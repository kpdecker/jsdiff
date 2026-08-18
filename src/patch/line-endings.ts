import type { StructuredPatch } from '../types.js';

export function unixToWin(patch: StructuredPatch): StructuredPatch;
export function unixToWin(patches: StructuredPatch[]): StructuredPatch[];
export function unixToWin(patch: StructuredPatch | StructuredPatch[]): StructuredPatch | StructuredPatch[];
export function unixToWin(patch: StructuredPatch | StructuredPatch[]): StructuredPatch | StructuredPatch[] {
  if (Array.isArray(patch)) {
    // It would be cleaner if instead of the line below we could just write
    //     return patch.map(unixToWin)
    // but mysteriously TypeScript (v5.7.3 at the time of writing) does not like this and it will
    // refuse to compile, thinking that unixToWin could then return StructuredPatch[][] and the
    // result would be incompatible with the overload signatures.
    // See bug report at https://github.com/microsoft/TypeScript/issues/61398.
    return patch.map(p => unixToWin(p));
  }

  return {
    ...patch,
    hunks: patch.hunks.map(hunk => ({
      ...hunk,
      lines: hunk.lines.map(
        (line, i) =>
          (line.startsWith('\\') || line.endsWith('\r') || hunk.lines[i + 1]?.startsWith('\\'))
            ? line
            : line + '\r'
      )
    }))
  };
}

export function winToUnix(patch: StructuredPatch): StructuredPatch;
export function winToUnix(patches: StructuredPatch[]): StructuredPatch[];
export function winToUnix(patch: StructuredPatch | StructuredPatch[]): StructuredPatch | StructuredPatch[];
export function winToUnix(patch: StructuredPatch | StructuredPatch[]): StructuredPatch | StructuredPatch[] {
  if (Array.isArray(patch)) {
    // (See comment above equivalent line in unixToWin)
    return patch.map(p => winToUnix(p));
  }

  return {
    ...patch,
    hunks: patch.hunks.map(hunk => ({
      ...hunk,
      lines: hunk.lines.map(
        (line, i) =>
          // A trailing '\r' on a line immediately followed by a "\ No newline at end of file"
          // marker is not a Windows line ending (a Windows EOL is '\r\n'); it's a literal carriage
          // return in the final line's content. Stripping it would corrupt the content, so we leave
          // such lines alone. (This mirrors the equivalent guard in unixToWin.)
          (line.endsWith('\r') && !hunk.lines[i + 1]?.startsWith('\\'))
            ? line.substring(0, line.length - 1)
            : line
      )
    }))
  };
}

/**
 * Returns true if the patch consistently uses Unix line endings (or only involves one line and has
 * no line endings).
 */
export function isUnix(patch: StructuredPatch | StructuredPatch[]): boolean {
  if (!Array.isArray(patch)) { patch = [patch]; }
  return !patch.some(
    index => index.hunks.some(
      hunk => hunk.lines.some(
        (line, i) => !line.startsWith('\\') && line.endsWith('\r') && !hunk.lines[i + 1]?.startsWith('\\')
      )
    )
  );
}

/**
 * Returns true if the patch uses Windows line endings and only Windows line endings.
 */
export function isWin(patch: StructuredPatch | StructuredPatch[]): boolean {
  if (!Array.isArray(patch)) { patch = [patch]; }
  return patch.some(
    index => index.hunks.some(
      hunk => hunk.lines.some(
        // A trailing '\r' before a "\ No newline at end of file" marker is a literal carriage
        // return in the final line's content, not a Windows line ending, so it isn't evidence that
        // the patch uses Windows line endings.
        (line, i) => line.endsWith('\r') && !hunk.lines[i + 1]?.startsWith('\\')
      )
    )
  )
    && patch.every(
      index => index.hunks.every(
        hunk => hunk.lines.every(
          (line, i) => line.startsWith('\\') || line.endsWith('\r') || hunk.lines[i + 1]?.startsWith('\\')
        )
      )
    );
}
