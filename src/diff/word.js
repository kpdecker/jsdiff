import Diff from './base';
import {generateOptions} from '../util/params';

// Based on https://en.wikipedia.org/wiki/Latin_script_in_Unicode
//
// Ranges and exceptions:
// Latin-1 Supplement, 0080–00FF
//  - U+00D7  × Multiplication sign
//  - U+00F7  ÷ Division sign
// Latin Extended-A, 0100–017F
// Latin Extended-B, 0180–024F
// IPA Extensions, 0250–02AF
// Spacing Modifier Letters, 02B0–02FF
//  - U+02C7  ˇ &#711;  Caron
//  - U+02D8  ˘ &#728;  Breve
//  - U+02D9  ˙ &#729;  Dot Above
//  - U+02DA  ˚ &#730;  Ring Above
//  - U+02DB  ˛ &#731;  Ogonek
//  - U+02DC  ˜ &#732;  Small Tilde
//  - U+02DD  ˝ &#733;  Double Acute Accent
// Latin Extended Additional, 1E00–1EFF
const extendedWordChars = 'a-zA-Z\\u{C0}-\\u{FF}\\u{D8}-\\u{F6}\\u{F8}-\\u{2C6}\\u{2C8}-\\u{2D7}\\u{2DE}-\\u{2FF}\\u{1E00}-\\u{1EFF}';

// A token is any of the following:
// * A newline (with or without a carriage return)
// * A run of word characters
// * A run of whitespace
// * A single character that doesn't belong to any of the above categories (and is therefore considered punctuation)
const tokenizeRegex = new RegExp(`\\r?\\n|[${extendedWordChars}]+|[^\\S\\r\\n]+|[^${extendedWordChars}]`, 'ug');

export const wordDiff = new Diff();
wordDiff.equals = function(left, right, options) {
  if (options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }
  // The comparisons to the empty string are needed PURELY to signal to
  // buildValues that the whitespace token should be ignored. The empty string
  // will never be a token (removeEmpty removes it) but buildValues uses empty
  // string comparisons to test for ignored tokens and we need to handle that
  // query here.
  const leftIsWhitespace = (left === '' || (/^\s+$/).test(left));
  const rightIsWhitespace = (right === '' || (/^\s+$/).test(right));
  return left === right || (options.ignoreWhitespace && leftIsWhitespace && rightIsWhitespace);
};
wordDiff.tokenize = function(value) {
  return value.match(tokenizeRegex) || [];
};

export function diffWords(oldStr, newStr, options) {
  options = generateOptions(options, {ignoreWhitespace: true});
  return wordDiff.diff(oldStr, newStr, options);
}

export function diffWordsWithSpace(oldStr, newStr, options) {
  return wordDiff.diff(oldStr, newStr, options);
}
