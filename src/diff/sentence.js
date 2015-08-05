import Diff from './base';

export default class SentenceDiff extends Diff {
  tokenize(value) {
    return value.split(/(\S.+?[.!?])(?=\s+|$)/);
  }
}

export const sentenceDiff = new SentenceDiff();
export function diffSentences(oldStr, newStr, callback) { return sentenceDiff.diff(oldStr, newStr, callback); }
