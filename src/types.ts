export interface ChangeObject<ValueT> {
    value: ValueT;
    added: boolean;
    removed: boolean;
    count: number;
}

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

interface DiffArraysOptions extends CommonDiffOptions {
  comparator?: (a: any, b: any) => boolean,
}
export interface DiffArraysOptionsNonabortable extends DiffArraysOptions {
  callback?: DiffCallbackNonabortable<any[]>
}
export type DiffArraysOptionsAbortable = DiffArraysOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<any[]>>


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
  ignoreWhitespace?: boolean, // TODO: This is SORT OF supported by diffWords. What to do?
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


// TODO: Move this somewhere else?
/**
 * Note that this contains the union of ALL options accepted by any of the built-in diffing
 * functions. The README notes which options are usable which functions. Using an option with a
 * diffing function that doesn't support it might yield unreasonable results.
 */
export type AllDiffOptions =
  DiffArraysOptions &
  DiffCharsOptions &
  DiffWordsOptions &
  DiffLinesOptions &
  DiffJsonOptions;

export interface StructuredPatch {
  oldFileName: string,
  newFileName: string,
  oldHeader: string,
  newHeader: string,
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
