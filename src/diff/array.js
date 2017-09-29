import Diff from './base';

export const arrayDiff = new Diff();
arrayDiff.tokenize = arrayDiff.join = function(value) {
  return value.slice();
};
arrayDiff.removeEmpty = function(value) {
  return value;
};

export function diffArrays(oldArr, newArr, callback) { return arrayDiff.diff(oldArr, newArr, callback); }
