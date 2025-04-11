import type { StructuredPatch } from '../types.js';

/**
 * @param patch either a single structured patch object (as returned by `structuredPatch`) or an array of them (as returned by `parsePatch`).
 * @returns a new structured patch which when applied will undo the original `patch`.
 */
export function reversePatch(structuredPatch: StructuredPatch): StructuredPatch;
export function reversePatch(structuredPatch: StructuredPatch[]): StructuredPatch[];
export function reversePatch(structuredPatch: StructuredPatch | StructuredPatch[]): StructuredPatch | StructuredPatch[];
export function reversePatch(structuredPatch: StructuredPatch | StructuredPatch[]): StructuredPatch | StructuredPatch[] {
  if (Array.isArray(structuredPatch)) {
    // (See comment in unixToWin for why we need the pointless-looking anonymous function here)
    return structuredPatch.map(patch => reversePatch(patch)).reverse();
  }

  return {
    ...structuredPatch,
    oldFileName: structuredPatch.newFileName,
    oldHeader: structuredPatch.newHeader,
    newFileName: structuredPatch.oldFileName,
    newHeader: structuredPatch.oldHeader,
    hunks: structuredPatch.hunks.map(hunk => {
      return {
        oldLines: hunk.newLines,
        oldStart: hunk.newStart,
        newLines: hunk.oldLines,
        newStart: hunk.oldStart,
        lines: hunk.lines.map(l => {
          if (l.startsWith('-')) { return `+${l.slice(1)}`; }
          if (l.startsWith('+')) { return `-${l.slice(1)}`; }
          return l;
        })
      };
    })
  };
}
