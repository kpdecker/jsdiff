import Diff from './base';
import {generateOptions} from '../util/params';

export const lineDiff = new Diff();
lineDiff.tokenize = function(value) {
  let retLines = [],
      linesAndNewlines = value.split(/(\n|\r\n)/);

  // Ignore the final empty token that occurs if the string ends with a new line
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }

  // Merge the content and line separators into single tokens
  if (this.options.ignoreWhitespace) {
    for (let i = 0; i < linesAndNewlines.length; i++) {
      let line = linesAndNewlines[i];

      if (i % 2 && !this.options.newlineIsToken) {
        let last = retLines[retLines.length - 1];
        last.key += line;
        last.payload += line;
      } else {
        retLines.push({ key: line.trim(), payload: line });
      }
    }
  } else {
    for (let i = 0; i < linesAndNewlines.length; i++) {
      let line = linesAndNewlines[i];

      if (i % 2 && !this.options.newlineIsToken) {
        retLines[retLines.length - 1] += line;
      } else {
        retLines.push(line);
      }
    }
  }

  return retLines;
};

lineDiff.removeEmpty = function(array) {
  if (this.options.ignoreWhitespace) {
    return array.filter(v => v.key);
  }
  return array.filter(v => v);
};

lineDiff.equals = function(left, right) {
  if (this.options.ignoreWhitespace) {
    // Special case handle for when one terminal is ignored (i.e. whitespace).
    // For this case we merge the terminal into the prior string and drop the change.
    // This is only available for string mode.
    if (left === '') {
      return Diff.prototype.equals.call(this, left, right.trim());
    }
    return Diff.prototype.equals.call(this, left.key, right.key);
  }
  return Diff.prototype.equals.call(this, left, right);
};

lineDiff.join = function(result) {
  if (this.options.ignoreWhitespace) {
    return result.map(v => v.payload).join('');
  }
  return result.join('');
};

export function diffLines(oldStr, newStr, callback) { return lineDiff.diff(oldStr, newStr, callback); }
export function diffTrimmedLines(oldStr, newStr, callback) {
  let options = generateOptions(callback, {ignoreWhitespace: true});
  return lineDiff.diff(oldStr, newStr, options);
}
