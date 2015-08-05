import Diff from './base';

export default class WordDiff extends Diff {
  tokenize(value) {
    return value.split(/(\s+|\b)/);
  }
}

export const wordDiff = new WordDiff(true);
export const wordWithSpaceDiff = new WordDiff();
