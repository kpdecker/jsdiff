import Diff from './base';

export const patchDiff = new Diff();
patchDiff.tokenize = function(value) {
  let ret = [],
      linesAndNewlines = value.split(/(\n|\r\n)/);

  // Ignore the final empty token that occurs if the string ends with a new line
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }

  // Merge the content and line separators into single tokens
  for (let i = 0; i < linesAndNewlines.length; i++) {
    let line = linesAndNewlines[i];

    if (i % 2) {
      ret[ret.length - 1] += line;
    } else {
      ret.push(line);
    }
  }
  return ret;
};
