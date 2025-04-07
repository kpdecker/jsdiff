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
  ignoreCase?: boolean;
}
export interface DiffCharsOptionsNonabortable extends DiffCharsOptions {
  callback?: DiffCallbackNonabortable<string>
}
export type DiffCharsOptionsAbortable = DiffCharsOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>

interface DiffLinesOptions extends CommonDiffOptions {
  stripTrailingCr?: boolean,
  newlineIsToken?: boolean,
  ignoreNewlineAtEof?: boolean,
  ignoreWhitespace?: boolean,
}
export interface DiffLinesOptionsNonabortable extends DiffLinesOptions {
  callback?: DiffCallbackNonabortable<string>
}
export type DiffLinesOptionsAbortable = DiffLinesOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>


interface DiffWordsOptions extends CommonDiffOptions {
  ignoreCase?: boolean
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
