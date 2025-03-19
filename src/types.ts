export interface ChangeObject<ValueT> {
    value: ValueT;
    added: boolean;
    removed: boolean;
    count: number;
}

export interface CommonDiffOptions<T> {
  maxEditLength?: number,
  timeout?: number,
  oneChangePerToken?: boolean,
  callback?: DiffCallback<T>
}

export interface DiffArraysOptions extends CommonDiffOptions<any[]> {
  comparator?: (a: any, b: any) => boolean,
}

export interface DiffCharsOptions extends CommonDiffOptions<string> {
  ignoreCase?: boolean,
}

export interface DiffLinesOptions extends CommonDiffOptions<string> {
  stripTrailingCr?: boolean,
  newlineIsToken?: boolean,
  ignoreNewlineAtEof?: boolean,
  ignoreWhitespace?: boolean, // TODO: This is SORT OF supported by diffWords. What to do?
}

export interface DiffWordsOptions extends CommonDiffOptions<string> {
  ignoreCase?: boolean
  intlSegmenter?: Intl.Segmenter,
}

export interface DiffSentencesOptions extends CommonDiffOptions<string> {}

export interface DiffJsonOptions extends CommonDiffOptions<string> {
  undefinedReplacement?: any,
  stringifyReplacer?: (k: string, v: any) => any,
}

export interface DiffCssOptions extends CommonDiffOptions<string> {}


interface NoAbortCallbackOption<ValueT> {
  callback: DiffCallback<ValueT>,
}

interface TimeoutOption {
  timeout: number,
}

interface MaxEditLengthOption {
  maxEditLength: number,
}

interface OptionalCallbackOption<ValueT> {
  callback: AbortableDiffCallback<ValueT>
}

export type AbortableDiffOptions = TimeoutOption | MaxEditLengthOption;

type AbortableCallbackOption<ValueT> = (OptionalCallbackOption<ValueT> & AbortableDiffOptions);

export type CallbackOption<ValueT> = NoAbortCallbackOption<ValueT> | AbortableCallbackOption<ValueT>;

/**
 * Note that this contains the union of ALL options accepted by any of the built-in diffing
 * functions. The README notes which options are usable which functions. Using an option with a
 * diffing function that doesn't support it might yield unreasonable results.
 */
export type AllDiffOptions<TokenT> =
  Omit<DiffArraysOptions, 'callback'> &
  Omit<DiffCharsOptions, 'callback'> &
  Omit<DiffWordsOptions, 'callback'> &
  Omit<DiffLinesOptions, 'callback'> &
  Omit<DiffJsonOptions, 'callback'> &
  Partial<CallbackOption<TokenT>>;

/**
 * This is a distinct type from AllDiffOptions so that we can have different overloads
 * with different return types depending upon whether a callback option is given (and thus whether
 * we are running in async or sync mode).
 */
export type DiffOptionsWithCallback<ValueT> = (AllDiffOptions<ValueT> & NoAbortCallbackOption<ValueT>) |
                                              (AllDiffOptions<ValueT> & AbortableCallbackOption<ValueT>);

export type DiffCallback<ValueT> = (result: ChangeObject<ValueT>[]) => void;
export type AbortableDiffCallback<ValueT> = (result?: ChangeObject<ValueT>[]) => void;

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
