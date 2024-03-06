import Diff from './base';
import { longestCommonPrefix, longestCommonSuffix, replacePrefix, replaceSuffix, removePrefix, removeSuffix, maximumOverlap } from '../util/string';
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
// - A punctuation mark plus the surrounding whitespace
// - A word plus the surrounding whitespace
// - Pure whitespace (but only in the special case where this the entire text
//   is just whitespace)
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
const tokenizeIncludingWhitespace = new RegExp(`[${extendedWordChars}]+|\\s+|[^${extendedWordChars}]`, 'ug');

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
    if ((/\s/).test(part)) {
      if (prevPart == null) {
        tokens.push(part);
      } else {
        tokens.push(tokens.pop() + part);
      }
    } else if ((/\s/).test(prevPart)) {
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
  // tokens except the first (and except any whitespace-only tokens) and then
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

wordDiff.postProcess = function(changes, options) {
  if (!changes || options.oneChangePerToken) {
    return changes;
  }

  let lastKeep = null;
  // Change objects representing any insertion or deletion since the last
  // "keep" change object. There can be at most one of each.
  let insertion = null;
  let deletion = null;
  for (const change of changes) {
    if (change.added) {
      insertion = change;
    } else if (change.removed) {
      deletion = change;
    } else {
      if (insertion || deletion) { // May be false at start of text
        dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, change);
      }
      lastKeep = change;
      insertion = null;
      deletion = null;
    }
  }
  if (insertion || deletion) {
    dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, null);
  }
  return changes;
};

export function diffWords(oldStr, newStr, options) {
  options = generateOptions(options, {});
  return wordDiff.diff(oldStr, newStr, options);
}

function dedupeWhitespaceInChangeObjects(startKeep, deletion, insertion, endKeep) {
  // Before returning, we tidy up the leading and trailing whitespace of the
  // change objects to eliminate cases where trailing whitespace in one object
  // is repeated as leading whitespace in the next.
  // Below are examples of the outcomes we want here to explain the code.
  // I=insert, K=keep, D=delete
  // 1. diffing 'foo bar baz' vs 'foo baz'
  //    Prior to cleanup, we have K:'foo ' D:' bar ' K:' baz'
  //    After cleanup, we want:   K:'foo ' D:'bar ' K:'baz'
  //
  // 2. Diffing 'foo bar baz' vs 'foo qux baz'
  //    Prior to cleanup, we have K:'foo ' D:' bar ' I:' qux ' K:' baz'
  //    After cleanup, we want K:'foo ' D:'bar' I:'qux' K:' baz'
  //
  // 3. Diffing 'foo\nbar baz' vs 'foo baz'
  //    Prior to cleanup, we have K:'foo ' D:'\nbar ' K:' baz'
  //    After cleanup, we want K'foo' D:'\nbar' K:' baz'
  //
  // 4. Diffing 'foo baz' vs 'foo\nbar baz'
  //    Prior to cleanup, we have K:'foo\n' I:'\nbar ' K:' baz'
  //    After cleanup, we want K'foo' I:'\nbar' K:' baz'
  //
  // 5. Diffing 'foo   bar baz' vs 'foo  baz'
  //    Prior to cleanup, we have K:'foo  ' D:'   bar ' K:'  baz'
  //    After cleanup, we want K:'foo  ' D:' bar ' K:'baz'
  //
  // Our handling is unavoidably imperfect in the case where there's a single
  // indel between keeps and the whitespace has changed. For instance, consider
  // diffing 'foo\tbar\nbaz' vs 'foo baz'. Unless we create an extra change
  // object to represent the insertion of the space character (which isn't even
  // a token), we have no way to avoid losing information about the texts'
  // original whitespace in the result we return. Still, we do our best to
  // output something that will look sensible if we e.g. print it with
  // insertions in green and deletions in red.

  // Between two "keep" change objects (or before the first or after the last
  // change object), we can have either:
  // * A "delete" followed by an "insert"
  // * Just an "insert"
  // * Just a "delete"
  // We handle the three cases separately.

  if (!deletion && !insertion) {
    throw Error("deletion & insertion are both null; this shouldn't happen");
  }

  if (deletion && insertion) {
    const oldWsPrefix = deletion.value.match(/^\s*/)[0];
    const oldWsSuffix = deletion.value.match(/\s*$/)[0];
    const newWsPrefix = insertion.value.match(/^\s*/)[0];
    const newWsSuffix = insertion.value.match(/\s*$/)[0];

    if (startKeep) {
      const commonWsPrefix = longestCommonPrefix(oldWsPrefix, newWsPrefix);
      startKeep.value = replaceSuffix(startKeep.value, newWsPrefix, commonWsPrefix);
      deletion.value = removePrefix(deletion.value, commonWsPrefix);
      insertion.value = removePrefix(insertion.value, commonWsPrefix);
    }
    if (endKeep) {
      const commonWsSuffix = longestCommonSuffix(oldWsSuffix, newWsSuffix);
      endKeep.value = replacePrefix(endKeep.value, newWsSuffix, commonWsSuffix);
      deletion.value = removeSuffix(deletion.value, commonWsSuffix);
      insertion.value = removeSuffix(insertion.value, commonWsSuffix);
    }
  } else if (insertion) {
    // The whitespaces all reflect what was in the new text rather than
    // the old, so we essentially have no information about whitespace
    // insertion or deletion. We just want to dedupe the whitespace.
    // We do that by having each change object keep its trailing
    // whitespace and deleting duplicate leading whitespace where
    // present.
    if (startKeep) {
      insertion.value = insertion.value.replace(/^\s*/, '');
    }
    if (endKeep) {
      endKeep.value = endKeep.value.replace(/^\s*/, '');
    }
  } else {
    // As long as we're NOT at the start of the text, the leading whitespace of
    // the second "keep" change object can always be nuked, and the trailing
    // whitespace of the deletion can always be kept, whether or not they
    // match. (The whitespace separating the two keeps will be including at
    // the end of startKeep so we don't need to duplicate it on endKeep.)
    if (startKeep && endKeep) {
      endKeep.value = endKeep.value.replace(/^\s*/, '');
    } else if (endKeep) {
      // If we ARE at the start of the text, though, we need to preserve all
      // the whitespace on endKeep. In that case, we just want to remove
      // whitespace from the end of deletion to the extent that it overlaps
      // with the start of endKeep.
      const endKeepWsPrefix = endKeep.value.match(/^\s*/)[0];
      const deletionWsSuffix = deletion.value.match(/\s*$/)[0];
      const overlap = maximumOverlap(deletionWsSuffix, endKeepWsPrefix);
      deletion.value = removeSuffix(deletion.value, overlap);
    }

    // Leading whitespace on the deleted token can only be deleted to the
    // extent that this overlaps with the trailing whitespace on the preceding
    // kept token.
    if (startKeep) {
      const startKeepWsSuffix = startKeep.value.match(/\s*$/)[0];
      const deletionWsPrefix = deletion.value.match(/^\s*/)[0];
      const overlap = maximumOverlap(startKeepWsSuffix, deletionWsPrefix);
      deletion.value = removePrefix(deletion.value, overlap);
    }
  }
}

export const wordWithSpaceDiff = new Diff();
wordWithSpaceDiff.tokenize = function(value) {
  // Slightly different to the tokenizeIncludingWhitespace regex used above in
  // that this one treats each individual newline as a distinct tokens, rather
  // than merging them into other surrounding whitespace. This was requested
  // in https://github.com/kpdecker/jsdiff/issues/180 &
  //    https://github.com/kpdecker/jsdiff/issues/211
  const regex = new RegExp(`(\\r?\\n)|[${extendedWordChars}]+|[^\\S\\n\\r]+|[^${extendedWordChars}]`, 'ug');
  return value.match(regex) || [];
};
export function diffWordsWithSpace(oldStr, newStr, options) {
  options = generateOptions(options, {});
  return wordWithSpaceDiff.diff(oldStr, newStr, options);
}
