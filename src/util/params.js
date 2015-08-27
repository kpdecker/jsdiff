export function generateOptions(options, defaults) {
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
