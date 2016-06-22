import {applyPatch, applyPatches} from '../../lib/patch/apply';
import {parsePatch} from '../../lib/patch/parse';
import {createPatch} from '../../lib/patch/create';

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
    it('should succeed within fuzz factor', function() {
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
          {fuzzFactor: 1}))
        .to.equal(
          'line2\n'
          + 'line2\n'
          + 'line4\n'
          + 'line5\n');
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

    it('should handle multiple files', function(done) {
      applyPatches(patch, {
        loadFile(index, callback) {
          callback(undefined, contents[index.index]);
        },
        patched(index, content) {
          expect(content)
              .to.equal(expected[index.index])
              .to.not.be.undefined;
        },
        complete: done
      });
    });
    it('should handle parsed patches', function(done) {
      applyPatches(parsePatch(patch), {
        loadFile(index, callback) {
          callback(undefined, contents[index.index]);
        },
        patched(index, content) {
          expect(content)
              .to.equal(expected[index.index])
              .to.not.be.undefined;
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
        patched(index, content) {
          expect(content)
              .to.equal(expected[index.newFileName])
              .to.not.be.undefined;
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
        patched(index, content) {
          expect(content)
              .to.equal(expected[index.newFileName])
              .to.not.be.undefined;
        },
        complete: done
      });
    });
  });
});
