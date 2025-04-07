import Diff from './base.js';
import { ChangeObject, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackNonabortable, DiffCharsOptionsAbortable, DiffCharsOptionsNonabortable} from '../types.js';

class CharacterDiff extends Diff<string, string> {}

export const characterDiff = new CharacterDiff();

export function diffChars(
  oldStr: string,
  newStr: string,
  options: DiffCallbackNonabortable<string>
): undefined;
export function diffChars(
  oldStr: string,
  newStr: string,
  options: DiffCharsOptionsAbortable & CallbackOptionAbortable<string>
): undefined
export function diffChars(
  oldStr: string,
  newStr: string,
  options: DiffCharsOptionsNonabortable & CallbackOptionNonabortable<string>
): undefined
export function diffChars(
  oldStr: string,
  newStr: string,
  options: DiffCharsOptionsAbortable
): ChangeObject<string>[] | undefined
export function diffChars(
  oldStr: string,
  newStr: string,
  options?: DiffCharsOptionsNonabortable
): ChangeObject<string>[]
export function diffChars(
  oldStr: string,
  newStr: string,
  options?: any
): undefined | ChangeObject<string>[] {
  return characterDiff.diff(oldStr, newStr, options);
}
