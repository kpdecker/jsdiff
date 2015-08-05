import Diff from './base';

export default class CssDiff extends Diff {
  tokenize(value) {
    return value.split(/([{}:;,]|\s+)/);
  }
}

export const cssDiff = new CssDiff();
export function diffCss(oldStr, newStr, callback) { return cssDiff.diff(oldStr, newStr, callback); }
