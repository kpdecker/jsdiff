import {applyPatch, applyPatches} from '../../libesm/patch/apply.js';
import {parsePatch} from '../../libesm/patch/parse.js';
import {createPatch} from '../../libesm/patch/create.js';
import {structuredPatch} from '../../libesm/patch/create.js';

import {expect} from 'chai';

describe('patch/apply', function() {
  describe('#applyPatch', function() {
    it('should accept parsed patches', function() {
      const patch = parsePatch(
          'Index: test\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,3 +1,4 @@\n'
          + ' line2\n'
          + ' line3\n'
          + '+line4\n'
          + ' line5\n');

      expect(applyPatch(
          'line2\n'
          + 'line3\n'
          + 'line5\n',

          patch))
        .to.equal(
          'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n');

      expect(applyPatch(
          'line2\n'
          + 'line3\n'
          + 'line5\n',

          patch[0]))
        .to.equal(
          'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n');
    });

    it('should error if passed multiple indexes', function() {
      expect(function() {
        applyPatch('', [1, 2]);
      }).to['throw']('applyPatch only works with a single input.');
    });

    it('should apply patches that change the last line', function() {
      expect(applyPatch(
          'line2\n'
          + 'line3\n'
          + 'line5\n',

          'Index: test\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,3 +1,4 @@\n'
          + ' line2\n'
          + ' line3\n'
          + '+line4\n'
          + ' line5\n'))
        .to.equal(
          'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n');

      expect(applyPatch(
          'line2\nline3\nline4\n',

          'Index: test\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,3 +1,4 @@\n'
          + ' line2\n'
          + ' line3\n'
          + ' line4\n'
          + '+line5\n'))
        .to.equal('line2\nline3\nline4\nline5\n');

      expect(applyPatch(
          'line1\nline2\nline3\nline4\n',

          'Index: test\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,4 +1,4 @@\n'
          + ' line1\n'
          + ' line2\n'
          + ' line3\n'
          + '+line44\n'
          + '-line4\n'))
        .to.equal('line1\nline2\nline3\nline44\n');

      expect(applyPatch(
          'line1\nline2\nline3\nline4\n',

          'Index: test\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,4 +1,5 @@\n'
          + ' line1\n'
          + ' line2\n'
          + ' line3\n'
          + '+line44\n'
          + '+line5\n'
          + '-line4\n'))
        .to.equal('line1\nline2\nline3\nline44\nline5\n');
    });

    it('should merge EOFNL', function() {
      expect(applyPatch(
          'line1\nline2\nline3\nline4\n',

          'Index: test\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,4 +1,4 @@\n'
          + ' line1\n'
          + ' line2\n'
          + ' line3\n'
          + '+line4\n'
          + '\\ No newline at end of file\n'
          + '-line4\n'))
        .to.equal('line1\nline2\nline3\nline4');

      expect(applyPatch(
          'line1\nline2\nline3\nline4',

          'Index: test\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,4 +1,4 @@\n'
          + ' line1\n'
          + ' line2\n'
          + ' line3\n'
          + '+line4\n'
          + '-line4\n'
          + '\\ No newline at end of file\n'))
        .to.equal('line1\nline2\nline3\nline4\n');

      expect(applyPatch(
          'line11\nline2\nline3\nline4',

            'Index: test\n'
            + '===================================================================\n'
            + '--- test\theader1\n'
            + '+++ test\theader2\n'
            + '@@ -1,4 +1,4 @@\n'
            + '+line1\n'
            + '-line11\n'
            + ' line2\n'
            + ' line3\n'
            + ' line4\n'
            + '\\ No newline at end of file\n'))
        .to.equal('line1\nline2\nline3\nline4');

      expect(applyPatch(
          'line11\nline2\nline3\nline4\nline4\nline4\nline4',

          'Index: test\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,5 +1,5 @@\n'
          + '+line1\n'
          + '-line11\n'
          + ' line2\n'
          + ' line3\n'
          + ' line4\n'
          + ' line4\n'))
        .to.equal('line1\nline2\nline3\nline4\nline4\nline4\nline4');

      // Test empty lines in patches
      expect(applyPatch(
          'line11\nline2\n\nline4',

            'Index: test\n'
            + '===================================================================\n'
            + '--- test\theader1\n'
            + '+++ test\theader2\n'
            + '@@ -1,4 +1,4 @@\n'
            + '+line1\n'
            + '-line11\n'
            + ' line2\n'
            + '\n'
            + ' line4\n'
            + '\\ No newline at end of file\n'))
        .to.equal('line1\nline2\n\nline4');
    });

    it('should apply patches', function() {
      const oldFile =
        'value\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'remove value\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'remove value\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'value\n'
        + 'context\n'
        + 'context';
      const newFile =
        'new value\n'
        + 'new value 2\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'add value\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'context\n'
        + 'new value\n'
        + 'new value 2\n'
        + 'context\n'
        + 'context';
      const diffFile =
        'Index: testFileName\n'
        + '===================================================================\n'
        + '--- testFileName\tOld Header\n'
        + '+++ testFileName\tNew Header\n'
        + '@@ -1,5 +1,6 @@\n'
        + '+new value\n'
        + '+new value 2\n'
        + '-value\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + '@@ -7,9 +8,8 @@\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + '-remove value\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + '@@ -17,20 +17,21 @@\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + '-remove value\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + '+add value\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + ' context\n'
        + '+new value\n'
        + '+new value 2\n'
        + '-value\n'
        + ' context\n'
        + ' context\n'
        + '\\ No newline at end of file\n';

      expect(applyPatch(oldFile, diffFile)).to.equal(newFile);

      const identityFile =
        'Index: testFileName\n'
        + '===================================================================\n'
        + '--- testFileName\tOld Header\n'
        + '+++ testFileName\tNew Header\n';
      expect(applyPatch(oldFile, identityFile)).to.equal(oldFile);
    });

    it('should apply patches that lack an index header', function() {
      expect(applyPatch(
          'line2\n'
          + 'line3\n'
          + 'line5\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,3 +1,4 @@\n'
          + ' line2\n'
          + ' line3\n'
          + '+line4\n'
          + ' line5\n'))
        .to.equal(
          'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n');
    });

    it('should apply single line patches with zero context and zero removed', function() {
      expect(applyPatch(
          'line2\n'
          + 'line3\n'
          + 'line5\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -2,0 +3 @@\n'
          + '+line4\n'))
        .to.equal(
          'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n');
    });

    it('should apply multiline patches with zero context and zero removed', function() {
      expect(applyPatch(
          'line2\n'
          + 'line3\n'
          + 'line7\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -2,0 +3,3 @@\n'
          + '+line4\n'
          + '+line5\n'
          + '+line6\n'))
        .to.equal(
          'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n'
          + 'line6\n'
          + 'line7\n');
    });

    it('should apply single line patches with zero context and zero removed at start of file', function() {
      expect(applyPatch(
          'line2\n'
          + 'line3\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -0,0 +1 @@\n'
          + '+line1\n'))
        .to.equal(
          'line1\n'
          + 'line2\n'
          + 'line3\n');
    });

    it('should apply multi line patches with zero context and zero removed at start of file', function() {
      expect(applyPatch(
          'line3\n'
          + 'line4\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -0,0 +1,2 @@\n'
          + '+line1\n'
          + '+line2\n'))
        .to.equal(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line4\n');
    });

    it('should apply multi line patches with zero context and zero removed at end of file', function() {
      expect(applyPatch(
          'line1\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,0 +2 @@\n'
          + '+line2\n'))
        .to.equal(
          'line1\n'
          + 'line2\n');
    });

    it('should apply multi line patches with zero context and zero removed at end of file', function() {
      expect(applyPatch(
          'line1\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,0 +2,2 @@\n'
          + '+line2\n'
          + '+line3\n'))
        .to.equal(
          'line1\n'
          + 'line2\n'
          + 'line3\n');
    });

    it('should apply single line patches with zero context and zero added at beginning of file', function() {
      expect(applyPatch(
          'line1\n'
          + 'line2\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1 +0,0 @@\n'
          + '-line1\n'))
        .to.equal(
          'line2\n');
    });

    it('should apply multi line patches with zero context and zero added at beginning of file', function() {
      expect(applyPatch(
          'line1\n'
          + 'line2\n'
          + 'line3\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,2 +0,0 @@\n'
          + '-line1\n'
          + '-line2\n'))
        .to.equal(
          'line3\n');
    });

    it('should apply single line patches with zero context and zero added at end of file', function() {
      expect(applyPatch(
          'line1\n'
          + 'line2\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -2 +1,0 @@\n'
          + '-line2\n'))
        .to.equal(
          'line1\n');
    });

    it('should apply multi line patches with zero context and zero added at end of file', function() {
      expect(applyPatch(
          'line1\n'
          + 'line2\n'
          + 'line3\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -2,2 +1,0 @@\n'
          + '-line2\n'
          + '-line3\n'))
        .to.equal(
          'line1\n');
    });

    it('should fail on mismatch', function() {
      expect(applyPatch(
          'line2\n'
          + 'line2\n'
          + 'line5\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,3 +1,4 @@\n'
          + ' line2\n'
          + ' line3\n'
          + '+line4\n'
          + ' line5\n'))
        .to.equal(false);
    });

    it("should fail if a line to delete doesn't match, even with fuzz factor", function() {
      const patch = 'Index: foo.txt\n' +
        '===================================================================\n' +
        '--- foo.txt\n' +
        '+++ foo.txt\n' +
        '@@ -1,4 +1,3 @@\n' +
        ' foo\n' +
        '-bar\n' +
        ' baz\n' +
        ' qux\n';

      // Sanity-check - patch should apply fine to this:
      const result1 = applyPatch('foo\nbar\nbaz\nqux\n', patch, {fuzzFactor: 99});
      expect(result1).to.equal('foo\nbaz\nqux\n');

      // ... but not to this:
      const result2 = applyPatch('foo\nSOMETHING ENTIRELY DIFFERENT\nbaz\nqux\n', patch, {fuzzFactor: 99});
      expect(result2).to.equal(false);
    });

    it("should fail if either line immediately next to an insertion doesn't match, regardless of fuzz factor", function() {
      expect(applyPatch(
          'lineA\n'
          + 'lineB\n'
          + 'lineC\n'
          + 'lineD\n'
          + 'lineE\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,5 +1,6 @@\n'
          + ' lineA\n'
          + ' lineB\n'
          + ' lineC\n'
          + '+lineNEW\n'
          + ' lineX\n'
          + ' lineE\n',
          {fuzzFactor: 10}))
        .to.equal(false);

      expect(applyPatch(
          'lineA\n'
          + 'lineB\n'
          + 'lineC\n'
          + 'lineD\n'
          + 'lineE\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,5 +1,6 @@\n'
          + ' lineA\n'
          + ' lineB\n'
          + ' lineX\n'
          + '+lineNEW\n'
          + ' lineD\n'
          + ' lineE\n',
          {fuzzFactor: 10}))
        .to.equal(false);
    });

    it('should, given a fuzz factor, allow mismatches caused by presence of extra lines', function() {
      expect(applyPatch(
        'line1\n'
        + 'line2\n'
        + 'line2.5\n'
        + 'line3\n'
        + 'line4\n'
        + 'line6\n'
        + 'line7\n'
        + 'line8\n'
        + 'line8.5\n'
        + 'line9\n'
        + 'line10\n',

        '--- foo.txt\t2024-07-19 09:58:02.489059795 +0100\n'
        + '+++ bar.txt\t2024-07-19 09:58:24.768153252 +0100\n'
        + '@@ -2,8 +2,8 @@\n'
        + ' line2\n'
        + ' line3\n'
        + ' line4\n'
        + '+line5\n'
        + ' line6\n'
        + ' line7\n'
        + ' line8\n'
        + '-line9\n'
        + ' line10\n',

        {fuzzFactor: 2}
      )).to.equal(
        'line1\n'
        + 'line2\n'
        + 'line2.5\n'
        + 'line3\n'
        + 'line4\n'
        + 'line5\n'
        + 'line6\n'
        + 'line7\n'
        + 'line8\n'
        + 'line8.5\n'
        + 'line10\n'
      );
    });

    it('should, given a fuzz factor, allow mismatches due to missing lines', function() {
      expect(applyPatch(
        'line1\n'
        + 'line2\n'
        + 'line4\n'
        + 'line6\n'
        + 'line7\n'
        + 'line9\n'
        + 'line10\n',

        '--- foo.txt\t2024-07-19 09:58:02.489059795 +0100\n'
        + '+++ bar.txt\t2024-07-19 09:58:24.768153252 +0100\n'
        + '@@ -2,8 +2,8 @@\n'
        + ' line2\n'
        + ' line3\n'
        + ' line4\n'
        + '+line5\n'
        + ' line6\n'
        + ' line7\n'
        + ' line8\n'
        + '-line9\n'
        + ' line10\n',

        {fuzzFactor: 2}
      )).to.equal(
        'line1\n'
        + 'line2\n'
        + 'line4\n'
        + 'line5\n'
        + 'line6\n'
        + 'line7\n'
        + 'line10\n'
      );
    });

    it('should, given a fuzz factor, allow mismatches caused by lines being changed', function() {
      expect(applyPatch(
        'line1\n'
        + 'line2\n'
        + 'lineTHREE\n'
        + 'line4\n'
        + 'line6\n'
        + 'line7\n'
        + 'lineEIGHT\n'
        + 'line9\n'
        + 'line10\n',

        '--- foo.txt\t2024-07-19 09:58:02.489059795 +0100\n'
        + '+++ bar.txt\t2024-07-19 09:58:24.768153252 +0100\n'
        + '@@ -2,8 +2,8 @@\n'
        + ' line2\n'
        + ' line3\n'
        + ' line4\n'
        + '+line5\n'
        + ' line6\n'
        + ' line7\n'
        + ' line8\n'
        + '-line9\n'
        + ' line10\n',

        {fuzzFactor: 2}
      )).to.equal(
        'line1\n'
        + 'line2\n'
        + 'lineTHREE\n'
        + 'line4\n'
        + 'line5\n'
        + 'line6\n'
        + 'line7\n'
        + 'lineEIGHT\n'
        + 'line10\n'
      );
    });

    it('should, given a fuzz factor, allow mismatches caused by a mixture of ins/sub/del', function() {
      expect(applyPatch(
        'line1\n'
        + 'line2\n'
        + 'line2.5\n'
        + 'lineTHREE\n'
        + 'line4\n'
        + 'line6\n'
        + 'line7\n'
        + 'line9\n'
        + 'line10\n',

        '--- foo.txt\t2024-07-19 09:58:02.489059795 +0100\n'
        + '+++ bar.txt\t2024-07-19 09:58:24.768153252 +0100\n'
        + '@@ -2,8 +2,8 @@\n'
        + ' line2\n'
        + ' line3\n'
        + ' line4\n'
        + '+line5\n'
        + ' line6\n'
        + ' line7\n'
        + ' line8\n'
        + '-line9\n'
        + ' line10\n',

        {fuzzFactor: 3}
      )).to.equal(
        'line1\n'
        + 'line2\n'
        + 'line2.5\n'
        + 'lineTHREE\n'
        + 'line4\n'
        + 'line5\n'
        + 'line6\n'
        + 'line7\n'
        + 'line10\n'
      );
    });

    it('should fail if number of lines of context mismatch is greater than fuzz factor', function() {
      // 3 extra lines of context, but fuzzFactor: 2
      expect(applyPatch(
        'line1\n'
        + 'line2\n'
        + 'line2.5\n'
        + 'line3\n'
        + 'line4\n'
        + 'line6\n'
        + 'line6.5\n'
        + 'line7\n'
        + 'line8\n'
        + 'line8.5\n'
        + 'line9\n'
        + 'line10\n',

        '--- foo.txt\t2024-07-19 09:58:02.489059795 +0100\n'
        + '+++ bar.txt\t2024-07-19 09:58:24.768153252 +0100\n'
        + '@@ -2,8 +2,8 @@\n'
        + ' line2\n'
        + ' line3\n'
        + ' line4\n'
        + '+line5\n'
        + ' line6\n'
        + ' line7\n'
        + ' line8\n'
        + '-line9\n'
        + ' line10\n',

        {fuzzFactor: 2}
      )).to.equal(
        false
      );

      // 2 lines of context missing from file to patch, fuzz factor 1
      expect(applyPatch(
        'line1\n'
        + 'line2\n'
        + 'line4\n'
        + 'line6\n'
        + 'line7\n'
        + 'line9\n'
        + 'line10\n',

        '--- foo.txt\t2024-07-19 09:58:02.489059795 +0100\n'
        + '+++ bar.txt\t2024-07-19 09:58:24.768153252 +0100\n'
        + '@@ -2,8 +2,8 @@\n'
        + ' line2\n'
        + ' line3\n'
        + ' line4\n'
        + '+line5\n'
        + ' line6\n'
        + ' line7\n'
        + ' line8\n'
        + '-line9\n'
        + ' line10\n',

        {fuzzFactor: 1}
      )).to.equal(false);

      // 3 changed context lines, but fuzzFactor of 2
      expect(applyPatch(
        'line1\n'
        + 'lineTWO\n'
        + 'lineTHREE\n'
        + 'line4\n'
        + 'line6\n'
        + 'line7\n'
        + 'lineEIGHT\n'
        + 'line9\n'
        + 'line10\n',

        '--- foo.txt\t2024-07-19 09:58:02.489059795 +0100\n'
        + '+++ bar.txt\t2024-07-19 09:58:24.768153252 +0100\n'
        + '@@ -2,8 +2,8 @@\n'
        + ' line2\n'
        + ' line3\n'
        + ' line4\n'
        + '+line5\n'
        + ' line6\n'
        + ' line7\n'
        + ' line8\n'
        + '-line9\n'
        + ' line10\n',

        {fuzzFactor: 2}
      )).to.equal(false);

      // 3 total changes, fuzzFactor 2
      expect(applyPatch(
        'line1\n'
        + 'line2\n'
        + 'line2.5\n'
        + 'lineTHREE\n'
        + 'line4\n'
        + 'line6\n'
        + 'line7\n'
        + 'line9\n'
        + 'line10\n',

        '--- foo.txt\t2024-07-19 09:58:02.489059795 +0100\n'
        + '+++ bar.txt\t2024-07-19 09:58:24.768153252 +0100\n'
        + '@@ -2,8 +2,8 @@\n'
        + ' line2\n'
        + ' line3\n'
        + ' line4\n'
        + '+line5\n'
        + ' line6\n'
        + ' line7\n'
        + ' line8\n'
        + '-line9\n'
        + ' line10\n',

        {fuzzFactor: 2}
      )).to.equal(false);
    });

    it('should adjust where it starts looking to apply the hunk based on offsets of prior hunks', function() {
      const patch = '--- foo.txt\t2024-07-19 12:28:25.056182029 +0100\n' +
        '+++ bar.txt\t2024-07-19 12:28:13.036639136 +0100\n' +
        '@@ -9,7 +9,6 @@\n' +
        ' 1 2 3 introductory text\n' +
        ' Baa oink moo introductory text\n' +
        ' Probably enough introductory text\n' +
        '-Incy wincy mincy introductory text\n' +
        ' \n' +
        ' Three repeated verses:\n' +
        ' \n' +
        '@@ -28,7 +27,7 @@\n' +
        ' The wind came along and blew them in again\n' +
        ' Poor old Michael Finnegan, begin again\n' +
        ' \n' +
        '-There was an old man named Michael Finnegan\n' +
        '+There was an old man named Bob\n' +
        ' He had whiskers on his chinnegan\n' +
        ' The wind came along and blew them in again\n' +
        ' Poor old Michael Finnegan, begin again\n';


      // First we try applying the text to the original text I used to generate the patch.
      // The patch was generated by modifying the fourth of the six occurrences of the repeated
      // verse, and that's what we should see when we apply it...
      expect(applyPatch(
        'Bla bla bla introductory text\n' +
        'Foo bar baz introductory text\n' +
        'Fworble worble glorble introductory text\n' +
        'Need to be at least 6 lines of introductory text\n' +
        'Jingle jangle jungle introductory text\n' +
        'Horgle worgle borgle introductory text\n' +
        'Wiggly jiggly piggly introductory text\n' +
        'A B C introductory text\n' +
        '1 2 3 introductory text\n' +
        'Baa oink moo introductory text\n' +
        'Probably enough introductory text\n' +
        'Incy wincy mincy introductory text\n' +
        '\n' +
        'Three repeated verses:\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n',

        patch
      )).to.equal(
        'Bla bla bla introductory text\n' +
        'Foo bar baz introductory text\n' +
        'Fworble worble glorble introductory text\n' +
        'Need to be at least 6 lines of introductory text\n' +
        'Jingle jangle jungle introductory text\n' +
        'Horgle worgle borgle introductory text\n' +
        'Wiggly jiggly piggly introductory text\n' +
        'A B C introductory text\n' +
        '1 2 3 introductory text\n' +
        'Baa oink moo introductory text\n' +
        'Probably enough introductory text\n' +
        '\n' +
        'Three repeated verses:\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Bob\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n'
      );

      // But what if we apply the patch to a source file where the first 5 lines are deleted?
      // Then we expect applyPatch to still modify the fourth occurrence of the repeated verse,
      // NOT the fifth (which is now the one at the line number indicated by the hunk header). This
      // is because it should be able to tell when it applied the previous hunk that 5 lines at the
      // beginning of the file had been deleted, and to adjust where it tries to apply the second
      // hunk accordingly.
      expect(applyPatch(
        'Horgle worgle borgle introductory text\n' +
        'Wiggly jiggly piggly introductory text\n' +
        'A B C introductory text\n' +
        '1 2 3 introductory text\n' +
        'Baa oink moo introductory text\n' +
        'Probably enough introductory text\n' +
        'Incy wincy mincy introductory text\n' +
        '\n' +
        'Three repeated verses:\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n',

        patch
      )).to.equal(
        'Horgle worgle borgle introductory text\n' +
        'Wiggly jiggly piggly introductory text\n' +
        'A B C introductory text\n' +
        '1 2 3 introductory text\n' +
        'Baa oink moo introductory text\n' +
        'Probably enough introductory text\n' +
        '\n' +
        'Three repeated verses:\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Bob\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n'
      );

      // What if we instead ADD five lines? Same thing - we still expect verse 4 to be the one
      // changed
      expect(applyPatch(
        'line1\n' +
        'line2\n' +
        'line3\n' +
        'line4\n' +
        'line5\n' +
        'Bla bla bla introductory text\n' +
        'Foo bar baz introductory text\n' +
        'Fworble worble glorble introductory text\n' +
        'Need to be at least 6 lines of introductory text\n' +
        'Jingle jangle jungle introductory text\n' +
        'Horgle worgle borgle introductory text\n' +
        'Wiggly jiggly piggly introductory text\n' +
        'A B C introductory text\n' +
        '1 2 3 introductory text\n' +
        'Baa oink moo introductory text\n' +
        'Probably enough introductory text\n' +
        'Incy wincy mincy introductory text\n' +
        '\n' +
        'Three repeated verses:\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n',

        patch
      )).to.equal(
        'line1\n' +
        'line2\n' +
        'line3\n' +
        'line4\n' +
        'line5\n' +
        'Bla bla bla introductory text\n' +
        'Foo bar baz introductory text\n' +
        'Fworble worble glorble introductory text\n' +
        'Need to be at least 6 lines of introductory text\n' +
        'Jingle jangle jungle introductory text\n' +
        'Horgle worgle borgle introductory text\n' +
        'Wiggly jiggly piggly introductory text\n' +
        'A B C introductory text\n' +
        '1 2 3 introductory text\n' +
        'Baa oink moo introductory text\n' +
        'Probably enough introductory text\n' +
        '\n' +
        'Three repeated verses:\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Bob\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n' +
        '\n' +
        'There was an old man named Michael Finnegan\n' +
        'He had whiskers on his chinnegan\n' +
        'The wind came along and blew them in again\n' +
        'Poor old Michael Finnegan, begin again\n'
      );
    });

    it('should succeed when hunk needs a negative offset', function() {
      expect(applyPatch(
          'line1\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -3,2 +3,3 @@\n'
          + ' line1\n'
          + '+line2\n'
          + ' line3\n'))
        .to.equal(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n');
    });

    it('can handle an insertion before the first line', function() {
      expect(applyPatch(
          'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,2 +1,3 @@\n'
          + '+line1\n'
          + ' line2\n'
          + ' line3\n'))
        .to.equal(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n');
    });

    it('can handle an insertion after the first line', function() {
      expect(applyPatch(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line4\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -3,2 +3,3 @@\n'
          + ' line3\n'
          + ' line4\n'
          + '+line5\n'))
        .to.equal(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n');
    });

    it('should succeed when hunk needs a positive offset', function() {
      expect(applyPatch(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line5\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,2 +1,3 @@\n'
          + ' line3\n'
          + '+line4\n'
          + ' line5\n'))
        .to.equal(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n');
    });

    it('should succeed when 1st hunk specifies invalid newStart', function() {
      expect(applyPatch(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line5\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,2 +2,3 @@\n'
          + ' line3\n'
          + '+line4\n'
          + ' line5\n'))
        .to.equal(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n');
    });

    it('should succeed when 2nd hunk specifies invalid newStart', function() {
      expect(applyPatch(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line5\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,3 +1,2 @@\n'
          + ' line1\n'
          + '-line2\n'
          + ' line3\n'
          + '@@ -3,2 +3,3 @@\n'
          + ' line3\n'
          + '+line4\n'
          + ' line5\n'))
        .to.equal(
          'line1\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n');
    });

    it('should create a file', function() {
      expect(applyPatch('',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -0,0 +1,4 @@\n'
          + '+line1\n'
          + '+line2\n'
          + '+line3\n'
          + '+line4\n'))
        .to.equal(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line4\n');
    });

    it('should erase a file', function() {
      expect(applyPatch(
          'line1\n'
          + 'line2\n'
          + 'line3\n'
          + 'line4\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,4 +0,0 @@\n'
          + '-line1\n'
          + '-line2\n'
          + '-line3\n'
          + '-line4\n'))
        .to.equal('');
    });

    it('should allow custom line comparison', function() {
      expect(applyPatch(
          'line2\n'
          + 'line2\n'
          + 'line5\n',

          '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,3 +1,4 @@\n'
          + ' line2\n'
          + ' line3\n'
          + '+line4\n'
          + ' line5\n',
          {
            compareLine(lineNumber, line, operation, patchContent) {
              expect(lineNumber).to.be.a('number');
              if (lineNumber === 2) {
                expect(line).to.equal('line2');
                expect(operation).to.equal(' ');
                expect(patchContent).to.equal('line3');
              }

              return true;
            }
          }))
        .to.equal(
          'line2\n'
          + 'line2\n'
          + 'line4\n'
          + 'line5\n');
    });

    it('should work with unicode newline characters', function() {
      const oldtext = 'AAAAAAAAAAAAAAAA\n\n';
      const newtext = 'AAAAAAAAAAAAAAAA\nBBBBBB' + String.fromCharCode(0x2028) + '\nCCCCCCCCCCCCCCCCCC\n\n';

      const diffed = createPatch('test', oldtext, newtext);
      expect(applyPatch(oldtext, diffed)).to.equal(newtext);
    });

    it('handle empty text', function() {
      const oldtext = '';
      const newtext = 'asdasd\n';

      const diffed = createPatch('test', oldtext, newtext);
      expect(applyPatch(oldtext, diffed)).to.equal(newtext);
    });

    it('handle two common text', function() {
      const oldtext = 's';
      const newtext = 'sdfsdf\n';
      const diffed = createPatch('test', oldtext, newtext);
      expect(applyPatch(oldtext, diffed)).to.equal(newtext);
    });

    it('should accept structured patches', function() {
      const oldContent = [
        'line1',
        'line2',
        ''
      ].join('\n');
      const newContent = [
        'line1',
        'line02'
      ].join('\n');
      const patch = structuredPatch('test.txt', 'test.txt', oldContent, newContent);

      expect(applyPatch(oldContent, patch)).to.equal(newContent);
    });

    // Regression test based on bug https://github.com/kpdecker/jsdiff/issues/177
    it('should correctly apply a patch that truncates an entire file', function() {
      const patch = parsePatch(
        '===================================================================\n'
        + '--- index.js\n'
        + '+++ index.js\n'
        + '@@ -1,3 +1,0 @@\n'
        + '-this\n'
        + '-\n'
        + '-tos\n'
        + '\\ No newline at end of file\n'
      );
      const fileContents = 'this\n\ntos';

      expect(applyPatch(fileContents, patch))
        .to.equal('');
    });

    it('should automatically convert a patch with Unix file endings to Windows when patching a Windows file', () => {
      const oldFile = 'foo\r\nbar\r\nbaz\r\nqux\r\n';
      const diffFile =
        'Index: testFileName\n'
        + '===================================================================\n'
        + '--- testFileName\tOld Header\n'
        + '+++ testFileName\tNew Header\n'
        + '@@ -2,2 +2,3 @@\n'
        + '-bar\n'
        + '-baz\n'
        + '+new\n'
        + '+two\n'
        + '+three\n';

      expect(applyPatch(oldFile, diffFile)).to.equal('foo\r\nnew\r\ntwo\r\nthree\r\nqux\r\n');
    });

    it('should automatically convert a patch with Windows file endings to Unix when patching a Unix file', () => {
      const oldFile = 'foo\nbar\nbaz\nqux\n';
      const diffFile =
        'Index: testFileName\r\n'
        + '===================================================================\r\n'
        + '--- testFileName\tOld Header\r\n'
        + '+++ testFileName\tNew Header\r\n'
        + '@@ -2,2 +2,3 @@\r\n'
        + '-bar\r\n'
        + '-baz\r\n'
        + '+new\r\n'
        + '+two\r\n'
        + '+three\r\n';

      expect(applyPatch(oldFile, diffFile)).to.equal('foo\nnew\ntwo\nthree\nqux\n');
    });

    it('should leave line endings in the patch alone if the target file has mixed file endings, even if this means the patch does not apply', () => {
      const oldFile1 = 'foo\r\nbar\nbaz\nqux\n';
      const oldFile2 = 'foo\nbar\r\nbaz\r\nqux\n';
      const diffFile =
        'Index: testFileName\r\n'
        + '===================================================================\r\n'
        + '--- testFileName\tOld Header\r\n'
        + '+++ testFileName\tNew Header\r\n'
        + '@@ -2,2 +2,3 @@\r\n'
        + '-bar\r\n'
        + '-baz\r\n'
        + '+new\r\n'
        + '+two\r\n'
        + '+three\r\n';

      expect(applyPatch(oldFile1, diffFile)).to.equal(false);
      expect(applyPatch(oldFile2, diffFile)).to.equal('foo\nnew\r\ntwo\r\nthree\r\nqux\n');
    });

    it('should leave patch file endings alone if autoConvertLineEndings=false', () => {
      const oldFile = 'foo\r\nbar\r\nbaz\r\nqux\r\n';
      const diffFile =
        'Index: testFileName\n'
        + '===================================================================\n'
        + '--- testFileName\tOld Header\n'
        + '+++ testFileName\tNew Header\n'
        + '@@ -2,2 +2,3 @@\n'
        + '-bar\n'
        + '-baz\n'
        + '+new\n'
        + '+two\n'
        + '+three\n';

      expect(applyPatch(oldFile, diffFile, {autoConvertLineEndings: false})).to.equal(false);
    });

    it('fails if asked to remove a non-existent trailing newline with fuzzFactor 0', () => {
      const oldFile = 'foo\nbar\nbaz\nqux';
      const diffFile =
        'Index: bla\n'
        + '===================================================================\n'
        + '--- bla\tOld Header\n'
        + '+++ bla\tNew Header\n'
        + '@@ -4,1 +4,1 @@\n'
        + '-qux\n'
        + '+qux\n'
        + '\\ No newline at end of file\n';

      expect(applyPatch(oldFile, diffFile)).to.equal(false);
    });

    it('fails if asked to add an EOF newline, with fuzzFactor 0, when one already exists', () => {
      const oldFile = 'foo\nbar\nbaz\nqux\n';
      const diffFile =
        'Index: bla\n'
        + '===================================================================\n'
        + '--- bla\tOld Header\n'
        + '+++ bla\tNew Header\n'
        + '@@ -4,1 +4,1 @@\n'
        + '-qux\n'
        + '\\ No newline at end of file\n'
        + '+qux\n';

      expect(applyPatch(oldFile, diffFile)).to.equal(false);
    });

    it('ignores being asked to remove a non-existent trailing newline if fuzzFactor >0', () => {
      const oldFile = 'foo\nbar\nbaz\nqux';
      const diffFile =
        'Index: bla\n'
        + '===================================================================\n'
        + '--- bla\tOld Header\n'
        + '+++ bla\tNew Header\n'
        + '@@ -4,1 +4,1 @@\n'
        + '-qux\n'
        + '+qux\n'
        + '\\ No newline at end of file\n';

      expect(applyPatch(oldFile, diffFile, {fuzzFactor: 1})).to.equal(oldFile);
    });

    it('ignores being asked to add an EOF newline when one already exists if fuzzFactor>0', () => {
      const oldFile = 'foo\nbar\nbaz\nqux\n';
      const diffFile =
        'Index: bla\n'
        + '===================================================================\n'
        + '--- bla\tOld Header\n'
        + '+++ bla\tNew Header\n'
        + '@@ -4,1 +4,1 @@\n'
        + '-qux\n'
        + '\\ No newline at end of file\n'
        + '+qux\n';

      expect(applyPatch(oldFile, diffFile, {fuzzFactor: 1})).to.equal(oldFile);
    });

    describe('when the last line is changed but both old & new version have no trailing newline...', () => {
      const diffFile = 'Index: file.txt\n' +
        '===================================================================\n' +
        '--- file.txt\n' +
        '+++ file.txt\n' +
        '@@ -1,4 +1,4 @@\n' +
        ' foo\n' +
        ' bar\n' +
        ' baz\n' +
        '-banana\n' +
        '\\ No newline at end of file\n' +
        '+babaco\n' +
        '\\ No newline at end of file\n';

      it('correctly applies the patch to the original source file', () => {
        const oldFile = 'foo\nbar\nbaz\nbanana';
        expect(applyPatch(oldFile, diffFile)).to.equal('foo\nbar\nbaz\nbabaco');
      });

      it('fails if fuzzFactor=0 and the source file has an unexpected trailing newline', () => {
        const oldFile = 'foo\nbar\nbaz\nbanana\n';
        expect(applyPatch(oldFile, diffFile)).to.equal(false);
      });

      it('ignores an unexpected trailing newline if fuzzFactor > 0', () => {
        const oldFile = 'foo\nbar\nbaz\nbanana\n';
        expect(applyPatch(oldFile, diffFile, {fuzzFactor: 1})).to.equal('foo\nbar\nbaz\nbabaco\n');
      });

      it("ignores extra lines, even with fuzzFactor = 0, as long as there's no newline at EOF", () => {
        const oldFile = 'foo\nbar\nbaz\nbanana\nqux';
        expect(applyPatch(oldFile, diffFile)).to.equal('foo\nbar\nbaz\nbabaco\nqux');
      });
    });

    it('rejects negative or non-integer fuzz factors', () => {
      expect(() => {
        applyPatch(
          'line2\n'
          + 'line3\n'
          + 'line5\n',

          'Index: test\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,3 +1,4 @@\n'
          + ' line2\n'
          + ' line3\n'
          + '+line4\n'
          + ' line5\n',

          {fuzzFactor: -1}
        );
      }).to['throw']('fuzzFactor must be a non-negative integer');

      expect(() => {
        applyPatch(
          'line2\n'
          + 'line3\n'
          + 'line5\n',

          'Index: test\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,3 +1,4 @@\n'
          + ' line2\n'
          + ' line3\n'
          + '+line4\n'
          + ' line5\n',

          {fuzzFactor: 1.5}
        );
      }).to['throw']('fuzzFactor must be a non-negative integer');
    });
  });

  describe('#applyPatches', function() {
    const patch =
          'Index: test\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,3 +1,4 @@\n'
          + ' line2\n'
          + ' line3\n'
          + '+line4\n'
          + ' line5\n'
          + 'Index: test2\n'
          + '===================================================================\n'
          + '--- test\theader1\n'
          + '+++ test\theader2\n'
          + '@@ -1,3 +1,4 @@\n'
          + ' foo2\n'
          + ' foo3\n'
          + '+foo4\n'
          + ' foo5\n';
    const contents = {
      test:
          'line2\n'
          + 'line3\n'
          + 'line5\n',
      test2:
          'foo2\n'
          + 'foo3\n'
          + 'foo5\n'
    };
    const expected = {
      test:
          'line2\n'
          + 'line3\n'
          + 'line4\n'
          + 'line5\n',
      test2:
          'foo2\n'
          + 'foo3\n'
          + 'foo4\n'
          + 'foo5\n'
    };

    it('should handle errors on complete', function(done) {
      const expected = new Error();

      applyPatches(patch, {
        loadFile(index, callback) {
          callback(undefined, contents[index.index]);
        },
        patched(index, content, callback) {
          callback(expected);
        },
        complete(err) {
          expect(err)
              .to.equal(expected)
              .to.not.be.undefined;

          done();
        }
      });
    });

    it('should handle multiple files', function(done) {
      applyPatches(patch, {
        loadFile(index, callback) {
          callback(undefined, contents[index.index]);
        },
        patched(index, content, callback) {
          expect(content)
              .to.equal(expected[index.index])
              .to.not.be.undefined;

          callback();
        },
        complete: done
      });
    });
    it('should handle parsed patches', function(done) {
      applyPatches(parsePatch(patch), {
        loadFile(index, callback) {
          callback(undefined, contents[index.index]);
        },
        patched(index, content, callback) {
          expect(content)
              .to.equal(expected[index.index])
              .to.not.be.undefined;

          callback();
        },
        complete: done
      });
    });
    it('should propagate errors', function(done) {
      applyPatches(patch, {
        loadFile(index, callback) {
          callback(new Error('foo'));
        },
        complete(err) {
          expect(err).to.match(/foo/);
          done();
        }
      });
    });
    it('should handle patches without Index', function(done) {
      const patch =
            '===================================================================\n'
            + '--- test\theader1\n'
            + '+++ test\theader2\n'
            + '@@ -1,3 +1,4 @@\n'
            + ' line2\n'
            + ' line3\n'
            + '+line4\n'
            + ' line5\n'
            + '===================================================================\n'
            + '--- test2\theader1\n'
            + '+++ test2\theader2\n'
            + '@@ -1,3 +1,4 @@\n'
            + ' foo2\n'
            + ' foo3\n'
            + '+foo4\n'
            + ' foo5\n';

      applyPatches(patch, {
        loadFile(index, callback) {
          callback(undefined, contents[index.oldFileName]);
        },
        patched(index, content, callback) {
          expect(content)
              .to.equal(expected[index.newFileName])
              .to.not.be.undefined;

          callback();
        },
        complete: done
      });
    });

    it('should handle file names containing spaces', done => {
      const patch =
        `===================================================================
--- test file\theader1
+++ test file\theader2
@@ -1,2 +1,3 @@
 line1
+line2
 line3
===================================================================
--- test file 2\theader1
+++ test file 2\theader2
@@ -1,2 +1,3 @@
 foo1
+foo2
 foo3
`;

      const contents = {
        'test file':
          `line1
line3
`,
        'test file 2':
          `foo1
foo3
`
      };

      const expected = {
        'test file':
          `line1
line2
line3
`,
        'test file 2':
          `foo1
foo2
foo3
`
      };

      applyPatches(patch, {
        loadFile(index, callback) {
          callback(undefined, contents[index.oldFileName]);
        },
        patched(index, content, callback) {
          expect(content)
              .to.equal(expected[index.newFileName])
              .to.not.be.undefined;

          callback();
        },
        complete: done
      });
    });
  });
});
