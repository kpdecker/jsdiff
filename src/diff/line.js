import Diff from './base';
import {generateOptions} from '../util/params';

export const lineDiff = new Diff();
lineDiff.tokenize = function(value) {
  if(this.options.stripTrailingCr) {
    // remove one \r before \n to match GNU diff's --strip-trailing-cr behavior
    value = value.replace(/\r\n/g, '\n');
  }

  let retLines = [],
      linesAndNewlines = value.split(/(\n|\r\n)/);

  // Ignore the final empty token that occurs if the string ends with a new line
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }

  // Merge the content and line separators into single tokens
  for (let i = 0; i < linesAndNewlines.length; i++) {
    let line = linesAndNewlines[i];

    if (i % 2 && !this.options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      retLines.push(line);
    }
  }

  return retLines;
};

lineDiff.equals = function(left, right) {
  // If we're ignoring whitespace, we need to normalise lines by stripping
  // whitespace before checking equality. (This has an annoying interaction
  // with newlineIsToken that requires special handling: if newlines get their
  // own token, then we DON'T want to trim the *newlines* tokens down to empty
  // strings, since this would cause us to treat whitespace-only line content
  // as equal to a separator between lines, which would be weird and
  // inconsistent with the documented behavior of the options.)
  if (this.options.ignoreWhitespace) {
    if (!this.options.newlineIsToken || !left.includes("\n")) {
      left = left.trim();
    }
    if (!this.options.newlineIsToken || !right.includes("\n")) {
      right = right.trim();
    }
  }
  return Diff.equals(left, right);
}

export function diffLines(oldStr, newStr, callback) { return lineDiff.diff(oldStr, newStr, callback); }

// Kept for backwards compatibility. This is a rather arbitrary wrapper method
// that just calls `diffLines` with `ignoreWhitespace: true`. It's confusing to
// have two ways to do exactly the same thing in the API, so we no longer
// document this one (library users should explicitly use `diffLines` with
// `ignoreWhitespace: true` instead) but we keep it around to maintain
// compatibility with code that used old versions.
export function diffTrimmedLines(oldStr, newStr, callback) {
  let options = generateOptions(callback, {ignoreWhitespace: true});
  return lineDiff.diff(oldStr, newStr, options);
}
