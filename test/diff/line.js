import {diffLines, diffTrimmedLines} from '../../libesm/diff/line.js';
import {convertChangesToXML} from '../../libesm/convert/xml.js';

import {expect} from 'chai';

describe('diff/line', function() {
  // Line Diff
  describe('#diffLines', function() {
    it('should diff lines', function() {
      const diffResult = diffLines(
        'line\nold value\nline',
        'line\nnew value\nline');
      expect(convertChangesToXML(diffResult)).to.equal('line\n<del>old value\n</del><ins>new value\n</ins>line');
    });
    it('should treat identical lines as equal', function() {
      const diffResult = diffLines(
        'line\nvalue\nline',
        'line\nvalue\nline');
      expect(convertChangesToXML(diffResult)).to.equal('line\nvalue\nline');
    });

    it('should handle leading and trailing whitespace', function() {
      const diffResult = diffLines(
        'line\nvalue \nline',
        'line\nvalue\nline');
      expect(convertChangesToXML(diffResult)).to.equal('line\n<del>value \n</del><ins>value\n</ins>line');
    });

    it('should handle windows line endings', function() {
      const diffResult = diffLines(
        'line\r\nold value \r\nline',
        'line\r\nnew value\r\nline');
      expect(convertChangesToXML(diffResult)).to.equal('line\r\n<del>old value \r\n</del><ins>new value\r\n</ins>line');
    });

    it('should handle empty lines', function() {
      const diffResult = diffLines(
        'line\n\nold value \n\nline',
        'line\n\nnew value\n\nline');
      expect(convertChangesToXML(diffResult)).to.equal('line\n\n<del>old value \n</del><ins>new value\n</ins>\nline');
    });

    it('should handle empty input', function() {
      const diffResult = diffLines(
        'line\n\nold value \n\nline',
        '');
      expect(convertChangesToXML(diffResult)).to.equal('<del>line\n\nold value \n\nline</del>');
    });

    it('Should prefer to do deletions before insertions, like Unix diff does', function() {
      const diffResult = diffLines('a\nb\nc\nd\n', 'a\nc\nb\nd\n');

      // There are two possible diffs with equal edit distance here; either we
      // can delete the "b" and insert it again later, or we can insert a "c"
      // before the "b" and then delete the original "c" later.
      // For consistency with the convention of other diff tools, we want to
      // prefer the diff where we delete and then later insert over the one
      // where we insert and then later delete.
      expect(convertChangesToXML(diffResult)).to.equal('a\n<del>b\n</del>c\n<ins>b\n</ins>d\n');

      const diffResult2 = diffLines('a\nc\nb\nd\n', 'a\nb\nc\nd\n');
      expect(convertChangesToXML(diffResult2)).to.equal('a\n<del>c\n</del>b\n<ins>c\n</ins>d\n');
    });

    describe('given options.maxEditLength', function() {
      it('terminates early', function() {
        const diffResult = diffLines(
          'line\nold value\nline',
          'line\nnew value\nline', { maxEditLength: 1 });
        expect(diffResult).to.be.undefined;
      });
      it('terminates early - async', function(done) {
        function callback(diffResult) {
          expect(diffResult).to.be.undefined;
          done();
        }
        diffLines(
          'line\nold value\nline',
          'line\nnew value\nline', { callback, maxEditLength: 1 });
      });
    });

    describe('given options.maxEditLength === 0', function() {
      it('returns normally if the strings are identical', function() {
        const diffResult = diffLines(
          'foo\nbar\nbaz\nqux\n',
          'foo\nbar\nbaz\nqux\n',
          { maxEditLength: 0 }
        );
        expect(convertChangesToXML(diffResult)).to.equal('foo\nbar\nbaz\nqux\n');
      });

      it('terminates early if there is even a single change', function() {
        const diffResult = diffLines(
          'foo\nbar\nbaz\nqux\n',
          'fox\nbar\nbaz\nqux\n',
          { maxEditLength: 0 }
        );
        expect(diffResult).to.be.undefined;
      });
    });
  });

  describe('oneChangePerToken option', function() {
    it('emits one change per line', function() {
      const diffResult = diffLines(
        'foo\nbar\nbaz\nqux\n',
        'fox\nbar\nbaz\nqux\n',
        { oneChangePerToken: true }
      );
      expect(diffResult).to.deep.equal(
        [
          {value: 'foo\n', count: 1, added: false, removed: true},
          {value: 'fox\n', count: 1, added: true, removed: false},
          {value: 'bar\n', count: 1, added: false, removed: false},
          {value: 'baz\n', count: 1, added: false, removed: false},
          {value: 'qux\n', count: 1, added: false, removed: false}
        ]
      );
    });
  });

  // Trimmed Line Diff
  describe('#TrimmedLineDiff', function() {
    it('should diff lines', function() {
      const diffResult = diffTrimmedLines(
        'line\nold value\nline',
        'line\nnew value\nline');
      expect(convertChangesToXML(diffResult)).to.equal('line\n<del>old value\n</del><ins>new value\n</ins>line');
    });
    it('should treat identical lines as equal', function() {
      const diffResult = diffTrimmedLines(
        'line\nvalue\nline',
        'line\nvalue\nline');
      expect(convertChangesToXML(diffResult)).to.equal('line\nvalue\nline');
    });

    it('should ignore leading and trailing whitespace', function() {
      const diffResult1 = diffTrimmedLines(
        'line\nvalue \nline',
        'line\nvalue\nline');
      expect(convertChangesToXML(diffResult1)).to.equal('line\nvalue\nline');

      const diffResult2 = diffTrimmedLines(
        'line\nvalue\nline',
        'line\nvalue \nline');
      expect(convertChangesToXML(diffResult2)).to.equal('line\nvalue \nline');

      const diffResult3 = diffTrimmedLines(
        'line\n value\nline',
        'line\nvalue\nline');
      expect(convertChangesToXML(diffResult3)).to.equal('line\nvalue\nline');

      const diffResult4 = diffTrimmedLines(
        'line\nvalue\nline',
        'line\n value\nline');
      expect(convertChangesToXML(diffResult4)).to.equal('line\n value\nline');
    });

    it('should not ignore the insertion or deletion of lines of whitespace at the end', function() {
      const finalChange = diffLines('foo\nbar\n', 'foo\nbar\n  \n  \n  \n', {ignoreWhitespace: true}).pop();
      expect(finalChange.count).to.equal(3);
      expect(finalChange.added).to.equal(true);

      const finalChange2 = diffLines('foo\nbar\n\n', 'foo\nbar\n', {ignoreWhitespace: true}).pop();
      expect(finalChange2.removed).to.equal(true);
    });

    it('should keep leading and trailing whitespace in the output', function() {
      function stringify(value) {
        return JSON.stringify(value, null, 2);
      }
      const diffResult = diffTrimmedLines(
      stringify([10, 20, 30]),
      stringify({ data: [10, 42, 30] }));
      expect(diffResult.filter(change => !change.removed).map(change => change.value).join('')).to.equal(`{
  "data": [
    10,
    42,
    30
  ]
}`);
      expect(convertChangesToXML(diffResult)).to.equal([
          '<del>[\n</del>',
          '<ins>{\n',
          '  "data": [\n</ins>',
          '    10,\n',
          '<del>  20,\n</del>',
          '<ins>    42,\n</ins>',
          '    30\n',
          '  ]\n',
          '<ins>}</ins>'
      ].join('').replace(/"/g, '&quot;'));
    });

    it('should not consider adding whitespace to an empty line an insertion', function() {
      const diffResult = diffTrimmedLines('foo\n\nbar', 'foo\n \nbar');
      expect(convertChangesToXML(diffResult)).to.equal('foo\n \nbar');
    });

    it('should handle windows line endings', function() {
      const diffResult = diffTrimmedLines(
        'line\r\nold value \r\nline',
        'line\r\nnew value\r\nline');
      expect(convertChangesToXML(diffResult)).to.equal('line\r\n<del>old value \r\n</del><ins>new value\r\n</ins>line');
    });

    it('should be compatible with newlineIsToken', function() {
      const diffResult = diffTrimmedLines(
        'line1\nline2\n   \nline4\n \n',
        'line1\nline2\n\n\nline4\n   \n',
        {newlineIsToken: true}
      );
      expect(convertChangesToXML(diffResult)).to.equal('line1\nline2\n<del>   </del>\n<ins>\n</ins>line4\n   \n');
    });

    it('supports async mode by passing a function as the options argument', function(done) {
      diffTrimmedLines(
        'line\r\nold value \r\nline',
        'line \r\nnew value\r\nline',
        function(diffResult) {
          expect(convertChangesToXML(diffResult)).to.equal(
            'line \r\n<del>old value \r\n</del><ins>new value\r\n</ins>line'
          );
          done();
        }
      );
    });
  });

  describe('#diffLinesNL', function() {
    expect(diffLines('restaurant', 'restaurant\n', {newlineIsToken: true})).to.eql([
      {value: 'restaurant', count: 1, added: false, removed: false},
      {value: '\n', count: 1, added: true, removed: false}
    ]);
    expect(diffLines('restaurant', 'restaurant\nhello', {newlineIsToken: true})).to.eql([
      {value: 'restaurant', count: 1, added: false, removed: false},
      {value: '\nhello', count: 2, added: true, removed: false}
    ]);
  });

  describe('Strip trailing CR', function() {
    expect(diffLines('line\nline', 'line\r\nline', {stripTrailingCr: true})).to.eql([
      {value: 'line\nline', count: 2, added: false, removed: false}
    ]);
  });

  it('ignores absence of newline on the last line of file wrt equality when ignoreNewlineAtEof', function() {
    // Example taken directly from https://github.com/kpdecker/jsdiff/issues/324
    expect(diffLines('a\nb\nc', 'a\nb')).to.eql(
      [
        { count: 1, added: false, removed: false, value: 'a\n' },
        { count: 2, added: false, removed: true, value: 'b\nc' },
        { count: 1, added: true, removed: false, value: 'b' }
      ]
    );
    expect(diffLines('a\nb\nc', 'a\nb', { ignoreNewlineAtEof: true })).to.eql(
      [
        { count: 2, added: false, removed: false, value: 'a\nb' },
        { count: 1, added: false, removed: true, value: 'c' }
      ]
    );
    expect(diffLines('a\nb', 'a\nb\nc', { ignoreNewlineAtEof: true })).to.eql(
      [
        { count: 2, added: false, removed: false, value: 'a\nb\n' },
        { count: 1, added: true, removed: false, value: 'c' }
      ]
    );
  });
});
