import {applyPatch} from '../../libesm/patch/apply.js';
import {structuredPatch, formatPatch} from '../../libesm/patch/create.js';
import {reversePatch} from '../../libesm/patch/reverse.js';
import {parsePatch} from '../../libesm/patch/parse.js';

import {expect} from 'chai';

describe('patch/reverse', function() {
  describe('#reversePatch', function() {
    it('should output a patch that is the inverse of the provided patch', function() {
      const file1 = 'line1\nline2\nline3\nline4\n';
      const file2 = 'line1\nline2\nline5\nline4\n';
      const patch = structuredPatch('file1', 'file2', file1, file2);
      const reversedPatch = reversePatch(patch);
      expect(formatPatch(reversedPatch)).to.equal(
        '===================================================================\n'
        + '--- file2\n'
        + '+++ file1\n'
        + '@@ -1,4 +1,4 @@\n'
        + ' line1\n'
        + ' line2\n'
        + '+line3\n'
        + '-line5\n'
        + ' line4\n'
      );
      expect(applyPatch(file2, reversedPatch)).to.equal(file1);
    });

    it('should support taking an array of structured patches, as output by parsePatch', function() {
      const patch = parsePatch(
        'diff --git a/CONTRIBUTING.md b/CONTRIBUTING.md\n' +
        'index 20b807a..4a96aff 100644\n' +
        '--- a/CONTRIBUTING.md\n' +
        '+++ b/CONTRIBUTING.md\n' +
        '@@ -2,6 +2,8 @@\n' +
        ' \n' +
        ' ## Pull Requests\n' +
        ' \n' +
        '+bla bla bla\n' +
        '+\n' +
        ' We also accept [pull requests][pull-request]!\n' +
        ' \n' +
        ' Generally we like to see pull requests that\n' +
        'diff --git a/README.md b/README.md\n' +
        'index 06eebfa..40919a6 100644\n' +
        '--- a/README.md\n' +
        '+++ b/README.md\n' +
        '@@ -1,5 +1,7 @@\n' +
        ' # jsdiff\n' +
        ' \n' +
        '+foo\n' +
        '+\n' +
        ' [![Build Status](https://secure.travis-ci.org/kpdecker/jsdiff.svg)](http://travis-ci.org/kpdecker/jsdiff)\n' +
        ' [![Sauce Test Status](https://saucelabs.com/buildstatus/jsdiff)](https://saucelabs.com/u/jsdiff)\n' +
        ' \n' +
        "@@ -225,3 +227,5 @@ jsdiff deviates from the published algorithm in a couple of ways that don't affe\n" +
        ' \n' +
        " * jsdiff keeps track of the diff for each diagonal using a linked list of change objects for each diagonal, rather than the historical array of furthest-reaching D-paths on each diagonal contemplated on page 8 of Myers's paper.\n" +
        ' * jsdiff skips considering diagonals where the furthest-reaching D-path would go off the edge of the edit graph. This dramatically reduces the time cost (from quadratic to linear) in cases where the new text just appends or truncates content at the end of the old text.\n' +
        '+\n' +
        '+bar\n'
      );
      expect(formatPatch(reversePatch(patch))).to.equal(
        'diff --git b/README.md a/README.md\n' +
        '--- b/README.md\t\n' +
        '+++ a/README.md\t\n' +
        '@@ -1,7 +1,5 @@\n' +
        ' # jsdiff\n' +
        ' \n' +
        '-foo\n' +
        '-\n' +
        ' [![Build Status](https://secure.travis-ci.org/kpdecker/jsdiff.svg)](http://travis-ci.org/kpdecker/jsdiff)\n' +
        ' [![Sauce Test Status](https://saucelabs.com/buildstatus/jsdiff)](https://saucelabs.com/u/jsdiff)\n' +
        ' \n' +
        '@@ -227,5 +225,3 @@\n' +
        ' \n' +
        " * jsdiff keeps track of the diff for each diagonal using a linked list of change objects for each diagonal, rather than the historical array of furthest-reaching D-paths on each diagonal contemplated on page 8 of Myers's paper.\n" +
        ' * jsdiff skips considering diagonals where the furthest-reaching D-path would go off the edge of the edit graph. This dramatically reduces the time cost (from quadratic to linear) in cases where the new text just appends or truncates content at the end of the old text.\n' +
        '-\n' +
        '-bar\n' +
        '\n' +
        'diff --git b/CONTRIBUTING.md a/CONTRIBUTING.md\n' +
        '--- b/CONTRIBUTING.md\t\n' +
        '+++ a/CONTRIBUTING.md\t\n' +
        '@@ -2,8 +2,6 @@\n' +
        ' \n' +
        ' ## Pull Requests\n' +
        ' \n' +
        '-bla bla bla\n' +
        '-\n' +
        ' We also accept [pull requests][pull-request]!\n' +
        ' \n' +
        ' Generally we like to see pull requests that\n'
      );
    });

    it('should reverse a rename patch into a rename in the opposite direction', function() {
      const patch = parsePatch(
        'diff --git a/old.txt b/new.txt\n' +
        'similarity index 85%\n' +
        'rename from old.txt\n' +
        'rename to new.txt\n' +
        '--- a/old.txt\n' +
        '+++ b/new.txt\n' +
        '@@ -1,3 +1,3 @@\n' +
        ' line1\n' +
        '-line2\n' +
        '+line2modified\n' +
        ' line3\n'
      );
      const reversed = reversePatch(patch);
      expect(reversed).to.have.length(1);
      expect(reversed[0].oldFileName).to.equal('b/new.txt');
      expect(reversed[0].newFileName).to.equal('a/old.txt');
      expect(reversed[0].isRename).to.equal(true);
      expect(reversed[0].isCopy).to.equal(undefined);
      expect(reversed[0].hunks).to.have.length(1);
      expect(reversed[0].hunks[0].lines).to.eql([
        ' line1',
        '+line2',
        '-line2modified',
        ' line3'
      ]);
    });

    it('should reverse a copy patch into a deletion', function() {
      const patch = parsePatch(
        'diff --git a/original.txt b/copy.txt\n' +
        'similarity index 85%\n' +
        'copy from original.txt\n' +
        'copy to copy.txt\n' +
        '--- a/original.txt\n' +
        '+++ b/copy.txt\n' +
        '@@ -1,3 +1,3 @@\n' +
        ' line1\n' +
        '-line2\n' +
        '+line2modified\n' +
        ' line3\n'
      );
      const reversed = reversePatch(patch);
      expect(reversed).to.have.length(1);
      // Reversing a copy means deleting the copy destination
      expect(reversed[0].oldFileName).to.equal('b/copy.txt');
      expect(reversed[0].newFileName).to.equal('/dev/null');
      expect(reversed[0].newHeader).to.equal(undefined);
      expect(reversed[0].isRename).to.equal(undefined);
      expect(reversed[0].isCopy).to.equal(undefined);
    });

    it('should reverse a hunk-less copy into a deletion', function() {
      const patch = parsePatch(
        'diff --git a/original.txt b/copy.txt\n' +
        'similarity index 100%\n' +
        'copy from original.txt\n' +
        'copy to copy.txt\n'
      );
      const reversed = reversePatch(patch);
      expect(reversed).to.have.length(1);
      expect(reversed[0].oldFileName).to.equal('b/copy.txt');
      expect(reversed[0].newFileName).to.equal('/dev/null');
      expect(reversed[0].isRename).to.equal(undefined);
      expect(reversed[0].isCopy).to.equal(undefined);
      expect(reversed[0].hunks).to.eql([]);
    });

    it('should reverse a hunk-less rename', function() {
      const patch = parsePatch(
        'diff --git a/old.txt b/new.txt\n' +
        'similarity index 100%\n' +
        'rename from old.txt\n' +
        'rename to new.txt\n'
      );
      const reversed = reversePatch(patch);
      expect(reversed).to.have.length(1);
      expect(reversed[0].oldFileName).to.equal('b/new.txt');
      expect(reversed[0].newFileName).to.equal('a/old.txt');
      expect(reversed[0].isRename).to.equal(true);
      expect(reversed[0].isCopy).to.equal(undefined);
      expect(reversed[0].hunks).to.eql([]);
    });
  });
});
