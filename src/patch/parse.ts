import type { StructuredPatch } from '../types.js';

/**
 * Parse a single Git path token starting at the provided index.
 * Supports C-style quoted paths used by Git when `core.quotePath` is enabled.
 */
function parseGitPathToken(input: string, startIndex: number): { value: string; nextIndex: number } | null {
  let i = startIndex;
  while (i < input.length && input[i] === ' ') {
    i++;
  }
  if (i >= input.length) {
    return null;
  }
  if (input[i] === '"') {
    i++;
    let value = '';
    while (i < input.length) {
      const ch = input[i];
      if (ch === '"') {
        return { value, nextIndex: i + 1 };
      }
      if (ch === '\\') {
        i++;
        if (i >= input.length) {
          return null;
        }
        const esc = input[i];
        if (esc >= '0' && esc <= '7') {
          let octal = esc;
          for (let count = 0; count < 2; count++) {
            const next = input[i + 1];
            if (next >= '0' && next <= '7') {
              i++;
              octal += next;
            } else {
              break;
            }
          }
          value += String.fromCharCode(parseInt(octal, 8));
          i++;
          continue;
        }
        if (esc === 'x') {
          const hex = input.substring(i + 1, i + 3);
          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            value += String.fromCharCode(parseInt(hex, 16));
            i += 3;
            continue;
          }
          value += 'x';
          i++;
          continue;
        }
        switch (esc) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          case 'b':
            value += '\b';
            break;
          case 'f':
            value += '\f';
            break;
          case 'a':
            value += '\u0007';
            break;
          case 'v':
            value += '\u000b';
            break;
          case '\\':
            value += '\\';
            break;
          case '"':
            value += '"';
            break;
          default:
            value += esc;
        }
        i++;
        continue;
      }
      value += ch;
      i++;
    }
    return null;
  }
  const start = i;
  while (i < input.length && input[i] !== ' ') {
    i++;
  }
  return { value: input.substring(start, i), nextIndex: i };
}

/**
 * Parse a fixed number of Git path tokens from a string.
 */
function parseGitPathTokens(input: string, count: number): string[] | null {
  let index = 0;
  const paths: string[] = [];
  for (let parsed = 0; parsed < count; parsed++) {
    const token = parseGitPathToken(input, index);
    if (!token) {
      return null;
    }
    paths.push(token.value);
    index = token.nextIndex;
  }
  return paths;
}

/**
 * Parse a Git `diff --git a/... b/...` header into old/new file names.
 */
function parseGitDiffHeader(line: string): { oldFileName?: string; newFileName?: string } | null {
  const prefix = 'diff --git ';
  if (!line.startsWith(prefix)) {
    return null;
  }
  const paths = parseGitPathTokens(line.substring(prefix.length), 2);
  if (!paths) {
    return null;
  }
  let [oldFileName, newFileName] = paths;
  if (oldFileName.startsWith('a/')) {
    oldFileName = oldFileName.substring(2);
  }
  if (newFileName.startsWith('b/')) {
    newFileName = newFileName.substring(2);
  }
  return { oldFileName, newFileName };
}

/**
 * Parse extended Git headers like `rename from`, `rename to`, `copy from`, and `copy to`.
 */
function parseGitExtendedPath(line: string, prefix: string): string | null {
  if (!line.startsWith(prefix)) {
    return null;
  }
  const token = parseGitPathToken(line, prefix.length);
  return token ? token.value : null;
}

/**
 * Parses a patch into structured data, in the same structure returned by `structuredPatch`.
 *
 * @return a JSON object representation of the a patch, suitable for use with the `applyPatch` method.
 */
export function parsePatch(uniDiff: string): StructuredPatch[] {
  const diffstr = uniDiff.split(/\n/),
        list: Partial<StructuredPatch>[] = [];
  let i = 0;

  function parseIndex() {
    const index: Partial<StructuredPatch> = {};
    let seenGitHeader = false;
    list.push(index);

    // Parse diff metadata
    while (i < diffstr.length) {
      const line = diffstr[i];

      // File header found, end parsing diff metadata
      if ((/^(---|\+\+\+|@@)\s/).test(line)) {
        break;
      }

      const gitHeader = parseGitDiffHeader(line);
      if (gitHeader) {
        if (seenGitHeader || index.index || index.oldFileName || index.newFileName) {
          break;
        }
        seenGitHeader = true;
        if (gitHeader.oldFileName) {
          index.oldFileName = gitHeader.oldFileName;
        }
        if (gitHeader.newFileName) {
          index.newFileName = gitHeader.newFileName;
          if (!index.index) {
            index.index = gitHeader.newFileName;
          }
        }
        i++;
        continue;
      }

      const renameFrom = parseGitExtendedPath(line, 'rename from ');
      if (renameFrom) {
        index.oldFileName = renameFrom;
        i++;
        continue;
      }
      const renameTo = parseGitExtendedPath(line, 'rename to ');
      if (renameTo) {
        index.newFileName = renameTo;
        if (!index.index) {
          index.index = renameTo;
        }
        i++;
        continue;
      }
      const copyFrom = parseGitExtendedPath(line, 'copy from ');
      if (copyFrom) {
        index.oldFileName = copyFrom;
        i++;
        continue;
      }
      const copyTo = parseGitExtendedPath(line, 'copy to ');
      if (copyTo) {
        index.newFileName = copyTo;
        if (!index.index) {
          index.index = copyTo;
        }
        i++;
        continue;
      }

      // Try to parse the line as a diff header, like
      //     Index: README.md
      // or
      //     diff -r 9117c6561b0b -r 273ce12ad8f1 .hgignore
      // or
      //     Index: something with multiple words
      // and extract the filename (or whatever else is used as an index name)
      // from the end (i.e. 'README.md', '.hgignore', or
      // 'something with multiple words' in the examples above).
      //
      // TODO: It seems awkward that we indiscriminately trim off trailing
      //       whitespace here. Theoretically, couldn't that be meaningful -
      //       e.g. if the patch represents a diff of a file whose name ends
      //       with a space? Seems wrong to nuke it.
      //       But this behaviour has been around since v2.2.1 in 2015, so if
      //       it's going to change, it should be done cautiously and in a new
      //       major release, for backwards-compat reasons.
      //       -- ExplodingCabbage
      const headerMatch = (/^(?:Index:|diff(?: -r \w+)+)\s+/).exec(line);
      if (headerMatch) {
        index.index = line.substring(headerMatch[0].length).trim();
      }

      i++;
    }

    // Parse file headers if they are defined. Unified diff requires them, but
    // there's no technical issues to have an isolated hunk without file header
    parseFileHeader(index);
    parseFileHeader(index);

    // Parse hunks
    index.hunks = [];

    while (i < diffstr.length) {
      const line = diffstr[i];
      if ((/^(Index:\s|diff\s|---\s|\+\+\+\s|===================================================================)/).test(line)) {
        break;
      } else if ((/^@@/).test(line)) {
        index.hunks.push(parseHunk());
      } else if (line) {
        throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(line));
      } else {
        i++;
      }
    }
  }

  // Parses the --- and +++ headers, if none are found, no lines
  // are consumed.
  function parseFileHeader(index: Partial<StructuredPatch>) {
    const fileHeaderMatch = (/^(---|\+\+\+)\s+/).exec(diffstr[i]);
    if (fileHeaderMatch) {
      const prefix = fileHeaderMatch[1],
            data = diffstr[i].substring(3).trim().split('\t', 2),
            header = (data[1] || '').trim();
      let fileName = data[0].replace(/\\\\/g, '\\');
      if (fileName.startsWith('"') && fileName.endsWith('"')) {
        fileName = fileName.substr(1, fileName.length - 2);
      }
      if (prefix === '---') {
        index.oldFileName = fileName;
        index.oldHeader = header;
      } else {
        index.newFileName = fileName;
        index.newHeader = header;
      }

      i++;
    }
  }

  // Parses a hunk
  // This assumes that we are at the start of a hunk.
  function parseHunk() {
    const chunkHeaderIndex = i,
        chunkHeaderLine = diffstr[i++],
        chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);

    const hunk = {
      oldStart: +chunkHeader[1],
      oldLines: typeof chunkHeader[2] === 'undefined' ? 1 : +chunkHeader[2],
      newStart: +chunkHeader[3],
      newLines: typeof chunkHeader[4] === 'undefined' ? 1 : +chunkHeader[4],
      lines: [] as string[]
    };

    // Unified Diff Format quirk: If the chunk size is 0,
    // the first number is one lower than one would expect.
    // https://www.artima.com/weblogs/viewpost.jsp?thread=164293
    if (hunk.oldLines === 0) {
      hunk.oldStart += 1;
    }
    if (hunk.newLines === 0) {
      hunk.newStart += 1;
    }

    let addCount = 0,
        removeCount = 0;
    for (
      ;
      i < diffstr.length && (removeCount < hunk.oldLines || addCount < hunk.newLines || diffstr[i]?.startsWith('\\'));
      i++
    ) {
      const operation = (diffstr[i].length == 0 && i != (diffstr.length - 1)) ? ' ' : diffstr[i][0];
      if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
        hunk.lines.push(diffstr[i]);

        if (operation === '+') {
          addCount++;
        } else if (operation === '-') {
          removeCount++;
        } else if (operation === ' ') {
          addCount++;
          removeCount++;
        }
      } else {
        throw new Error(`Hunk at line ${chunkHeaderIndex + 1} contained invalid line ${diffstr[i]}`);
      }
    }

    // Handle the empty block count case
    if (!addCount && hunk.newLines === 1) {
      hunk.newLines = 0;
    }
    if (!removeCount && hunk.oldLines === 1) {
      hunk.oldLines = 0;
    }

    // Perform sanity checking
    if (addCount !== hunk.newLines) {
      throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
    }
    if (removeCount !== hunk.oldLines) {
      throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
    }

    return hunk;
  }

  while (i < diffstr.length) {
    parseIndex();
  }

  return list as StructuredPatch[];
}
