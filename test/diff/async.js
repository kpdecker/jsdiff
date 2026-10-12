import {diffWords} from '../../libesm/diff/word.js';
import {diffChars} from '../../libesm/diff/character.js';
import Diff from '../../libesm/diff/base.js';

import {expect} from 'chai';

describe('async mode scheduling', function() {
  function makeTexts(wordCount) {
    const oldWords = [], newWords = [];
    for (let i = 0; i < wordCount; i++) {
      oldWords.push('word' + i);
      // Change every third word so that the diff takes many iterations
      newWords.push(i % 3 === 0 ? 'other' + i : 'word' + i);
    }
    return [oldWords.join(' '), newWords.join(' ')];
  }

  it('gives the same result as sync mode', function(done) {
    const [oldText, newText] = makeTexts(200);
    const expected = diffWords(oldText, newText);
    diffWords(oldText, newText, {callback: (result) => {
      expect(result).to.deep.equal(expected);
      done();
    }});
  });

  it('does not wait on a timer for every iteration', function(done) {
    // Browsers clamp nested setTimeout(fn, 0) calls to at least 4ms, and Node clamps them to
    // 1ms, so scheduling every iteration through setTimeout makes async mode very slow. Count
    // setTimeout calls to check that the main loop does not use it.
    const [oldText, newText] = makeTexts(500);
    const realSetTimeout = globalThis.setTimeout;
    let timeoutCalls = 0;
    globalThis.setTimeout = function(...args) {
      timeoutCalls++;
      return realSetTimeout.apply(this, args);
    };
    function restore() { globalThis.setTimeout = realSetTimeout; }

    try {
      diffWords(oldText, newText, {callback: (result) => {
        restore();
        try {
          expect(result).to.deep.equal(diffWords(oldText, newText));
          // The diff needs hundreds of iterations. Only the final callback delivery may use a
          // timer.
          expect(timeoutCalls).to.be.below(5);
          done();
        } catch (e) {
          done(e);
        }
      }});
    } catch (e) {
      restore();
      throw e;
    }
  });

  it('is not slowed down to one timer tick per iteration', function(done) {
    this.timeout(10000);
    const [oldText, newText] = makeTexts(500);
    const start = Date.now();
    diffWords(oldText, newText, {callback: () => {
      // Before the fix, this took roughly one millisecond per iteration. The bound is generous
      // to avoid flakiness on slow machines.
      expect(Date.now() - start).to.be.below(300);
      done();
    }});
  });

  it('still honours the timeout option in async mode', function(done) {
    const [oldText, newText] = makeTexts(2000);
    diffWords(oldText, newText, {timeout: 1, callback: (result) => {
      expect(result).to.be.undefined;
      done();
    }});
  });

  it('still honours maxEditLength in async mode', function(done) {
    diffChars('abcdefgh', 'ABCDEFGH', {maxEditLength: 2, callback: (result) => {
      expect(result).to.be.undefined;
      done();
    }});
  });

  // Temporarily replaces some globals. Returns a function that restores them.
  function stubGlobals(stubs) {
    const originals = {};
    for (const key of Object.keys(stubs)) {
      originals[key] = Object.getOwnPropertyDescriptor(globalThis, key);
      Object.defineProperty(globalThis, key, {value: stubs[key], configurable: true, writable: true});
    }
    return function restore() {
      for (const key of Object.keys(stubs)) {
        if (originals[key]) {
          Object.defineProperty(globalThis, key, originals[key]);
        } else {
          delete globalThis[key];
        }
      }
    };
  }

  // Some tests below inspect Node internals; the rest also run in the browser (via Karma).
  const inNode = typeof process !== 'undefined' && typeof process.getActiveResourcesInfo === 'function';

  function activeMessagePorts() {
    return process.getActiveResourcesInfo().filter(r => r === 'MessagePort').length;
  }

  it('prefers setImmediate when it is available', function(done) {
    if (!inNode) { return this.skip(); }
    const realSetImmediate = globalThis.setImmediate;
    const RealMessageChannel = globalThis.MessageChannel;
    let immediateCalls = 0, channelsCreated = 0;
    const restore = stubGlobals({
      setImmediate: function(...args) { immediateCalls++; return realSetImmediate(...args); },
      MessageChannel: function() { channelsCreated++; return new RealMessageChannel(); }
    });
    const [oldText, newText] = makeTexts(100);
    const expected = diffWords(oldText, newText);
    diffWords(oldText, newText, {callback: (result) => {
      restore();
      try {
        expect(result).to.deep.equal(expected);
        expect(immediateCalls).to.be.above(10);
        expect(channelsCreated).to.equal(0);
        done();
      } catch (e) {
        done(e);
      }
    }});
  });

  it('uses a MessageChannel when setImmediate is unavailable, and closes it afterwards', function(done) {
    if (!inNode) { return this.skip(); }
    const RealMessageChannel = globalThis.MessageChannel;
    let channelsCreated = 0;
    const portsBefore = activeMessagePorts();
    const restore = stubGlobals({
      setImmediate: undefined,
      MessageChannel: function() { channelsCreated++; return new RealMessageChannel(); }
    });
    const [oldText, newText] = makeTexts(100);
    const expected = diffWords(oldText, newText);
    diffWords(oldText, newText, {callback: (result) => {
      restore();
      try {
        expect(result).to.deep.equal(expected);
        expect(channelsCreated).to.equal(1);
        // The callback is delivered after the channel has been closed, so a lingering port would
        // keep the process (and mocha) alive.
        setTimeout(() => {
          try {
            expect(activeMessagePorts()).to.equal(portsBefore);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      } catch (e) {
        done(e);
      }
    }});
  });

  it('closes the MessageChannel when the timeout option aborts the diff', function(done) {
    if (!inNode) { return this.skip(); }
    const portsBefore = activeMessagePorts();
    const restore = stubGlobals({setImmediate: undefined});
    const [oldText, newText] = makeTexts(2000);
    diffWords(oldText, newText, {timeout: 1, callback: (result) => {
      restore();
      try {
        expect(result).to.be.undefined;
        setTimeout(() => {
          try {
            expect(activeMessagePorts()).to.equal(portsBefore);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      } catch (e) {
        done(e);
      }
    }});
  });

  it('closes the MessageChannel when something throws mid-diff', function(done) {
    if (!inNode) { return this.skip(); }
    const portsBefore = activeMessagePorts();
    const restore = stubGlobals({setImmediate: undefined});
    // The error is thrown from inside a MessagePort message handler, so it surfaces as an
    // uncaught exception. Intercept it so that mocha does not see it.
    const mochaListeners = process.listeners('uncaughtException');
    process.removeAllListeners('uncaughtException');
    function onUncaught(err) {
      process.removeListener('uncaughtException', onUncaught);
      mochaListeners.forEach(l => process.on('uncaughtException', l));
      restore();
      try {
        expect(err.message).to.equal('boom');
        setTimeout(() => {
          try {
            expect(activeMessagePorts()).to.equal(portsBefore);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      } catch (e) {
        done(e);
      }
    }
    process.on('uncaughtException', onUncaught);
    let comparisons = 0;
    class ThrowingDiff extends Diff {
      tokenize(value) { return value.split(''); }
      equals(left, right) {
        if (++comparisons > 200) {
          throw new Error('boom');
        }
        return left === right;
      }
    }
    new ThrowingDiff().diff('abcdefghij'.repeat(20), 'ZYXWVUTSRQ'.repeat(20), {callback: () => {}});
  });

  it('falls back to setTimeout when neither setImmediate nor MessageChannel is available', function(done) {
    const restore = stubGlobals({setImmediate: undefined, MessageChannel: undefined});
    const expected = diffChars('abcdefgh', 'abXdefYh');
    diffChars('abcdefgh', 'abXdefYh', {callback: (result) => {
      restore();
      try {
        expect(result).to.deep.equal(expected);
        done();
      } catch (e) {
        done(e);
      }
    }});
  });

  it('can be driven entirely by fake timers', function() {
    // Test frameworks' fake timers (Jest, Vitest, Sinon) replace setTimeout and setImmediate, and
    // tests that use them expect advancing the fake clock to complete async work. Emulate that
    // with queues that only run when we drain them by hand. (A MessageChannel could not be driven
    // this way, because fake timers cannot replace it.)
    const queue = [];
    const restore = stubGlobals({
      setTimeout: function(fn) { queue.push(fn); return 0; },
      setImmediate: function(fn) { queue.push(fn); return 0; }
    });
    let result;
    try {
      diffWords('a b c d e f g', 'a x c y e z g', {callback: (r) => { result = r; }});
      let guard = 0;
      while (queue.length && guard++ < 10000) {
        queue.shift()();
      }
    } finally {
      restore();
    }
    expect(result).to.deep.equal(diffWords('a b c d e f g', 'a x c y e z g'));
  });

  it('does not starve timers while it runs', function(done) {
    if (!inNode) { return this.skip(); }
    // A chain of MessageChannel messages in Node runs ahead of timers and I/O until the chain
    // ends, so an interval timer would barely tick during a long async diff.
    this.timeout(10000);
    const [oldText, newText] = makeTexts(3000);
    let ticks = 0;
    const interval = setInterval(() => { ticks++; }, 1);
    diffWords(oldText, newText, {callback: () => {
      clearInterval(interval);
      try {
        expect(ticks).to.be.at.least(5);
        done();
      } catch (e) {
        done(e);
      }
    }});
  });
});
