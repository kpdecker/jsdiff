import Diff from './base.js';
import type {
  ChangeObject,
  CallbackOptionAbortable,
  CallbackOptionNonabortable,
  DiffCallbackNonabortable,
  DiffSentencesOptionsAbortable,
  DiffSentencesOptionsNonabortable
} from '../types.js';

function isSentenceEndPunct(char: string) {
  return char == '.' || char == '!' || char == '?';
}

class SentenceDiff extends Diff<string, string> {
  tokenize(value: string) {
    // If in future we drop support for environments that don't support lookbehinds, we can replace
    // this entire function with:
    //     return value.split(/(?<=[.!?])(\s+|$)/);
    // but until then, for similar reasons to the trailingWs function in string.ts, we are forced
    // to do this verbosely "by hand" instead of using a regex.
    const result = [];
    let tokenStartI = 0;
    for (let i = 0; i < value.length; i++) {
      if (i == value.length - 1) {
        result.push(value.slice(tokenStartI));
        break;
      }

      if (isSentenceEndPunct(value[i]) && value[i + 1].match(/\s/)) {
        // We've hit a sentence break - i.e. a punctuation mark followed by whitespace.
        // We now want to push TWO tokens to the result:
        // 1. the sentence
        result.push(value.slice(tokenStartI, i + 1));

        // 2. the whitespace
        i = tokenStartI = i + 1;
        while (value[i + 1]?.match(/\s/)) {
          i++;
        }
        result.push(value.slice(tokenStartI, i + 1));

        // Then the next token (a sentence) starts on the character after the whitespace.
        // (It's okay if this is off the end of the string - then the outer loop will terminate
        // here anyway.)
        tokenStartI = i + 1;
      }
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
