export function unixToWin(patch) {
  if (Array.isArray(patch)) {
    return patch.map(unixToWin);
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

export function winToUnix(patch) {
  if (Array.isArray(patch)) {
    return patch.map(winToUnix);
  }

  return {
    ...patch,
    hunks: patch.hunks.map(hunk => ({
      ...hunk,
      lines: hunk.lines.map(line => line.endsWith('\r') ? line.substring(0, line.length - 1) : line)
    }))
  };
}

/**
 * Returns true if the patch consistently uses Unix line endings (or only involves one line and has
 * no line endings).
 */
export function isUnix(patch) {
  if (!Array.isArray(patch)) { patch = [patch]; }
  return !patch.some(
    index => index.hunks.some(
      hunk => hunk.lines.some(
        line => !line.startsWith('\\') && line.endsWith('\r')
      )
    )
  );
}

/**
 * Returns true if the patch uses Windows line endings and only Windows line endings.
 */
export function isWin(patch) {
  if (!Array.isArray(patch)) { patch = [patch]; }
  return patch.some(index => index.hunks.some(hunk => hunk.lines.some(line => line.endsWith('\r'))))
    && patch.every(
      index => index.hunks.every(
        hunk => hunk.lines.every(
          (line, i) => line.startsWith('\\') || line.endsWith('\r') || hunk.lines[i + 1]?.startsWith('\\')
        )
      )
    );
}
