import {longestCommonPrefix, longestCommonSuffix, replacePrefix, replaceSuffix} from '../../lib/util/string';
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

describe('#replacePrefix', function() {
  it('replaces a prefix on a string with a different prefix', function() {
    expect((replacePrefix('food', 'foo', 'gla'))).to.equal('glad');
    expect((replacePrefix('food', '', 'good '))).to.equal('good food');
  });

  it("throws if the prefix to remove isn't present", function() {
    // eslint-disable-next-line dot-notation
    expect(() => replacePrefix('food', 'drin', 'goo')).to.throw();
  });
});

describe('#replaceSuffx', function() {
  it('replaces a suffix on a string with a different suffix', function() {
    expect((replaceSuffix('bangle', 'gle', 'jo'))).to.equal('banjo');
    expect((replaceSuffix('bun', '', 'gle'))).to.equal('bungle');
  });

  it("throws if the suffix to remove isn't present", function() {
    // eslint-disable-next-line dot-notation
    expect(() => replaceSuffix('food', 'ool', 'ondle')).to.throw();
  });
});
