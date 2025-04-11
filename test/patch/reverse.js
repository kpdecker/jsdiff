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
        '===================================================================\n' +
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
        '===================================================================\n' +
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
  });
});
