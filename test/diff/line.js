import {diffLines, diffTrimmedLines} from '../../lib/diff/line';
import {convertChangesToXML} from '../../lib/convert/xml';

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
    it('should the same lines in diff', function() {
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
  });

  // Trimmed Line Diff
  describe('#TrimmedLineDiff', function() {
    it('should diff lines', function() {
      const diffResult = diffTrimmedLines(
        'line\nold value\nline',
        'line\nnew value\nline');
      expect(convertChangesToXML(diffResult)).to.equal('line\n<del>old value\n</del><ins>new value\n</ins>line');
    });
    it('should the same lines in diff', function() {
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

    it('should keep leading and trailing whitespace in the output', function() {
      function stringify(value) {
        return JSON.stringify(value, null, 2);
      }
      const diffResult = diffTrimmedLines(
        stringify([10, 20, 30]),
        stringify({ data: [10, 42, 30] }));
      expect(convertChangesToXML(diffResult)).to.equal([
        '<del>[\n</del>',
        '<ins>{\n',
        '  "data": [\n</ins>',
        '    10,\n',
        '<del>  20,\n</del>',
        '<ins>    42,\n</ins>',
        '    30\n',
        '<del>]</del><ins>  ]\n',
        '}</ins>'
      ].join('').replace(/"/g, '&quot;'));
    });

    it('should handle windows line endings', function() {
      const diffResult = diffTrimmedLines(
        'line\r\nold value \r\nline',
        'line\r\nnew value\r\nline');
      expect(convertChangesToXML(diffResult)).to.equal('line\r\n<del>old value \r\n</del><ins>new value\r\n</ins>line');
    });
  });

  describe('#diffLinesNL', function() {
    expect(diffLines('restaurant', 'restaurant\n', {newlineIsToken: true})).to.eql([
      {value: 'restaurant', count: 1},
      {value: '\n', count: 1, added: true, removed: undefined}
    ]);
    expect(diffLines('restaurant', 'restaurant\nhello', {newlineIsToken: true})).to.eql([
      {value: 'restaurant', count: 1},
      {value: '\nhello', count: 2, added: true, removed: undefined}
    ]);
  });
});
