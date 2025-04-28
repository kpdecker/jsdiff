import Diff from './base.js';
import type { ChangeObject, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackNonabortable, DiffSentencesOptionsAbortable, DiffSentencesOptionsNonabortable} from '../types.js';

class SentenceDiff extends Diff<string, string> {
  tokenize(value: string) {
    return value.split(/(?<=[.!?])(\s+|$)/);
  }
}

export const sentenceDiff = new SentenceDiff();

/**
 * diffs two blocks of text, treating each sentence, and the whitespace between each pair of sentences, as a token.
 * The characters `.`, `!`, and `?`, when followed by whitespace, are treated as marking the end of a sentence; nothing else besides the end of the string is considered to mark a sentence end.
 *
 * (For more sophisticated detection of sentence breaks, including support for non-English punctuation, consider instead tokenizing with an [`Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) with `granularity: 'sentence'` and passing the result to `diffArrays`.)
 *
 * @returns a list of change objects.
 */
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
export function diffSentences(oldStr: string, newStr: string, options?: any): undefined | ChangeObject<string>[] {
  return sentenceDiff.diff(oldStr, newStr, options);
}
