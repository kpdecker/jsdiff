import {DiffCallback, DiffOptionsWithCallback, DiffOptionsWithoutCallback} from '../types';


export function generateOptions(
  options: DiffOptionsWithoutCallback | DiffCallback<any>,
  defaults: DiffOptionsWithoutCallback
): DiffOptionsWithoutCallback | DiffOptionsWithCallback<any> {
  if (typeof options === 'function') {
    (defaults as DiffOptionsWithCallback<any>).callback = options;
  } else if (options) {
    for (const name in options) {
      /* istanbul ignore else */
      if (Object.prototype.hasOwnProperty.call(options, name)) {
        defaults[name] = options[name];
      }
    }
  }
  return defaults;
}
