import {wordDiff, diffWords, diffWordsWithSpace} from '../../libesm/diff/word.js';
import {convertChangesToXML} from '../../libesm/convert/xml.js';

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

    // Test for bug reported at https://github.com/kpdecker/jsdiff/issues/553
    it('should treat numbers as part of a word if not separated by whitespace or punctuation', () => {
      expect(
        wordDiff.tokenize(
          'Tea Too, also known as T2, had revenue of 57m AUD in 2012-13.'
        )
      ).to.deep.equal([
        'Tea ',
        ' Too',
        ', ',
        ' also ',
        ' known ',
        ' as ',
        ' T2',
        ', ',
        ' had ',
        ' revenue ',
        ' of ',
        ' 57m ',
        ' AUD ',
        ' in ',
        ' 2012',
        '-',
        '13',
        '.'
      ]);
    });

    // Test for various behaviours discussed at
    // https://github.com/kpdecker/jsdiff/issues/634#issuecomment-3381707327
    // In particular we are testing that:
    // 1. single code points representing accented characters (most of range
    //    U+00C0 thru U+00FF) are treated as word characters
    // 2. soft hyphens are treated as part of the word they appear in
    // 3. the multiplication and division signs are punctuation
    // 4. currency signs are punctuation
    // 5. section symbol is punctuation
    // 6. reserved trademark symbol is punctuation
    // 7. fractions are punctuation
    // The behaviour being tested for in points 4 thru 7 above is of debatable
    // correctness; it is not totally obvious whether we SHOULD treat those
    // things as punctuation characters or as word characters. Nonetheless, we
    // have this test to help document the current behaviour.
    it('should handle the 0080-00FF range the way we expect', () => {
      expect(
        wordDiff.tokenize(
          'My daugh\u00adter, Am\u00E9lie, is 1½ years old and works for ' +
            'Google® for £6 per hour (equivalently £6÷60=£0.10 per minute, or ' +
            '£6×8=£48 per day), in violation of § 123 of the Child Labour Act.'
        )
      ).to.deep.equal([
        'My ',
        ' daugh\u00adter',
        ', ',
        ' Am\u00E9lie',
        ', ',
        ' is ',
        ' 1',
        '½ ',
        ' years ',
        ' old ',
        ' and ',
        ' works ',
        ' for ',
        ' Google',
        '® ',
        ' for ',
        ' £',
        '6 ',
        ' per ',
        ' hour ',
        ' (',
        'equivalently ',
        ' £',
        '6',
        '÷',
        '60',
        '=',
        '£',
        '0',
        '.',
        '10 ',
        ' per ',
        ' minute',
        ', ',
        ' or ',
        ' £',
        '6',
        '×',
        '8',
        '=',
        '£',
        '48 ',
        ' per ',
        ' day',
        ')',
        ', ',
        ' in ',
        ' violation ',
        ' of ',
        ' § ',
        ' 123 ',
        ' of ',
        ' the ',
        ' Child ',
        ' Labour ',
        ' Act',
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

        // Rules around how to split up the whitespace between the start and
        // end "keep" change objects are subtle, as shown by the three examples
        // below:
        const diffResult2 = diffWords('foo\nbar baz', 'foo baz');
        expect(convertChangesToXML(diffResult2)).to.equal('foo<del>\nbar</del> baz');

        const diffResult3 = diffWords('foo bar baz', 'foo baz');
        expect(convertChangesToXML(diffResult3)).to.equal('foo <del>bar </del>baz');

        const diffResult4 = diffWords('foo\nbar baz', 'foo\n baz');
        expect(convertChangesToXML(diffResult4)).to.equal('foo\n<del>bar</del> baz');
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

    it('should skip postprocessing of change objects in one-change-object-per-token mode', function() {
      const diffResult = diffWords('Foo Bar', 'Foo Baz', {oneChangePerToken: true});
      expect(convertChangesToXML(diffResult)).to.equal(
        'Foo <del> Bar</del><ins> Baz</ins>'
      );
    });

    it('should respect options.ignoreCase', function() {
      const diffResult = diffWords('foo bar baz', 'FOO BAR QUX', {ignoreCase: true});
      expect(convertChangesToXML(diffResult)).to.equal(
        'FOO BAR <del>baz</del><ins>QUX</ins>'
      );
    });

    it('should treat punctuation characters as tokens', function() {
      let diffResult = diffWords('New:Value:Test', 'New,Value,More,Data ');
      expect(convertChangesToXML(diffResult)).to.equal('New<del>:</del><ins>,</ins>Value<del>:Test</del><ins>,More,Data </ins>');
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

    it('calls #diffWordsWithSpace if you pass ignoreWhitespace: false', function() {
      const diffResult = diffWords(
        'foo bar',
        'foo\tbar',
        {ignoreWhitespace: false}
      );
      expect(convertChangesToXML(diffResult)).to.equal('foo<del> </del><ins>\t</ins>bar');
    });

    it('supports tokenizing with an Intl.Segmenter', () => {
      // Example 1: Diffing Chinese text with no spaces.
      // a. "She (她) has (有) many (很多) tables (桌子)"
      // b. "Mei (梅) has (有) many (很多) sons (儿子)"
      // We want to see that diffWords will get the word counts right and won't try to treat the
      // trailing 子 as common to both texts (since it's part of a different word each time).
      const chineseSegmenter = new Intl.Segmenter('zh', {granularity: 'word'});
      const diffResult = diffWords('她有很多桌子。', '梅有很多儿子。', {intlSegmenter: chineseSegmenter});
      expect(diffResult).to.deep.equal([
        { count: 1, added: false, removed: true, value: '她' },
        { count: 1, added: true, removed: false, value: '梅' },
        { count: 2, added: false, removed: false, value: '有很多' },
        { count: 1, added: false, removed: true, value: '桌子' },
        { count: 1, added: true, removed: false, value: '儿子' },
        { count: 1, added: false, removed: false, value: '。' }
      ]);

      // Example 2: Should understand that a colon in the middle of a word is not a word break in
      // Finnish (see https://stackoverflow.com/a/76402021/1709587)
      const finnishSegmenter = new Intl.Segmenter('fi', {granularity: 'word'});
      expect(convertChangesToXML(diffWords(
        'USA:n nykyinen presidentti',
        'USA ja sen presidentti',
        {intlSegmenter: finnishSegmenter}
      ))).to.equal('<del>USA:n nykyinen</del><ins>USA ja sen</ins> presidentti');

      // Example 3: Some English text, including contractions, long runs of arbitrary space,
      // and punctuation, and using case insensitive mode, just to show all normal behaviour of
      // diffWords still works with a segmenter
      const englishSegmenter = new Intl.Segmenter('en', {granularity: 'word'});
      expect(convertChangesToXML(diffWords(
        "There wasn't time \n \t   for all that. He thought...",
        "There isn't time \n \t   left for all that, he thinks.",
        {intlSegmenter: englishSegmenter, ignoreCase: true}
      ))).to.equal(
        "There <del>wasn't</del><ins>isn't</ins> time \n \t   <ins>left </ins>"
        + 'for all that<del>.</del><ins>,</ins> he <del>thought</del><ins>thinks</ins>.<del>..</del>'
      );
    });

    it('rejects attempts to use a non-word Intl.Segmenter', () => {
      const segmenter = new Intl.Segmenter('en', {granularity: 'grapheme'});
      expect(() => {
        diffWords('foo', 'bar', {intlSegmenter: segmenter});
      }).to['throw']('The segmenter passed must have a granularity of "word"');
    });

    it("doesn't blow up when using an Intl.Segmenter on a text with a double newline", () => {
      // Regression test for https://github.com/kpdecker/jsdiff/issues/630
      const englishSegmenter = new Intl.Segmenter('en', {granularity: 'word'});
      expect(convertChangesToXML(diffWords(
        'A\n\nX',
        'B\n\nX',
        {intlSegmenter: englishSegmenter}
      ))).to.equal(
        '<del>A</del><ins>B</ins>\n\nX'
      );
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

    it('should handle empty', function() {
      const diffResult = diffWordsWithSpace('', '');
      expect(convertChangesToXML(diffResult)).to.equal('');
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
