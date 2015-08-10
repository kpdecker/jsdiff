import Diff from './base';

export const lineDiff = new Diff();
export const trimmedLineDiff = new Diff();
trimmedLineDiff.ignoreTrim = true;

lineDiff.tokenize = trimmedLineDiff.tokenize = function(value) {
  let retLines = [],
      linesAndNewlines = value.split(/(\n|\r\n)/);

  // Ignore the final empty token that occurs if the string ends with a new line
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }

  // Merge the content and line separators into single tokens
  for (let i = 0; i < linesAndNewlines.length; i++) {
    let line = linesAndNewlines[i];

    if (i % 2) {
      retLines[retLines.length - 1] += line;
    } else {
      if (this.ignoreTrim) {
        line = line.trim();
      }
      retLines.push(line);
    }
  }

  return retLines;
};

export function diffLines(oldStr, newStr, callback) { return lineDiff.diff(oldStr, newStr, callback); }
export function diffTrimmedLines(oldStr, newStr, callback) { return trimmedLineDiff.diff(oldStr, newStr, callback); }
