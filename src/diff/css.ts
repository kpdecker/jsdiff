import Diff from './base';
import { ChangeObject, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackNonabortable, DiffCssOptionsAbortable, DiffCssOptionsNonabortable} from '../types';

class CssDiff extends Diff<string, string> {
  protected tokenize(value: string) {
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
export function diffCss(oldStr: string, newStr: string, options?): undefined | ChangeObject<string>[] {
  return cssDiff.diff(oldStr, newStr, options);
}
