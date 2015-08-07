import {convertChangesToDMP} from '../../lib/convert/dmp';
import {diffWords} from '../../lib/diff/word';

import {expect} from 'chai';

describe('convertToDMP', function() {
  it('should output diff-match-patch format', function() {
    const diffResult = diffWords('New Value  ', 'New  ValueMoreData ');

    expect(convertChangesToDMP(diffResult)).to.eql([[0, 'New  '], [-1, 'Value'], [1, 'ValueMoreData'], [0, ' ']]);
  });
});
