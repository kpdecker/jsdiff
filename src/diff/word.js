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

// Each token is one of the following:
// - A newline (either Unix-style or Windows-style)
// - A punctuation mark plus the surrounding non-newline whitespace
// - A word plus the surrounding non-newline whitespace
// - A run of pure whitespace (but only when this is the only content on a line)
//
// We have to include surrounding whitespace in the tokens because the two
// alternative approaches produce horribly broken results:
// * If we just discard the whitespace, we can't fully reproduce the original
//   text from the sequence of tokens and any attempt to render the diff will
//   get the whitespace wrong.
// * If we have separate tokens for whitespace, then in a typical text every
//   second token will be a single space character. But this often results in
//   the optimal diff between two texts being a perverse one that preserves
//   the spaces between words but deletes and reinserts actual common words.
//   See https://github.com/kpdecker/jsdiff/issues/160#issuecomment-1866099640
//   for an example.
//
// Keeping the surrounding whitespace of course has implications for .equals
// and .join, not just .tokenize.

// This regex does NOT fully implement the tokenization rules described above.
// Instead, it gives runs of whitespace their own "token". The tokenize method
// then handles stitching whitespace tokens onto adjacent word or punctuation
// tokens.
const tokenizeIncludingWhitespace = new RegExp(`\\r?\\n|[${extendedWordChars}]+|[^\\S\\r\\n]+|[^${extendedWordChars}]`, 'ug');

export const wordDiff = new Diff();
wordDiff.equals = function(left, right, options) {
  if (options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }

  return left.trim() === right.trim();
};

wordDiff.tokenize = function(value) {
  let parts = value.match(tokenizeIncludingWhitespace) || [];
  const tokens = [];
  let prevPart = null;
  for (const part of parts) {
    if (part.includes('\n')) {
      tokens.push(part);
    } else if ((/\s/).test(part)) {
      if (prevPart == null || prevPart.includes('\n')) {
        tokens.push(part);
      } else {
        tokens.push(tokens.pop() + part);
      }
    } else if ((/\s/).test(prevPart) && !prevPart.includes('\n')) {
      if (tokens[tokens.length - 1] == prevPart) {
        tokens.push(tokens.pop() + part);
      } else {
        tokens.push(prevPart + part);
      }
    } else {
      tokens.push(part);
    }

    prevPart = part;
  }
  return tokens;
};

wordDiff.join = function(tokens) {
  // Tokens being joined here will always have appeared consecutively in the
  // same text, so we can simply strip off the leading whitespace from all the
  // tokens except the first (and expect any whitespace-only tokens) and then
  // join them and the whitespace around words and punctuation will end up
  // correct.
  return tokens.map((token, i) => {
    if (i == 0) {
      return token;
    } else if ((/^\s+$/).test(token)) {
      return token;
    } else {
      return token.replace((/^\s+/), '');
    }
  }).join('');
};

export function diffWords(oldStr, newStr, options) {
  options = generateOptions(options);
  return wordDiff.diff(oldStr, newStr, options);
}

// TODO: Restore diffWordsWithSpace. It should basically just use
//       tokenizeIncludingWhitespace without the extra logic.
