import type { StructuredPatch } from '../types.js';

function swapPrefix(fileName: string | undefined): string | undefined {
  if (fileName === undefined || fileName === '/dev/null') {
    return fileName;
  }
  if (fileName.startsWith('a/')) {
    return 'b/' + fileName.slice(2);
  }
  if (fileName.startsWith('b/')) {
    return 'a/' + fileName.slice(2);
  }
  return fileName;
}

/**
 * Returns a new structured patch which when applied will undo the original `patch`.
 *
 * When `patch` is a Git-style patch, `reversePatch` handles extended header information (relating
 * to renames, file modes, etc.) to the extent that doing so is possible, but note one fundamental
 * limitation: the correct inverse of a patch featuring `copy from`/`copy to` headers cannot, in
 * general, be determined based on the information contained in the patch alone, and so
 * `reversePatch`'s output when passed such a patch will usually be rejected by `git apply`. (The
 * correct inverse would be a patch that deletes the newly-created file, but for Git to apply such
 * a patch, the patch must explicitly delete every line of content in the file too, and that
 * content cannot be determined from the original patch on its own. `reversePatch` therefore does
 * the only vaguely reasonable thing it can do in this scenario: it outputs a patch with a
 * `deleted file mode` header - indicating that the file should be deleted - but no hunks.)
 *
 * @param patch either a single structured patch object (as returned by `structuredPatch`) or an
 *   array of them (as returned by `parsePatch`).
 */
export function reversePatch(structuredPatch: StructuredPatch): StructuredPatch;
export function reversePatch(structuredPatch: StructuredPatch[]): StructuredPatch[];
export function reversePatch(structuredPatch: StructuredPatch | StructuredPatch[]): StructuredPatch | StructuredPatch[];
export function reversePatch(structuredPatch: StructuredPatch | StructuredPatch[]): StructuredPatch | StructuredPatch[] {
  if (Array.isArray(structuredPatch)) {
    // (See comment in unixToWin for why we need the pointless-looking anonymous function here)
    return structuredPatch.map(patch => reversePatch(patch)).reverse();
  }

  const reversed: StructuredPatch = {
    ...structuredPatch,
    oldFileName: structuredPatch.isGit ? swapPrefix(structuredPatch.newFileName) : structuredPatch.newFileName,
    oldHeader: structuredPatch.newHeader,
    newFileName: structuredPatch.isGit ? swapPrefix(structuredPatch.oldFileName) : structuredPatch.oldFileName,
    newHeader: structuredPatch.oldHeader,
    oldMode: structuredPatch.newMode,
    newMode: structuredPatch.oldMode,
    isCreate: structuredPatch.isDelete,
    isDelete: structuredPatch.isCreate,
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

  if (structuredPatch.isCopy) {
    // Reversing a copy means deleting the file that was created by the copy.
    // The "old" file in the reversed patch is the copy destination (which
    // exists and should be removed), and the "new" file is /dev/null.
    //
    // Note: we clear the hunks because the original copy's hunks describe
    // the diff between the source and destination, not the full content of
    // the destination file, so they can't be meaningfully reversed into a
    // deletion hunk. This means the resulting patch is not something
    // `git apply` will accept (it requires deletion patches to include a
    // hunk removing every line). Producing a correct deletion hunk would
    // require knowing the full content of the copy destination, which we
    // don't have. Consumers that need a `git apply`-compatible patch will
    // need to resolve the full file content themselves.
    reversed.newFileName = '/dev/null';
    reversed.newHeader = undefined;
    reversed.isDelete = true;
    delete reversed.isCreate;
    delete reversed.isCopy;
    delete reversed.isRename;
    reversed.hunks = [];
  }
  // Reversing a rename is just a rename in the opposite direction;
  // isRename stays set and the filenames are already swapped above.

  return reversed;
}
