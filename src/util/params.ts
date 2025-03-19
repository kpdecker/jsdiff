import {DiffCallback, DiffOptionsWithCallback, AllDiffOptions} from '../types';


export function generateOptions<TokenT>(
  options: AllDiffOptions<TokenT> | DiffCallback<TokenT>,
  defaults: AllDiffOptions<TokenT>
): AllDiffOptions<TokenT> | DiffOptionsWithCallback<TokenT> {
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
