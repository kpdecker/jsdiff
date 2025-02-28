import {ChangeObject} from '../types';

type DmpOperation = 1 | 0 | -1;

// See: http://code.google.com/p/google-diff-match-patch/wiki/API
export function convertChangesToDMP<ValueT>(changes: ChangeObject<ValueT>[]): [DmpOperation, ValueT][] {
  let ret = [],
      change,
      operation;
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
