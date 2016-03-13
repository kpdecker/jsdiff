import {wordDiff, diffWords, diffWordsWithSpace} from '../../lib/diff/word';
import {convertChangesToXML} from '../../lib/convert/xml';

import {expect} from 'chai';

describe('WordDiff', function() {
  describe('#diffWords', function() {
    it('should diff whitespace', function() {
      const diffResult = diffWords('New Value', 'New  ValueMoreData');
      expect(convertChangesToXML(diffResult)).to.equal('New  <del>Value</del><ins>ValueMoreData</ins>');
    });

    it('should diff multiple whitespace values', function() {
      const diffResult = diffWords('New Value  ', 'New  ValueMoreData ');
      expect(convertChangesToXML(diffResult)).to.equal('New  <del>Value</del><ins>ValueMoreData</ins> ');
    });

    // Diff on word boundary
    it('should diff on word boundaries', function() {
      let diffResult = diffWords('New :Value:Test', 'New  ValueMoreData ');
      expect(convertChangesToXML(diffResult)).to.equal('New  <del>:Value:Test</del><ins>ValueMoreData </ins>');

      diffResult = diffWords('New Value:Test', 'New  Value:MoreData ');
      expect(convertChangesToXML(diffResult)).to.equal('New  Value:<del>Test</del><ins>MoreData </ins>');

      diffResult = diffWords('New Value-Test', 'New  Value:MoreData ');
      expect(convertChangesToXML(diffResult)).to.equal('New  Value<del>-Test</del><ins>:MoreData </ins>');

      diffResult = diffWords('New Value', 'New  Value:MoreData ');
      expect(convertChangesToXML(diffResult)).to.equal('New  Value<ins>:MoreData </ins>');
    });

    // Diff without changes
    it('should handle identity', function() {
      const diffResult = diffWords('New Value', 'New Value');
      expect(convertChangesToXML(diffResult)).to.equal('New Value');
    });
    it('should handle empty', function() {
      const diffResult = diffWords('', '');
      expect(convertChangesToXML(diffResult)).to.equal('');
    });
    it('should diff has identical content', function() {
      const diffResult = diffWords('New Value', 'New  Value');
      expect(convertChangesToXML(diffResult)).to.equal('New  Value');
    });

    // Empty diffs
    it('should diff empty new content', function() {
      const diffResult = diffWords('New Value', '');
      expect(diffResult.length).to.equal(1);
      expect(convertChangesToXML(diffResult)).to.equal('<del>New Value</del>');
    });
    it('should diff empty old content', function() {
      const diffResult = diffWords('', 'New Value');
      expect(convertChangesToXML(diffResult)).to.equal('<ins>New Value</ins>');
    });

    // With without anchor (the Heckel algorithm error case)
    it('should diff when there is no anchor value', function() {
      const diffResult = diffWords('New Value New Value', 'Value Value New New');
      expect(convertChangesToXML(diffResult)).to.equal('<del>New</del><ins>Value</ins> Value New <del>Value</del><ins>New</ins>');
    });

    it('should token unicode characters safely', function() {
      expect(wordDiff.removeEmpty(wordDiff.tokenize('jurídica'))).to.eql(['jurídica']);
      expect(wordDiff.removeEmpty(wordDiff.tokenize('wir üben'))).to.eql(['wir', ' ', 'üben']);
    });

    it('should include count with identity cases', function() {
      expect(diffWords('foo', 'foo')).to.eql([{value: 'foo', count: 1}]);
      expect(diffWords('foo bar', 'foo bar')).to.eql([{value: 'foo bar', count: 3}]);
    });
    it('should include count with empty cases', function() {
      expect(diffWords('foo', '')).to.eql([{value: 'foo', count: 1, added: undefined, removed: true}]);
      expect(diffWords('foo bar', '')).to.eql([{value: 'foo bar', count: 3, added: undefined, removed: true}]);

      expect(diffWords('', 'foo')).to.eql([{value: 'foo', count: 1, added: true, removed: undefined}]);
      expect(diffWords('', 'foo bar')).to.eql([{value: 'foo bar', count: 3, added: true, removed: undefined}]);
    });

    it('should ignore whitespace', function() {
      expect(diffWords('hase igel fuchs', 'hase igel fuchs')).to.eql([{ count: 5, value: 'hase igel fuchs' }]);
      expect(diffWords('hase igel fuchs', 'hase igel fuchs\n')).to.eql([{ count: 5, value: 'hase igel fuchs\n' }]);
      expect(diffWords('hase igel fuchs\n', 'hase igel fuchs')).to.eql([{ count: 5, value: 'hase igel fuchs\n' }]);
      expect(diffWords('hase igel fuchs', 'hase igel\nfuchs')).to.eql([{ count: 5, value: 'hase igel\nfuchs' }]);
      expect(diffWords('hase igel\nfuchs', 'hase igel fuchs')).to.eql([{ count: 5, value: 'hase igel fuchs' }]);
    });

    it('should diff whitespace with flag', function() {
      const diffResult = diffWords('New Value', 'New  ValueMoreData', {ignoreWhitespace: false});
      expect(convertChangesToXML(diffResult)).to.equal('New<del> Value</del><ins>  ValueMoreData</ins>');
    });

    it('should diff with only whitespace', function() {
      let diffResult = diffWords('', ' ');
      expect(convertChangesToXML(diffResult)).to.equal('<ins> </ins>');

      diffResult = diffWords(' ', '');
      expect(convertChangesToXML(diffResult)).to.equal('<del> </del>');
    });
  });

  describe('#diffWords - async', function() {
    it('should diff whitespace', function(done) {
      diffWords('New Value', 'New  ValueMoreData', function(err, diffResult) {
        expect(err).to.be.undefined;
        expect(convertChangesToXML(diffResult)).to.equal('New  <del>Value</del><ins>ValueMoreData</ins>');
        done();
      });
    });

    it('should diff multiple whitespace values', function(done) {
      diffWords('New Value  ', 'New  ValueMoreData ', function(err, diffResult) {
        expect(err).to.be.undefined;
        expect(convertChangesToXML(diffResult)).to.equal('New  <del>Value</del><ins>ValueMoreData</ins> ');
        done();
      });
    });

    // Diff on word boundary
    it('should diff on word boundaries', function(done) {
      diffWords('New :Value:Test', 'New  ValueMoreData ', function(err, diffResult) {
        expect(err).to.be.undefined;
        expect(convertChangesToXML(diffResult)).to.equal('New  <del>:Value:Test</del><ins>ValueMoreData </ins>');
        done();
      });
    });

    // Diff without changes
    it('should handle identity', function(done) {
      diffWords('New Value', 'New Value', function(err, diffResult) {
        expect(err).to.be.undefined;
        expect(convertChangesToXML(diffResult)).to.equal('New Value');
        done();
      });
    });
    it('should handle empty', function(done) {
      diffWords('', '', function(err, diffResult) {
        expect(err).to.be.undefined;
        expect(convertChangesToXML(diffResult)).to.equal('');
        done();
      });
    });
    it('should diff has identical content', function(done) {
      diffWords('New Value', 'New  Value', function(err, diffResult) {
        expect(err).to.be.undefined;
        expect(convertChangesToXML(diffResult)).to.equal('New  Value');
        done();
      });
    });

    // Empty diffs
    it('should diff empty new content', function(done) {
      diffWords('New Value', '', function(err, diffResult) {
        expect(diffResult.length).to.equal(1);
        expect(convertChangesToXML(diffResult)).to.equal('<del>New Value</del>');
        done();
      });
    });
    it('should diff empty old content', function(done) {
      diffWords('', 'New Value', function(err, diffResult) {
        expect(convertChangesToXML(diffResult)).to.equal('<ins>New Value</ins>');
        done();
      });
    });

    // With without anchor (the Heckel algorithm error case)
    it('should diff when there is no anchor value', function(done) {
      diffWords('New Value New Value', 'Value Value New New', function(err, diffResult) {
        expect(convertChangesToXML(diffResult)).to.equal('<del>New</del><ins>Value</ins> Value New <del>Value</del><ins>New</ins>');
        done();
      });
    });
  });

  describe('#diffWordsWithSpace', function() {
    it('should diff whitespace', function() {
      const diffResult = diffWordsWithSpace('New Value', 'New  ValueMoreData');
      expect(convertChangesToXML(diffResult)).to.equal('New<del> Value</del><ins>  ValueMoreData</ins>');
    });

    it('should diff multiple whitespace values', function() {
      const diffResult = diffWordsWithSpace('New Value  ', 'New  ValueMoreData ');
      expect(convertChangesToXML(diffResult)).to.equal('New<ins>  ValueMoreData</ins> <del>Value  </del>');
    });

    it('should perform async operations', function(done) {
      diffWordsWithSpace('New Value  ', 'New  ValueMoreData ', function(err, diffResult) {
        expect(convertChangesToXML(diffResult)).to.equal('New<ins>  ValueMoreData</ins> <del>Value  </del>');
        done();
      });
    });
  });
});
