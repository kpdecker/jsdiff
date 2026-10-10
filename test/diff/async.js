import {diffWords} from '../../libesm/diff/word.js';
import {diffChars} from '../../libesm/diff/character.js';

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

  it('falls back to setTimeout when MessageChannel is unavailable', function(done) {
    const realMessageChannel = globalThis.MessageChannel;
    globalThis.MessageChannel = undefined;
    function restore() { globalThis.MessageChannel = realMessageChannel; }
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
});
