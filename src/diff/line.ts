import Diff from './base';
import { CallbackOption, ChangeObject, DiffCallback, DiffLinesOptions } from '../types';
import {generateOptions} from '../util/params';


class LineDiff extends Diff<string, string> {
  // public so it can be copied by jsonDiff
  public tokenize(value: string, options: DiffLinesOptions) {
    if(options.stripTrailingCr) {
      // remove one \r before \n to match GNU diff's --strip-trailing-cr behavior
      value = value.replace(/\r\n/g, '\n');
    }

    const retLines = [],
        linesAndNewlines = value.split(/(\n|\r\n)/);

    // Ignore the final empty token that occurs if the string ends with a new line
    if (!linesAndNewlines[linesAndNewlines.length - 1]) {
      linesAndNewlines.pop();
    }

    // Merge the content and line separators into single tokens
    for (let i = 0; i < linesAndNewlines.length; i++) {
      const line = linesAndNewlines[i];

      if (i % 2 && !options.newlineIsToken) {
        retLines[retLines.length - 1] += line;
      } else {
        retLines.push(line);
      }
    }

    return retLines;
  }

  protected equals(left: string, right: string, options: DiffLinesOptions) {
    // If we're ignoring whitespace, we need to normalise lines by stripping
    // whitespace before checking equality. (This has an annoying interaction
    // with newlineIsToken that requires special handling: if newlines get their
    // own token, then we DON'T want to trim the *newline* tokens down to empty
    // strings, since this would cause us to treat whitespace-only line content
    // as equal to a separator between lines, which would be weird and
    // inconsistent with the documented behavior of the options.)
    if (options.ignoreWhitespace) {
      if (!options.newlineIsToken || !left.includes('\n')) {
        left = left.trim();
      }
      if (!options.newlineIsToken || !right.includes('\n')) {
        right = right.trim();
      }
    } else if (options.ignoreNewlineAtEof && !options.newlineIsToken) {
      if (left.endsWith('\n')) {
        left = left.slice(0, -1);
      }
      if (right.endsWith('\n')) {
        right = right.slice(0, -1);
      }
    }
    return super.equals(left, right, options);
  }
}

export const lineDiff = new LineDiff();

export function diffLines(
  oldStr: string,
  newStr: string,
  options: (DiffLinesOptions & CallbackOption<string>) | DiffCallback<string>
): undefined
export function diffLines(oldStr: string, newStr: string, options?: DiffLinesOptions): ChangeObject<string>[];
export function diffLines(oldStr: string, newStr: string, options?): undefined | ChangeObject<string>[] {
  return lineDiff.diff(oldStr, newStr, options);
}

// Kept for backwards compatibility. This is a rather arbitrary wrapper method
// that just calls `diffLines` with `ignoreWhitespace: true`. It's confusing to
// have two ways to do exactly the same thing in the API, so we no longer
// document this one (library users should explicitly use `diffLines` with
// `ignoreWhitespace: true` instead) but we keep it around to maintain
// compatibility with code that used old versions.
export function diffTrimmedLines(
  oldStr: string,
  newStr: string,
  options: (DiffLinesOptions & CallbackOption<string>) | DiffCallback<string>
): undefined
export function diffTrimmedLines(oldStr: string, newStr: string, options?: DiffLinesOptions): ChangeObject<string>[];
export function diffTrimmedLines(oldStr: string, newStr: string, options?): undefined | ChangeObject<string>[] {
  options = generateOptions(options, {ignoreWhitespace: true});
  return lineDiff.diff(oldStr, newStr, options);
}
