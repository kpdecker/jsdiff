import Diff from './base';

export const glyphDiff = new Diff();
glyphDiff.tokenize = function(value) {
  return [...value];
};
glyphDiff.join = function(value) {
  return value.join('');
};
glyphDiff.removeEmpty = function(value) {
  return value.filter((str) => str !== '');
};
export function diffGlyph(oldStr, newStr, options) {
  return glyphDiff.diff(oldStr, newStr, options);
}
