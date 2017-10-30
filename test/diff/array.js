import {diffArrays} from '../../lib/diff/array';

import {expect} from 'chai';

describe('diff/array', function() {
  describe('#diffArrays', function() {
    it('Should diff arrays', function() {
      const a = {a: 0}, b = {b: 1}, c = {c: 2};
      const diffResult = diffArrays([a, b, c], [a, c, b]);
      console.log(diffResult);
      expect(diffResult).to.deep.equals([
          {count: 1, value: [a]},
          {count: 1, value: [c], removed: undefined, added: true},
          {count: 1, value: [b]},
          {count: 1, value: [c], removed: true, added: undefined}
      ]);
    });
    it('should diff falsey values', function() {
      const a = false;
      const b = 0;
      const c = '';
      // Example sequences from Myers 1986
      const arrayA = [c, b, a, b, a, c];
      const arrayB = [a, b, c, a, b, b, a];
      const diffResult = diffArrays(arrayA, arrayB);
      expect(diffResult).to.deep.equals([
        {count: 2, value: [a, b], removed: undefined, added: true},
        {count: 1, value: [c]},
        {count: 1, value: [b], removed: true, added: undefined},
        {count: 2, value: [a, b]},
        {count: 1, value: [b], removed: undefined, added: true},
        {count: 1, value: [a]},
        {count: 1, value: [c], removed: true, added: undefined}
      ]);
    });
    describe('anti-aliasing', function() {
      // Test apparent contract that no chunk value is ever an input argument.
      const value = [0, 1, 2];
      const expected = [
        {count: value.length, value: value}
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
      console.log(diffResult);
      expect(diffResult).to.deep.equals([
          {count: 2, value: [a, b]},
          {count: 1, value: [c], removed: true, added: undefined},
          {count: 1, value: [d], removed: undefined, added: true}
      ]);
    });
  });
});
