import Diff from './base';

export default class WordDiff extends Diff {
  tokenize(value) {
    return value.split(/(\s+|\b)/);
  }
}

export const wordDiff = new WordDiff(true);
export const wordWithSpaceDiff = new WordDiff();

export function diffWords(oldStr, newStr, callback) { return wordDiff.diff(oldStr, newStr, callback); }
export function diffWordsWithSpace(oldStr, newStr, callback) { return wordWithSpaceDiff.diff(oldStr, newStr, callback); }
