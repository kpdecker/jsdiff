import Diff from './base';

export default class CssDiff extends Diff {
  tokenize(value) {
    return value.split(/([{}:;,]|\s+)/);
  }
}

export const cssDiff = new CssDiff();
