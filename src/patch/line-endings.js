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
