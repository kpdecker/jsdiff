import Diff from './base.js';
import { ChangeObject, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackNonabortable, DiffSentencesOptionsAbortable, DiffSentencesOptionsNonabortable} from '../types.js';

class SentenceDiff extends Diff<string, string> {
  tokenize(value: string) {
    return value.split(/(?<=[.!?])(\s+|$)/);
  }
}

export const sentenceDiff = new SentenceDiff();

export function diffSentences(
  oldStr: string,
  newStr: string,
  options: DiffCallbackNonabortable<string>
): undefined;
export function diffSentences(
  oldStr: string,
  newStr: string,
  options: DiffSentencesOptionsAbortable & CallbackOptionAbortable<string>
): undefined
export function diffSentences(
  oldStr: string,
  newStr: string,
  options: DiffSentencesOptionsNonabortable & CallbackOptionNonabortable<string>
): undefined
export function diffSentences(
  oldStr: string,
  newStr: string,
  options: DiffSentencesOptionsAbortable
): ChangeObject<string>[] | undefined
export function diffSentences(
  oldStr: string,
  newStr: string,
  options?: DiffSentencesOptionsNonabortable
): ChangeObject<string>[]
export function diffSentences(oldStr: string, newStr: string, options?): undefined | ChangeObject<string>[] {
  return sentenceDiff.diff(oldStr, newStr, options);
}
