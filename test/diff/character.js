import {diffChars} from '../../lib/diff/character';
import {convertChangesToXML} from '../../lib/convert/xml';

import {expect} from 'chai';

describe('diff/character', function() {
  describe('#diffChars', function() {
    it('Should diff chars', function() {
      const diffResult = diffChars('New Value.', 'New ValueMoreData.');
      expect(convertChangesToXML(diffResult)).to.equal('New Value<ins>MoreData</ins>.');
    });
  });
});
