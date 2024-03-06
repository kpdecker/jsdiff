import {longestCommonPrefix, longestCommonSuffix} from '../../lib/util/string';
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

describe('#longestCommonSuffix', function() {
  it('finds the longest common suffix', function() {
    expect(longestCommonSuffix('bumpy', 'grumpy')).to.equal('umpy');
    expect(longestCommonSuffix('grumpy', 'bumpy')).to.equal('umpy');
    expect(longestCommonSuffix('grumpy', 'umpy')).to.equal('umpy');
    expect(longestCommonSuffix('umpy', 'grumpy')).to.equal('umpy');
    expect(longestCommonSuffix('foo', '')).to.equal('');
    expect(longestCommonSuffix('', 'foo')).to.equal('');
    expect(longestCommonSuffix('', '')).to.equal('');
    expect(longestCommonSuffix('foo', 'bar')).to.equal('');
  });
});

