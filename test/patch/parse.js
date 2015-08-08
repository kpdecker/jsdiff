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
              from: {line: 1, count: 3},
              to: {line: 1, count: 4},
              lines: [
                {operation: ' ', content: 'line2'},
                {operation: ' ', content: 'line3'},
                {operation: '+', content: 'line4'},
                {operation: ' ', content: 'line5'}
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
              from: {line: 1, count: 1},
              to: {line: 1, count: 1},
              lines: [
                {operation: '-', content: 'line3'},
                {operation: '+', content: 'line4'}
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
              from: {line: 1, count: 3},
              to: {line: 1, count: 4},
              lines: [
                {operation: ' ', content: 'line2'},
                {operation: ' ', content: 'line3'},
                {operation: '+', content: 'line4'},
                {operation: ' ', content: 'line5'}
              ]
            },
            {
              from: {line: 4, count: 3},
              to: {line: 1, count: 4},
              lines: [
                {operation: ' ', content: 'line2'},
                {operation: ' ', content: 'line3'},
                {operation: '-', content: 'line4'},
                {operation: ' ', content: 'line5'}
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
          from: {
            file: 'from',
            header: 'header1'
          },
          to: {
            file: 'to',
            header: 'header2'
          },
          hunks: [
            {
              from: {line: 1, count: 3},
              to: {line: 1, count: 4},
              lines: [
                {operation: ' ', content: 'line2'},
                {operation: ' ', content: 'line3'},
                {operation: '+', content: 'line4'},
                {operation: ' ', content: 'line5'}
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
          from: {
            file: 'from',
            header: 'header1'
          },
          to: {
            file: 'to',
            header: 'header2'
          },
          hunks: [
            {
              from: {line: 1, count: 3},
              to: {line: 1, count: 4},
              lines: [
                {operation: ' ', content: 'line2'},
                {operation: ' ', content: 'line3'},
                {operation: '+', content: 'line4'},
                {operation: ' ', content: 'line5'}
              ]
            }
          ]
        }, {
          index: 'test2',
          from: {
            file: 'from',
            header: 'header1'
          },
          to: {
            file: 'to',
            header: 'header2'
          },
          hunks: [
            {
              from: {line: 1, count: 3},
              to: {line: 1, count: 4},
              lines: [
                {operation: ' ', content: 'line2'},
                {operation: ' ', content: 'line3'},
                {operation: '+', content: 'line4'},
                {operation: ' ', content: 'line5'}
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
              from: {line: 1, count: 3},
              to: {line: 1, count: 4},
              lines: [
                {operation: '-', content: 'line5'}
              ]
            }
          ],
          addEOFNL: true
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
              from: {line: 1, count: 3},
              to: {line: 1, count: 4},
              lines: [
                {operation: '+', content: 'line5'}
              ]
            }
          ],
          removeEOFNL: true
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
              from: {line: 1, count: 3},
              to: {line: 1, count: 4},
              lines: [
                {operation: '+', content: 'line4'},
                {operation: ' ', content: 'line5'}
              ]
            }
          ]
        }]);
    });

    it('should perform sanity checks on line numbers', function() {
      parsePatch(`@@ -1 +1 @@`, {strict: true});

      expect(function() {
        parsePatch(`@@ -1 +1,4 @@`, {strict: true});
      }).to['throw']('Added line count did not match for hunk at line 1');
      expect(function() {
        parsePatch(`@@ -1,4 +1 @@`, {strict: true});
      }).to['throw']('Removed line count did not match for hunk at line 1');
    });
    it('should throw on invalid input', function() {
      expect(function() {
        parsePatch('Index: foo\nfoo');
      }).to['throw'](/Unknown line 2 "foo"/);
    });
  });
});
