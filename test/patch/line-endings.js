import {parsePatch} from '../../lib/patch/parse';
import {formatPatch} from '../../lib/patch/create';
import {winToUnix, unixToWin} from '../../lib/patch/line-endings';

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
  });
});
