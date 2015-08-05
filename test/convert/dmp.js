import {convertChangesToDMP} from '../../lib/convert/dmp';
import {diffWords} from '../../lib/diff/word';

describe('convertToDMP', function() {
  it('should output diff-match-patch format', function() {
    var diffResult = diffWords('New Value  ', 'New  ValueMoreData ');

    convertChangesToDMP(diffResult).should.eql([[0, 'New  '], [-1, 'Value'], [1, 'ValueMoreData'], [0, ' ']]);
  });
});
