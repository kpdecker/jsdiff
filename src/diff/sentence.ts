import Diff from './base';
import { CallbackOption, ChangeObject, DiffCallback, DiffSentencesOptions } from '../types';

class SentenceDiff extends Diff<string, string> {
  protected tokenize(value: string) {
    return value.split(/(?<=[.!?])(\s+|$)/);
  }
}

export const sentenceDiff = new SentenceDiff();

export function diffSentences(
  oldStr: string,
  newStr: string,
  options: (DiffSentencesOptions & CallbackOption<string>) | DiffCallback<string>
): undefined
export function diffSentences(oldStr: string, newStr: string, options?: DiffSentencesOptions): ChangeObject<string>[];
export function diffSentences(oldStr: string, newStr: string, options?): undefined | ChangeObject<string>[] {
  return sentenceDiff.diff(oldStr, newStr, options);
}
