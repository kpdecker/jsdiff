import {parsePatch} from '../../lib/patch/parse';

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
      parsePatch('@@ -1 +1 @@', {strict: true});

      expect(function() {
        parsePatch('@@ -1 +1,4 @@', {strict: true});
      }).to['throw']('Added line count did not match for hunk at line 1');
      expect(function() {
        parsePatch('@@ -1,4 +1 @@', {strict: true});
      }).to['throw']('Removed line count did not match for hunk at line 1');
    });

    it('should not throw on invalid input', function() {
      expect(parsePatch('blit\nblat\nIndex: foo\nfoo'))
          .to.eql([{
            hunks: [],
            index: 'foo'
          }]);
    });
    it('should throw on invalid input in strict mode', function() {
      expect(function() {
        parsePatch('Index: foo\n+++ bar\nblah', {strict: true});
      }).to['throw'](/Unknown line 3 "blah"/);
    });

    it('should handle OOM case', function() {
      parsePatch('Index: \n===================================================================\n--- \n+++ \n@@ -1,1 +1,2 @@\n-1\n\\ No newline at end of file\n+1\n+2\n');
    });
  });
});
