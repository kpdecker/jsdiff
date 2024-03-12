import Diff from './base';
const typedefs = require('../typedefs');

export const characterDiff = new Diff();

/**
 * @typedef DiffCharsOptions
 * @property {boolean} [ignoreCase]
 */

/**
 * @param {string} oldStr
 * @param {string} newStr
 * @param {DiffCharsOptions & typedefs.BaseDiffOptions} [options]
 */
export function diffChars(oldStr, newStr, options) { return characterDiff.diff(oldStr, newStr, options); }
