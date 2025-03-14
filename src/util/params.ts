import {DiffCallback, DiffOptionsWithCallback, DiffOptionsWithoutCallback} from '../types';


export function generateOptions(
  options: DiffOptionsWithoutCallback | DiffCallback<any>,
  defaults: DiffOptionsWithoutCallback
): DiffOptionsWithoutCallback | DiffOptionsWithCallback<any> {
  if (typeof options === 'function') {
    (defaults as DiffOptionsWithCallback<any>).callback = options;
  } else if (options) {
    for (let name in options) {
      /* istanbul ignore else */
      if (options.hasOwnProperty(name)) {
        defaults[name] = options[name];
      }
    }
  }
  return defaults;
}
