import {hasOnlyWinLineEndings, hasOnlyUnixLineEndings} from '../util/string';
import {isWin, isUnix, unixToWin, winToUnix} from './line-endings';
import {parsePatch} from './parse';
import distanceIterator from '../util/distance-iterator';

export function applyPatch(source, uniDiff, options = {}) {
  if (typeof uniDiff === 'string') {
    uniDiff = parsePatch(uniDiff);
  }

  if (Array.isArray(uniDiff)) {
    if (uniDiff.length > 1) {
      throw new Error('applyPatch only works with a single input.');
    }

    uniDiff = uniDiff[0];
  }

  if (options.autoConvertLineEndings || options.autoConvertLineEndings == null) {
    if (hasOnlyWinLineEndings(source) && isUnix(uniDiff)) {
      uniDiff = unixToWin(uniDiff);
    } else if (hasOnlyUnixLineEndings(source) && isWin(uniDiff)) {
      uniDiff = winToUnix(uniDiff);
    }
  }

  // Apply the diff to the input
  let lines = source.split('\n'),
      hunks = uniDiff.hunks,

      compareLine = options.compareLine || ((lineNumber, line, operation, patchContent) => line === patchContent),
      fuzzFactor = options.fuzzFactor || 0,
      minLine = 0;

  if (fuzzFactor < 0 || !Number.isInteger(fuzzFactor)) {
    throw new Error('fuzzFactor must be a non-negative integer');
  }

  // Special case for empty patch.
  if (!hunks.length) {
    return source;
  }

  // Before anything else, handle EOFNL insertion/removal. If the patch tells us to make a change
  // to the EOFNL that is redundant/impossible - i.e. to remove a newline that's not there, or add a
  // newline that already exists - then we either return false and fail to apply the patch (if
  // fuzzFactor is 0) or simply ignore the problem and do nothing (if fuzzFactor is >0).
  // If we do need to remove/add a newline at EOF, this will always be in the final hunk:
  let prevLine = '',
      removeEOFNL = false,
      addEOFNL = false;
  for (let i = 0; i < hunks[hunks.length - 1].lines.length; i++) {
    const line = hunks[hunks.length - 1].lines[i];
    if (line[0] == '\\') {
      if (prevLine[0] == '+') {
        removeEOFNL = true;
      } else if (prevLine[0] == '-') {
        addEOFNL = true;
      }
    }
    prevLine = line;
  }
  if (removeEOFNL) {
    if (addEOFNL) {
      // This means the final line gets changed but doesn't have a trailing newline in either the
      // original or patched version. In that case, we do nothing if fuzzFactor > 0, and if
      // fuzzFactor is 0, we simply validate that the source file has no trailing newline.
      if (!fuzzFactor && lines[lines.length - 1] == '') {
        return false;
      }
    } else if (lines[lines.length - 1] == '') {
      lines.pop();
    } else if (!fuzzFactor) {
      return false;
    }
  } else if (addEOFNL) {
    if (lines[lines.length - 1] != '') {
      lines.push('');
    } else if (!fuzzFactor) {
      return false;
    }
  }

  /**
   * Checks if the hunk can be made to fit at the provided location with at most `maxErrors`
   * insertions, substitutions, or deletions, while ensuring also that:
   * - lines deleted in the hunk match exactly, and
   * - wherever an insertion operation or block of insertion operations appears in the hunk, the
   *   immediately preceding and following lines of context match exactly
   *
   * `toPos` should be set such that lines[toPos] is meant to match hunkLines[0].
   *
   * If the hunk can be applied, returns an object with properties `oldLineLastI` and
   * `replacementLines`. Otherwise, returns null.
   */
  function applyHunk(
    hunkLines,
    toPos,
    maxErrors,
    hunkLinesI = 0,
    lastContextLineMatched = true,
    patchedLines = [],
    patchedLinesLength = 0,
  ) {
    let nConsecutiveOldContextLines = 0;
    let nextContextLineMustMatch = false;
    for (; hunkLinesI < hunkLines.length; hunkLinesI++) {
      let hunkLine = hunkLines[hunkLinesI],
          operation = (hunkLine.length > 0 ? hunkLine[0] : ' '),
          content = (hunkLine.length > 0 ? hunkLine.substr(1) : hunkLine);

      if (operation === '-') {
        if (compareLine(toPos + 1, lines[toPos], operation, content)) {
          toPos++;
          nConsecutiveOldContextLines = 0;
        } else {
          if (!maxErrors || lines[toPos] == null) {
            return null;
          }
          patchedLines[patchedLinesLength] = lines[toPos];
          return applyHunk(
            hunkLines,
            toPos + 1,
            maxErrors - 1,
            hunkLinesI,
            false,
            patchedLines,
            patchedLinesLength + 1,
          );
        }
      }

      if (operation === '+') {
        if (!lastContextLineMatched) {
          return null;
        }
        patchedLines[patchedLinesLength] = content;
        patchedLinesLength++;
        nConsecutiveOldContextLines = 0;
        nextContextLineMustMatch = true;
      }

      if (operation === ' ') {
        nConsecutiveOldContextLines++;
        patchedLines[patchedLinesLength] = lines[toPos];
        if (compareLine(toPos + 1, lines[toPos], operation, content)) {
          patchedLinesLength++;
          lastContextLineMatched = true;
          nextContextLineMustMatch = false;
          toPos++;
        } else {
          if (nextContextLineMustMatch || !maxErrors) {
            return null;
          }

          // Consider 3 possibilities in sequence:
          // 1. lines contains a *substitution* not included in the patch context, or
          // 2. lines contains an *insertion* not included in the patch context, or
          // 3. lines contains a *deletion* not included in the patch context
          // The first two options are of course only possible if the line from lines is non-null -
          // i.e. only option 3 is possible if we've overrun the end of the old file.
          return (
            lines[toPos] && (
              applyHunk(
                hunkLines,
                toPos + 1,
                maxErrors - 1,
                hunkLinesI + 1,
                false,
                patchedLines,
                patchedLinesLength + 1
              ) || applyHunk(
                hunkLines,
                toPos + 1,
                maxErrors - 1,
                hunkLinesI,
                false,
                patchedLines,
                patchedLinesLength + 1
              )
            ) || applyHunk(
              hunkLines,
              toPos,
              maxErrors - 1,
              hunkLinesI + 1,
              false,
              patchedLines,
              patchedLinesLength
            )
          );
        }
      }
    }

    // Before returning, trim any unmodified context lines off the end of patchedLines and reduce
    // toPos (and thus oldLineLastI) accordingly. This allows later hunks to be applied to a region
    // that starts in this hunk's trailing context.
    patchedLinesLength -= nConsecutiveOldContextLines;
    toPos -= nConsecutiveOldContextLines;
    patchedLines.length = patchedLinesLength;
    return {
      patchedLines,
      oldLineLastI: toPos - 1
    };
  }

  const resultLines = [];

  // Search best fit offsets for each hunk based on the previous ones
  let prevHunkOffset = 0;
  for (let i = 0; i < hunks.length; i++) {
    const hunk = hunks[i];
    let hunkResult;
    let maxLine = lines.length - hunk.oldLines + fuzzFactor;
    let toPos;
    for (let maxErrors = 0; maxErrors <= fuzzFactor; maxErrors++) {
      toPos = hunk.oldStart + prevHunkOffset - 1;
      let iterator = distanceIterator(toPos, minLine, maxLine);
      for (; toPos !== undefined; toPos = iterator()) {
        hunkResult = applyHunk(hunk.lines, toPos, maxErrors);
        if (hunkResult) {
          break;
        }
      }
      if (hunkResult) {
        break;
      }
    }

    if (!hunkResult) {
      return false;
    }

    // Copy everything from the end of where we applied the last hunk to the start of this hunk
    for (let i = minLine; i < toPos; i++) {
      resultLines.push(lines[i]);
    }

    // Add the lines produced by applying the hunk:
    for (let i = 0; i < hunkResult.patchedLines.length; i++) {
      const line = hunkResult.patchedLines[i];
      resultLines.push(line);
    }

    // Set lower text limit to end of the current hunk, so next ones don't try
    // to fit over already patched text
    minLine = hunkResult.oldLineLastI + 1;

    // Note the offset between where the patch said the hunk should've applied and where we
    // applied it, so we can adjust future hunks accordingly:
    prevHunkOffset = toPos + 1 - hunk.oldStart;
  }

  // Copy over the rest of the lines from the old text
  for (let i = minLine; i < lines.length; i++) {
    resultLines.push(lines[i]);
  }

  return resultLines.join('\n');
}

// Wrapper that supports multiple file patches via callbacks.
export function applyPatches(uniDiff, options) {
  if (typeof uniDiff === 'string') {
    uniDiff = parsePatch(uniDiff);
  }

  let currentIndex = 0;
  function processIndex() {
    let index = uniDiff[currentIndex++];
    if (!index) {
      return options.complete();
    }

    options.loadFile(index, function(err, data) {
      if (err) {
        return options.complete(err);
      }

      let updatedContent = applyPatch(data, index, options);
      options.patched(index, updatedContent, function(err) {
        if (err) {
          return options.complete(err);
        }

        processIndex();
      });
    });
  }
  processIndex();
}
