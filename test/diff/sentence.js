import {diffSentences, sentenceDiff} from '../../libesm/diff/sentence.js';
import {convertChangesToXML} from '../../libesm/convert/xml.js';

import {expect} from 'chai';

describe('diff/sentence', function() {
  describe('tokenize', function() {
    it('should split on whitespace after a punctuation mark, and keep the whitespace as a token', function() {
      expect(sentenceDiff.removeEmpty(sentenceDiff.tokenize(''))).to.eql([]);

      expect(sentenceDiff.removeEmpty(sentenceDiff.tokenize(
          'Foo bar baz! Qux wibbly wobbly bla? \n\tYayayaya!Yayayaya!Ya! Yes!!!!! Blub'
      ))).to.eql([
        'Foo bar baz!',
        ' ',
        'Qux wibbly wobbly bla?',
        ' \n\t',
        'Yayayaya!Yayayaya!Ya!',
        ' ',
        'Yes!!!!!',
        ' ',
        'Blub'
      ]);

      expect(sentenceDiff.removeEmpty(sentenceDiff.tokenize(
        '! Hello there.'
      ))).to.eql([
        '!',
        ' ',
        'Hello there.'
      ]);

      expect(sentenceDiff.removeEmpty(sentenceDiff.tokenize(
        '    foo bar baz.'
      ))).to.eql([
        '    foo bar baz.'
      ]);
    });
  });

  describe('#diffSentences', function() {
    it('Should diff Sentences', function() {
      const diffResult = diffSentences('New Value.', 'New ValueMoreData.');
      expect(convertChangesToXML(diffResult)).to.equal('<del>New Value.</del><ins>New ValueMoreData.</ins>');
    });

    it('should diff only the last sentence', function() {
      const diffResult = diffSentences('Here im. Rock you like old man.', 'Here im. Rock you like hurricane.');
      expect(convertChangesToXML(diffResult)).to.equal('Here im. <del>Rock you like old man.</del><ins>Rock you like hurricane.</ins>');
    });
  });
});
