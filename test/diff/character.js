import {diffChars} from '../../lib/diff/character';
import {convertChangesToXML} from '../../lib/convert/xml';

import {expect} from 'chai';

describe('diff/character', function() {
  describe('#diffChars', function() {
    it('Should diff chars', function() {
      const diffResult = diffChars('Old Value.', 'New ValueMoreData.');
      expect(convertChangesToXML(diffResult)).to.equal('<del>Old</del><ins>New</ins> Value<ins>MoreData</ins>.');
    });

    describe('oneChangePerToken option', function() {
      it('emits one change per character', function() {
        const diffResult = diffChars('Old Value.', 'New ValueMoreData.', {oneChangePerToken: true});
        expect(diffResult.length).to.equal(21);
        expect(convertChangesToXML(diffResult)).to.equal('<del>O</del><del>l</del><del>d</del><ins>N</ins><ins>e</ins><ins>w</ins> Value<ins>M</ins><ins>o</ins><ins>r</ins><ins>e</ins><ins>D</ins><ins>a</ins><ins>t</ins><ins>a</ins>.');
      });

      it('correctly handles the case where the texts are identical', function() {
        const diffResult = diffChars('foo bar baz qux', 'foo bar baz qux', {oneChangePerToken: true});
        expect(diffResult).to.deep.equal(
          ['f', 'o', 'o', ' ', 'b', 'a', 'r', ' ', 'b', 'a', 'z', ' ', 'q', 'u', 'x'].map(
            char => ({value: char, count: 1, added: false, removed: false})
          )
        );
      });
    });

    describe('case insensitivity', function() {
      it("is considered when there's no difference", function() {
        const diffResult = diffChars('New Value.', 'New value.', {ignoreCase: true});
        expect(convertChangesToXML(diffResult)).to.equal('New value.');
      });

      it("is considered when there's a difference", function() {
        const diffResult = diffChars('New Values.', 'New value.', {ignoreCase: true});
        expect(convertChangesToXML(diffResult)).to.equal('New value<del>s</del>.');
      });
    });
  });
});
