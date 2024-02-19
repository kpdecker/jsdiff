import Diff from './base';
import {generateOptions} from '../util/params';

const spaceChars = ' \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';
let charsCannotBecomeWord = '';
charsCannotBecomeWord += '\n\r';
charsCannotBecomeWord +=
  '\u0000-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E'; // Basic Latin
  charsCannotBecomeWord += '\u00A0-\u00BF\u00D7\u00F7'; // Latin-1 Supplement
  charsCannotBecomeWord += '\u02B9-\u02DD\u02E5-\u02FF'; // Spacing Modifier Letters
  charsCannotBecomeWord += '\u0300-\u036F'; // Combining Diacritical Marks
  charsCannotBecomeWord += '\u1000-\u1FAFF'; // Mahjong Tiles - Symbols and Pictographs Extended-A
  charsCannotBecomeWord += '\u2000-\u2BFF'; // General Punctuation - Miscellaneous Symbols and Arrows
  charsCannotBecomeWord += '\u3000-\u303F'; // CJK Symbols and Punctuation
const spaceRegExp = new RegExp(`[${spaceChars}]`);
const cannotBecomeWordRegExp = new RegExp(`[${charsCannotBecomeWord}]`);

const reWhitespace = /\S/;

export const wordDiff = new Diff();
wordDiff.equals = function(left, right, options) {
  if (options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }
  return left === right || (options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right));
};
wordDiff.tokenize = function(value) {
  const tokens = [];
  let prevCharType = '';
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (spaceRegExp.test(char)) {
      if(prevCharType === 'space') {
        tokens[tokens.length - 1] += ' ';
      } else {
        tokens.push(' ');
      }
      prevCharType = 'space';
    } else if (cannotBecomeWordRegExp.test(char)) {
      tokens.push(char);
      prevCharType = '';
    } else {
      if(prevCharType === 'word') {
        tokens[tokens.length - 1] += char;
      } else {
        tokens.push(char);
      }
      prevCharType = 'word';
    }
  }
  return tokens;
};

export function diffWords(oldStr, newStr, options) {
  options = generateOptions(options, {ignoreWhitespace: true});
  return wordDiff.diff(oldStr, newStr, options);
}

export function diffWordsWithSpace(oldStr, newStr, options) {
  return wordDiff.diff(oldStr, newStr, options);
}
