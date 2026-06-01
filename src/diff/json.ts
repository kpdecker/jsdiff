import Diff from './base.js';
import type { ChangeObject, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackNonabortable, DiffJsonOptionsAbortable, DiffJsonOptionsNonabortable} from '../types.js';
import { tokenize } from './line.js';
import { canonicalize } from './json/canonicalize.js';

class JsonDiff extends Diff<string, string, string | object> {
  get useLongestToken() {
    // Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
    // dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:
    return true;
  }

  tokenize = tokenize;

  castInput(value: string | object, options: DiffJsonOptionsNonabortable | DiffJsonOptionsAbortable) {
    const {undefinedReplacement, stringifyReplacer = (k, v) => typeof v === 'undefined' ? undefinedReplacement : v} = options;

    return typeof value === 'string' ? value : JSON.stringify(canonicalize(value, stringifyReplacer), null, '  ');
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
