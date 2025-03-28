import Diff from './base';
import {ChangeObject, DiffArraysOptionsNonabortable, CallbackOptionNonabortable, DiffArraysOptionsAbortable, DiffCallbackNonabortable, CallbackOptionAbortable} from '../types';

class ArrayDiff extends Diff<any, Array<any>> {
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

export function diffArrays(
  oldArr: any[],
  newArr: any[],
  options: DiffCallbackNonabortable<any[]>
): undefined;
export function diffArrays(
  oldArr: any[],
  newArr: any[],
  options: DiffArraysOptionsAbortable & CallbackOptionAbortable<any[]>
): undefined
export function diffArrays(
  oldArr: any[],
  newArr: any[],
  options: DiffArraysOptionsNonabortable & CallbackOptionNonabortable<any[]>
): undefined
export function diffArrays(
  oldArr: any[],
  newArr: any[],
  options: DiffArraysOptionsAbortable
): ChangeObject<any[]>[] | undefined
export function diffArrays(
  oldArr: any[],
  newArr: any[],
  options?: DiffArraysOptionsNonabortable
): ChangeObject<any[]>[]
export function diffArrays(
  oldArr: any[],
  newArr: any[],
  options?
): undefined | ChangeObject<any[]>[] {
  return arrayDiff.diff(oldArr, newArr, options);
}
