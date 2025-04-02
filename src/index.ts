/* See LICENSE file for terms of use */

/*
 * Text diff implementation.
 *
 * This library supports the following APIs:
 * Diff.diffChars: Character by character diff
 * Diff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
 * Diff.diffLines: Line based diff
 *
 * Diff.diffCss: Diff targeted at CSS content
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

import {applyPatch, applyPatches, ApplyPatchOptions, ApplyPatchesOptions} from './patch/apply';
import {parsePatch} from './patch/parse';
import {reversePatch} from './patch/reverse';
import {
  structuredPatch,
  createTwoFilesPatch,
  createPatch,
  formatPatch,
  StructuredPatchOptionsAbortable,
  StructuredPatchOptionsNonabortable,
  CreatePatchOptionsAbortable,
  CreatePatchOptionsNonabortable
} from './patch/create';

import {convertChangesToDMP} from './convert/dmp';
import {convertChangesToXML} from './convert/xml';
import {
  ChangeObject,
  Change,
  DiffArraysOptionsAbortable,
  DiffArraysOptionsNonabortable,
  DiffCharsOptionsAbortable,
  DiffCharsOptionsNonabortable,
  DiffLinesOptionsAbortable,
  DiffLinesOptionsNonabortable,
  DiffWordsOptionsAbortable,
  DiffWordsOptionsNonabortable,
  DiffSentencesOptionsAbortable,
  DiffSentencesOptionsNonabortable,
  DiffJsonOptionsAbortable,
  DiffJsonOptionsNonabortable,
  DiffCssOptionsAbortable,
  DiffCssOptionsNonabortable,
  StructuredPatch,
  StructuredPatchHunk
} from './types';

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
  formatPatch,
  applyPatch,
  applyPatches,
  parsePatch,
  reversePatch,
  convertChangesToDMP,
  convertChangesToXML,
  canonicalize,

  ChangeObject,
  Change,
  DiffArraysOptionsAbortable,
  DiffArraysOptionsNonabortable,
  DiffCharsOptionsAbortable,
  DiffCharsOptionsNonabortable,
  DiffLinesOptionsAbortable,
  DiffLinesOptionsNonabortable,
  DiffWordsOptionsAbortable,
  DiffWordsOptionsNonabortable,
  DiffSentencesOptionsAbortable,
  DiffSentencesOptionsNonabortable,
  DiffJsonOptionsAbortable,
  DiffJsonOptionsNonabortable,
  DiffCssOptionsAbortable,
  DiffCssOptionsNonabortable,
  StructuredPatch,
  StructuredPatchHunk,

  ApplyPatchOptions,
  ApplyPatchesOptions,

  StructuredPatchOptionsAbortable,
  StructuredPatchOptionsNonabortable,
  CreatePatchOptionsAbortable,
  CreatePatchOptionsNonabortable
};
