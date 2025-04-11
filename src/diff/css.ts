import Diff from './base.js';
import type { ChangeObject, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackNonabortable, DiffCssOptionsAbortable, DiffCssOptionsNonabortable} from '../types.js';

class CssDiff extends Diff<string, string> {
  tokenize(value: string) {
    return value.split(/([{}:;,]|\s+)/);
  }
}

export const cssDiff = new CssDiff();

/**
 * diffs two blocks of text, comparing CSS tokens.
 *
 * @returns a list of change objects.
 */
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
