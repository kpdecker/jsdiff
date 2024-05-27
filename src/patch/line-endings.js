export function unixToWin(patch) {
  return patch.map(index => ({
    ...index,
    hunks: index.hunks.map(hunk => ({
      ...hunk,
      lines: hunk.lines.map(line => line.endsWith('\r') ? line : line + '\r')
    }))
  }));
}

export function winToUnix(patch) {
  return patch.map(index => ({
    ...index,
    hunks: index.hunks.map(hunk => ({
      ...hunk,
      lines: hunk.lines.map(line => line.endsWith('\r') ? line.substring(0, line.length - 1) : line)
    }))
  }));
}

/**
 * Returns true if the patch consistently uses Unix line endings (or only involves one line and has
 * no line endings).
 */
export function isUnix(patch) {
  return !patch.some(index => index.hunks.some(hunk => hunk.lines.some(line => line.endsWith('\r'))));
}

/**
 * Returns true if the patch uses Windows line endings and only Windows line endings.
 */
export function isWin(patch) {
  return patch.some(index => index.hunks.some(hunk => hunk.lines.some(line => line.endsWith('\r'))))
    && patch.every(index => index.hunks.every(hunk => hunk.lines.every(line => line.endsWith('\r'))));
}
