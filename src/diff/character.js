import Diff from './base';

export const characterDiff = new Diff();
export function diffChars(oldStr, newStr, options) { return characterDiff.diff(oldStr, newStr, options); }
