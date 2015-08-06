export function applyPatch(oldStr, uniDiff) {
  let diffstr = uniDiff.split('\n'),
      hunks = [],
      i = 0,
      remEOFNL = false,
      addEOFNL = false;

  // Skip to the first change hunk
  while (i < diffstr.length && !(/^@@/.test(diffstr[i]))) {
    i++;
  }

  // Parse the unified diff
  for (; i < diffstr.length; i++) {
    if (diffstr[i][0] === '@') {
      let chnukHeader = diffstr[i].split(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
      hunks.unshift({
        start: chnukHeader[3],
        oldlength: +chnukHeader[2],
        removed: [],
        newlength: chnukHeader[4],
        added: []
      });
    } else if (diffstr[i][0] === '+') {
      hunks[0].added.push(diffstr[i].substr(1));
    } else if (diffstr[i][0] === '-') {
      hunks[0].removed.push(diffstr[i].substr(1));
    } else if (diffstr[i][0] === ' ') {
      hunks[0].added.push(diffstr[i].substr(1));
      hunks[0].removed.push(diffstr[i].substr(1));
    } else if (diffstr[i][0] === '\\') {
      if (diffstr[i - 1][0] === '+') {
        remEOFNL = true;
      } else if (diffstr[i - 1][0] === '-') {
        addEOFNL = true;
      }
    }
  }

  // Apply the diff to the input
  let lines = oldStr.split('\n');
  for (i = hunks.length - 1; i >= 0; i--) {
    let hunk = hunks[i];
    // Sanity check the input string. Bail if we don't match.
    for (let j = 0; j < hunk.oldlength; j++) {
      if (lines[hunk.start - 1 + j] !== hunk.removed[j]) {
        return false;
      }
    }
    Array.prototype.splice.apply(lines, [hunk.start - 1, hunk.oldlength].concat(hunk.added));
  }

  // Handle EOFNL insertion/removal
  if (remEOFNL) {
    while (!lines[lines.length - 1]) {
      lines.pop();
    }
  } else if (addEOFNL) {
    lines.push('');
  }
  return lines.join('\n');
}
