let enqueueTaskCalls = 0;

// Adds `callback` to the event queue as a macrotask, much like setTimeout(callback, 0) would.
// Unlike setTimeout(callback, 0), this MessageChannel-based approach isn't delayed by timer
// clamping (at least 4ms per nested timer in browsers, 1ms per timer in Node). We want to avoid
// timer clamping because it would make jsdiff's async mode much much slower than sync mode for
// no good reason.
export function enqueueTask(callback: () => void): void {
  // The occasional setTimeout calls are a compromise to mitigate
  // https://bugs.webkit.org/show_bug.cgi?id=327531.
  // Without this workaround, async mode would be effectively sync inside a web worker in Safari.
  // Instead, we very occasionally yield just so that really long-running async diffs will
  // occasionally yield in Safari, while still eliminating 90% of the clamping in all environments.
  if (++enqueueTaskCalls % 10 == 0) {
    setTimeout(callback, 0);
    return;
  }

  const {port1, port2} = new MessageChannel();
  port1.onmessage = () => {
    // An open port would keep a Node process alive
    port1.close();
    callback();
  };
  port2.postMessage(undefined);
}
