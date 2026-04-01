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
        'Index: file1.txt\n' +
        '===================================================================\n' +
        '--- file1.txt\n' +
        '+++ file1.txt\n' +
        '@@ -1,4 +1,5 @@\n' +
        ' alpha\n' +
        '+beta\n' +
        ' gamma\n' +
        ' delta\n' +
        ' epsilon\n' +
        'Index: file2.txt\n' +
        '===================================================================\n' +
        '--- file2.txt\n' +
        '+++ file2.txt\n' +
        '@@ -2,3 +2,3 @@\n' +
        ' two\n' +
        '-three\n' +
        '+THREE\n' +
        ' four\n'
      );
      expect(formatPatch(reversePatch(patch))).to.equal(
        'Index: file2.txt\n' +
        '===================================================================\n' +
        '--- file2.txt\n' +
        '+++ file2.txt\n' +
        '@@ -2,3 +2,3 @@\n' +
        ' two\n' +
        '+three\n' +
        '-THREE\n' +
        ' four\n' +
        '\n' +
        'Index: file1.txt\n' +
        '===================================================================\n' +
        '--- file1.txt\n' +
        '+++ file1.txt\n' +
        '@@ -1,5 +1,4 @@\n' +
        ' alpha\n' +
        '-beta\n' +
        ' gamma\n' +
        ' delta\n' +
        ' epsilon\n'
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
      expect(formatPatch(reversePatch(patch))).to.equal(
        'diff --git a/new.txt b/old.txt\n' +
        'rename from new.txt\n' +
        'rename to old.txt\n' +
        '--- a/new.txt\n' +
        '+++ b/old.txt\n' +
        '@@ -1,3 +1,3 @@\n' +
        ' line1\n' +
        '+line2\n' +
        '-line2modified\n' +
        ' line3\n'
      );
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
      expect(formatPatch(reversePatch(patch))).to.equal(
        'diff --git a/copy.txt b/copy.txt\n' +
        'deleted file mode 100644\n'
      );
    });

    it('should reverse a hunk-less copy into a deletion', function() {
      const patch = parsePatch(
        'diff --git a/original.txt b/copy.txt\n' +
        'similarity index 100%\n' +
        'copy from original.txt\n' +
        'copy to copy.txt\n'
      );
      expect(formatPatch(reversePatch(patch))).to.equal(
        'diff --git a/copy.txt b/copy.txt\n' +
        'deleted file mode 100644\n'
      );
    });

    it('should reverse a hunk-less rename', function() {
      const patch = parsePatch(
        'diff --git a/old.txt b/new.txt\n' +
        'similarity index 100%\n' +
        'rename from old.txt\n' +
        'rename to new.txt\n'
      );
      expect(formatPatch(reversePatch(patch))).to.equal(
        'diff --git a/new.txt b/old.txt\n' +
        'rename from new.txt\n' +
        'rename to old.txt\n'
      );
    });

    it('should reverse a creation into a deletion, swapping isCreate/isDelete and oldMode/newMode', function() {
      const patch = parsePatch(
        'diff --git a/newfile.txt b/newfile.txt\n' +
        'new file mode 100755\n' +
        '--- /dev/null\n' +
        '+++ b/newfile.txt\n' +
        '@@ -0,0 +1 @@\n' +
        '+hello\n'
      );
      expect(formatPatch(reversePatch(patch))).to.equal(
        'diff --git a/newfile.txt b/newfile.txt\n' +
        'deleted file mode 100755\n' +
        '--- a/newfile.txt\n' +
        '+++ /dev/null\n' +
        '@@ -1,1 +0,0 @@\n' +
        '-hello\n'
      );
    });

    it('should reverse a deletion into a creation, swapping isCreate/isDelete and oldMode/newMode', function() {
      const patch = parsePatch(
        'diff --git a/oldfile.txt b/oldfile.txt\n' +
        'deleted file mode 100644\n' +
        '--- a/oldfile.txt\n' +
        '+++ /dev/null\n' +
        '@@ -1 +0,0 @@\n' +
        '-goodbye\n'
      );
      expect(formatPatch(reversePatch(patch))).to.equal(
        'diff --git a/oldfile.txt b/oldfile.txt\n' +
        'new file mode 100644\n' +
        '--- /dev/null\n' +
        '+++ b/oldfile.txt\n' +
        '@@ -0,0 +1,1 @@\n' +
        '+goodbye\n'
      );
    });

    it('should swap oldMode and newMode when reversing a mode change', function() {
      const patch = parsePatch(
        'diff --git a/script.sh b/script.sh\n' +
        'old mode 100644\n' +
        'new mode 100755\n'
      );
      expect(formatPatch(reversePatch(patch))).to.equal(
        'diff --git a/script.sh b/script.sh\n' +
        'old mode 100755\n' +
        'new mode 100644\n'
      );
    });
  });
});
