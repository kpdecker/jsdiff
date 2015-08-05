import {diffSentences} from '../../lib/diff/sentence';
import {convertChangesToXML} from '../../lib/convert/xml';

describe('diff/sentence', function() {
  describe('#diffSentences', function() {
    it('Should diff Sentences', function() {
      var diffResult = diffSentences('New Value.', 'New ValueMoreData.');
      convertChangesToXML(diffResult).should.equal('<del>New Value.</del><ins>New ValueMoreData.</ins>');
    });

    it('should diff only the last sentence', function() {
      var diffResult = diffSentences('Here im. Rock you like old man.', 'Here im. Rock you like hurricane.');
      convertChangesToXML(diffResult).should.equal('Here im. <del>Rock you like old man.</del><ins>Rock you like hurricane.</ins>');
    });
  });
});
