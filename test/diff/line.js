import {diffLines, diffTrimmedLines} from '../../lib/diff/line';
import {convertChangesToXML} from '../../lib/convert/xml';

describe('diff/line', function() {
  // Line Diff
  describe('#diffLines', function() {
    it('should diff lines', function() {
      var diffResult = diffLines(
        'line\nold value\nline',
        'line\nnew value\nline');
      convertChangesToXML(diffResult).should.equal('line\n<del>old value\n</del><ins>new value\n</ins>line');
    });
    it('should the same lines in diff', function() {
      var diffResult = diffLines(
        'line\nvalue\nline',
        'line\nvalue\nline');
      convertChangesToXML(diffResult).should.equal('line\nvalue\nline');
    });

    it('should handle leading and trailing whitespace', function() {
      var diffResult = diffLines(
        'line\nvalue \nline',
        'line\nvalue\nline');
      convertChangesToXML(diffResult).should.equal('line\n<del>value \n</del><ins>value\n</ins>line');
    });

    it('should handle windows line endings', function() {
      var diffResult = diffLines(
        'line\r\nold value \r\nline',
        'line\r\nnew value\r\nline');
      convertChangesToXML(diffResult).should.equal('line\r\n<del>old value \r\n</del><ins>new value\r\n</ins>line');
    });

    it('should handle empty lines', function() {
      var diffResult = diffLines(
        'line\n\nold value \n\nline',
        'line\n\nnew value\n\nline');
      convertChangesToXML(diffResult).should.equal('line\n\n<del>old value \n</del><ins>new value\n</ins>\nline');
    });

    it('should handle empty input', function() {
      var diffResult = diffLines(
        'line\n\nold value \n\nline',
        '');
      convertChangesToXML(diffResult).should.equal('<del>line\n\nold value \n\nline</del>');
    });
  });

  // Trimmed Line Diff
  describe('#TrimmedLineDiff', function() {
    it('should diff lines', function() {
      var diffResult = diffTrimmedLines(
        'line\nold value\nline',
        'line\nnew value\nline');
      convertChangesToXML(diffResult).should.equal('line\n<del>old value\n</del><ins>new value\n</ins>line');
    });
    it('should the same lines in diff', function() {
      var diffResult = diffTrimmedLines(
        'line\nvalue\nline',
        'line\nvalue\nline');
      convertChangesToXML(diffResult).should.equal('line\nvalue\nline');
    });

    it('should ignore leading and trailing whitespace', function() {
      var diffResult = diffTrimmedLines(
        'line\nvalue \nline',
        'line\nvalue\nline');
      convertChangesToXML(diffResult).should.equal('line\nvalue\nline');
    });

    it('should handle windows line endings', function() {
      var diffResult = diffTrimmedLines(
        'line\r\nold value \r\nline',
        'line\r\nnew value\r\nline');
      convertChangesToXML(diffResult).should.equal('line\r\n<del>old value\r\n</del><ins>new value\r\n</ins>line');
    });
  });
});
