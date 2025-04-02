import Diff from './base';
import {ChangeObject, DiffArraysOptionsNonabortable, CallbackOptionNonabortable, DiffArraysOptionsAbortable, DiffCallbackNonabortable, CallbackOptionAbortable} from '../types';

class ArrayDiff<T> extends Diff<T, Array<T>> {
  protected tokenize(value: Array<any>) {
    return value.slice();
  }

  protected join(value: Array<any>) {
    return value;
  }

  protected removeEmpty(value: Array<any>) {
    return value;
  }
}

export const arrayDiff = new ArrayDiff();

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
  options?
): undefined | ChangeObject<T[]>[] {
  return arrayDiff.diff(oldArr, newArr, options);
}
