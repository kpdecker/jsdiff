import Diff from './base.js';
import type {ChangeObject, DiffArraysOptionsNonabortable, CallbackOptionNonabortable, DiffArraysOptionsAbortable, DiffCallbackNonabortable, CallbackOptionAbortable} from '../types.js';

class ArrayDiff<T> extends Diff<T, Array<T>> {
  tokenize(value: Array<T>) {
    return value.slice();
  }

  join(value: Array<T>) {
    return value;
  }

  removeEmpty(value: Array<T>) {
    return value;
  }
}

export const arrayDiff = new ArrayDiff();

/**
 * diffs two arrays of tokens, comparing each item for strict equality (===).
 * @returns a list of change objects.
 */
export function diffArrays<T>(
  oldArr: T[],
  newArr: T[],
  options: DiffCallbackNonabortable<T[]>
): undefined;
export function diffArrays<T>(
  oldArr: T[],
  newArr: T[],
  options: DiffArraysOptionsAbortable<T> & CallbackOptionAbortable<T[]>
): undefined
export function diffArrays<T>(
  oldArr: T[],
  newArr: T[],
  options: DiffArraysOptionsNonabortable<T> & CallbackOptionNonabortable<T[]>
): undefined
export function diffArrays<T>(
  oldArr: T[],
  newArr: T[],
  options: DiffArraysOptionsAbortable<T>
): ChangeObject<T[]>[] | undefined
export function diffArrays<T>(
  oldArr: T[],
  newArr: T[],
  options?: DiffArraysOptionsNonabortable<T>
): ChangeObject<T[]>[]
export function diffArrays<T>(
  oldArr: T[],
  newArr: T[],
  options?: any
): undefined | ChangeObject<T[]>[] {
  return arrayDiff.diff(oldArr, newArr, options);
}
