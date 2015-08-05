import Diff from './base';

export const characterDiff = new Diff();
export function diffChars(oldStr, newStr, callback) { return characterDiff.diff(oldStr, newStr, callback); }
