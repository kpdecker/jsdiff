import {convertChangesToDMP} from '../../lib/convert/dmp';
import {diffChars} from '../../lib/diff/character';

import {expect} from 'chai';

describe('convertToDMP', function() {
  it('should output diff-match-patch format', function() {
    const diffResult = diffChars('New Value  ', 'New  ValueMoreData ');

    expect(convertChangesToDMP(diffResult)).to.eql([[0, 'New '], [1, ' '], [0, 'Value'], [1, 'MoreData'], [0, ' '], [-1, ' ']]);
  });
});
