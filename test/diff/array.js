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
  });
});
