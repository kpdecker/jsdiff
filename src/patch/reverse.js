export function reversePatch(structuredPatch) {
  if (Array.isArray(structuredPatch)) {
    return structuredPatch.map(reversePatch).reverse();
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
        linedelimiters: hunk.linedelimiters,
        lines: hunk.lines.map(l => {
          if (l.startsWith('-')) { return `+${l.slice(1)}`; }
          if (l.startsWith('+')) { return `-${l.slice(1)}`; }
          return l;
        })
      };
    })
  };
}
