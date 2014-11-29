const VERBOSE = false;

var diff = require('../diff');

function getKeys(obj) {
  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
    }
  }
  return keys;
}

describe('#canonicalize', function() {
  it('should put the keys in canonical order', function() {
    getKeys(diff.canonicalize({b: 456, a: 123})).should.eql(['a', 'b']);
  });

  it('should dive into nested objects', function() {
    var canonicalObj = diff.canonicalize({b: 456, a: {d: 123, c: 456}});
    getKeys(canonicalObj.a).should.eql(['c', 'd']);
  });

  it('should dive into nested arrays', function() {
    var canonicalObj = diff.canonicalize({b: 456, a: [789, {d: 123, c: 456}]});
    getKeys(canonicalObj.a[1]).should.eql(['c', 'd']);
  });

  it('should handle circular references correctly', function() {
    var obj = {b: 456};
    obj.a = obj;
    var canonicalObj = diff.canonicalize(obj);
    getKeys(canonicalObj).should.eql(['a', 'b']);
    getKeys(canonicalObj.a).should.eql(['a', 'b']);
  });
});
