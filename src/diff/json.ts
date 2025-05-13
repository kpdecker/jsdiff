import Diff from './base.js';
import type { ChangeObject, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackNonabortable, DiffJsonOptionsAbortable, DiffJsonOptionsNonabortable} from '../types.js';
import { tokenize } from './line.js';

class JsonDiff extends Diff<string, string, string | object> {
  get useLongestToken() {
    // Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
    // dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:
    return true;
  }

  tokenize = tokenize;

  castInput(value: string | object, options: DiffJsonOptionsNonabortable | DiffJsonOptionsAbortable) {
    const {undefinedReplacement, stringifyReplacer = (k, v) => typeof v === 'undefined' ? undefinedReplacement : v} = options;

    return typeof value === 'string' ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), null, '  ');
  }

  equals(left: string, right: string, options: DiffJsonOptionsNonabortable | DiffJsonOptionsAbortable) {
    return super.equals(left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'), options);
  }
}

export const jsonDiff = new JsonDiff();

/**
 * diffs two JSON-serializable objects by first serializing them to prettily-formatted JSON and then treating each line of the JSON as a token.
 * Object properties are ordered alphabetically in the serialized JSON, so the order of properties in the objects being compared doesn't affect the result.
 *
 * @returns a list of change objects.
 */
export function diffJson(
  oldStr: string | object,
  newStr: string | object,
  options: DiffCallbackNonabortable<string>
): undefined;
export function diffJson(
  oldStr: string | object,
  newStr: string | object,
  options: DiffJsonOptionsAbortable & CallbackOptionAbortable<string>
): undefined
export function diffJson(
  oldStr: string | object,
  newStr: string | object,
  options: DiffJsonOptionsNonabortable & CallbackOptionNonabortable<string>
): undefined
export function diffJson(
  oldStr: string | object,
  newStr: string | object,
  options: DiffJsonOptionsAbortable
): ChangeObject<string>[] | undefined
export function diffJson(
  oldStr: string | object,
  newStr: string | object,
  options?: DiffJsonOptionsNonabortable
): ChangeObject<string>[]
export function diffJson(oldStr: string | object, newStr: string | object, options?: any): undefined | ChangeObject<string>[] {
  return jsonDiff.diff(oldStr, newStr, options);
}


// This function handles the presence of circular references by bailing out when encountering an
// object that is already on the "stack" of items being processed. Accepts an optional replacer
export function canonicalize(
  obj: any,
  stack: Array<any> | null, replacementStack: Array<any> | null,
  replacer: (k: string, v: any) => any,
  key?: string
) {
  stack = stack || [];
  replacementStack = replacementStack || [];

  if (replacer) {
    obj = replacer(key === undefined ? '' : key, obj);
  }

  let i;

  for (i = 0; i < stack.length; i += 1) {
    if (stack[i] === obj) {
      return replacementStack[i];
    }
  }

  let canonicalizedObj: any;

  if ('[object Array]' === Object.prototype.toString.call(obj)) {
    stack.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);
    for (i = 0; i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, String(i));
    }
    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }

  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }

  if (typeof obj === 'object' && obj !== null) {
    stack.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);
    const sortedKeys = [];
    let key;
    for (key in obj) {
      /* istanbul ignore else */
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sortedKeys.push(key);
      }
    }
    sortedKeys.sort();
    for (i = 0; i < sortedKeys.length; i += 1) {
      key = sortedKeys[i];
      canonicalizedObj[key] = canonicalize(obj[key], stack, replacementStack, replacer, key);
    }
    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }
  return canonicalizedObj;
}
