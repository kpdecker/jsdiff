export function generateOptions(
  options: object | ((_: unknown) => void),
  defaults: any
): object {
  if (typeof options === 'function') {
    defaults.callback = options;
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
