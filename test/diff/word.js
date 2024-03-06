import {wordDiff, diffWords, diffWordsWithSpace} from '../../lib/diff/word';
import {convertChangesToXML} from '../../lib/convert/xml';

import {expect} from 'chai';

describe('WordDiff', function() {
  describe('#tokenize', function() {
    it('should give each word & punctuation mark its own token, including leading and trailing whitespace', function() {
      expect(
        wordDiff.tokenize(
          'foo bar baz jurídica wir üben    bla\t\t \txyzáxyz  \n\n\n  animá-los\r\n\r\n(wibbly wobbly)().'
        )
      ).to.deep.equal([
        'foo ',
        ' bar ',
        ' baz ',
        ' jurídica ',
        ' wir ',
        ' üben    ',
        '    bla\t\t \t',
        '\t\t \txyzáxyz  \n\n\n  ',
        '  \n\n\n  animá',
        '-',
        'los\r\n\r\n',
        '\r\n\r\n(',
        'wibbly ',
        ' wobbly',
        ')',
        '(',
        ')',
        '.'
      ]);
    });
  });

  describe('#diffWords', function() {
    it("should ignore whitespace changes between tokens that aren't added or deleted", function() {
      const diffResult = diffWords('New    Value', 'New \n \t Value');
      expect(convertChangesToXML(diffResult)).to.equal('New \n \t Value');
    });

    describe('whitespace changes that border inserted/deleted tokens should be included in the diff as far as is possible...', function() {
      it('(add+del at end of text)', function() {
        const diffResult = diffWords('New Value  ', 'New  ValueMoreData ');
        expect(convertChangesToXML(diffResult)).to.equal('New <del>Value  </del><ins> ValueMoreData </ins>');
      });

      it('(add+del in middle of text)', function() {
        const diffResult = diffWords('New Value End', 'New  ValueMoreData End');
        expect(convertChangesToXML(diffResult)).to.equal('New <del>Value</del><ins> ValueMoreData</ins> End');
      });

      it('(add+del at start of text)', function() {
        const diffResult = diffWords('\tValue End', ' ValueMoreData   End');
        expect(convertChangesToXML(diffResult)).to.equal('<del>\tValue</del><ins> ValueMoreData  </ins> End');
      });

      it('(add at start of text)', function() {
        const diffResult = diffWords('\t Value', 'More  Value');
        // Preferable would be:
        // '<ins>More </ins> Value'
        // But this is hard to achieve without adding something like the
        // .oldValue property I contemplate in
        // https://github.com/kpdecker/jsdiff/pull/219#issuecomment-1858246490
        // to change objects returned by the base diffing algorithm. The CO
        // cleanup done by diffWords simply doesn't have enough information to
        // return the ideal result otherwise.
        expect(convertChangesToXML(diffResult)).to.equal('<ins>More  </ins>Value');
      });

      it('(del at start of text)', function() {
        const diffResult = diffWords('More  Value', '\t Value');
        expect(convertChangesToXML(diffResult)).to.equal('<del>More  </del>\t Value');
      });

      it('(add in middle of text)', function() {
        const diffResult = diffWords('Even Value', 'Even    More    Value');
        // Preferable would be:
        // 'Even <ins>   More    </ins>Value'
        // But this is hard to achieve without adding something like the
        // .oldValue property I contemplate in
        // https://github.com/kpdecker/jsdiff/pull/219#issuecomment-1858246490
        // to change objects returned by the base diffing algorithm. The CO
        // cleanup done by diffWords simply doesn't have enough information to
        // return the ideal result otherwise.
        expect(convertChangesToXML(diffResult)).to.equal('Even    <ins>More    </ins>Value');
      });

      it('(del in middle of text)', function() {
        const diffResult = diffWords('Even    More    Value', 'Even Value');
        expect(convertChangesToXML(diffResult)).to.equal('Even <del>   More    </del>Value');
      });

      it('(add at end of text)', function() {
        const diffResult = diffWords('Foo\n', 'Foo Bar\n');
        // Preferable would be:
        // 'Foo<ins> Bar\n</ins>'
        // But this is hard to achieve without adding something like the
        // .oldValue property I contemplate in
        // https://github.com/kpdecker/jsdiff/pull/219#issuecomment-1858246490
        // to change objects returned by the base diffing algorithm. The CO
        // cleanup done by diffWords simply doesn't have enough information to
        // return the ideal result otherwise.
        expect(convertChangesToXML(diffResult)).to.equal('Foo <ins>Bar\n</ins>');
      });

      it('(del at end of text)', function() {
        const diffResult = diffWords('Foo   Bar', 'Foo ');
        expect(convertChangesToXML(diffResult)).to.equal('Foo <del>  Bar</del>');
      });
    });

    it('should treat punctuation characters as tokens', function() {
      let diffResult = diffWords('New:Value:Test', 'New,Value,More,Data ');
      expect(convertChangesToXML(diffResult)).to.equal('New<del>:</del><ins>,</ins>Value<del>:Test</del><ins>,More,Data </ins>');
    });

    // TODO: Review all tests below here
    // Diff on word boundary

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

    it('should include count with identity cases', function() {
      expect(diffWords('foo', 'foo')).to.eql([{value: 'foo', count: 1, removed: false, added: false}]);
      expect(diffWords('foo bar', 'foo bar')).to.eql([{value: 'foo bar', count: 2, removed: false, added: false}]);
    });
    it('should include count with empty cases', function() {
      expect(diffWords('foo', '')).to.eql([{value: 'foo', count: 1, added: false, removed: true}]);
      expect(diffWords('foo bar', '')).to.eql([{value: 'foo bar', count: 2, added: false, removed: true}]);

      expect(diffWords('', 'foo')).to.eql([{value: 'foo', count: 1, added: true, removed: false}]);
      expect(diffWords('', 'foo bar')).to.eql([{value: 'foo bar', count: 2, added: true, removed: false}]);
    });

    it('should ignore whitespace', function() {
      expect(diffWords('hase igel fuchs', 'hase igel fuchs')).to.eql([{ count: 3, value: 'hase igel fuchs', removed: false, added: false }]);
      expect(diffWords('hase igel fuchs', 'hase igel fuchs\n')).to.eql([{ count: 3, value: 'hase igel fuchs\n', removed: false, added: false }]);
      expect(diffWords('hase igel fuchs\n', 'hase igel fuchs')).to.eql([{ count: 3, value: 'hase igel fuchs', removed: false, added: false }]);
      expect(diffWords('hase igel fuchs', 'hase igel\nfuchs')).to.eql([{ count: 3, value: 'hase igel\nfuchs', removed: false, added: false }]);
      expect(diffWords('hase igel\nfuchs', 'hase igel fuchs')).to.eql([{ count: 3, value: 'hase igel fuchs', removed: false, added: false }]);
    });

    it('should diff with only whitespace', function() {
      let diffResult = diffWords('', ' ');
      expect(convertChangesToXML(diffResult)).to.equal('<ins> </ins>');

      diffResult = diffWords(' ', '');
      expect(convertChangesToXML(diffResult)).to.equal('<del> </del>');
    });

    it('should support async mode', function(done) {
      diffWords('New    Value', 'New \n \t Value', function(diffResult) {
        expect(convertChangesToXML(diffResult)).to.equal('New \n \t Value');
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
      expect(convertChangesToXML(diffResult)).to.equal('New<del> Value</del>  <ins>ValueMoreData </ins>');
    });

    it('should inserts values in parenthesis', function() {
      const diffResult = diffWordsWithSpace('()', '(word)');
      expect(convertChangesToXML(diffResult)).to.equal('(<ins>word</ins>)');
    });

    it('should inserts values in brackets', function() {
      const diffResult = diffWordsWithSpace('[]', '[word]');
      expect(convertChangesToXML(diffResult)).to.equal('[<ins>word</ins>]');
    });

    it('should inserts values in curly braces', function() {
      const diffResult = diffWordsWithSpace('{}', '{word}');
      expect(convertChangesToXML(diffResult)).to.equal('{<ins>word</ins>}');
    });

    it('should inserts values in quotes', function() {
      const diffResult = diffWordsWithSpace("''", "'word'");
      expect(convertChangesToXML(diffResult)).to.equal("'<ins>word</ins>'");
    });

    it('should inserts values in double quotes', function() {
      const diffResult = diffWordsWithSpace('""', '"word"');
      expect(convertChangesToXML(diffResult)).to.equal('&quot;<ins>word</ins>&quot;');
    });

    it('should treat newline as separate token (issues #180, #211)', function() {
      // #180
      const diffResult1 = diffWordsWithSpace('foo\nbar', 'foo\n\n\nbar');
      expect(convertChangesToXML(diffResult1)).to.equal('foo\n<ins>\n\n</ins>bar');
      // #211
      const diffResult2 = diffWordsWithSpace('A\n\nB\n', 'A\nB\n');
      expect(convertChangesToXML(diffResult2)).to.equal('A\n<del>\n</del>B\n');
      // Windows-style newlines should also get a single token
      const diffResult3 = diffWordsWithSpace('foo\r\nbar', 'foo  \r\n\r\n\r\nbar');
      expect(convertChangesToXML(diffResult3)).to.equal('foo<ins>  </ins>\r\n<ins>\r\n\r\n</ins>bar');
      const diffResult4 = diffWordsWithSpace('A\r\n\r\nB\r\n', 'A\r\nB\r\n');
      expect(convertChangesToXML(diffResult4)).to.equal('A\r\n<del>\r\n</del>B\r\n');
    });

    it('should perform async operations', function(done) {
      diffWordsWithSpace('New Value  ', 'New  ValueMoreData ', function(diffResult) {
        expect(convertChangesToXML(diffResult)).to.equal('New<del> Value</del>  <ins>ValueMoreData </ins>');
        done();
      });
    });

    // With without anchor (the Heckel algorithm error case)
    it('should diff when there is no anchor value', function() {
      const diffResult = diffWordsWithSpace('New Value New Value', 'Value Value New New');
      expect(convertChangesToXML(diffResult)).to.equal('<del>New</del><ins>Value</ins> Value New <del>Value</del><ins>New</ins>');
    });

    describe('case insensitivity', function() {
      it("is considered when there's a difference", function() {
        const diffResult = diffWordsWithSpace('new value', 'New  ValueMoreData', {ignoreCase: true});
        expect(convertChangesToXML(diffResult)).to.equal('New<del> value</del><ins>  ValueMoreData</ins>');
      });

      it("is considered when there's no difference", function() {
        const diffResult = diffWordsWithSpace('new value', 'New Value', {ignoreCase: true});
        expect(convertChangesToXML(diffResult)).to.equal('New Value');
      });
    });
  });
});
