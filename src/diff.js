/* See LICENSE file for terms of use */

/*
 * Text diff implementation.
 *
 * This library supports the following APIS:
 * JsDiff.diffChars: Character by character diff
 * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
 * JsDiff.diffLines: Line based diff
 *
 * JsDiff.diffCss: Diff targeted at CSS content
 *
 * These methods are based on the implementation proposed in
 * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */
import Diff from './diff/base';
import {characterDiff} from './diff/character';
import {lineDiff, trimmedLineDiff} from './diff/line';
import {sentenceDiff} from './diff/sentence';
import {wordDiff, wordWithSpaceDiff} from './diff/word';

import {cssDiff} from './diff/css';
import {jsonDiff, canonicalize} from './diff/json';

import {applyPatch} from './patch/apply';
import {structuredPatch, createTwoFilesPatch, createPatch} from './patch/create';

import {convertChangesToDMP} from './convert/dmp';
import {convertChangesToXML} from './convert/xml';

export {
  Diff,
  structuredPatch,
  createTwoFilesPatch,
  createPatch,
  applyPatch,
  convertChangesToDMP,
  convertChangesToXML,
  canonicalize
};

export function diffChars(oldStr, newStr, callback) { return characterDiff.diff(oldStr, newStr, callback); }
export function diffWords(oldStr, newStr, callback) { return wordDiff.diff(oldStr, newStr, callback); }
export function diffWordsWithSpace(oldStr, newStr, callback) { return wordWithSpaceDiff.diff(oldStr, newStr, callback); }
export function diffLines(oldStr, newStr, callback) { return lineDiff.diff(oldStr, newStr, callback); }
export function diffTrimmedLines(oldStr, newStr, callback) { return trimmedLineDiff.diff(oldStr, newStr, callback); }
export function diffSentences(oldStr, newStr, callback) { return sentenceDiff.diff(oldStr, newStr, callback); }

export function diffCss(oldStr, newStr, callback) { return cssDiff.diff(oldStr, newStr, callback); }
export function diffJson(oldObj, newObj, callback) { return jsonDiff.diff(oldObj, newObj, callback); }
