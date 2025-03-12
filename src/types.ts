export interface ChangeObject<ValueT> {
    value: ValueT;
    added: boolean;
    removed: boolean;
    count: number;
}

/**
 * Note that this contains the union of ALL options accepted by any of the built-in diffing
 * functions. The README notes which options are usable which functions. Using an option with a
 * diffing function that doesn't support it might yield unreasonable results.
 */
export interface DiffOptionsWithoutCallback {
  // Universal:
  maxEditLength?: number,
  timeout?: number,
  oneChangePerToken?: boolean,

  // diffArrays only:
  comparator?: (a: any, b: any) => boolean,

  // diffChars or diffWords only:
  ignoreCase?: boolean,

  // diffJson only:
  undefinedReplacement?: any,
  stringifyReplacer?: (k: string, v: any) => any,

  // diffWords only:
  intlSegmenter?: Intl.Segmenter,

  // diffLines only:
  stripTrailingCr?: boolean,
  newlineIsToken?: boolean,
  ignoreNewlineAtEof?: boolean,
  ignoreWhitespace?: boolean, // TODO: This is SORT OF supported by diffWords. What to do?
}

/**
 * This is a distinct type from DiffOptionsWithoutCallback so that we can have different overloads
 * with different return types depending upon whether a callback option is given (and thus whether
 * we are running in async or sync mode).
 */
export interface DiffOptionsWithCallback<ValueT> extends DiffOptionsWithoutCallback {
  callback?: DiffCallback<ValueT>,
}

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
