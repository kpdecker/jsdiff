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
