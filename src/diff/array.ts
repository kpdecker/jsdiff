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
export function diffArrays<T, U = T>(
  oldArr: T[],
  newArr: U[],
  options: DiffCallbackNonabortable<(T | U)[]>
): undefined;
export function diffArrays<T, U = T>(
  oldArr: T[],
  newArr: U[],
  options: DiffArraysOptionsAbortable<T, U> & CallbackOptionAbortable<(T | U)[]>
): undefined
export function diffArrays<T, U = T>(
  oldArr: T[],
  newArr: U[],
  options: DiffArraysOptionsNonabortable<T, U> & CallbackOptionNonabortable<(T | U)[]>
): undefined
export function diffArrays<T, U = T>(
  oldArr: T[],
  newArr: U[],
  options: DiffArraysOptionsAbortable<T, U>
): ChangeObject<(T | U)[]>[] | undefined
export function diffArrays<T, U = T>(
  oldArr: T[],
  newArr: U[],
  options?: DiffArraysOptionsNonabortable<T, U>
): ChangeObject<(T | U)[]>[]
export function diffArrays<T, U = T>(
  oldArr: T[],
  newArr: U[],
  options?: any
): undefined | ChangeObject<(T | U)[]>[] {
  return arrayDiff.diff(oldArr, newArr, options);
}
