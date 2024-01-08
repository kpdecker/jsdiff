import {diffGlyph} from '../../lib/diff/glyph';
import {convertChangesToXML} from '../../lib/convert/xml';

import {expect} from 'chai';

describe('diff/glyph', function() {
  describe('#diffGlyph', function() {
    describe('extended unicode characters', function() {
      it('are treated as single characters when inserted', function() {
        const diffResult = diffGlyph('New 🐴.', 'New 🐴🐴MoreData.', {removeEmpty: true});
        expect(convertChangesToXML(diffResult)).to.equal('New 🐴<ins>🐴MoreData</ins>.');
      });
      it('are treated as single characters when deleted', function() {
        const diffResult = diffGlyph('New 🐴🐴.', 'New 🐴.', {removeEmpty: true});
        expect(convertChangesToXML(diffResult)).to.equal('New 🐴<del>🐴</del>.');
      });
      it('are treated as single characters when equal', function() {
        const diffResult = diffGlyph('New 🐴.', 'New 🐴.', {removeEmpty: true});
        expect(convertChangesToXML(diffResult)).to.equal('New 🐴.');
      });
    });
  });
});
