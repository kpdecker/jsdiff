import Diff from './base';

export const cssDiff = new Diff();
cssDiff.tokenize = function(value) {
  return value.split(/([{}:;,]|\s+)/);
};

export function diffCss(oldStr, newStr, callback) { return cssDiff.diff(oldStr, newStr, callback); }
