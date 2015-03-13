var diff = require('../diff');

describe('#diffWords', function() {
  it('should diff whitespace', function() {
    var diffResult = diff.diffWords('New Value', 'New  ValueMoreData');
    diff.convertChangesToXML(diffResult).should.equal('New  <ins>ValueMoreData</ins><del>Value</del>');
  });

  it('should diff multiple whitespace values', function() {
    var diffResult = diff.diffWords('New Value  ', 'New  ValueMoreData ');
    diff.convertChangesToXML(diffResult).should.equal('New  <ins>ValueMoreData</ins><del>Value</del> ');
  });

  // Diff on word boundary
  it('should diff on word boundaries', function() {
    var diffResult = diff.diffWords('New :Value:Test', 'New  ValueMoreData ');
    diff.convertChangesToXML(diffResult).should.equal('New  <ins>ValueMoreData </ins><del>:Value:Test</del>');

    diffResult = diff.diffWords('New Value:Test', 'New  Value:MoreData ');
    diff.convertChangesToXML(diffResult).should.equal('New  Value:<ins>MoreData </ins><del>Test</del>');

    diffResult = diff.diffWords('New Value-Test', 'New  Value:MoreData ');
    diff.convertChangesToXML(diffResult).should.equal('New  Value<ins>:MoreData </ins><del>-Test</del>');

    diffResult = diff.diffWords('New Value', 'New  Value:MoreData ');
    diff.convertChangesToXML(diffResult).should.equal('New  Value<ins>:MoreData </ins>');
  });

  // Diff without changes
  it('should handle identity', function() {
    var diffResult = diff.diffWords('New Value', 'New Value');
    diff.convertChangesToXML(diffResult).should.equal('New Value');
  });
  it('should handle empty', function() {
    var diffResult = diff.diffWords('', '');
    diff.convertChangesToXML(diffResult).should.equal('');
  });
  it('should diff has identical content', function() {
    var diffResult = diff.diffWords('New Value', 'New  Value');
    diff.convertChangesToXML(diffResult).should.equal('New  Value');
  });

  // Empty diffs
  it('should diff empty new content', function() {
    var diffResult = diff.diffWords('New Value', '');
    diffResult.length.should.equal(1);
    diff.convertChangesToXML(diffResult).should.equal('<del>New Value</del>');
  });
  it('should diff empty old content', function() {
    var diffResult = diff.diffWords('', 'New Value');
    diff.convertChangesToXML(diffResult).should.equal('<ins>New Value</ins>');
  });

  // With without anchor (the Heckel algorithm error case)
  it('should diff when there is no anchor value', function() {
    var diffResult = diff.diffWords('New Value New Value', 'Value Value New New');
    diff.convertChangesToXML(diffResult).should.equal('<ins>Value</ins><del>New</del> Value New <ins>New</ins><del>Value</del>');
  });
});

describe('#diffWords - async', function() {
  it('should diff whitespace', function(done) {
    diff.diffWords('New Value', 'New  ValueMoreData', function(err, diffResult) {
      diff.convertChangesToXML(diffResult).should.equal('New  <ins>ValueMoreData</ins><del>Value</del>');
      done();
    });
  });

  it('should diff multiple whitespace values', function(done) {
    diff.diffWords('New Value  ', 'New  ValueMoreData ', function(err, diffResult) {
      diff.convertChangesToXML(diffResult).should.equal('New  <ins>ValueMoreData</ins><del>Value</del> ');
      done();
    });
  });

  // Diff on word boundary
  it('should diff on word boundaries', function(done) {
    diff.diffWords('New :Value:Test', 'New  ValueMoreData ', function(err, diffResult) {
      diff.convertChangesToXML(diffResult).should.equal('New  <ins>ValueMoreData </ins><del>:Value:Test</del>');
      done();
    });
  });

  // Diff without changes
  it('should handle identity', function(done) {
    diff.diffWords('New Value', 'New Value', function(err, diffResult) {
      diff.convertChangesToXML(diffResult).should.equal('New Value');
      done();
    });
  });
  it('should handle empty', function(done) {
    diff.diffWords('', '', function(err, diffResult) {
      diff.convertChangesToXML(diffResult).should.equal('');
      done();
    });
  });
  it('should diff has identical content', function(done) {
    diff.diffWords('New Value', 'New  Value', function(err, diffResult) {
      diff.convertChangesToXML(diffResult).should.equal('New  Value');
      done();
    });
  });

  // Empty diffs
  it('should diff empty new content', function(done) {
    diff.diffWords('New Value', '', function(err, diffResult) {
      diffResult.length.should.equal(1);
      diff.convertChangesToXML(diffResult).should.equal('<del>New Value</del>');
      done();
    });
  });
  it('should diff empty old content', function(done) {
    diff.diffWords('', 'New Value', function(err, diffResult) {
      diff.convertChangesToXML(diffResult).should.equal('<ins>New Value</ins>');
      done();
    });
  });

  // With without anchor (the Heckel algorithm error case)
  it('should diff when there is no anchor value', function(done) {
    diff.diffWords('New Value New Value', 'Value Value New New', function(err, diffResult) {
      diff.convertChangesToXML(diffResult).should.equal('<ins>Value</ins><del>New</del> Value New <ins>New</ins><del>Value</del>');
      done();
    });
  });
});

describe('#diffWordsWithSpace', function() {
  it('should diff whitespace', function() {
    var diffResult = diff.diffWordsWithSpace('New Value', 'New  ValueMoreData');
    diff.convertChangesToXML(diffResult).should.equal('New<ins>  ValueMoreData</ins><del> Value</del>');
  });

  it('should diff multiple whitespace values', function() {
    var diffResult = diff.diffWordsWithSpace('New Value  ', 'New  ValueMoreData ');
    diff.convertChangesToXML(diffResult).should.equal('New<ins>  ValueMoreData</ins> <del>Value  </del>');
  });
});

describe('#diffChars', function() {
  it('Should diff chars', function() {
    var diffResult = diff.diffChars('New Value.', 'New ValueMoreData.');
    diff.convertChangesToXML(diffResult).should.equal('New Value<ins>MoreData</ins>.');
  });
});


describe('#diffSentences', function() {
  it('Should diff Sentences', function() {
    var diffResult = diff.diffSentences('New Value.', 'New ValueMoreData.');
    diff.convertChangesToXML(diffResult).should.equal('<ins>New ValueMoreData.</ins><del>New Value.</del>');
  });

  it('should diff only the last sentence', function() {
    var diffResult = diff.diffSentences('Here im. Rock you like old man.', 'Here im. Rock you like hurricane.');
    diff.convertChangesToXML(diffResult).should.equal('Here im. <ins>Rock you like hurricane.</ins><del>Rock you like old man.</del>');
  });
});

// CSS Diff
describe('#diffCss', function() {
  it('should diff css', function() {
    var diffResult = diff.diffCss(
      '.test,#value .test{margin-left:50px;margin-right:-40px}',
      '.test2, #value2 .test {\nmargin-top:50px;\nmargin-right:-400px;\n}');
    diff.convertChangesToXML(diffResult).should.equal(
      '<ins>.test2</ins><del>.test</del>,<del>#value</del> <ins>#value2 </ins>.test<ins> </ins>{<ins>\n'
      + 'margin-top</ins><del>margin-left</del>:50px;<ins>\n</ins>'
      + 'margin-right:<ins>-400px;\n</ins><del>-40px</del>}');
  });
});

// Line Diff
describe('#diffLines', function() {
  it('should diff lines', function() {
    var diffResult = diff.diffLines(
      'line\nold value\nline',
      'line\nnew value\nline');
    diff.convertChangesToXML(diffResult).should.equal('line\n<ins>new value\n</ins><del>old value\n</del>line');
  });
  it('should the same lines in diff', function() {
    var diffResult = diff.diffLines(
      'line\nvalue\nline',
      'line\nvalue\nline');
    diff.convertChangesToXML(diffResult).should.equal('line\nvalue\nline');
  });

  it('should handle leading and trailing whitespace', function() {
    var diffResult = diff.diffLines(
      'line\nvalue \nline',
      'line\nvalue\nline');
    diff.convertChangesToXML(diffResult).should.equal('line\n<ins>value\n</ins><del>value \n</del>line');
  });

  it('should handle windows line endings', function() {
    var diffResult = diff.diffLines(
      'line\r\nold value \r\nline',
      'line\r\nnew value\r\nline');
    diff.convertChangesToXML(diffResult).should.equal('line\r\n<ins>new value\r\n</ins><del>old value \r\n</del>line');
  });
  
  it('should handle empty lines', function() {
    var diffResult = diff.diffLines(
      'line\n\nold value \n\nline',
      'line\n\nnew value\n\nline');
    diff.convertChangesToXML(diffResult).should.equal('line\n\n<ins>new value\n</ins><del>old value \n</del>\nline');
  });
});

// Trimmed Line Diff
describe('#TrimmedLineDiff', function() {
  it('should diff lines', function() {
    var diffResult = diff.diffTrimmedLines(
      'line\nold value\nline',
      'line\nnew value\nline');
    diff.convertChangesToXML(diffResult).should.equal('line\n<ins>new value\n</ins><del>old value\n</del>line');
  });
  it('should the same lines in diff', function() {
    var diffResult = diff.diffTrimmedLines(
      'line\nvalue\nline',
      'line\nvalue\nline');
    diff.convertChangesToXML(diffResult).should.equal('line\nvalue\nline');
  });

  it('should ignore leading and trailing whitespace', function() {
    var diffResult = diff.diffTrimmedLines(
      'line\nvalue \nline',
      'line\nvalue\nline');
    diff.convertChangesToXML(diffResult).should.equal('line\nvalue\nline');
  });

  it('should handle windows line endings', function() {
    var diffResult = diff.diffTrimmedLines(
      'line\r\nold value \r\nline',
      'line\r\nnew value\r\nline');
    diff.convertChangesToXML(diffResult).should.equal('line\r\n<ins>new value\r\n</ins><del>old value\r\n</del>line');
  });
});

describe('#diffJson', function() {
  it('should accept objects', function() {
    diff.diffJson(
      {a: 123, b: 456, c: 789},
      {a: 123, b: 456}
    ).should.eql([
      { count: 3, value: '{\n  "a": 123,\n  "b": 456,\n' },
      { count: 1, value: '  "c": 789\n', added: undefined, removed: true },
      { count: 1, value: '}' }
    ]);
  });
  it('should accept objects with different order', function() {
    diff.diffJson(
      {a: 123, b: 456, c: 789},
      {b: 456, a: 123}
    ).should.eql([
      { count: 3, value: '{\n  "a": 123,\n  "b": 456,\n' },
      { count: 1, value: '  "c": 789\n', added: undefined, removed: true },
      { count: 1, value: '}' }
    ]);
  });

  it('should accept objects with nested structures', function() {
    diff.diffJson(
      {a: 123, b: 456, c: [1, 2, {foo: 'bar'}, 4]},
      {a: 123, b: 456, c: [1, {foo: 'bar'}, 4]}
    ).should.eql([
      { count: 5, value: '{\n  "a": 123,\n  "b": 456,\n  "c": [\n    1,\n' },
      { count: 1, value: '    2,\n', added: undefined, removed: true },
      { count: 6, value: '    {\n      "foo": "bar"\n    },\n    4\n  ]\n}' }
    ]);
  });

  it('should accept already stringified JSON', function() {
    diff.diffJson(
      JSON.stringify({a: 123, b: 456, c: 789}, undefined, '  '),
      JSON.stringify({a: 123, b: 456}, undefined, '  ')
    ).should.eql([
      { count: 3, value: '{\n  "a": 123,\n  "b": 456,\n' },
      { count: 1, value: '  "c": 789\n', added: undefined, removed: true },
      { count: 1, value: '}' }
    ]);
  });

  it('should ignore trailing comma on the previous line when the property has been removed', function() {
    var diffResult = diff.diffJson(
      {a: 123, b: 456, c: 789},
      {a: 123, b: 456});
    diff.convertChangesToXML(diffResult).should.equal('{\n  &quot;a&quot;: 123,\n  &quot;b&quot;: 456,\n<del>  &quot;c&quot;: 789\n</del>}');
  });

  it('should ignore the missing trailing comma on the last line when a property has been added after it', function() {
    var diffResult = diff.diffJson(
      {a: 123, b: 456},
      {a: 123, b: 456, c: 789});
    diff.convertChangesToXML(diffResult).should.equal('{\n  &quot;a&quot;: 123,\n  &quot;b&quot;: 456,\n<ins>  &quot;c&quot;: 789\n</ins>}');
  });

  it('should throw an error if one of the objects being diffed has a circular reference', function() {
    var circular = {foo: 123};
    circular.bar = circular;
    (function () {
      diff.diffJson(
        circular,
        {foo: 123, bar: {}}
      );
    }).should.throw('Converting circular structure to JSON');
  });
});

describe('convertToDMP', function() {
  it('should output diff-match-patch format', function() {
    var diffResult = diff.diffWords('New Value  ', 'New  ValueMoreData ');

    diff.convertChangesToDMP(diffResult).should.eql(
        [[0,'New  '],[1,'ValueMoreData'],[-1,'Value'],[0,' ']]);
  });
});
