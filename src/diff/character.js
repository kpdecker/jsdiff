import Diff from './base';

export const characterDiff = new Diff();

// TODO: Add more common options
// TODO: Move to base.js and import
/**
 * @typedef BaseDiffOptions
 * @property {number} [timeout]
 */

/**
 * @typedef DiffCharsOptions
 * @property {boolean} [ignoreCase]
 */

/**
 * @param {string} oldStr
 * @param {string} newStr
 * @param {DiffCharsOptions & BaseDiffOptions} [options]
 */
export function diffChars(oldStr, newStr, options) { return characterDiff.diff(oldStr, newStr, options); }
