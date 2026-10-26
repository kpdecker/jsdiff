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

  // JSON.stringify only applies the toJSON step to objects (including functions), not
  // to primitive values. That distinction matters if, for example, String.prototype has
  // been monkey-patched with a toJSON method: primitive strings must not call it.
  if ((typeof obj === 'object' && obj !== null || typeof obj === 'function') && typeof obj.toJSON === 'function') {
    obj = obj.toJSON(key === undefined ? '' : key);
  }

  if (replacer) {
    obj = replacer(key === undefined ? '' : key, obj);
  }

  // JSON.stringify special-cases boxed primitive wrapper objects (e.g. new String('x'))
  // *after* applying the replacer, by unboxing them back to primitives before deciding
  // whether to treat the value as an object/array. We need to mirror that here; otherwise
  // we'd recurse into wrapper objects and canonicalize them as plain objects with numeric
  // keys, diverging from JSON.stringify.
  obj = unboxJsonPrimitiveWrapper(obj);

  // For the root value only, if the post-toJSON/post-replacer value is not representable in JSON
  // (undefined/function/symbol), JSON.stringify returns undefined and does not try to call toJSON
  // again on that value. Returning undefined here preserves that behaviour and prevents the final
  // JSON.stringify(canonicalizedRoot) call in castInput() from invoking a second-pass toJSON.
  if (key === undefined && isUnrepresentableInJson(obj)) {
    return undefined;
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
      // JSON.stringify turns unrepresentable array-element values (undefined/function/symbol)
      // into null. We do that here for parity, and also so the final replacer-less stringify call
      // in castInput() doesn't see function-valued entries and accidentally invoke second-pass
      // toJSON methods on them.
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
      // JSON.stringify omits object properties whose value is undefined/function/symbol.
      // We do that here for parity, and also so the final replacer-less stringify call in
      // castInput() doesn't see function-valued properties and accidentally invoke second-pass
      // toJSON methods on them.
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

function unboxJsonPrimitiveWrapper(value: any): any {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  // This uses the same built-in unboxing methods JSON.stringify is conceptually based on.
  // We guard with try/catch so that objects spoofing Symbol.toStringTag as one of these
  // wrapper types still behave like ordinary objects.
  const objectTag = Object.prototype.toString.call(value);
  try {
    switch (objectTag) {
      case '[object String]':
        return String.prototype.valueOf.call(value);
      case '[object Number]':
        return Number.prototype.valueOf.call(value);
      case '[object Boolean]':
        return Boolean.prototype.valueOf.call(value);
      case '[object BigInt]':
        return BigInt.prototype.valueOf.call(value);
      default:
        return value;
    }
  } catch {
    return value;
  }
}
