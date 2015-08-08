import {parsePatch} from './parse';

export function applyPatch(oldStr, uniDiff) {
  if (typeof uniDiff === 'string') {
    uniDiff = parsePatch(uniDiff);
  }

  if (Array.isArray(uniDiff)) {
    if (uniDiff.length > 1) {
      throw new Error('applyPatch only works with a single input.');
    }

    uniDiff = uniDiff[0];
  }

  // Apply the diff to the input
  let lines = oldStr.split('\n'),
      hunks = uniDiff.hunks;
  for (let i = 0; i < hunks.length; i++) {
    let hunk = hunks[i],
        toPos = hunk.to.line - 1;

    // Sanity check the input string. Bail if we don't match.
    for (let j = 0; j < hunk.lines.length; j++) {
      let line = hunk.lines[j];
      if (line.operation === ' ' || line.operation === '-') {
        // Context sanity check
        if (lines[toPos] !== line.content) {
          return false;
        }
      }

      if (line.operation === ' ') {
        toPos++;
      } else if (line.operation === '-') {
        lines.splice(toPos, 1);
      /* istanbul ignore else */
      } else if (line.operation === '+') {
        lines.splice(toPos, 0, line.content);
        toPos++;
      }
    }
  }

  // Handle EOFNL insertion/removal
  if (uniDiff.removeEOFNL) {
    while (!lines[lines.length - 1]) {
      lines.pop();
    }
  } else if (uniDiff.addEOFNL) {
    lines.push('');
  }
  return lines.join('\n');
}
