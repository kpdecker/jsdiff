import {diffArrays} from '../../libesm/diff/array.js';

import {expect} from 'chai';

describe('diff/array', function() {
  describe('#diffArrays', function() {
    it('Should diff arrays', function() {
      const a = {a: 0}, b = {b: 1}, c = {c: 2};
      const diffResult = diffArrays([a, b, c], [a, c, b]);
      expect(diffResult).to.deep.equals([
          {count: 1, value: [a], removed: false, added: false},
          {count: 1, value: [b], removed: true, added: false},
          {count: 1, value: [c], removed: false, added: false},
          {count: 1, value: [b], removed: false, added: true}
      ]);
    });
    it('should diff falsey values', function() {
      const a = false;
      const b = 0;
      const c = '';
      // Example sequences from Myers 1986
      const arrayA = [a, b, c, a, b, b, a];
      const arrayB = [c, b, a, b, a, c];
      const diffResult = diffArrays(arrayA, arrayB);
      expect(diffResult).to.deep.equals([
        {count: 2, value: [a, b], removed: true, added: false},
        {count: 1, value: [c], removed: false, added: false},
        {count: 1, value: [b], removed: false, added: true},
        {count: 2, value: [a, b], removed: false, added: false},
        {count: 1, value: [b], removed: true, added: false},
        {count: 1, value: [a], removed: false, added: false},
        {count: 1, value: [c], removed: false, added: true}
      ]);
    });
    describe('anti-aliasing', function() {
      // Test apparent contract that no chunk value is ever an input argument.
      const value = [0, 1, 2];
      const expected = [
        {count: value.length, value: value, removed: false, added: false}
      ];

      const input = value.slice();
      const diffResult = diffArrays(input, input);
      it('returns correct deep result for identical inputs', function() {
        expect(diffResult).to.deep.equals(expected);
      });
      it('does not return the input array', function() {
        expect(diffResult[0].value).to.not.equal(input);
      });

      const input1 = value.slice();
      const input2 = value.slice();
      const diffResult2 = diffArrays(input1, input2);
      it('returns correct deep result for equivalent inputs', function() {
        expect(diffResult2).to.deep.equals(expected);
      });
      it('does not return the first input array', function() {
        expect(diffResult2[0].value).to.not.equal(input1);
      });
      it('does not return the second input array', function() {
        expect(diffResult2[0].value).to.not.equal(input2);
      });
    });
    it('Should diff arrays with comparator', function() {
      const a = {a: 0}, b = {a: 1}, c = {a: 2}, d = {a: 3};
      function comparator(left, right) {
        return left.a === right.a;
      }
      const diffResult = diffArrays([a, b, c], [a, b, d], { comparator: comparator });
      expect(diffResult).to.deep.equals([
          {count: 2, value: [a, b], removed: false, added: false},
          {count: 1, value: [c], removed: true, added: false},
          {count: 1, value: [d], removed: false, added: true}
      ]);
    });
    it('Should pass old/new tokens as the left/right comparator args respectively', function() {
      diffArrays(
        ['a', 'b', 'c'],
        ['x', 'y', 'z'],
        {
          comparator: function(left, right) {
            expect(left).to.be.oneOf(['a', 'b', 'c']);
            expect(right).to.be.oneOf(['x', 'y', 'z']);
            return left === right;
          }
        }
      );
    });
    it('Should terminate early if execution time exceeds `timeout` ms', function() {
      // To test this, we also pass a comparator that hot sleeps as a way to
      // artificially slow down execution so we reach the timeout.
      function comparator(left, right) {
        const start = Date.now();
        // Hot-sleep for 10ms
        while (Date.now() < start + 10) {
          // Do nothing
        }
        return left === right;
      }

      // It will require 14 comparisons (140ms) to diff these arrays:
      const arr1 = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      const arr2 = ['a', 'b', 'c', 'd', 'x', 'y', 'z'];

      // So with a timeout of 50ms, we are guaranteed failure:
      expect(diffArrays(arr1, arr2, {comparator, timeout: 50})).to.be.undefined;

      // But with a longer timeout, we expect success:
      expect(diffArrays(arr1, arr2, {comparator, timeout: 1000})).not.to.be.undefined;
    });
  });
});
