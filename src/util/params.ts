import {DiffOptions, DiffCallback} from '../types';

export function generateOptions<T>(options: DiffOptions<T> | DiffCallback<T> | null, defaults: DiffOptions<T>): DiffOptions<T> {
  if (typeof options === 'function') {
    defaults.callback = options;
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
