var diff = require('../diff');

describe('#structuredPatch', function() {
  it('should handle files with the last line changed', function() {
    var res = diff.structuredPatch(
      'oldfile', 'newfile',
      'line2\nline3\nline4\n', 'line2\nline3\nline5',
      'header1', 'header2'
    );
    res.should.eql({
      oldFileName: 'oldfile', newFileName: 'newfile',
      oldHeader: 'header1', newHeader: 'header2',
      hunks: [{
        oldStart: 1, oldLines: 3, newStart: 1, newLines: 3,
        lines: [' line2', ' line3', '-line4', '+line5', '\\ No newline at end of file']
      }]
    });
  });
});
