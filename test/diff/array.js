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
  });
});
