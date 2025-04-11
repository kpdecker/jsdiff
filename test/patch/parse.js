import {parsePatch} from '../../libesm/patch/parse.js';
import {createPatch} from '../../libesm/patch/create.js';

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
@@ -4,4 +1,3 @@
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
              ]
            },
            {
              oldStart: 4, oldLines: 4,
              newStart: 1, newLines: 3,
              lines: [
                ' line2',
                ' line3',
                '-line4',
                ' line5'
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
              ]
            }
          ]
        }]);
    });

    it('should note added EOFNL', function() {
      expect(parsePatch(
`@@ -1,1 +0,0 @@
-line5
\\ No newline at end of file`))
        .to.eql([{
          hunks: [
            {
              oldStart: 1, oldLines: 1,
              newStart: 1, newLines: 0,
              lines: [
                '-line5',
                '\\ No newline at end of file'
              ]
            }
          ]
        }]);
    });
    it('should note removed EOFNL', function() {
      expect(parsePatch(
`@@ -0,0 +1 @@
+line5
\\ No newline at end of file`))
        .to.eql([{
          hunks: [
            {
              oldStart: 1, oldLines: 0,
              newStart: 1, newLines: 1,
              lines: [
                '+line5',
                '\\ No newline at end of file'
              ]
            }
          ]
        }]);
    });
    it('should ignore context no EOFNL', function() {
      expect(parsePatch(
`@@ -1 +1,2 @@
+line4
 line5
\\ No newline at end of file`))
        .to.eql([{
          hunks: [
            {
              oldStart: 1, oldLines: 1,
              newStart: 1, newLines: 2,
              lines: [
                '+line4',
                ' line5',
                '\\ No newline at end of file'
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
              ]
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
              ]
            }
          ]
        }
      ]);
    });

    it('should tolerate patches with extra trailing newlines after hunks', () => {
      // Regression test for https://github.com/kpdecker/jsdiff/issues/524
      // Not only are these considered valid by GNU patch, but jsdiff's own formatPatch method
      // emits patches like this, which jsdiff used to then be unable to parse!
      const patchStr = `--- foo\t2024-06-14 22:16:31.444276792 +0100
+++ bar\t2024-06-14 22:17:14.910611219 +0100
@@ -1,7 +1,7 @@
 first
 second
 third
-fourth
-fifth
+vierte
+fünfte
 sixth
 seventh

`;
      expect(parsePatch(patchStr)).to.eql([{
        oldFileName: 'foo',
        oldHeader: '2024-06-14 22:16:31.444276792 +0100',
        newFileName: 'bar',
        newHeader: '2024-06-14 22:17:14.910611219 +0100',
        hunks: [
          {
            oldStart: 1,
            oldLines: 7,
            newStart: 1,
            newLines: 7,
            lines: [
              ' first',
              ' second',
              ' third',
              '-fourth',
              '-fifth',
              '+vierte',
              '+fünfte',
              ' sixth',
              ' seventh'
            ]
          }
        ]
      }]);
    });

    it("shouldn't be caught out by removal/addition of lines starting with -- or ++", () => {
      // The patch below is a valid patch generated by diffing this file, foo:

      // first
      // second
      // third
      // -- bla
      // fifth
      // sixth

      // against this file, bar:

      // first
      // second
      // third
      // ++ bla
      // fifth
      // sixth
      // seventh

      // with the command `diff -u0 foo bar`. (All lines in `foo` and `bar` have no leading
      // whitespace and a trailing LF.)

      // This is effectively an adversarial example meant to catch out a parser that tries to
      // detect the end of a file in a multi-file diff by looking for lines starting with '---',
      // '+++', and then '@@'. jsdiff used to do this. However, as this example illustrates, it is
      // unsound, since the '---' and '+++' lines might actually just represent the deletion and
      // insertion of lines starting with '--' and '++'. The only way to disambiguate these
      // interpretations is to heed the line counts in the @@ hunk headers; you *cannot* reliably
      // determine where a hunk or file ends in a unified diff patch without heeding those line
      // counts.

      const patchStr = `--- foo\t2024-06-14 21:57:04.341065736 +0100
+++ bar\t2024-06-14 22:00:57.988080321 +0100
@@ -4 +4 @@
--- bla
+++ bla
@@ -6,0 +7 @@
+seventh
`;

      expect(parsePatch(patchStr)).to.eql([{
        oldFileName: 'foo',
        oldHeader: '2024-06-14 21:57:04.341065736 +0100',
        newFileName: 'bar',
        newHeader: '2024-06-14 22:00:57.988080321 +0100',
        hunks: [
          { oldStart: 4, oldLines: 1, newStart: 4, newLines: 1, lines: ['--- bla', '+++ bla'] },
          { oldStart: 7, oldLines: 0, newStart: 7, newLines: 1, lines: ['+seventh'] }
        ]
      }]);
    });

    it('should emit an error if a hunk contains an invalid line', () => {
      // Within a hunk, every line must either start with '+' (insertion), '-' (deletion),
      // ' ' (context line, i.e. not deleted nor inserted) or a backslash (for
      // '\\ No newline at end of file' lines). Seeing anything else before the end of the hunk is
      // an error.

      const patchStr = `Index: test
===================================================================
--- from\theader1
+++ to\theader2
@@ -1,3 +1,4 @@
 line2
line3
+line4
 line5`;

      // eslint-disable-next-line dot-notation
      expect(() => {parsePatch(patchStr);}).to.throw('Hunk at line 5 contained invalid line line3');
    });
  });
});
