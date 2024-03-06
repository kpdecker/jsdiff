import {longestCommonPrefix} from '../../lib/util/string';
import {expect} from 'chai';

describe('#longestCommonPrefix', function() {
  it('finds the longest common prefix', function() {
    expect(longestCommonPrefix('food', 'foolish')).to.equal('foo');
    expect(longestCommonPrefix('foolish', 'food')).to.equal('foo');
    expect(longestCommonPrefix('foolish', 'foo')).to.equal('foo');
    expect(longestCommonPrefix('foo', 'foolish')).to.equal('foo');
    expect(longestCommonPrefix('foo', '')).to.equal('');
    expect(longestCommonPrefix('', 'foo')).to.equal('');
    expect(longestCommonPrefix('', '')).to.equal('');
    expect(longestCommonPrefix('foo', 'bar')).to.equal('');
  });
});
