import {diffChars} from '../../lib/diff/character';
import {convertChangesToXML} from '../../lib/convert/xml';

describe('diff/character', function() {
  describe('#diffChars', function() {
    it('Should diff chars', function() {
      var diffResult = diffChars('New Value.', 'New ValueMoreData.');
      convertChangesToXML(diffResult).should.equal('New Value<ins>MoreData</ins>.');
    });
  });
});
