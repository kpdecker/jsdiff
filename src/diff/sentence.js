import Diff from './base';

export default class SentenceDiff extends Diff {
  tokenize(value) {
    return value.split(/(\S.+?[.!?])(?=\s+|$)/);
  }
}

export const sentenceDiff = new SentenceDiff();
