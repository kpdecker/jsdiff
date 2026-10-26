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

  if (obj && typeof obj.toJSON === 'function') {
    obj = obj.toJSON(key === undefined ? '' : key);
  }

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
      const canonicalizedValue = canonicalize(obj[i], stack, replacementStack, replacer, String(i));
      // Just like JSON.stringify, render array elements that can't be represented in JSON
      // (undefined, functions, symbols) as null rather than including them as-is. Doing this
      // ourselves - rather than leaving it to a final, unreplaced JSON.stringify call to sort
      // out - matters because a value in this situation could in principle be an object with its
      // own (real, own-property) "toJSON" method, e.g. if a user's stringifyReplacer returns such
      // an object; if we let it through unchanged, the final JSON.stringify(canonicalizedObj) call
      // we do in castInput() would invoke that toJSON method a second time, which we don't want.
      canonicalizedObj[i] = isUnrepresentableInJson(canonicalizedValue) ? null : canonicalizedValue;
    }
    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }

  if (typeof obj === 'object' && obj !== null) {
    stack.push(obj);
    // Use a null-prototype object so that an own "__proto__" key is stored as
    // a normal property instead of triggering the Object.prototype setter,
    // which would silently drop the key from the canonicalized output.
    canonicalizedObj = Object.create(null);
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
      const canonicalizedValue = canonicalize(obj[key], stack, replacementStack, replacer, key);
      // Just like JSON.stringify, omit object properties whose value can't be represented in JSON
      // (undefined, functions, symbols) instead of including them as-is. See the comment in the
      // array-handling code above for why we do this ourselves instead of leaving it to the final
      // JSON.stringify(canonicalizedObj) call in castInput() to sort out: if we didn't, a property
      // whose value happens to be a function - most notably one named "toJSON" - could cause that
      // final call to misinterpret the (already fully resolved) canonicalized object as having its
      // own "toJSON" method and call it, running the function a second time.
      if (!isUnrepresentableInJson(canonicalizedValue)) {
        canonicalizedObj[key] = canonicalizedValue;
      }
    }
    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }
  return canonicalizedObj;
}

// Values of these types aren't valid JSON values, and JSON.stringify() omits them when they're
// encountered as object property values (or replaces them with null when encountered as array
// elements). We replicate that behavior ourselves in canonicalize() above.
function isUnrepresentableInJson(value: any): boolean {
  return typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol';
}
