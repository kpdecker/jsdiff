import Diff from './base.js';
import type {
  ChangeObject,
  CallbackOptionAbortable,
  CallbackOptionNonabortable,
  DiffCallbackNonabortable,
  DiffSentencesOptionsAbortable,
  DiffSentencesOptionsNonabortable
} from '../types.js';

class SentenceDiff extends Diff<string, string> {
  tokenize(value: string) {
    // If in future we drop support for environments that don't support lookbehinds, we can replace
    // this entire function with:
    //     return value.split(/(?<=[.!?])(\s+|$)/);
    // Until then, we find each sentence break - a punctuation mark followed by whitespace - with a
    // regex without lookbehind, and push TWO tokens for it: the sentence and the whitespace.
    const result = [],
        sentenceBreak = /[.!?](\s+)/g;
    let tokenStartI = 0,
        match;
    while ((match = sentenceBreak.exec(value))) {
      result.push(value.slice(tokenStartI, match.index + 1), match[1]);
      tokenStartI = sentenceBreak.lastIndex;
    }
    if (tokenStartI < value.length) {
      result.push(value.slice(tokenStartI));
    }

    return result;
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
