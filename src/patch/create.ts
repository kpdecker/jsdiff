import {diffLines} from '../diff/line.js';
import type { StructuredPatch, DiffLinesOptionsAbortable, DiffLinesOptionsNonabortable, AbortableDiffOptions, ChangeObject } from '../types.js';

type StructuredPatchCallbackAbortable = (patch: StructuredPatch | undefined) => void;
type StructuredPatchCallbackNonabortable = (patch: StructuredPatch) => void;

interface _StructuredPatchOptionsAbortable extends Pick<DiffLinesOptionsAbortable, 'ignoreWhitespace' | 'stripTrailingCr'> {
  /**
   * describes how many lines of context should be included.
   * You can set this to `Number.MAX_SAFE_INTEGER` or `Infinity` to include the entire file content in one hunk.
   * @default 4
   */
  context?: number,
  callback?: StructuredPatchCallbackAbortable,
}
export type StructuredPatchOptionsAbortable = _StructuredPatchOptionsAbortable & AbortableDiffOptions;
export interface StructuredPatchOptionsNonabortable extends Pick<DiffLinesOptionsNonabortable, 'ignoreWhitespace' | 'stripTrailingCr'> {
  context?: number,
  callback?: StructuredPatchCallbackNonabortable,
}
interface StructuredPatchCallbackOptionAbortable {
  /**
   * If provided, the diff will be computed in async mode to avoid blocking the event loop while the diff is calculated.
   * The value of the `callback` option should be a function and will be passed the computed diff or patch as its first argument.
   */
  callback: StructuredPatchCallbackAbortable;
}
interface StructuredPatchCallbackOptionNonabortable {
  /**
   * If provided, the diff will be computed in async mode to avoid blocking the event loop while the diff is calculated.
   * The value of the `callback` option should be a function and will be passed the computed diff or patch as its first argument.
   */
  callback: StructuredPatchCallbackNonabortable;
}

// Purely an implementation detail of diffLinesResultToPatch, which mutates the result of diffLines
// for convenience of implementation
interface ChangeObjectPlusLines extends Partial<ChangeObject<string>> {
  value: string;
  lines?: string[];
}

/**
 * returns an object with an array of hunk objects.
 *
 * This method is similar to createTwoFilesPatch, but returns a data structure suitable for further processing.
 * @param oldFileName String to be output in the filename section of the patch for the removals
 * @param newFileName String to be output in the filename section of the patch for the additions
 * @param oldStr Original string value
 * @param newStr New string value
 * @param oldHeader Optional additional information to include in the old file header.
 * @param newHeader Optional additional information to include in the new file header.
 */
export function structuredPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: StructuredPatchCallbackNonabortable
): undefined;
export function structuredPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: StructuredPatchOptionsAbortable & StructuredPatchCallbackOptionAbortable
): undefined
export function structuredPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: StructuredPatchOptionsNonabortable & StructuredPatchCallbackOptionNonabortable
): undefined
export function structuredPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: StructuredPatchOptionsAbortable
): StructuredPatch | undefined
export function structuredPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader?: string,
  newHeader?: string,
  options?: StructuredPatchOptionsNonabortable
): StructuredPatch
export function structuredPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader?: string,
  newHeader?: string,
  options?: StructuredPatchOptionsAbortable | StructuredPatchOptionsNonabortable | StructuredPatchCallbackNonabortable
): StructuredPatch | undefined {
  let optionsObj: StructuredPatchOptionsAbortable | StructuredPatchOptionsNonabortable;
  if (!options) {
    optionsObj = {};
  } else if (typeof options === 'function') {
    optionsObj = {callback: options};
  } else {
    optionsObj = options;
  }


  if (typeof optionsObj.context === 'undefined') {
    optionsObj.context = 4;
  }

  // We copy this into its own variable to placate TypeScript, which thinks
  // optionsObj.context might be undefined in the callbacks below.
  const context = optionsObj.context;

  // @ts-expect-error (runtime check for something that is correctly a static type error)
  if (optionsObj.newlineIsToken) {
    throw new Error('newlineIsToken may not be used with patch-generation functions, only with diffing functions');
  }

  if (!optionsObj.callback) {
    return diffLinesResultToPatch(diffLines(oldStr, newStr, optionsObj as any));
  } else {
    const {callback} = optionsObj;
    diffLines(
      oldStr,
      newStr,
      {
        ...optionsObj,
        callback: (diff) => {
          const patch = diffLinesResultToPatch(diff);
          // TypeScript is unhappy without the cast because it does not understand that `patch` may
          // be undefined here only if `callback` is StructuredPatchCallbackAbortable:
          (callback as any)(patch);
        }
      }
    );
  }

  function diffLinesResultToPatch(diff: ChangeObjectPlusLines[] | undefined) {
    // STEP 1: Build up the patch with no "\ No newline at end of file" lines and with the arrays
    //         of lines containing trailing newline characters. We'll tidy up later...

    if(!diff) {
      return;
    }

    diff.push({value: '', lines: []}); // Append an empty value to make cleanup easier

    function contextLines(lines: string[]) {
      return lines.map(function(entry) { return ' ' + entry; });
    }

    const hunks = [];
    let oldRangeStart = 0, newRangeStart = 0, curRange: string[] = [],
        oldLine = 1, newLine = 1;
    for (let i = 0; i < diff.length; i++) {
      const current = diff[i],
            lines = current.lines || splitLines(current.value);
      current.lines = lines;

      if (current.added || current.removed) {
        // If we have previous context, start with that
        if (!oldRangeStart) {
          const prev = diff[i - 1];
          oldRangeStart = oldLine;
          newRangeStart = newLine;

          if (prev) {
            curRange = context > 0 ? contextLines(prev.lines!.slice(-context)) : [];
            oldRangeStart -= curRange.length;
            newRangeStart -= curRange.length;
          }
        }

        // Output our changes
        for (const line of lines) {
          curRange.push((current.added ? '+' : '-') + line);
        }

        // Track the updated file position
        if (current.added) {
          newLine += lines.length;
        } else {
          oldLine += lines.length;
        }
      } else {
        // Identical context lines. Track line changes
        if (oldRangeStart) {
          // Close out any changes that have been output (or join overlapping)
          if (lines.length <= context * 2 && i < diff.length - 2) {
            // Overlapping
            for (const line of contextLines(lines)) {
              curRange.push(line);
            }
          } else {
            // end the range and output
            const contextSize = Math.min(lines.length, context);
            for (const line of contextLines(lines.slice(0, contextSize))) {
              curRange.push(line);
            }

            const hunk = {
              oldStart: oldRangeStart,
              oldLines: (oldLine - oldRangeStart + contextSize),
              newStart: newRangeStart,
              newLines: (newLine - newRangeStart + contextSize),
              lines: curRange
            };
            hunks.push(hunk);

            oldRangeStart = 0;
            newRangeStart = 0;
            curRange = [];
          }
        }
        oldLine += lines.length;
        newLine += lines.length;
      }
    }

    // Step 2: eliminate the trailing `\n` from each line of each hunk, and, where needed, add
    //         "\ No newline at end of file".
    for (const hunk of hunks) {
      for (let i = 0; i < hunk.lines.length; i++) {
        if (hunk.lines[i].endsWith('\n')) {
          hunk.lines[i] = hunk.lines[i].slice(0, -1);
        } else {
          hunk.lines.splice(i + 1, 0, '\\ No newline at end of file');
          i++; // Skip the line we just added, then continue iterating
        }
      }
    }

    return {
      oldFileName: oldFileName, newFileName: newFileName,
      oldHeader: oldHeader, newHeader: newHeader,
      hunks: hunks
    };
  }
}

/**
 * creates a unified diff patch.
 * @param patch either a single structured patch object (as returned by `structuredPatch`) or an array of them (as returned by `parsePatch`)
 */
export function formatPatch(patch: StructuredPatch | StructuredPatch[]): string {
  if (Array.isArray(patch)) {
    return patch.map(formatPatch).join('\n');
  }

  const ret = [];
  if (patch.oldFileName == patch.newFileName) {
    ret.push('Index: ' + patch.oldFileName);
  }
  ret.push('===================================================================');
  ret.push('--- ' + patch.oldFileName + (typeof patch.oldHeader === 'undefined' ? '' : '\t' + patch.oldHeader));
  ret.push('+++ ' + patch.newFileName + (typeof patch.newHeader === 'undefined' ? '' : '\t' + patch.newHeader));

  for (let i = 0; i < patch.hunks.length; i++) {
    const hunk = patch.hunks[i];
    // Unified Diff Format quirk: If the chunk size is 0,
    // the first number is one lower than one would expect.
    // https://www.artima.com/weblogs/viewpost.jsp?thread=164293
    if (hunk.oldLines === 0) {
      hunk.oldStart -= 1;
    }
    if (hunk.newLines === 0) {
      hunk.newStart -= 1;
    }
    ret.push(
      '@@ -' + hunk.oldStart + ',' + hunk.oldLines
      + ' +' + hunk.newStart + ',' + hunk.newLines
      + ' @@'
    );
    for (const line of hunk.lines) {
      ret.push(line);
    }
  }

  return ret.join('\n') + '\n';
}

type CreatePatchCallbackAbortable = (patch: string | undefined) => void;
type CreatePatchCallbackNonabortable = (patch: string) => void;

interface _CreatePatchOptionsAbortable extends Pick<DiffLinesOptionsAbortable, 'ignoreWhitespace' | 'stripTrailingCr'> {
  context?: number,
  callback?: CreatePatchCallbackAbortable,
}
export type CreatePatchOptionsAbortable = _CreatePatchOptionsAbortable & AbortableDiffOptions;
export interface CreatePatchOptionsNonabortable extends Pick<DiffLinesOptionsNonabortable, 'ignoreWhitespace' | 'stripTrailingCr'> {
  context?: number,
  callback?: CreatePatchCallbackNonabortable,
}
interface CreatePatchCallbackOptionAbortable {
  callback: CreatePatchCallbackAbortable;
}
interface CreatePatchCallbackOptionNonabortable {
  callback: CreatePatchCallbackNonabortable;
}

/**
 * creates a unified diff patch by first computing a diff with `diffLines` and then serializing it to unified diff format.
 * @param oldFileName String to be output in the filename section of the patch for the removals
 * @param newFileName String to be output in the filename section of the patch for the additions
 * @param oldStr Original string value
 * @param newStr New string value
 * @param oldHeader Optional additional information to include in the old file header.
 * @param newHeader Optional additional information to include in the new file header.
 */
export function createTwoFilesPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: CreatePatchCallbackNonabortable
): undefined;
export function createTwoFilesPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: CreatePatchOptionsAbortable & CreatePatchCallbackOptionAbortable
): undefined
export function createTwoFilesPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: CreatePatchOptionsNonabortable & CreatePatchCallbackOptionNonabortable
): undefined
export function createTwoFilesPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: CreatePatchOptionsAbortable
): string | undefined
export function createTwoFilesPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader?: string,
  newHeader?: string,
  options?: CreatePatchOptionsNonabortable
): string
export function createTwoFilesPatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  oldHeader?: string,
  newHeader?: string,
  options?: CreatePatchOptionsAbortable | CreatePatchOptionsNonabortable | CreatePatchCallbackNonabortable
): string | undefined {
  if (typeof options === 'function') {
    options = {callback: options};
  }

  if (!options?.callback) {
    const patchObj = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options as any);
    if (!patchObj) {
      return;
    }
    return formatPatch(patchObj);
  } else {
    const {callback} = options;
    structuredPatch(
      oldFileName,
      newFileName,
      oldStr,
      newStr,
      oldHeader,
      newHeader,
      {
        ...options,
        callback: patchObj => {
          if (!patchObj) {
            (callback as CreatePatchCallbackAbortable)(undefined);
          } else {
            callback(formatPatch(patchObj));
          }
        }
      }
    );
  }
}

/**
 * creates a unified diff patch.
 *
 * Just like createTwoFilesPatch, but with oldFileName being equal to newFileName.
 * @param fileName String to be output in the filename section of the patch
 * @param oldStr Original string value
 * @param newStr New string value
 * @param oldHeader Optional additional information to include in the old file header.
 * @param newHeader Optional additional information to include in the new file header.
 */
export function createPatch(
  fileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: CreatePatchCallbackNonabortable
): undefined;
export function createPatch(
  fileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: CreatePatchOptionsAbortable & CreatePatchCallbackOptionAbortable
): undefined
export function createPatch(
  fileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: CreatePatchOptionsNonabortable & CreatePatchCallbackOptionNonabortable
): undefined
export function createPatch(
  fileName: string,
  oldStr: string,
  newStr: string,
  oldHeader: string | undefined,
  newHeader: string | undefined,
  options: CreatePatchOptionsAbortable
): string | undefined
export function createPatch(
  fileName: string,
  oldStr: string,
  newStr: string,
  oldHeader?: string,
  newHeader?: string,
  options?: CreatePatchOptionsNonabortable
): string
export function createPatch(
  fileName: string,
  oldStr: string,
  newStr: string,
  oldHeader?: string,
  newHeader?: string,
  options?: CreatePatchOptionsAbortable | CreatePatchOptionsNonabortable | CreatePatchCallbackNonabortable
): string | undefined {
  return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options as any);
}

/**
 * Split `text` into an array of lines, including the trailing newline character (where present)
 */
function splitLines(text: string): string[] {
  const hasTrailingNl = text.endsWith('\n');
  const result = text.split('\n').map(line => line + '\n');
  if (hasTrailingNl) {
    result.pop();
  } else {
    result.push(
      (result.pop() as string).slice(0, -1)
    );
  }
  return result;
}
