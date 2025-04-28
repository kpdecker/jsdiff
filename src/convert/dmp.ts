import type {ChangeObject} from '../types.js';

type DmpOperation = 1 | 0 | -1;

/**
 * converts a list of change objects to the format returned by Google's [diff-match-patch](https://github.com/google/diff-match-patch) library
 */
export function convertChangesToDMP<ValueT>(changes: ChangeObject<ValueT>[]): [DmpOperation, ValueT][] {
  const ret: [DmpOperation, ValueT][] = [];
  let change,
      operation: DmpOperation;
  for (let i = 0; i < changes.length; i++) {
    change = changes[i];
    if (change.added) {
      operation = 1;
    } else if (change.removed) {
      operation = -1;
    } else {
      operation = 0;
    }

    ret.push([operation, change.value]);
  }
  return ret;
}
