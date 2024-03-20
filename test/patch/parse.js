import {parsePatch} from '../../lib/patch/parse';
import {createPatch} from '../../lib/patch/create';

import {expect} from 'chai';

describe('patch/parse', function() {
  describe('#parse', function() {
    it('should parse basic patches', function() {
      expect(parsePatch(
`@@ -1,3 +1,4 @@
 line2
 line3
+line4
 line5`))
        .to.eql([{
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line2',
                ' line3',
                '+line4',
                ' line5'
              ],
              linedelimiters: [
                '\n',
                '\n',
                '\n',
                '\n'
              ]
            }
          ]
        }]);
    });
    it('should parse single line hunks', function() {
      expect(parsePatch(
`@@ -1 +1 @@
-line3
+line4`))
        .to.eql([{
          hunks: [
            {
              oldStart: 1, oldLines: 1,
              newStart: 1, newLines: 1,
              lines: [
                '-line3',
                '+line4'
              ],
              linedelimiters: [
                '\n',
                '\n'
              ]
            }
          ]
        }]);
    });
    it('should parse multiple hunks', function() {
      expect(parsePatch(
`@@ -1,3 +1,4 @@
 line2
 line3
+line4
 line5
@@ -4,3 +1,4 @@
 line2
 line3
-line4
 line5`))
        .to.eql([{
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line2',
                ' line3',
                '+line4',
                ' line5'
              ],
              linedelimiters: [
                '\n',
                '\n',
                '\n',
                '\n'
              ]
            },
            {
              oldStart: 4, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line2',
                ' line3',
                '-line4',
                ' line5'
              ],
              linedelimiters: [
                '\n',
                '\n',
                '\n',
                '\n'
              ]
            }
          ]
        }]);
    });
    it('should parse single index patches', function() {
      expect(parsePatch(
`Index: test
===================================================================
--- from\theader1
+++ to\theader2
@@ -1,3 +1,4 @@
 line2
 line3
+line4
 line5`))
        .to.eql([{
          index: 'test',
          oldFileName: 'from',
          oldHeader: 'header1',
          newFileName: 'to',
          newHeader: 'header2',
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line2',
                ' line3',
                '+line4',
                ' line5'
              ],
              linedelimiters: [
                '\n',
                '\n',
                '\n',
                '\n'
              ]
            }
          ]
        }]);
    });
    it('should parse multiple index files', function() {
      expect(parsePatch(
`Index: test
===================================================================
--- from\theader1
+++ to\theader2
@@ -1,3 +1,4 @@
 line2
 line3
+line4
 line5
Index: test2
===================================================================
--- from\theader1
+++ to\theader2
@@ -1,3 +1,4 @@
 line2
 line3
+line4
 line5`))
        .to.eql([{
          index: 'test',
          oldFileName: 'from',
          oldHeader: 'header1',
          newFileName: 'to',
          newHeader: 'header2',
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line2',
                ' line3',
                '+line4',
                ' line5'
              ],
              linedelimiters: [
                '\n',
                '\n',
                '\n',
                '\n'
              ]
            }
          ]
        }, {
          index: 'test2',
          oldFileName: 'from',
          oldHeader: 'header1',
          newFileName: 'to',
          newHeader: 'header2',
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line2',
                ' line3',
                '+line4',
                ' line5'
              ],
              linedelimiters: [
                '\n',
                '\n',
                '\n',
                '\n'
              ]
            }
          ]
        }]);
    });

    it('should parse multiple files without the Index line', function() {
      expect(parsePatch(
`--- from\theader1
+++ to\theader2
@@ -1,3 +1,4 @@
 line2
 line3
+line4
 line5
--- from\theader1
+++ to\theader2
@@ -1,3 +1,4 @@
 line2
 line3
+line4
 line5`))
        .to.eql([{
          oldFileName: 'from',
          oldHeader: 'header1',
          newFileName: 'to',
          newHeader: 'header2',
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line2',
                ' line3',
                '+line4',
                ' line5'
              ],
              linedelimiters: [
                '\n',
                '\n',
                '\n',
                '\n'
              ]
            }
          ]
        }, {
          oldFileName: 'from',
          oldHeader: 'header1',
          newFileName: 'to',
          newHeader: 'header2',
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line2',
                ' line3',
                '+line4',
                ' line5'
              ],
              linedelimiters: [
                '\n',
                '\n',
                '\n',
                '\n'
              ]
            }
          ]
        }]);
    });

 it('should parse patches with filenames having quotes and back slashes', function() {
      expect(parsePatch(
`Index: test
===================================================================
--- "from\\\\a\\\\file\\\\with\\\\quotes\\\\and\\\\backslash"\theader1
+++ "to\\\\a\\\\file\\\\with\\\\quotes\\\\and\\\\backslash"\theader2
@@ -1,3 +1,4 @@
 line2
 line3
+line4
 line5`))
        .to.eql([{
          index: 'test',
          oldFileName: 'from\\a\\file\\with\\quotes\\and\\backslash',
          oldHeader: 'header1',
          newFileName: 'to\\a\\file\\with\\quotes\\and\\backslash',
          newHeader: 'header2',
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line2',
                ' line3',
                '+line4',
                ' line5'
              ],
              linedelimiters: [
                '\n',
                '\n',
                '\n',
                '\n'
              ]
            }
          ]
        }]);
    });

    it('should note added EOFNL', function() {
      expect(parsePatch(
`@@ -1,3 +1,4 @@
-line5
\\ No newline at end of file`))
        .to.eql([{
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                '-line5',
                '\\ No newline at end of file'
              ],
              linedelimiters: [
                '\n',
                '\n'
              ]
            }
          ]
        }]);
    });
    it('should note removed EOFNL', function() {
      expect(parsePatch(
`@@ -1,3 +1,4 @@
+line5
\\ No newline at end of file`))
        .to.eql([{
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                '+line5',
                '\\ No newline at end of file'
              ],
              linedelimiters: [
                '\n',
                '\n'
              ]
            }
          ]
        }]);
    });
    it('should ignore context no EOFNL', function() {
      expect(parsePatch(
`@@ -1,3 +1,4 @@
+line4
 line5
\\ No newline at end of file`))
        .to.eql([{
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                '+line4',
                ' line5',
                '\\ No newline at end of file'
              ],
              linedelimiters: [
                '\n',
                '\n',
                '\n'
              ]
            }
          ]
        }]);
    });

    it('should perform sanity checks on line numbers', function() {
      parsePatch('@@ -1 +1 @@');

      expect(function() {
        parsePatch('@@ -1 +1,4 @@');
      }).to['throw']('Added line count did not match for hunk at line 1');
      expect(function() {
        parsePatch('@@ -1,4 +1 @@');
      }).to['throw']('Removed line count did not match for hunk at line 1');
    });

    it('should not throw on invalid input', function() {
      expect(parsePatch('blit\nblat\nIndex: foo\nfoo'))
          .to.eql([{
            hunks: [],
            index: 'foo'
          }]);
    });
    it('should throw on invalid input', function() {
      expect(function() {
        parsePatch('Index: foo\n+++ bar\nblah');
      }).to['throw'](/Unknown line 3 "blah"/);
    });

    it('should handle OOM case', function() {
      parsePatch('Index: \n===================================================================\n--- \n+++ \n@@ -1,1 +1,2 @@\n-1\n\\ No newline at end of file\n+1\n+2\n');
    });

    it('should treat vertical tabs like ordinary characters', function() {
      // Patch below was generated as follows:
      // 1. From Node, run:
      //      fs.writeFileSync("foo", "foo\nbar\vbar\nbaz\nqux")
      //      fs.writeFileSync("bar", "foo\nbarry\vbarry\nbaz\nqux")
      // 2. From shell, run:
      //      diff -u foo bar > diff.txt
      // 3. From Node, run
      //      fs.readFileSync("diff.txt")
      //    and copy the string literal you get.
      // This patch illustrates how the Unix `diff` and `patch` tools handle
      // characters like vertical tabs - namely, they simply treat them as
      // ordinary characters, NOT as line breaks. JsDiff used to treat them as
      // line breaks but this breaks its parsing of patches like this one; this
      // test was added to demonstrate the brokenness and prevent us from
      // reintroducing it.
      const patch = '--- foo\t2023-12-20 16:11:20.908225554 +0000\n' +
      '+++ bar\t2023-12-20 16:11:34.391473579 +0000\n' +
      '@@ -1,4 +1,4 @@\n' +
      ' foo\n' +
      '-bar\x0Bbar\n' +
      '+barry\x0Bbarry\n' +
      ' baz\n' +
      ' qux\n' +
      '\\ No newline at end of file\n';

      expect(parsePatch(patch)).to.eql([
        {
          oldFileName: 'foo',
          oldHeader: '2023-12-20 16:11:20.908225554 +0000',
          newFileName: 'bar',
          newHeader: '2023-12-20 16:11:34.391473579 +0000',
          hunks: [
            {
              oldStart: 1,
              oldLines: 4,
              newStart: 1,
              newLines: 4,
              lines: [
                ' foo',
                '-bar\x0Bbar',
                '+barry\x0Bbarry',
                ' baz',
                ' qux',
                '\\ No newline at end of file'
              ],
              linedelimiters: [ '\n', '\n', '\n', '\n', '\n', '\n' ]
            }
          ]
        }
      ]);
    });

    it('should treat vertical tabs in a way consistent with createPatch', function() {
      // This is basically the same as the test above, but this time we create
      // the patch USING JsDiff instead of testing one created with Unix diff
      const patch = createPatch('foo', 'foo\nbar\vbar\nbaz\nqux', 'foo\nbarry\vbarry\nbaz\nqux');

      expect(parsePatch(patch)).to.eql([
        {
          oldFileName: 'foo',
          oldHeader: '',
          newFileName: 'foo',
          newHeader: '',
          index: 'foo',
          hunks: [
            {
              oldStart: 1,
              oldLines: 4,
              newStart: 1,
              newLines: 4,
              lines: [
                ' foo',
                '-bar\x0Bbar',
                '+barry\x0Bbarry',
                ' baz',
                ' qux',
                '\\ No newline at end of file'
              ],
              linedelimiters: [ '\n', '\n', '\n', '\n', '\n', '\n' ]
            }
          ]
        }
      ]);
    });
  });
});
