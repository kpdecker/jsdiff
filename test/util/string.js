import {longestCommonPrefix, longestCommonSuffix, replacePrefix, replaceSuffix, removePrefix, removeSuffix, maximumOverlap} from '../../libesm/util/string.js';
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

describe('#replaceSuffix', function() {
  it('replaces a suffix on a string with a different suffix', function() {
    expect((replaceSuffix('bangle', 'gle', 'jo'))).to.equal('banjo');
    expect((replaceSuffix('bun', '', 'gle'))).to.equal('bungle');
  });

  it("throws if the suffix to remove isn't present", function() {
    // eslint-disable-next-line dot-notation
    expect(() => replaceSuffix('food', 'ool', 'ondle')).to.throw();
  });
});

describe('#removePrefix', function() {
  it('removes a prefix', function() {
    expect(removePrefix('inconceivable', 'in')).to.equal('conceivable');
    expect(removePrefix('inconceivable', '')).to.equal('inconceivable');
    expect(removePrefix('inconceivable', 'inconceivable')).to.equal('');
  });

  it("throws if the prefix to remove isn't present", function() {
    // eslint-disable-next-line dot-notation
    expect(() => removePrefix('food', 'dr')).to.throw();
  });
});

describe('#removeSuffix', function() {
  it('removes a suffix', function() {
    expect(removeSuffix('counterfactual', 'factual')).to.equal('counter');
    expect(removeSuffix('counterfactual', '')).to.equal('counterfactual');
    expect(removeSuffix('counterfactual', 'counterfactual')).to.equal('');
  });

  it("throws if the suffix to remove isn't present", function() {
    // eslint-disable-next-line dot-notation
    expect(() => removeSuffix('food', 'dr')).to.throw();
  });
});

describe('#maximumOverlap', function() {
  it('finds the maximum overlap between the end of one string and the start of the other', function() {
    expect(maximumOverlap('qwertyuiop', 'uiopasdfgh')).to.equal('uiop');
    expect(maximumOverlap('qwertyuiop', 'qwertyuiop')).to.equal('qwertyuiop');
    expect(maximumOverlap('qwertyuiop', 'asdfghjkl')).to.equal('');
    expect(maximumOverlap('qwertyuiop', '')).to.equal('');
    expect(maximumOverlap('uiopasdfgh', 'qwertyuiop')).to.equal('');
    expect(maximumOverlap('x   ', '  x')).to.equal('  ');
    expect(maximumOverlap('', '')).to.equal('');
  });
});
