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

    it('should parse the header format used by Mercurial', function() {
      // (At least, Mercurial is the only tool I could find that uses this
      // format. Claude was unable to suggest any other tool that would produce
      // this format, and I don't know of any either. See
      // https://claude.ai/share/51e202d0-9da0-4dfa-a4a4-d6c6b476b300.)
      //
      // Support for this got added by Kevin in commit:
      // 0c9dd6d0e622d8a32b441b45baa797a7e86a4c55
      //
      // I find it a bit odd that (at the time of adding this test) our header
      // parsing has special handling for Mercurial's diff format but does not
      // support Git's format (given Git is much more popular). I also find it
      // a bit odd that we discard the information in the header about what
      // revisions are being diffed and preserve only the filename (which is
      // available anyway via the lines below, and exposed by us in the
      // oldFileName and newFileName fields). But for now I am just trying to
      // document and test the current state of things.
      //
      // -- ExplodingCabbage

      // (Patch below was produced by running `hg diff -r 0 -r 1` in the
      // Mercurial repo for Mercurial itself.)
      const patchStr = `diff -r 9117c6561b0b -r 273ce12ad8f1 .hgignore
--- /dev/null	Thu Jan 01 00:00:00 1970 +0000
+++ b/.hgignore	Tue May 03 13:27:13 2005 -0800
@@ -0,0 +1,1 @@
+.*~
diff -r 9117c6561b0b -r 273ce12ad8f1 README
--- a/README	Tue May 03 13:16:10 2005 -0800
+++ b/README	Tue May 03 13:27:13 2005 -0800
@@ -69,6 +69,10 @@

 Network support (highly experimental):

+ # pull the self-hosting hg repo
+ foo$ hg init
+ foo$ hg merge http://selenic.com/hg/
+
  # export your .hg directory as a directory on your webserver
  foo$ ln -s .hg ~/public_html/hg-linux

@@ -76,5 +80,10 @@
  bar$ hg merge http://foo/~user/hg-linux

  This is just a proof of concept of grabbing byte ranges, and is not
- expected to perform well.
+ expected to perform well. Fixing this needs some pipelining to reduce
+ the number of round trips. See zsync for a similar approach.

+ Another approach which does perform well right now is to use rsync.
+ Simply rsync the remote repo to a read-only local copy and then do a
+ local pull.
+
`;

      const patchObj = parsePatch(patchStr);
      expect(patchObj).to.deep.equals([
        {
          // Parsed from line `diff -r 9117c6561b0b -r 273ce12ad8f1 .hgignore`:
          index: '.hgignore',
          // Parsed from line `--- /dev/null	Thu Jan 01 00:00:00 1970 +0000`:
          oldFileName: '/dev/null',
          oldHeader: 'Thu Jan 01 00:00:00 1970 +0000',
          // Parsed from line `+++ b/.hgignore	Tue May 03 13:27:13 2005 -0800`:
          newFileName: 'b/.hgignore',
          newHeader: 'Tue May 03 13:27:13 2005 -0800',
          hunks: [
            {
              oldStart: 1,
              oldLines: 0,
              newStart: 1,
              newLines: 1,
              lines: [
                '+.*~'
              ]
            }
          ]
        },
        {
          index: 'README',
          oldFileName: 'a/README',
          oldHeader: 'Tue May 03 13:16:10 2005 -0800',
          newFileName: 'b/README',
          newHeader: 'Tue May 03 13:27:13 2005 -0800',
          hunks: [
            {
              oldStart: 69,
              oldLines: 6,
              newStart: 69,
              newLines: 10,
              lines: [
                '',
                ' Network support (highly experimental):',
                '',
                '+ # pull the self-hosting hg repo',
                '+ foo$ hg init',
                '+ foo$ hg merge http://selenic.com/hg/',
                '+',
                '  # export your .hg directory as a directory on your webserver',
                '  foo$ ln -s .hg ~/public_html/hg-linux',
                ''
              ]
            },
            {
              oldStart: 76,
              oldLines: 5,
              newStart: 80,
              newLines: 10,
              lines: [
                '  bar$ hg merge http://foo/~user/hg-linux',
                '',
                '  This is just a proof of concept of grabbing byte ranges, and is not',
                '- expected to perform well.',
                '+ expected to perform well. Fixing this needs some pipelining to reduce',
                '+ the number of round trips. See zsync for a similar approach.',
                '',
                '+ Another approach which does perform well right now is to use rsync.',
                '+ Simply rsync the remote repo to a read-only local copy and then do a',
                '+ local pull.',
                '+'
              ]
            }
          ]
        }
      ]);
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

    it('should treat non-ASCII line break characters \\u2028 and \\u2029 like ordinary characters', () => {
      // Regression test for nasty denial-of-service vulnerability fixed by
      // https://github.com/kpdecker/jsdiff/pull/649
      const patch = 'Index: t\u2028e\u2028s\u2028t\n' +
      '--- f\u2028o\u2028o\t2023-12-20\u202816:11:20.908225554\u2028+0000\u2028\n' +
      '+++ b\u2028a\u2028r\t2023-12-20\u202816:11:34.391473579\u2028+0000\u2028\n' +
      '@@ -1,4 +1,4 @@\n' +
      ' foo\n' +
      '-bar\u2028bar\n' +
      '+barry\u2028barry\n' +
      ' baz\n' +
      ' qux\n' +
      '\\ No newline at end of file\n';
      expect(parsePatch(patch)).to.eql([
        {
          oldFileName: 'f\u2028o\u2028o',
          oldHeader: '2023-12-20\u202816:11:20.908225554\u2028+0000',
          newFileName: 'b\u2028a\u2028r',
          newHeader: '2023-12-20\u202816:11:34.391473579\u2028+0000',
          index: 't\u2028e\u2028s\u2028t',
          hunks: [
            {
              oldStart: 1,
              oldLines: 4,
              newStart: 1,
              newLines: 4,
              lines: [
                ' foo',
                '-bar\u2028bar',
                '+barry\u2028barry',
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

    it('should parse a single-file `diff --git` patch', function() {
      expect(parsePatch(
`diff --git a/file.txt b/file.txt
index abc1234..def5678 100644
--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,4 @@
 line1
 line2
+line3
 line4`))
        .to.eql([{
          oldFileName: 'a/file.txt',
          oldHeader: '',
          newFileName: 'b/file.txt',
          newHeader: '',
          isGit: true,
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line1',
                ' line2',
                '+line3',
                ' line4'
              ]
            }
          ]
        }]);
    });

    it('should parse a multi-file diff --git patch', function() {
      expect(parsePatch(
`diff --git a/file1.txt b/file1.txt
index abc1234..def5678 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,4 @@
 line1
 line2
+line3
 line4
diff --git a/file2.txt b/file2.txt
index 1234567..abcdef0 100644
--- a/file2.txt
+++ b/file2.txt
@@ -1,3 +1,4 @@
 lineA
 lineB
+lineC
 lineD`))
        .to.eql([{
          oldFileName: 'a/file1.txt',
          oldHeader: '',
          newFileName: 'b/file1.txt',
          newHeader: '',
          isGit: true,
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line1',
                ' line2',
                '+line3',
                ' line4'
              ]
            }
          ]
        }, {
          oldFileName: 'a/file2.txt',
          oldHeader: '',
          newFileName: 'b/file2.txt',
          newHeader: '',
          isGit: true,
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' lineA',
                ' lineB',
                '+lineC',
                ' lineD'
              ]
            }
          ]
        }]);
    });

    it('should parse a diff --git rename with no content change', function() {
      expect(parsePatch(
`diff --git a/README.md b/README-2.md
similarity index 100%
rename from README.md
rename to README-2.md`))
        .to.eql([{
          oldFileName: 'a/README.md',
          newFileName: 'b/README-2.md',
          isGit: true,
          hunks: [],
          isRename: true
        }]);
    });

    it('should parse a diff --git rename with content change', function() {
      expect(parsePatch(
`diff --git a/old-name.txt b/new-name.txt
similarity index 85%
rename from old-name.txt
rename to new-name.txt
index abc1234..def5678 100644
--- a/old-name.txt
+++ b/new-name.txt
@@ -1,3 +1,4 @@
 line1
 line2
+line3
 line4`))
        .to.eql([{
          oldFileName: 'a/old-name.txt',
          oldHeader: '',
          newFileName: 'b/new-name.txt',
          newHeader: '',
          isGit: true,
          isRename: true,
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line1',
                ' line2',
                '+line3',
                ' line4'
              ]
            }
          ]
        }]);
    });

    it('should parse a diff --git mode-only change', function() {
      expect(parsePatch(
`diff --git a/script.sh b/script.sh
old mode 100644
new mode 100755`))
        .to.eql([{
          oldFileName: 'a/script.sh',
          newFileName: 'b/script.sh',
          isGit: true,
          oldMode: '100644',
          newMode: '100755',
          hunks: []
        }]);
    });

    it('should parse a diff --git binary file change', function() {
      expect(parsePatch(
`diff --git a/image.png b/image.png
index abc1234..def5678 100644
Binary files a/image.png and b/image.png differ`))
        .to.eql([{
          oldFileName: 'a/image.png',
          newFileName: 'b/image.png',
          isGit: true,
          hunks: []
        }]);
    });

    it('should not lose files when a diff --git binary change is followed by a text change', function() {
      expect(parsePatch(
`diff --git a/file1.txt b/file1.txt
--- a/file1.txt
+++ b/file1.txt
@@ -1 +1 @@
-old
+new
diff --git a/image.png b/image.png
Binary files a/image.png and b/image.png differ
diff --git a/file3.txt b/file3.txt
--- a/file3.txt
+++ b/file3.txt
@@ -1 +1 @@
-foo
+bar`))
        .to.eql([{
          oldFileName: 'a/file1.txt',
          oldHeader: '',
          newFileName: 'b/file1.txt',
          newHeader: '',
          isGit: true,
          hunks: [
            {
              oldStart: 1, oldLines: 1,
              newStart: 1, newLines: 1,
              lines: ['-old', '+new']
            }
          ]
        }, {
          oldFileName: 'a/image.png',
          newFileName: 'b/image.png',
          isGit: true,
          hunks: []
        }, {
          oldFileName: 'a/file3.txt',
          oldHeader: '',
          newFileName: 'b/file3.txt',
          newHeader: '',
          isGit: true,
          hunks: [
            {
              oldStart: 1, oldLines: 1,
              newStart: 1, newLines: 1,
              lines: ['-foo', '+bar']
            }
          ]
        }]);
    });

    it('should not lose files when a diff --git mode-only change is in the middle', function() {
      expect(parsePatch(
`diff --git a/file1.txt b/file1.txt
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,4 @@
 line1
 line2
+line3
 line4
diff --git a/script.sh b/script.sh
old mode 100644
new mode 100755
diff --git a/file3.txt b/file3.txt
--- a/file3.txt
+++ b/file3.txt
@@ -1,2 +1,3 @@
 aaa
+bbb
 ccc`))
        .to.eql([{
          oldFileName: 'a/file1.txt',
          oldHeader: '',
          newFileName: 'b/file1.txt',
          newHeader: '',
          isGit: true,
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 4,
              lines: [
                ' line1',
                ' line2',
                '+line3',
                ' line4'
              ]
            }
          ]
        }, {
          oldFileName: 'a/script.sh',
          newFileName: 'b/script.sh',
          isGit: true,
          oldMode: '100644',
          newMode: '100755',
          hunks: []
        }, {
          oldFileName: 'a/file3.txt',
          oldHeader: '',
          newFileName: 'b/file3.txt',
          newHeader: '',
          isGit: true,
          hunks: [
            {
              oldStart: 1, oldLines: 2,
              newStart: 1, newLines: 3,
              lines: [
                ' aaa',
                '+bbb',
                ' ccc'
              ]
            }
          ]
        }]);
    });

    it('should parse a diff --git copy', function() {
      expect(parsePatch(
`diff --git a/original.txt b/copy.txt
similarity index 100%
copy from original.txt
copy to copy.txt`))
        .to.eql([{
          oldFileName: 'a/original.txt',
          newFileName: 'b/copy.txt',
          isGit: true,
          hunks: [],
          isCopy: true
        }]);
    });

    it('should parse a diff --git new file', function() {
      expect(parsePatch(
`diff --git a/newfile.txt b/newfile.txt
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/newfile.txt
@@ -0,0 +1,2 @@
+hello
+world`))
        .to.eql([{
          oldFileName: '/dev/null',
          oldHeader: '',
          newFileName: 'b/newfile.txt',
          newHeader: '',
          isGit: true,
          isCreate: true,
          newMode: '100644',
          hunks: [
            {
              oldStart: 1, oldLines: 0,
              newStart: 1, newLines: 2,
              lines: ['+hello', '+world']
            }
          ]
        }]);
    });

    it('should parse a diff --git deleted file', function() {
      expect(parsePatch(
`diff --git a/old.txt b/old.txt
deleted file mode 100644
index ce01362..0000000
--- a/old.txt
+++ /dev/null
@@ -1 +0,0 @@
-goodbye`))
        .to.eql([{
          oldFileName: 'a/old.txt',
          oldHeader: '',
          newFileName: '/dev/null',
          newHeader: '',
          isGit: true,
          isDelete: true,
          oldMode: '100644',
          hunks: [
            {
              oldStart: 1, oldLines: 1,
              newStart: 1, newLines: 0,
              lines: ['-goodbye']
            }
          ]
        }]);
    });

    it('should parse a diff --git empty file creation (no --- / +++ or hunks)', function() {
      expect(parsePatch(
`diff --git a/empty.txt b/empty.txt
new file mode 100644
index 0000000..e69de29`))
        .to.eql([{
          oldFileName: 'a/empty.txt',
          newFileName: 'b/empty.txt',
          isGit: true,
          isCreate: true,
          newMode: '100644',
          hunks: []
        }]);
    });

    it('should parse a diff --git empty file deletion (no --- / +++ or hunks)', function() {
      expect(parsePatch(
`diff --git a/empty.txt b/empty.txt
deleted file mode 100644
index e69de29..0000000`))
        .to.eql([{
          oldFileName: 'a/empty.txt',
          newFileName: 'b/empty.txt',
          isGit: true,
          isDelete: true,
          oldMode: '100644',
          hunks: []
        }]);
    });

    it('should parse diff --git with quoted filenames containing spaces', function() {
      expect(parsePatch(
`diff --git "a/file with spaces.txt" "b/file with spaces.txt"
index abc1234..def5678 100644
--- "a/file with spaces.txt"
+++ "b/file with spaces.txt"
@@ -1 +1 @@
-old
+new`))
        .to.eql([{
          oldFileName: 'a/file with spaces.txt',
          oldHeader: '',
          newFileName: 'b/file with spaces.txt',
          newHeader: '',
          isGit: true,
          hunks: [
            {
              oldStart: 1, oldLines: 1,
              newStart: 1, newLines: 1,
              lines: ['-old', '+new']
            }
          ]
        }]);
    });

    it('should parse diff --git rename with quoted filenames', function() {
      expect(parsePatch(
`diff --git "a/old name.txt" "b/new name.txt"
similarity index 100%
rename from old name.txt
rename to new name.txt`))
        .to.eql([{
          oldFileName: 'a/old name.txt',
          newFileName: 'b/new name.txt',
          isGit: true,
          hunks: [],
          isRename: true
        }]);
    });

    it('should unquote C-style quoted filenames in rename from/to', function() {
      expect(parsePatch(
`diff --git "a/file\\twith\\ttabs.txt" b/normal.txt
similarity index 100%
rename from "file\\twith\\ttabs.txt"
rename to normal.txt`))
        .to.eql([{
          oldFileName: 'a/file\twith\ttabs.txt',
          newFileName: 'b/normal.txt',
          isGit: true,
          hunks: [],
          isRename: true
        }]);
    });

    it('should handle all Git C-style escape sequences in quoted filenames', function() {
      expect(parsePatch(
`diff --git "a/\\a\\b\\f\\r\\v\\001file.txt" "b/\\a\\b\\f\\r\\v\\001file.txt"
old mode 100644
new mode 100755`))
        .to.eql([{
          oldFileName: 'a/\x07\b\f\r\v\x01file.txt',
          newFileName: 'b/\x07\b\f\r\v\x01file.txt',
          isGit: true,
          oldMode: '100644',
          newMode: '100755',
          hunks: []
        }]);
    });

    it('should handle multi-byte UTF-8 octal escapes in quoted filenames (emoji)', function() {
      // 🎉 is U+1F389, UTF-8 bytes F0 9F 8E 89 = octal 360 237 216 211
      expect(parsePatch(
`diff --git "a/file\\360\\237\\216\\211.txt" "b/file\\360\\237\\216\\211.txt"
new file mode 100644
index 0000000..ce01362
--- /dev/null
+++ "b/file\\360\\237\\216\\211.txt"
@@ -0,0 +1 @@
+hello`))
        .to.eql([{
          oldFileName: '/dev/null',
          oldHeader: '',
          newFileName: 'b/file🎉.txt',
          newHeader: '',
          isGit: true,
          isCreate: true,
          newMode: '100644',
          hunks: [
            {
              oldStart: 1, oldLines: 0,
              newStart: 1, newLines: 1,
              lines: ['+hello']
            }
          ]
        }]);
    });

    it('should handle multi-byte UTF-8 octal escapes in quoted filenames (accented latin)', function() {
      // é is U+00E9, UTF-8 bytes C3 A9 = octal 303 251
      expect(parsePatch(
`diff --git "a/caf\\303\\251.txt" "b/caf\\303\\251.txt"
old mode 100644
new mode 100755`))
        .to.eql([{
          oldFileName: 'a/café.txt',
          newFileName: 'b/café.txt',
          isGit: true,
          oldMode: '100644',
          newMode: '100755',
          hunks: []
        }]);
    });

    it('should unquote C-style quoted filenames in copy from/to', function() {
      expect(parsePatch(
`diff --git a/original.txt "b/copy\\nwith\\nnewlines.txt"
similarity index 100%
copy from original.txt
copy to "copy\\nwith\\nnewlines.txt"`))
        .to.eql([{
          oldFileName: 'a/original.txt',
          newFileName: 'b/copy\nwith\nnewlines.txt',
          isGit: true,
          hunks: [],
          isCopy: true
        }]);
    });

    it('should let --- and +++ lines override filenames from diff --git header', function() {
      // When --- and +++ are present, they should take precedence over
      // the filenames parsed from the diff --git header line.
      expect(parsePatch(
`diff --git a/file.txt b/file.txt
--- a/file.txt
+++ b/file.txt
@@ -1 +1 @@
-old
+new`))
        .to.eql([{
          oldFileName: 'a/file.txt',
          oldHeader: '',
          newFileName: 'b/file.txt',
          newHeader: '',
          isGit: true,
          hunks: [
            {
              oldStart: 1, oldLines: 1,
              newStart: 1, newLines: 1,
              lines: ['-old', '+new']
            }
          ]
        }]);
    });

    it('should not be confused by a diff --git rename followed by files with hunks', function() {
      expect(parsePatch(
`diff --git a/old.txt b/new.txt
similarity index 100%
rename from old.txt
rename to new.txt
diff --git a/other.txt b/other.txt
--- a/other.txt
+++ b/other.txt
@@ -1 +1 @@
-aaa
+bbb`))
        .to.eql([{
          oldFileName: 'a/old.txt',
          newFileName: 'b/new.txt',
          isGit: true,
          hunks: [],
          isRename: true
        }, {
          oldFileName: 'a/other.txt',
          oldHeader: '',
          newFileName: 'b/other.txt',
          newHeader: '',
          isGit: true,
          hunks: [
            {
              oldStart: 1, oldLines: 1,
              newStart: 1, newLines: 1,
              lines: ['-aaa', '+bbb']
            }
          ]
        }]);
    });

    it('should parse diff --git with unquoted filenames containing spaces (same old and new)', function() {
      expect(parsePatch(
`diff --git a/file with spaces.txt b/file with spaces.txt
old mode 100644
new mode 100755`))
        .to.eql([{
          oldFileName: 'a/file with spaces.txt',
          newFileName: 'b/file with spaces.txt',
          isGit: true,
          oldMode: '100644',
          newMode: '100755',
          hunks: []
        }]);
    });

    it('should parse diff --git rename with unquoted filenames containing spaces', function() {
      // The diff --git line alone is ambiguous when filenames contain spaces
      // and old != new, but rename from / rename to resolve the ambiguity.
      expect(parsePatch(
`diff --git a/file with spaces.txt b/another file with spaces.txt
similarity index 100%
rename from file with spaces.txt
rename to another file with spaces.txt`))
        .to.eql([{
          oldFileName: 'a/file with spaces.txt',
          newFileName: 'b/another file with spaces.txt',
          isGit: true,
          hunks: [],
          isRename: true
        }]);
    });

    it('should handle diff --git with a filename containing " b/"', function() {
      // The filename literally contains " b/" which is also the separator
      // between the old and new paths. Since old === new, the parser can
      // find the unique split where both halves match.
      expect(parsePatch(
`diff --git a/x b/y.txt b/x b/y.txt
old mode 100644
new mode 100755`))
        .to.eql([{
          oldFileName: 'a/x b/y.txt',
          newFileName: 'b/x b/y.txt',
          isGit: true,
          oldMode: '100644',
          newMode: '100755',
          hunks: []
        }]);
    });

    it('should handle diff --git rename where filenames contain " b/"', function() {
      // rename from / rename to lines are unambiguous (one filename per
      // line) so " b/" in the name is not a problem for them. The
      // diff --git header IS ambiguous, but rename from/to override it.
      expect(parsePatch(
`diff --git a/x b/old.txt b/x b/new.txt
similarity index 100%
rename from x b/old.txt
rename to x b/new.txt`))
        .to.eql([{
          oldFileName: 'a/x b/old.txt',
          newFileName: 'b/x b/new.txt',
          isGit: true,
          hunks: [],
          isRename: true
        }]);
    });

    it('should handle diff --git rename where filenames contain " b/", without rename from/to', function() {
      // Without rename from/to, the diff --git header is ambiguous when
      // filenames contain " b/". But --- and +++ lines resolve it.
      expect(parsePatch(
`diff --git a/x b/old.txt b/x b/new.txt
--- a/x b/old.txt
+++ b/x b/new.txt
@@ -1 +1 @@
-hello
+world`))
        .to.eql([{
          oldFileName: 'a/x b/old.txt',
          oldHeader: '',
          newFileName: 'b/x b/new.txt',
          newHeader: '',
          isGit: true,
          hunks: [
            {
              oldStart: 1, oldLines: 1,
              newStart: 1, newLines: 1,
              lines: ['-hello', '+world']
            }
          ]
        }]);
      });

      // So far as we know, Git never actually produces diff --git headers that
      // can't be parsed (e.g. with unterminated quotes or missing a/b prefixes).
      // But we test these cases to confirm parsePatch doesn't crash and instead
      // gracefully falls back to getting filenames from --- / +++ lines.

      it('should handle an unparseable diff --git header with unterminated quote', function() {
        expect(parsePatch(
`diff --git "a/unterminated
--- a/file.txt
+++ b/file.txt
@@ -1 +1 @@
-old
+new`))
          .to.eql([{
            oldFileName: 'a/file.txt',
            oldHeader: '',
            newFileName: 'b/file.txt',
            newHeader: '',
            isGit: true,
            hunks: [
              {
                oldStart: 1, oldLines: 1,
                newStart: 1, newLines: 1,
                lines: ['-old', '+new']
              }
            ]
          }]);
      });

      it('should handle an unparseable diff --git header with no a/b prefixes', function() {
        expect(parsePatch(
`diff --git file.txt file.txt
--- a/file.txt
+++ b/file.txt
@@ -1 +1 @@
-old
+new`))
          .to.eql([{
            oldFileName: 'a/file.txt',
            oldHeader: '',
            newFileName: 'b/file.txt',
            newHeader: '',
            isGit: true,
            hunks: [
              {
                oldStart: 1, oldLines: 1,
                newStart: 1, newLines: 1,
                lines: ['-old', '+new']
              }
            ]
          }]);
      });

      it('should handle an incomplete octal escape in a quoted filename', function() {
        // The quoted filename has a truncated octal escape (\36 instead of \360).
        // parseQuotedFileName should return null, so parseGitDiffHeader returns
        // null and we fall back to --- / +++ lines for filenames.
        expect(parsePatch(
`diff --git "a/file\\36" "b/file\\36"
--- a/file.txt
+++ b/file.txt
@@ -1 +1 @@
-old
+new`))
          .to.eql([{
            oldFileName: 'a/file.txt',
            oldHeader: '',
            newFileName: 'b/file.txt',
            newHeader: '',
            isGit: true,
            hunks: [
              {
                oldStart: 1, oldLines: 1,
                newStart: 1, newLines: 1,
                lines: ['-old', '+new']
              }
            ]
          }]);
      });

      it('should handle an unparseable diff --git header with no --- or +++ fallback', function() {
        // When both the diff --git header is unparseable AND there are no
        // --- / +++ lines, filenames remain undefined.
        expect(parsePatch(
`diff --git file.txt file.txt
old mode 100644
new mode 100755`))
          .to.eql([{
            isGit: true,
            oldMode: '100644',
            newMode: '100755',
            hunks: []
          }]);
      });
  });
});
