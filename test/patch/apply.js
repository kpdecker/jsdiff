import {applyPatch} from '../../lib/patch/apply';
import {parsePatch} from '../../lib/patch/parse';
import {createPatch} from '../../lib/patch/create';

import {expect} from 'chai';

describe('patch/apply', function() {
  describe('#applyPatch', function() {
    it('should accept parsed patches', function() {
      let patch = parsePatch(
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
    });

    it('should apply patches', function() {
      // Create patch
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
      let diffFile =
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

      diffFile =
        'Index: testFileName\n'
        + '===================================================================\n'
        + '--- testFileName\tOld Header\n'
        + '+++ testFileName\tNew Header\n';
      expect(applyPatch(oldFile, diffFile)).to.equal(oldFile);
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

    it('should work with unicode newline characters', function() {
      const oldtext = 'AAAAAAAAAAAAAAAA\n\n';
      const newtext = 'AAAAAAAAAAAAAAAA\nBBBBBB' + String.fromCharCode(0x2028) + '\nCCCCCCCCCCCCCCCCCC\n\n';

      const diffed = createPatch('test', oldtext, newtext);
      expect(applyPatch(oldtext, diffed)).to.equal(newtext);
    });
  });
});
