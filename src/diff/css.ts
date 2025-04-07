import Diff from './base.js';
import { ChangeObject, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackNonabortable, DiffCssOptionsAbortable, DiffCssOptionsNonabortable} from '../types.js';

class CssDiff extends Diff<string, string> {
  tokenize(value: string) {
    return value.split(/([{}:;,]|\s+)/);
  }
}

export const cssDiff = new CssDiff();

export function diffCss(
  oldStr: string,
  newStr: string,
  options: DiffCallbackNonabortable<string>
): undefined;
export function diffCss(
  oldStr: string,
  newStr: string,
  options: DiffCssOptionsAbortable & CallbackOptionAbortable<string>
): undefined
export function diffCss(
  oldStr: string,
  newStr: string,
  options: DiffCssOptionsNonabortable & CallbackOptionNonabortable<string>
): undefined
export function diffCss(
  oldStr: string,
  newStr: string,
  options: DiffCssOptionsAbortable
): ChangeObject<string>[] | undefined
export function diffCss(
  oldStr: string,
  newStr: string,
  options?: DiffCssOptionsNonabortable
): ChangeObject<string>[]
export function diffCss(oldStr: string, newStr: string, options?: any): undefined | ChangeObject<string>[] {
  return cssDiff.diff(oldStr, newStr, options);
}
