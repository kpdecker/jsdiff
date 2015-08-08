export function parsePatch(uniDiff, options = {}) {
  let diffstr = uniDiff.split('\n'),
      list = [],
      i = 0;

  function parseIndex() {
    let index = {};
    list.push(index);

    let header = (/^Index: (.*)/.exec(diffstr[i]));
    if (header) {
      index.index = header[1];
      i++;

      if (/^===/.test(diffstr[i])) {
        i++;
      }

      parseFileHeader(index);
      parseFileHeader(index);
    } else {
      // Ignore erant header components that might occur at the start of the file
      parseFileHeader({});
      parseFileHeader({});
    }

    index.hunks = [];

    while (i < diffstr.length) {
      if (/^Index:/.test(diffstr[i])) {
        break;
      } else if (/^@@/.test(diffstr[i])) {
        index.hunks.push(parseHunk(index));
      } else if (!diffstr[i]) {
        i++;
      } else {
        throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(diffstr[i]));
      }
    }
  }

  // Parses the --- and +++ headers, if none are found, no lines
  // are consumed.
  function parseFileHeader(index) {
    let fileHeader = (/^(\-\-\-|\+\+\+)\s(\S+)\s?(.*)/.exec(diffstr[i]));
    if (fileHeader) {
      index[fileHeader[1] === '---' ? 'from' : 'to'] = {
        file: fileHeader[2],
        header: fileHeader[3]
      };
      i++;
    }
  }

  // Parses a hunk
  // This assumes that we are at the start of a hunk.
  function parseHunk(index) {
    let chunkHeaderIndex = i,
        chunkHeaderLine = diffstr[i++],
        chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);

    let hunk = {
      from: {
        line: +chunkHeader[1],
        count: +chunkHeader[2] || 1
      },
      to: {
        line: +chunkHeader[3],
        count: +chunkHeader[4] || 1
      },
      lines: []
    };

    let addCount = 0,
        removeCount = 0;
    for (; i < diffstr.length; i++) {
      let operation = diffstr[i][0],
          content = diffstr[i].substr(1);

      if (operation === '+' || operation === '-' || operation === ' ') {
        hunk.lines.push({operation, content});

        if (operation === '+') {
          addCount++;
        } else if (operation === '-') {
          removeCount++;
        } else {
          addCount++;
          removeCount++;
        }
      } else if (operation === '\\') {
        if (diffstr[i - 1][0] === '+') {
          index.removeEOFNL = true;
        } else if (diffstr[i - 1][0] === '-') {
          index.addEOFNL = true;
        }
      } else {
        break;
      }
    }

    // Handle the empty block count case
    if (!addCount && hunk.to.count === 1) {
      hunk.to.count = 0;
    }
    if (!removeCount && hunk.from.count === 1) {
      hunk.from.count = 0;
    }

    // Perform optional sanity checking
    if (options.strict) {
      if (addCount !== hunk.to.count) {
        throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }
      if (removeCount !== hunk.from.count) {
        throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }
    }

    return hunk;
  }

  while (i < diffstr.length) {
    parseIndex();
  }

  return list;
}
