// Following this pattern to make sure the ignore next is in the correct place after babel builds
export default map;

/* istanbul ignore next */
function map(arr, mapper, that) {
  if (Array.prototype.map) {
    return Array.prototype.map.call(arr, mapper, that);
  }

  let other = new Array(arr.length);

  for (let i = 0, n = arr.length; i < n; i++) {
    other[i] = mapper.call(that, arr[i], i, arr);
  }
  return other;
}
