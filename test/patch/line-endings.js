import {parsePatch} from '../../libesm/patch/parse.js';
import {formatPatch} from '../../libesm/patch/create.js';
import {winToUnix, unixToWin, isWin, isUnix} from '../../libesm/patch/line-endings.js';

import {expect} from 'chai';

describe('unixToWin and winToUnix', function() {
  it('should convert line endings in a patch between Unix-style and Windows-style', function() {
    const patch = parsePatch(
      'Index: test\n'
      + '===================================================================\n'
      + '--- test\theader1\n'
      + '+++ test\theader2\n'
      + '@@ -1,3 +1,4 @@\n'
      + ' line2\n'
      + ' line3\r\n'
      + '+line4\r\n'
      + ' line5\n'
    );

    const winPatch = unixToWin(patch);
    expect(formatPatch(winPatch)).to.equal(
      'Index: test\n'
      + '===================================================================\n'
      + '--- test\theader1\n'
      + '+++ test\theader2\n'
      + '@@ -1,3 +1,4 @@\n'
      + ' line2\r\n'
      + ' line3\r\n'
      + '+line4\r\n'
      + ' line5\r\n'
    );

    const unixPatch = winToUnix(winPatch);
    expect(formatPatch(unixPatch)).to.equal(
      'Index: test\n'
      + '===================================================================\n'
      + '--- test\theader1\n'
      + '+++ test\theader2\n'
      + '@@ -1,3 +1,4 @@\n'
      + ' line2\n'
      + ' line3\n'
      + '+line4\n'
      + ' line5\n'
    );

    expect(formatPatch(winToUnix(patch))).to.equal(formatPatch(unixPatch));
  });

  it('should not introduce \\r on the last line if there was no newline at EOF', () => {
    const patch = parsePatch(
      'Index: test\n'
      + '===================================================================\n'
      + '--- test\theader1\n'
      + '+++ test\theader2\n'
      + '@@ -1,2 +1,3 @@\n'
      + ' line2\n'
      + ' line3\n'
      + '+line4\n'
      + '\\ No newline at end of file\n'
    );

    const winPatch = unixToWin(patch);
    expect(formatPatch(winPatch)).to.equal(
      'Index: test\n'
      + '===================================================================\n'
      + '--- test\theader1\n'
      + '+++ test\theader2\n'
      + '@@ -1,2 +1,3 @@\n'
      + ' line2\r\n'
      + ' line3\r\n'
      + '+line4\n'
      + '\\ No newline at end of file\n'
    );
  });
});

describe('isWin', () => {
  it('should return true if all lines end with CRLF', () => {
    const patch = parsePatch(
      'Index: test\n'
      + '===================================================================\n'
      + '--- test\theader1\n'
      + '+++ test\theader2\n'
      + '@@ -1,2 +1,3 @@\n'
      + ' line2\r\n'
      + ' line3\r\n'
      + '+line4\r\n'
    );
    expect(isWin(patch)).to.equal(true);
  });

  it('should return false if a line ends with a LF without a CR', () => {
    const patch = parsePatch(
      'Index: test\n'
      + '===================================================================\n'
      + '--- test\theader1\n'
      + '+++ test\theader2\n'
      + '@@ -1,2 +1,3 @@\n'
      + ' line2\r\n'
      + ' line3\r\n'
      + '+line4\n'
    );
    expect(isWin(patch)).to.equal(false);
  });

  it('should still return true if only the last line in a file is missing a CR and there is a no newline at EOF indicator', () => {
    const patch = parsePatch(
      'Index: test\n'
      + '===================================================================\n'
      + '--- test\theader1\n'
      + '+++ test\theader2\n'
      + '@@ -1,2 +1,3 @@\n'
      + ' line2\r\n'
      + ' line3\r\n'
      + '+line4\n'
      + '\\ No newline at end of file\n'
    );
    expect(isWin(patch)).to.equal(true);
  });
});

describe('isUnix', () => {
  it('should return false if some lines end with CRLF', () => {
    const patch = parsePatch(
      'Index: test\n'
      + '===================================================================\n'
      + '--- test\theader1\n'
      + '+++ test\theader2\n'
      + '@@ -1,2 +1,3 @@\n'
      + ' line2\r\n'
      + ' line3\n'
      + '+line4\r\n'
    );
    expect(isUnix(patch)).to.equal(false);
  });

  it('should return true if no lines end with CRLF', () => {
    const patch = parsePatch(
      'Index: test\n'
      + '===================================================================\n'
      + '--- test\theader1\n'
      + '+++ test\theader2\n'
      + '@@ -1,2 +1,3 @@\n'
      + ' line2\n'
      + ' line3\n'
      + '+line4\n'
    );
    expect(isUnix(patch)).to.equal(true);
  });
});
