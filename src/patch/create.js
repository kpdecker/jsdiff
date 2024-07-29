import {diffLines} from '../diff/line';

export function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (!options) {
    options = {};
  }
  if (typeof options === 'function') {
    options = {callback: options};
  }
  if (typeof options.context === 'undefined') {
    options.context = 4;
  }
  if (options.newlineIsToken) {
    throw new Error('newlineIsToken may not be used with patch-generation functions, only with diffing functions');
  }

  if (!options.callback) {
    return diffLinesResultToPatch(diffLines(oldStr, newStr, options));
  } else {
    const {callback} = options;
    diffLines(
      oldStr,
      newStr,
      {
        ...options,
        callback: (diff) => {
          const patch = diffLinesResultToPatch(diff);
          callback(patch);
        }
      }
    );
  }

  function diffLinesResultToPatch(diff) {
    // STEP 1: Build up the patch with no "\ No newline at end of file" lines and with the arrays
    //         of lines containing trailing newline characters. We'll tidy up later...

    if(!diff) {
      return;
    }

    diff.push({value: '', lines: []}); // Append an empty value to make cleanup easier

    function contextLines(lines) {
      return lines.map(function(entry) { return ' ' + entry; });
    }

    let hunks = [];
    let oldRangeStart = 0, newRangeStart = 0, curRange = [],
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
            curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
            oldRangeStart -= curRange.length;
            newRangeStart -= curRange.length;
          }
        }

        // Output our changes
        curRange.push(... lines.map(function(entry) {
          return (current.added ? '+' : '-') + entry;
        }));

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
          if (lines.length <= options.context * 2 && i < diff.length - 2) {
            // Overlapping
            curRange.push(... contextLines(lines));
          } else {
            // end the range and output
            let contextSize = Math.min(lines.length, options.context);
            curRange.push(... contextLines(lines.slice(0, contextSize)));

            let hunk = {
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

export function formatPatch(diff) {
  if (Array.isArray(diff)) {
    return diff.map(formatPatch).join('\n');
  }

  const ret = [];
  if (diff.oldFileName == diff.newFileName) {
    ret.push('Index: ' + diff.oldFileName);
  }
  ret.push('===================================================================');
  ret.push('--- ' + diff.oldFileName + (typeof diff.oldHeader === 'undefined' ? '' : '\t' + diff.oldHeader));
  ret.push('+++ ' + diff.newFileName + (typeof diff.newHeader === 'undefined' ? '' : '\t' + diff.newHeader));

  for (let i = 0; i < diff.hunks.length; i++) {
    const hunk = diff.hunks[i];
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
    ret.push.apply(ret, hunk.lines);
  }

  return ret.join('\n') + '\n';
}

export function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (typeof options === 'function') {
    options = {callback: options};
  }

  if (!options?.callback) {
    const patchObj = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);
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
            callback();
          } else {
            callback(formatPatch(patchObj));
          }
        }
      }
    );
  }
}

export function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
  return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
}

/**
 * Split `text` into an array of lines, including the trailing newline character (where present)
 */
function splitLines(text) {
  const hasTrailingNl = text.endsWith('\n');
  const result = text.split('\n').map(line => line + '\n');
  if (hasTrailingNl) {
    result.pop();
  } else {
    result.push(result.pop().slice(0, -1));
  }
  return result;
}
