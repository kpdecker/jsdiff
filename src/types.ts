export interface ChangeObject<ValueT> {
    value: ValueT;
    added: boolean;
    removed: boolean;
    count: number;
}

// Name "Change" is used here for consistency with the previous type definitions from
// DefinitelyTyped. I would *guess* this is probably the single most common type for people to
// explicitly reference by name in their own code, so keeping its name consistent is valuable even
// though the names of many other types are inconsistent with the old DefinitelyTyped names.
export type Change = ChangeObject<string>;
export type ArrayChange = ChangeObject<any[]>;

export interface CommonDiffOptions {
  oneChangePerToken?: boolean,
}

export interface TimeoutOption {
  timeout: number;
}

export interface MaxEditLengthOption {
  maxEditLength: number;
}

export type AbortableDiffOptions = TimeoutOption | MaxEditLengthOption;

export type DiffCallbackNonabortable<T> = (result: ChangeObject<T>[]) => void;
export type DiffCallbackAbortable<T> = (result: ChangeObject<T>[] | undefined) => void;

export interface CallbackOptionNonabortable<T> {
  callback: DiffCallbackNonabortable<T>
}
export interface CallbackOptionAbortable<T> {
  callback: DiffCallbackAbortable<T>
}

interface DiffArraysOptions<T> extends CommonDiffOptions {
  comparator?: (a: T, b: T) => boolean,
}
export interface DiffArraysOptionsNonabortable<T> extends DiffArraysOptions<T> {
  callback?: DiffCallbackNonabortable<T[]>
}
export type DiffArraysOptionsAbortable<T> = DiffArraysOptions<T> & AbortableDiffOptions & Partial<CallbackOptionAbortable<T[]>>


interface DiffCharsOptions extends CommonDiffOptions {
  /**
   * If `true`, the uppercase and lowercase forms of a character are considered equal.
   * @default false
   */
  ignoreCase?: boolean;
}
export interface DiffCharsOptionsNonabortable extends DiffCharsOptions {
  callback?: DiffCallbackNonabortable<string>
}
export type DiffCharsOptionsAbortable = DiffCharsOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>

interface DiffLinesOptions extends CommonDiffOptions {
  /**
   * `true` to remove all trailing CR (`\r`) characters before performing the diff.
   * This helps to get a useful diff when diffing UNIX text files against Windows text files.
   * @default false
   */
  stripTrailingCr?: boolean,
  /**
   * `true` to treat the newline character at the end of each line as its own token.
   * This allows for changes to the newline structure to occur independently of the line content and to be treated as such.
   * In general this is the more human friendly form of `diffLines`; the default behavior with this option turned off is better suited for patches and other computer friendly output.
   *
   * Note that while using `ignoreWhitespace` in combination with `newlineIsToken` is not an error, results may not be as expected.
   * With `ignoreWhitespace: true` and `newlineIsToken: false`, changing a completely empty line to contain some spaces is treated as a non-change, but with `ignoreWhitespace: true` and `newlineIsToken: true`, it is treated as an insertion.
   * This is because the content of a completely blank line is not a token at all in `newlineIsToken` mode.
   *
   * @default false
   */
  newlineIsToken?: boolean,
  /**
   * `true` to ignore a missing newline character at the end of the last line when comparing it to other lines.
   * (By default, the line `'b\n'` in text `'a\nb\nc'` is not considered equal to the line `'b'` in text `'a\nb'`; this option makes them be considered equal.)
   * Ignored if `ignoreWhitespace` or `newlineIsToken` are also true.
   * @default false
   */
  ignoreNewlineAtEof?: boolean,
  /**
   * `true` to ignore leading and trailing whitespace characters when checking if two lines are equal.
   * @default false
   */
  ignoreWhitespace?: boolean,
}
export interface DiffLinesOptionsNonabortable extends DiffLinesOptions {
  callback?: DiffCallbackNonabortable<string>
}
export type DiffLinesOptionsAbortable = DiffLinesOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>


interface DiffWordsOptions extends CommonDiffOptions {
  /**
   * Same as in `diffChars`.
   * @default false
   */
  ignoreCase?: boolean

  /**
   * An optional [`Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) object (which must have a `granularity` of `'word'`) for `diffWords` to use to split the text into words.
   *
   * By default, `diffWords` does not use an `Intl.Segmenter`, just some regexes for splitting text into words. This will tend to give worse results than `Intl.Segmenter` would, but ensures the results are consistent across environments; `Intl.Segmenter` behaviour is only loosely specced and the implementations in browsers could in principle change dramatically in future. If you want to use `diffWords` with an `Intl.Segmenter` but ensure it behaves the same whatever environment you run it in, use an `Intl.Segmenter` polyfill instead of the JavaScript engine's native `Intl.Segmenter` implementation.
   *
   * Using an `Intl.Segmenter` should allow better word-level diffing of non-English text than the default behaviour. For instance, `Intl.Segmenter`s can generally identify via built-in dictionaries which sequences of adjacent Chinese characters form words, allowing word-level diffing of Chinese. By specifying a language when instantiating the segmenter (e.g. `new Intl.Segmenter('sv', {granularity: 'word'})`) you can also support language-specific rules, like treating Swedish's colon separated contractions (like *k:a* for *kyrka*) as single words; by default this would be seen as two words separated by a colon.
   */
  intlSegmenter?: Intl.Segmenter,
}
export interface DiffWordsOptionsNonabortable extends DiffWordsOptions {
  callback?: DiffCallbackNonabortable<string>
}
export type DiffWordsOptionsAbortable = DiffWordsOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>


interface DiffSentencesOptions extends CommonDiffOptions {}
export interface DiffSentencesOptionsNonabortable extends DiffSentencesOptions {
  callback?: DiffCallbackNonabortable<string>
}
export type DiffSentencesOptionsAbortable = DiffSentencesOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>


interface DiffJsonOptions extends CommonDiffOptions {
  undefinedReplacement?: any,
  stringifyReplacer?: (k: string, v: any) => any,
}
export interface DiffJsonOptionsNonabortable extends DiffJsonOptions {
  callback?: DiffCallbackNonabortable<string>
}
export type DiffJsonOptionsAbortable = DiffJsonOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>


interface DiffCssOptions extends CommonDiffOptions {}
export interface DiffCssOptionsNonabortable extends DiffCssOptions {
  callback?: DiffCallbackNonabortable<string>
}
export type DiffCssOptionsAbortable = DiffJsonOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>


/**
 * Note that this contains the union of ALL options accepted by any of the built-in diffing
 * functions. The README notes which options are usable which functions. Using an option with a
 * diffing function that doesn't support it might yield unreasonable results.
 */
export type AllDiffOptions =
  DiffArraysOptions<unknown> &
  DiffCharsOptions &
  DiffWordsOptions &
  DiffLinesOptions &
  DiffJsonOptions;

export interface StructuredPatch {
  oldFileName: string,
  newFileName: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  hunks: StructuredPatchHunk[],
  index?: string,
}

export interface StructuredPatchHunk {
  oldStart: number,
  oldLines: number,
  newStart: number,
  newLines: number,
  lines: string[],
}
