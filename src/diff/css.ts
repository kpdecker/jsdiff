import Diff from './base';
import { AbortableDiffOptions, CallbackOption, ChangeObject, DiffCallback, DiffCssOptions } from '../types';

class CssDiff extends Diff<string, string> {
  protected tokenize(value: string) {
    return value.split(/([{}:;,]|\s+)/);
  }
}

export const cssDiff = new CssDiff();

export function diffCss(
  oldStr: string,
  newStr: string,
  options: (DiffCssOptions & CallbackOption<string>) | DiffCallback<string>
): undefined
export function diffCss(oldStr: string, newStr: string, options: DiffCssOptions & AbortableDiffOptions): ChangeObject<string>[] | undefined;
export function diffCss(oldStr: string, newStr: string, options?: DiffCssOptions): ChangeObject<string>[];
export function diffCss(oldStr: string, newStr: string, options?): undefined | ChangeObject<string>[] {
  return cssDiff.diff(oldStr, newStr, options);
}
