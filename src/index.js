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
import {diffChars} from './diff/character';
import {diffWords, diffWordsWithSpace} from './diff/word';
import {diffLines, diffTrimmedLines} from './diff/line';
import {diffSentences} from './diff/sentence';

import {diffCss} from './diff/css';
import {diffJson, canonicalize} from './diff/json';

import {diffArrays} from './diff/array';

import {applyPatch, applyPatches} from './patch/apply';
import {parsePatch} from './patch/parse';
import {merge} from './patch/merge';
import {structuredPatch, createTwoFilesPatch, createPatch} from './patch/create';

import {convertChangesToDMP} from './convert/dmp';
import {convertChangesToXML} from './convert/xml';

export {
  Diff,

  diffChars,
  diffWords,
  diffWordsWithSpace,
  diffLines,
  diffTrimmedLines,
  diffSentences,

  diffCss,
  diffJson,

  diffArrays,

  structuredPatch,
  createTwoFilesPatch,
  createPatch,
  applyPatch,
  applyPatches,
  parsePatch,
  merge,
  convertChangesToDMP,
  convertChangesToXML,
  canonicalize
};
