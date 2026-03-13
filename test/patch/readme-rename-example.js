import {applyPatches} from '../../libesm/patch/apply.js';

import {expect} from 'chai';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('README Git rename example', function() {
  let tmpDir;
  let originalCwd;

  beforeEach(function() {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsdiff-readme-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(function() {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, {recursive: true, force: true});
  });

  /**
   * Extract the Git rename example code from the README and return it as a
   * function that takes (applyPatches, patch, fs, path) and runs the example.
   */
  function getReadmeExampleFn() {
    const readme = fs.readFileSync(
      path.join(__dirname, '../../README.md'),
      'utf-8'
    );

    // Find the heading
    const headingIndex = readme.indexOf('##### Applying a multi-file Git patch that may include renames');
    if (headingIndex === -1) {
      throw new Error('Could not find the Git rename example heading in README.md');
    }

    // Find the code block after the heading
    const afterHeading = readme.substring(headingIndex);
    const codeBlockStart = afterHeading.indexOf('\n```\n');
    if (codeBlockStart === -1) {
      throw new Error('Could not find the code block in the Git rename example');
    }
    const codeStart = codeBlockStart + 4; // skip past the \n```\n
    const codeBlockEnd = afterHeading.indexOf('\n```\n', codeStart);
    if (codeBlockEnd === -1) {
      throw new Error('Could not find the end of the code block in the Git rename example');
    }

    let code = afterHeading.substring(codeStart, codeBlockEnd);

    // Strip the require line — we'll provide applyPatches as an argument.
    // Strip the fs.readFileSync for the patch — we'll provide patch as an argument.
    code = code
      .replace(/const \{applyPatches\}.*\n/, '')
      .replace(/const patch = .*\n/, '');

    // eslint-disable-next-line no-new-func
    return new Function('applyPatches', 'patch', 'fs', 'path', code);
  }

  it('should handle a simple rename with content change', function() {
    fs.writeFileSync('old.txt', 'line1\nline2\nline3\n');

    const patch =
`diff --git a/old.txt b/new.txt
similarity index 80%
rename from old.txt
rename to new.txt
--- a/old.txt
+++ b/new.txt
@@ -1,3 +1,3 @@
 line1
-line2
+line2modified
 line3
`;

    getReadmeExampleFn()(applyPatches, patch, fs, path);

    expect(fs.existsSync('old.txt')).to.equal(false);
    expect(fs.readFileSync('new.txt', 'utf-8'))
      .to.equal('line1\nline2modified\nline3\n');
  });

  it('should handle a swap rename (a→b, b→a)', function() {
    fs.writeFileSync('a.txt', 'content of a\n');
    fs.writeFileSync('b.txt', 'content of b\n');

    const patch =
`diff --git a/a.txt b/b.txt
similarity index 100%
rename from a.txt
rename to b.txt
diff --git a/b.txt b/a.txt
similarity index 100%
rename from b.txt
rename to a.txt
`;

    getReadmeExampleFn()(applyPatches, patch, fs, path);

    expect(fs.readFileSync('a.txt', 'utf-8')).to.equal('content of b\n');
    expect(fs.readFileSync('b.txt', 'utf-8')).to.equal('content of a\n');
  });

  it('should handle a swap rename with content changes', function() {
    fs.writeFileSync('a.txt', 'aaa\n');
    fs.writeFileSync('b.txt', 'bbb\n');

    const patch =
`diff --git a/a.txt b/b.txt
similarity index 50%
rename from a.txt
rename to b.txt
--- a/a.txt
+++ b/b.txt
@@ -1 +1 @@
-aaa
+aaa-modified
diff --git a/b.txt b/a.txt
similarity index 50%
rename from b.txt
rename to a.txt
--- a/b.txt
+++ b/a.txt
@@ -1 +1 @@
-bbb
+bbb-modified
`;

    getReadmeExampleFn()(applyPatches, patch, fs, path);

    expect(fs.readFileSync('a.txt', 'utf-8')).to.equal('bbb-modified\n');
    expect(fs.readFileSync('b.txt', 'utf-8')).to.equal('aaa-modified\n');
  });

  it('should handle a three-way rotation (a→b, b→c, c→a)', function() {
    fs.writeFileSync('a.txt', 'content of a\n');
    fs.writeFileSync('b.txt', 'content of b\n');
    fs.writeFileSync('c.txt', 'content of c\n');

    const patch =
`diff --git a/a.txt b/b.txt
similarity index 100%
rename from a.txt
rename to b.txt
diff --git a/b.txt b/c.txt
similarity index 100%
rename from b.txt
rename to c.txt
diff --git a/c.txt b/a.txt
similarity index 100%
rename from c.txt
rename to a.txt
`;

    getReadmeExampleFn()(applyPatches, patch, fs, path);

    expect(fs.readFileSync('a.txt', 'utf-8')).to.equal('content of c\n');
    expect(fs.readFileSync('b.txt', 'utf-8')).to.equal('content of a\n');
    expect(fs.readFileSync('c.txt', 'utf-8')).to.equal('content of b\n');
  });

  it('should handle a file deletion', function() {
    fs.writeFileSync('doomed.txt', 'goodbye\n');

    const patch =
`diff --git a/doomed.txt b/doomed.txt
deleted file mode 100644
index 2b31011..0000000
--- a/doomed.txt
+++ /dev/null
@@ -1 +0,0 @@
-goodbye
`;

    getReadmeExampleFn()(applyPatches, patch, fs, path);

    expect(fs.existsSync('doomed.txt')).to.equal(false);
  });

  it('should handle a file creation', function() {
    const patch =
`diff --git a/brand-new.txt b/brand-new.txt
new file mode 100644
index 0000000..fa49b07
--- /dev/null
+++ b/brand-new.txt
@@ -0,0 +1 @@
+hello world
`;

    getReadmeExampleFn()(applyPatches, patch, fs, path);

    expect(fs.readFileSync('brand-new.txt', 'utf-8')).to.equal('hello world\n');
  });

  it('should create a new executable file with correct mode', function() {
    const patch =
`diff --git a/run.sh b/run.sh
new file mode 100755
index 0000000..abc1234
--- /dev/null
+++ b/run.sh
@@ -0,0 +1,2 @@
+#!/bin/bash
+echo hello
`;

    getReadmeExampleFn()(applyPatches, patch, fs, path);

    expect(fs.readFileSync('run.sh', 'utf-8')).to.equal('#!/bin/bash\necho hello\n');
    const mode = fs.statSync('run.sh').mode & 0o777;
    expect(mode).to.equal(0o755);
  });

  it('should set the mode when a file is modified with a mode change', function() {
    fs.writeFileSync('script.sh', 'echo old\n');
    fs.chmodSync('script.sh', 0o644);

    const patch =
`diff --git a/script.sh b/script.sh
old mode 100644
new mode 100755
--- a/script.sh
+++ b/script.sh
@@ -1 +1 @@
-echo old
+echo new
`;

    getReadmeExampleFn()(applyPatches, patch, fs, path);

    expect(fs.readFileSync('script.sh', 'utf-8')).to.equal('echo new\n');
    const mode = fs.statSync('script.sh').mode & 0o777;
    expect(mode).to.equal(0o755);
  });
});
