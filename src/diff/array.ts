import Diff from './base';
import {CallbackOption, DiffCallback, ChangeObject, DiffArraysOptions} from '../types';

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
  options: (DiffArraysOptions & CallbackOption<any[]>) | DiffCallback<any[]>
): undefined;
export function diffArrays(
  oldArr: any[],
  newArr: any[],
  options: DiffArraysOptions
): ChangeObject<any[]>[];
export function diffArrays(
  oldArr: any[],
  newArr: any[],
  options
): undefined | ChangeObject<any[]>[] {
  return arrayDiff.diff(oldArr, newArr, options);
}
