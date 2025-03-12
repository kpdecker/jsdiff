export interface ChangeObject<ValueT> {
    value: ValueT;
    added: boolean;
    removed: boolean;
    count: number;
}

export interface CommonDiffOptions {
  maxEditLength?: number,
  timeout?: number,
  oneChangePerToken?: boolean,
}

export interface DiffArraysOptions extends CommonDiffOptions {
  comparator?: (a: any, b: any) => boolean,
}

export interface DiffCharsOptions extends CommonDiffOptions {
  ignoreCase?: boolean,
}

export interface DiffLinesOptions extends CommonDiffOptions {
  stripTrailingCr?: boolean,
  newlineIsToken?: boolean,
  ignoreNewlineAtEof?: boolean,
  ignoreWhitespace?: boolean, // TODO: This is SORT OF supported by diffWords. What to do?
}

export interface DiffWordsOptions extends CommonDiffOptions {
  ignoreCase?: boolean
  intlSegmenter?: Intl.Segmenter,
}

export interface DiffSentencesOptions extends CommonDiffOptions {}

export interface DiffJsonOptions extends CommonDiffOptions {
  undefinedReplacement?: any,
  stringifyReplacer?: (k: string, v: any) => any,
}

export interface DiffCssOptions extends CommonDiffOptions {}


export interface CallbackOption<ValueT> {
  callback: DiffCallback<ValueT>,
}

/**
 * Note that this contains the union of ALL options accepted by any of the built-in diffing
 * functions. The README notes which options are usable which functions. Using an option with a
 * diffing function that doesn't support it might yield unreasonable results.
 */
export type DiffOptionsWithoutCallback =
  DiffArraysOptions &
  DiffCharsOptions &
  DiffWordsOptions &
  DiffLinesOptions &
  DiffJsonOptions;

/**
 * This is a distinct type from DiffOptionsWithoutCallback so that we can have different overloads
 * with different return types depending upon whether a callback option is given (and thus whether
 * we are running in async or sync mode).
 */
export type DiffOptionsWithCallback<ValueT> = DiffOptionsWithoutCallback & CallbackOption<ValueT>;

export type DiffCallback<ValueT> = (result?: ChangeObject<ValueT>[]) => void;

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
