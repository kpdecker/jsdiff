import type { StructuredPatch } from '../types.js';

/**
 * Parses a patch into structured data, in the same structure returned by `structuredPatch`.
 *
 * @return a JSON object representation of the a patch, suitable for use with the `applyPatch` method.
 */
export function parsePatch(uniDiff: string): StructuredPatch[] {
  const diffstr = uniDiff.split(/\n/),
        list: Partial<StructuredPatch>[] = [];
  let i = 0;

  // These helper functions identify line types that can appear between files
  // in a multi-file patch. Keeping them in one place avoids subtle
  // inconsistencies from having the same regexes duplicated in multiple places.

  // Matches `diff --git ...` lines specifically.
  function isGitDiffHeader(line: string): boolean {
    return (/^diff --git /).test(line);
  }

  // Matches lines that denote the start of a new diff's section in a
  // multi-file patch: `diff --git ...`, `Index: ...`, or `diff -r ...`.
  function isDiffHeader(line: string): boolean {
    return isGitDiffHeader(line)
        || (/^Index:\s/).test(line)
        || (/^diff(?: -r \w+)+\s/).test(line);
  }

  // Matches `--- ...` and `+++ ...` file header lines.
  function isFileHeader(line: string): boolean {
    return (/^(---|\+\+\+)\s/).test(line);
  }

  // Matches `@@ ...` hunk header lines.
  function isHunkHeader(line: string): boolean {
    return (/^@@\s/).test(line);
  }

  function parseIndex() {
    const index: Partial<StructuredPatch> = {};
    list.push(index);

    // Parse diff metadata
    let seenDiffHeader = false;
    while (i < diffstr.length) {
      const line = diffstr[i];

      // File header (---, +++) or hunk header (@@) found; end parsing diff metadata
      if (isFileHeader(line) || isHunkHeader(line)) {
        break;
      }

      // The next two branches handle recognized diff headers. Note that
      // isDiffHeader deliberately does NOT match arbitrary `diff`
      // commands like `diff -u -p -r1.1 -r1.2`, because in some
      // formats (e.g. CVS diffs) such lines appear as metadata within
      // a single file's header section, after an `Index:` line. See the
      // diffx documentation (https://diffx.org) for examples.
      //
      // In both branches: if we've already seen a diff header for *this*
      // file and now we encounter another one, it must belong to the
      // next file, so break.

      if (isGitDiffHeader(line)) {
        if (seenDiffHeader) {
          break;
        }
        seenDiffHeader = true;
        index.isGit = true;

        // Parse the old and new filenames from the `diff --git` header and
        // tentatively set oldFileName and newFileName from them. These may
        // be overridden below by `rename from` / `rename to` or `copy from` /
        // `copy to` extended headers, or by --- and +++ lines. But for Git
        // diffs that lack all of those (e.g. mode-only changes, binary
        // file changes without rename), these are the only filenames we
        // get.
        // parseGitDiffHeader returns null if the header can't be parsed
        // (e.g. unterminated quoted filename, or unexpected format). In
        // that case we skip setting filenames here; they may still be
        // set from --- / +++ or rename from / rename to lines below.
        const paths = parseGitDiffHeader(line);
        if (paths) {
          index.oldFileName = paths.oldFileName;
          index.newFileName = paths.newFileName;
        }

        // Consume Git extended headers (`old mode`, `new mode`, `rename from`,
        // `rename to`, `similarity index`, `index`, `Binary files ... differ`,
        // etc.)
        i++;
        while (i < diffstr.length) {
          const extLine = diffstr[i];

          // Stop consuming extended headers if we hit a file header,
          // hunk header, or another diff header.
          if (isFileHeader(extLine) || isHunkHeader(extLine) || isDiffHeader(extLine)) {
            break;
          }

          // Parse `rename from` / `rename to` lines - these give us
          // unambiguous filenames. These lines don't include the
          // a/ and b/ prefixes that appear in the `diff --git` header
          // and --- / +++ lines, so we add them for consistency.
          const renameFromMatch = (/^rename from (.*)/).exec(extLine);
          if (renameFromMatch) {
            index.oldFileName = 'a/' + renameFromMatch[1];
            index.isRename = true;
          }
          const renameToMatch = (/^rename to (.*)/).exec(extLine);
          if (renameToMatch) {
            index.newFileName = 'b/' + renameToMatch[1];
            index.isRename = true;
          }

          // Parse copy from / copy to lines similarly
          const copyFromMatch = (/^copy from (.*)/).exec(extLine);
          if (copyFromMatch) {
            index.oldFileName = 'a/' + copyFromMatch[1];
            index.isCopy = true;
          }
          const copyToMatch = (/^copy to (.*)/).exec(extLine);
          if (copyToMatch) {
            index.newFileName = 'b/' + copyToMatch[1];
            index.isCopy = true;
          }

          const newFileModeMatch = (/^new file mode (\d+)/).exec(extLine);
          if (newFileModeMatch) {
            index.isCreate = true;
            index.newMode = newFileModeMatch[1];
          }
          const deletedFileModeMatch = (/^deleted file mode (\d+)/).exec(extLine);
          if (deletedFileModeMatch) {
            index.isDelete = true;
            index.oldMode = deletedFileModeMatch[1];
          }
          const oldModeMatch = (/^old mode (\d+)/).exec(extLine);
          if (oldModeMatch) {
            index.oldMode = oldModeMatch[1];
          }
          const newModeMatch = (/^new mode (\d+)/).exec(extLine);
          if (newModeMatch) {
            index.newMode = newModeMatch[1];
          }

          i++;
        }
        continue;
      } else if (isDiffHeader(line)) {
        if (seenDiffHeader) {
          break;
        }
        seenDiffHeader = true;

        // For Mercurial-style headers like
        //     diff -r 9117c6561b0b -r 273ce12ad8f1 .hgignore
        // or Index: headers like
        //     Index: something with multiple words
        // we extract the trailing filename as the index.
        //
        // TODO: It seems awkward that we indiscriminately trim off
        //       trailing whitespace here. Theoretically, couldn't that
        //       be meaningful - e.g. if the patch represents a diff of a
        //       file whose name ends with a space? Seems wrong to nuke
        //       it. But this behaviour has been around since v2.2.1 in
        //       2015, so if it's going to change, it should be done
        //       cautiously and in a new major release, for
        //       backwards-compat reasons.
        //       -- ExplodingCabbage
        const headerMatch = (/^(?:Index:|diff(?: -r \w+)+)\s+/).exec(line);
        if (headerMatch) {
          index.index = line.substring(headerMatch[0].length).trim();
        }
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
      if (isDiffHeader(line) || isFileHeader(line) || (/^===================================================================/).test(line)) {
        break;
      } else if (isHunkHeader(line)) {
        index.hunks.push(parseHunk());
      } else if (line) {
        throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(line));
      } else {
        i++;
      }
    }
  }

  /**
   * Parses the old and new filenames from a `diff --git` header line.
   *
   * The format is:
   *     diff --git a/<old-path> b/<new-path>
   *
   * When filenames contain characters like newlines, tabs, backslashes, or
   * double quotes, Git quotes them with C-style escaping:
   *     diff --git "a/file\twith\ttabs.txt" "b/file\twith\ttabs.txt"
   *
   * When filenames don't contain special characters and the old and new names
   * are the same, we can unambiguously split on ` b/` by finding where the
   * two halves (including their a/ and b/ prefixes) yield matching bare names.
   * When they differ AND contain spaces AND aren't quoted, parsing is
   * inherently ambiguous, so we do our best.
   *
   * Returns null if the header can't be parsed — e.g. if a quoted filename
   * has an unterminated quote, or if the unquoted header doesn't match the
   * expected `a/... b/...` format. In that case, the caller (parseIndex)
   * skips setting oldFileName/newFileName from this header, but they may
   * still be set later from `---`/`+++` lines or `rename from`/`rename to`
   * extended headers; if none of those are present either, they'll remain
   * undefined in the output.
   */
  function parseGitDiffHeader(line: string): { oldFileName: string, newFileName: string } | null {
    // Strip the "diff --git " prefix
    const rest = line.substring('diff --git '.length);

    // Handle quoted paths: "a/path" "b/path"
    // Git quotes paths when they contain characters like newlines, tabs,
    // backslashes, or double quotes (but notably not spaces).
    if (rest.startsWith('"')) {
      const oldPath = parseQuotedFileName(rest);
      if (oldPath === null) { return null; }
      const afterOld = rest.substring(oldPath.rawLength + 1); // +1 for space
      let newFileName: string;
      if (afterOld.startsWith('"')) {
        const newPath = parseQuotedFileName(afterOld);
        if (newPath === null) { return null; }
        newFileName = newPath.fileName;
      } else {
        newFileName = afterOld;
      }
      return {
        oldFileName: oldPath.fileName,
        newFileName
      };
    }

    // Check if the second path is quoted
    // e.g. diff --git a/simple "b/renamed\nnewline.txt"
    const quoteIdx = rest.indexOf('"');
    if (quoteIdx > 0) {
      const oldFileName = rest.substring(0, quoteIdx - 1);
      const newPath = parseQuotedFileName(rest.substring(quoteIdx));
      if (newPath === null) { return null; }
      return {
        oldFileName,
        newFileName: newPath.fileName
      };
    }

    // Unquoted paths. Try to find the split point.
    // The format is: a/<old-path> b/<new-path>
    //
    // Strategy: if the path starts with a/ and contains " b/", we try
    // to find where to split. When old and new names are the same, there's
    // a unique split where both halves (after stripping their respective
    // a/ and b/ prefixes) match. When they differ, we try the last split.
    // The returned filenames include the a/ and b/ prefixes.
    if (rest.startsWith('a/')) {
      // Try to find a " b/" separator. If the filename itself contains " b/",
      // there could be multiple candidates. We try each one and pick the
      // split where both halves look like valid prefixed paths.
      let searchFrom = 2; // skip past initial "a/"
      let bestSplit = -1;
      while (true) {
        const idx = rest.indexOf(' b/', searchFrom);
        if (idx === -1) { break; }
        // Candidate: old = rest[0..idx), new = rest[idx+1..)
        const candidateOldBare = rest.substring(2, idx); // strip "a/" for comparison
        const candidateNewBare = rest.substring(idx + 3); // strip " b/" for comparison
        if (candidateOldBare === candidateNewBare) {
          // Perfect match - unambiguous
          return { oldFileName: rest.substring(0, idx), newFileName: rest.substring(idx + 1) };
        }
        bestSplit = idx;
        searchFrom = idx + 3;
      }
      if (bestSplit !== -1) {
        return {
          oldFileName: rest.substring(0, bestSplit),
          newFileName: rest.substring(bestSplit + 1)
        };
      }
    }

    // Fallback: can't parse, return null
    return null;
  }

  /**
   * Parses a C-style quoted filename as used by git.
   * Returns the unescaped filename and the raw length consumed (including quotes).
   */
  function parseQuotedFileName(s: string): { fileName: string, rawLength: number } | null {
    if (!s.startsWith('"')) { return null; }
    let result = '';
    let j = 1; // skip opening quote
    while (j < s.length) {
      if (s[j] === '"') {
        return { fileName: result, rawLength: j + 1 };
      }
      if (s[j] === '\\' && j + 1 < s.length) {
        j++;
        switch (s[j]) {
          case 'n': result += '\n'; break;
          case 't': result += '\t'; break;
          case '\\': result += '\\'; break;
          case '"': result += '"'; break;
          default: result += '\\' + s[j]; break;
        }
      } else {
        result += s[j];
      }
      j++;
    }
    // Unterminated quote
    return null;
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
