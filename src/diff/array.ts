import Diff, {DiffOptions} from './base';

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
  oldArr: Array<any>,
  newArr: Array<any>,
  options: DiffOptions<Array<any>>
) {
  return arrayDiff.diff(oldArr, newArr, options);
}
