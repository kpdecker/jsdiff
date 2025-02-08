import Diff from './base';


export const sentenceDiff = new Diff();
sentenceDiff.tokenize = function(value) {
  return value.split(/(?<=^|\s+)(\S.+?[.!?])(?=\s+|$)/);
};

export function diffSentences(oldStr, newStr, callback) { return sentenceDiff.diff(oldStr, newStr, callback); }
