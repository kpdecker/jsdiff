import Diff from './base'
import { DiffOptions } from '../types';

class CharacterDiff extends Diff<string, string> {}

export const characterDiff = new CharacterDiff();

export function diffChars(oldStr: string, newStr: string, options: DiffOptions<string>) {
  return characterDiff.diff(oldStr, newStr, options);
}