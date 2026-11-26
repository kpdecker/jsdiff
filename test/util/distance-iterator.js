import distanceIterator from '../../libesm/util/distance-iterator.js';
import {expect} from 'chai';

describe('distanceIterator', function() {
  it('starts at the boundary even when the old position exceeds safe integer precision', function() {
    for (const start of [1e20, Number.MAX_VALUE]) {
      const forward = distanceIterator(-start, 0, 3);
      const backward = distanceIterator(start, 0, 3);
      for (let value = 0; value <= 3; value++) {
        expect(forward()).to.equal(value);
        expect(backward()).to.equal(3 - value);
      }
      expect(forward()).to.equal(undefined);
      expect(backward()).to.equal(undefined);
    }
  });

  it('visits only the bounded range in distance order, excluding the start', function() {
    for (let min = -3; min <= 3; min++) {
      for (let max = -3; max <= 3; max++) {
        for (let start = -6; start <= 6; start++) {
          const expected = [];
          for (let value = min; value <= max; value++) {
            if (value !== start) {
              expected.push(value);
            }
          }
          expected.sort((a, b) => Math.abs(a - start) - Math.abs(b - start) || b - a);
          const next = distanceIterator(start, min, max);
          for (const value of expected) {
            expect(next(), `start=${start}, min=${min}, max=${max}`).to.equal(value);
          }
          expect(next()).to.equal(undefined);
          expect(next()).to.equal(undefined);
        }
      }
    }
  });
});
