import Diff from './base';

function tokenize(value) {
  return value.split(/(\n|\r\n)/);
}

// Treats new line characters as separate, significant tokens
export const nlTokenLineDiff = new Diff();
nlTokenLineDiff.tokenize = tokenize;

// Inlines new line characters into the diff result, thus, `restaurant\n` is different than `restaruant`
export const lineDiff = new Diff();

// Operates in a similar fashion to lineDiff, but whitespace other thing the the newline character is trimmed
export const trimmedLineDiff = new Diff();
trimmedLineDiff.ignoreTrim = true;

lineDiff.tokenize = trimmedLineDiff.tokenize = function(value) {
  let retLines = [],
      linesAndNewlines = tokenize(value);

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
export function diffLinesNL(oldStr, newStr, callback) { return nlTokenLineDiff.diff(oldStr, newStr, callback); }
