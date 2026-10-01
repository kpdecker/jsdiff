// Calls `callback` in a new task. Unlike setTimeout(callback, 0), this isn't delayed by timer
// clamping (at least 4ms per nested timer in browsers, 1ms per timer in Node).
export function yieldToEventLoop(callback: () => void): void {
  const {port1, port2} = new MessageChannel();
  port1.onmessage = () => {
    // An open port would keep a Node process alive
    port1.close();
    callback();
  };
  port2.postMessage(undefined);
}
