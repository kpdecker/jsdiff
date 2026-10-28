import {diffChars} from '../../libesm/diff/character.js';
import {convertChangesToXML} from '../../libesm/convert/xml.js';

import {expect} from 'chai';

describe('diff/character', function() {
  describe('#diffChars', function() {
    it('Should diff chars', function() {
      const diffResult = diffChars('Old Value.', 'New ValueMoreData.');
      expect(convertChangesToXML(diffResult)).to.equal('<del>Old</del><ins>New</ins> Value<ins>MoreData</ins>.');
    });

    describe('oneChangePerToken option', function() {
      it('emits one change per character', function() {
        const diffResult = diffChars('Old Value.', 'New ValueMoreData.', {oneChangePerToken: true});
        expect(diffResult.length).to.equal(21);
        expect(convertChangesToXML(diffResult)).to.equal('<del>O</del><del>l</del><del>d</del><ins>N</ins><ins>e</ins><ins>w</ins> Value<ins>M</ins><ins>o</ins><ins>r</ins><ins>e</ins><ins>D</ins><ins>a</ins><ins>t</ins><ins>a</ins>.');
      });

      it('correctly handles the case where the texts are identical', function() {
        const diffResult = diffChars('foo bar baz qux', 'foo bar baz qux', {oneChangePerToken: true});
        expect(diffResult).to.deep.equal(
          ['f', 'o', 'o', ' ', 'b', 'a', 'r', ' ', 'b', 'a', 'z', ' ', 'q', 'u', 'x'].map(
            char => ({value: char, count: 1, added: false, removed: false})
          )
        );
      });
    });

    describe('handling of empty strings', function() {
      it('should emit insertions only when the old text is empty', function() {
        const diffResult = diffChars('', 'bla');
        expect(diffResult).to.deep.equal(
          [
            { value: 'bla', count: 3, added: true, removed: false }
          ]
        );
      });

      it('should emit deletions only when the new text is empty', function() {
        const diffResult = diffChars('bla', '');
        expect(diffResult).to.deep.equal(
          [
            { value: 'bla', count: 3, added: false, removed: true }
          ]
        );
      });

      it('should emit an empty change list when both texts are empty strings', function() {
        const diffResult = diffChars('', '');
        expect(diffResult).to.deep.equal([]);
      });
    });

    it('should treat a code point that consists of two UTF-16 code units as a single character, not two', function() {
      const diffResult = diffChars('𝟘𝟙𝟚𝟛', '𝟘𝟙𝟚𝟜𝟝𝟞');
      expect(diffResult.length).to.equal(3);
      expect(diffResult[2].count).to.equal(3);
      expect(convertChangesToXML(diffResult)).to.equal('𝟘𝟙𝟚<del>𝟛</del><ins>𝟜𝟝𝟞</ins>');
    });

    describe('case insensitivity', function() {
      it("is considered when there's no difference", function() {
        const diffResult = diffChars('New Value.', 'New value.', {ignoreCase: true});
        expect(convertChangesToXML(diffResult)).to.equal('New value.');
      });

      it("is considered when there's a difference", function() {
        const diffResult = diffChars('New Values.', 'New value.', {ignoreCase: true});
        expect(convertChangesToXML(diffResult)).to.equal('New value<del>s</del>.');
      });

      it('is applied before tokens are passed to a comparator', function() {
        const seen = [];
        diffChars('A', 'b', {ignoreCase: true, comparator: (left, right) => {
          seen.push(left + right);
          return left === right;
        }});
        expect(seen).to.eql(['ab']);
      });
    });

    it('should not be susceptible to race conditions in async mode when called with different options', function(done) {
      // (regression test for https://github.com/kpdecker/jsdiff/issues/477)
      diffChars('wibblywobbly', 'WIBBLYWOBBLY', {ignoreCase: false, callback: (diffResult) => {
        expect(convertChangesToXML(diffResult)).to.equal('<del>wibblywobbly</del><ins>WIBBLYWOBBLY</ins>');
        done();
      }});

      // Historically, doing this while async execution of the previous
      // diffChars call was ongoing would overwrite this.options and make the
      // ongoing diff become case-insensitive partway through execution.
      diffChars('whatever', 'whatever', {ignoreCase: true});
      diffChars('whatever', 'whatever', {ignoreCase: true, callback: () => {}});
    });
  });

  describe('async mode', function() {
    it('should return undefined when called in async mode', function() {
      expect(diffChars('whatever', 'whatever', {callback: () => {}})).to.be.undefined;
      expect(diffChars('whatever', 'whatever else', {callback: () => {}})).to.be.undefined;
    });

    it('should not wait for a timer between iterations in async mode', function(done) {
      // 1000 insertions take 1000 iterations. Waiting for setTimeout between them used to take
      // at least 1s in Node and 4s in browsers, due to timer clamping.
      const start = Date.now();
      diffChars('', 'a'.repeat(1000), function(diffResult) {
        expect(diffResult).to.have.length(1);
        expect(Date.now() - start).to.be.below(500);
        done();
      });
    });

    it('does not starve timers while it runs', function(done) {
      // Confirm that we're actually yielding control back to the event loop in a way that allows
      // other stuff to run - that is after all the point of async mode!
      const oldText = 'ax'.repeat(1000);
      const newText = 'ay'.repeat(1000);
      let ticks = 0;
      const interval = setInterval(() => { ticks++; }, 1);
      diffChars(oldText, newText, {callback: () => {
        clearInterval(interval);
          expect(ticks).to.be.at.least(100);
          done();
      }});
    });
  });
});
