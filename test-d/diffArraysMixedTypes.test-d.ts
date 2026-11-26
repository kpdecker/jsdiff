import {expectType} from 'tsd';
import Diff, {ChangeObject} from '../libesm/index.js';

// Comparing arrays of different element types with a custom comparator, as
// reported in https://github.com/kpdecker/jsdiff/issues/741
const result = Diff.diffArrays([1, 2, 3], ['1', '2'], {
  comparator: (oldValue, newValue) => oldValue.toString() === newValue
});

expectType<ChangeObject<(number | string)[]>[]>(result);

// Same-type comparisons keep inferring the element type.
const sameType = Diff.diffArrays([1, 2, 3], [1, 2], {
  comparator: (oldValue, newValue) => oldValue === newValue
});

expectType<ChangeObject<number[]>[]>(sameType);
