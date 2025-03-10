import Diff, { DiffOptions } from './base';

class CssDiff extends Diff<string, string> {
  protected tokenize(value: string) {
    return value.split(/([{}:;,]|\s+)/);
  }
}

export const cssDiff = new CssDiff();

export function diffCss(oldStr: string, newStr: string, options: DiffOptions<string>) {
  return cssDiff.diff(oldStr, newStr, options);
}