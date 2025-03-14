import Diff from './base';
import {CallbackOption, DiffOptionsWithoutCallback, DiffCallback, ChangeObject, DiffCharsOptions} from '../types';

class CharacterDiff extends Diff<string, string> {}

export const characterDiff = new CharacterDiff();

export function diffChars(
  oldStr: string,
  newStr: string,
  options: (DiffCharsOptions & CallbackOption<string>) | DiffCallback<string>
): undefined
export function diffChars(oldStr: string, newStr: string, options: DiffCharsOptions): ChangeObject<string>[];
export function diffChars(oldStr: string, newStr: string, options): undefined | ChangeObject<string>[] {
  return characterDiff.diff(oldStr, newStr, options);
}
