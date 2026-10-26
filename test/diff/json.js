import {diffJson, canonicalize} from '../../libesm/diff/json.js';
import {convertChangesToXML} from '../../libesm/convert/xml.js';

import {expect} from 'chai';

describe('diff/json', function() {
  describe('#diffJson', function() {
    it('should accept objects', function() {
      expect(diffJson(
        {a: 123, b: 456, c: 789},
        {a: 123, b: 456}
      )).to.eql([
        { count: 3, value: '{\n  "a": 123,\n  "b": 456,\n', removed: false, added: false },
        { count: 1, value: '  "c": 789\n', added: false, removed: true },
        { count: 1, value: '}', removed: false, added: false }
      ]);
    });

    it('should accept objects with different order', function() {
      expect(diffJson(
        {a: 123, b: 456, c: 789},
        {b: 456, a: 123}
      )).to.eql([
        { count: 3, value: '{\n  "a": 123,\n  "b": 456,\n', removed: false, added: false },
        { count: 1, value: '  "c": 789\n', added: false, removed: true },
        { count: 1, value: '}', removed: false, added: false }
      ]);
    });

    it('should accept objects with nested structures', function() {
      expect(diffJson(
        {a: 123, b: 456, c: [1, 2, {foo: 'bar'}, 4]},
        {a: 123, b: 456, c: [1, {foo: 'bar'}, 4]}
      )).to.eql([
        { count: 5, value: '{\n  "a": 123,\n  "b": 456,\n  "c": [\n    1,\n', removed: false, added: false },
        { count: 1, value: '    2,\n', added: false, removed: true },
        { count: 6, value: '    {\n      "foo": "bar"\n    },\n    4\n  ]\n}', removed: false, added: false }
      ]);
    });

    it('should accept dates', function() {
      expect(diffJson(
        {a: new Date(123), b: new Date(456), c: new Date(789)},
        {a: new Date(124), b: new Date(456)}
      )).to.eql([
        { count: 1, value: '{\n', removed: false, added: false },
        { count: 1, value: '  "a": "1970-01-01T00:00:00.123Z",\n', added: false, removed: true },
        { count: 1, value: '  "a": "1970-01-01T00:00:00.124Z",\n', added: true, removed: false },
        { count: 1, value: '  "b": "1970-01-01T00:00:00.456Z",\n', removed: false, added: false },
        { count: 1, value: '  "c": "1970-01-01T00:00:00.789Z"\n', added: false, removed: true },
        { count: 1, value: '}', removed: false, added: false }
      ]);
    });

    it('should accept undefined keys', function() {
      expect(diffJson(
        {a: 123, b: 456, c: null},
        {a: 123, b: 456}
      )).to.eql([
        { count: 3, value: '{\n  "a": 123,\n  "b": 456,\n', removed: false, added: false },
        { count: 1, value: '  "c": null\n', added: false, removed: true },
        { count: 1, value: '}', removed: false, added: false }
      ]);
      expect(diffJson(
        {a: 123, b: 456, c: undefined},
        {a: 123, b: 456}
      )).to.eql([
        { count: 4, value: '{\n  "a": 123,\n  "b": 456\n}', removed: false, added: false }
      ]);
      expect(diffJson(
        {a: 123, b: 456, c: undefined},
        {a: 123, b: 456},
        {undefinedReplacement: null}
      )).to.eql([
        { count: 3, value: '{\n  "a": 123,\n  "b": 456,\n', removed: false, added: false },
        { count: 1, value: '  "c": null\n', added: false, removed: true },
        { count: 1, value: '}', removed: false, added: false }
      ]);
    });

    it('should accept already stringified JSON', function() {
      expect(diffJson(
        JSON.stringify({a: 123, b: 456, c: 789}, undefined, '  '),
        JSON.stringify({a: 123, b: 456}, undefined, '  ')
      )).to.eql([
        { count: 3, value: '{\n  "a": 123,\n  "b": 456,\n', removed: false, added: false },
        { count: 1, value: '  "c": 789\n', added: false, removed: true },
        { count: 1, value: '}', removed: false, added: false }
      ]);
    });

    it('should ignore trailing comma on the previous line when the property has been removed', function() {
      const diffResult = diffJson(
        {a: 123, b: 456, c: 789},
        {a: 123, b: 456});
      expect(convertChangesToXML(diffResult)).to.equal('{\n  &quot;a&quot;: 123,\n  &quot;b&quot;: 456,\n<del>  &quot;c&quot;: 789\n</del>}');
    });

    it('should ignore the missing trailing comma on the last line when a property has been added after it', function() {
      const diffResult = diffJson(
        {a: 123, b: 456},
        {a: 123, b: 456, c: 789});
      expect(convertChangesToXML(diffResult)).to.equal('{\n  &quot;a&quot;: 123,\n  &quot;b&quot;: 456,\n<ins>  &quot;c&quot;: 789\n</ins>}');
    });

    it('should throw an error if one of the objects being diffed has a circular reference', function() {
      const circular = {foo: 123};
      circular.bar = circular;
      expect(function() {
        diffJson(
          circular,
          {foo: 123, bar: {}}
        );
      }).to['throw'](/circular|cyclic/i);
    });

    it('does not silently drop an own __proto__ property', function() {
      // Objects parsed from JSON can carry an own enumerable "__proto__"
      // property. Diffing must reflect a change to it instead of reporting
      // the two objects as identical.
      const oldObj = JSON.parse('{"__proto__": "old"}');
      const newObj = JSON.parse('{"__proto__": "new"}');
      expect(diffJson(oldObj, newObj)).to.eql([
        { count: 1, value: '{\n', removed: false, added: false },
        { count: 1, value: '  "__proto__": "old"\n', added: false, removed: true },
        { count: 1, value: '  "__proto__": "new"\n', added: true, removed: false },
        { count: 1, value: '}', removed: false, added: false }
      ]);
    });

    it('handles custom toJSON methods like JSON.stringify does', function() {
      const x = {
        toJSON: () => 'aaa'
      };
      const y = {
        toJSON: () => 'bbb'
      };

      expect(diffJson({ foo: x }, {foo: y})).to.eql([
        { count: 1, value: '{\n', removed: false, added: false },
        { count: 1, value: '  "foo": "aaa"\n', added: false, removed: true },
        { count: 1, value: '  "foo": "bbb"\n', added: true, removed: false },
        { count: 1, value: '}', removed: false, added: false }
      ]);
    });

    it('preserves arrays returned by toJSON methods', function() {
      const value = {
        toJSON: () => [1, {b: 3, a: 2}]
      };
      const expected = [1, {a: 2, b: 3}];

      expect(diffJson(value, expected)).to.eql([
        { count: 7, value: JSON.stringify(expected, null, '  '), added: false, removed: false }
      ]);
    });

    it('calls toJSON methods on arrays', function() {
      const value = [1, 2];
      value.toJSON = () => ({b: 2, a: 1});
      const expected = {a: 1, b: 2};

      expect(diffJson(value, expected)).to.eql([
        { count: 4, value: JSON.stringify(expected, null, '  '), added: false, removed: false }
      ]);
    });

    it('treats non-callable toJSON properties as normal properties (like JSON.stringify does)', function() {
      const x = {
        toJSON: 'aaa'
      };
      const y = {
        toJSON: 'bbb'
      };

      expect(diffJson(x, y)).to.eql([
        { count: 1, value: '{\n', removed: false, added: false },
        { count: 1, value: '  "toJSON": "aaa"\n', added: false, removed: true },
        { count: 1, value: '  "toJSON": "bbb"\n', added: true, removed: false },
        { count: 1, value: '}', removed: false, added: false }
      ]);
    });
  });

  describe('#canonicalize', function() {
    it('should put the keys in canonical order', function() {
      expect(Object.keys(canonicalize({b: 456, a: 123}))).to.eql(['a', 'b']);
    });

    it('should dive into nested objects', function() {
      const canonicalObj = canonicalize({b: 456, a: {d: 123, c: 456}});
      expect(Object.keys(canonicalObj.a)).to.eql(['c', 'd']);
    });

    it('should dive into nested arrays', function() {
      const canonicalObj = canonicalize({b: 456, a: [789, {d: 123, c: 456}]});
      expect(Object.keys(canonicalObj.a[1])).to.eql(['c', 'd']);
    });

    it('should handle circular references correctly', function() {
      const obj = {b: 456};
      obj.a = obj;
      const canonicalObj = canonicalize(obj);
      expect(Object.keys(canonicalObj)).to.eql(['a', 'b']);
      expect(Object.keys(canonicalObj.a)).to.eql(['a', 'b']);
    });

    it('should accept a custom JSON.stringify() replacer function', function() {
      expect(diffJson(
        {a: 123},
        {a: /foo/}
      )).to.eql([
        { count: 1, value: '{\n', removed: false, added: false },
        { count: 1, value: '  "a": 123\n', added: false, removed: true },
        { count: 1, value: '  "a": {}\n', added: true, removed: false },
        { count: 1, value: '}', removed: false, added: false }
      ]);

      expect(diffJson(
        {a: 123},
        {a: /foo/gi},
        {stringifyReplacer: (k, v) => v instanceof RegExp ? v.toString() : v}
      )).to.eql([
        { count: 1, value: '{\n', removed: false, added: false },
        { count: 1, value: '  "a": 123\n', added: false, removed: true },
        { count: 1, value: '  "a": "/foo/gi"\n', added: true, removed: false },
        { count: 1, value: '}', removed: false, added: false }
      ]);

      expect(diffJson(
        {a: 123},
        {a: new Error('ohaider')},
        {stringifyReplacer: (k, v) => v instanceof Error ? `${v.name}: ${v.message}` : v}
      )).to.eql([
        { count: 1, value: '{\n', removed: false, added: false },
        { count: 1, value: '  "a": 123\n', added: false, removed: true },
        { count: 1, value: '  "a": "Error: ohaider"\n', added: true, removed: false },
        { count: 1, value: '}', removed: false, added: false }
      ]);

      expect(diffJson(
        {a: 123},
        {a: [new Error('ohaider')]},
        {stringifyReplacer: (k, v) => v instanceof Error ? `${v.name}: ${v.message}` : v}
      )).to.eql([
        { count: 1, value: '{\n', removed: false, added: false },
        { count: 1, value: '  "a": 123\n', added: false, removed: true },
        { count: 3, value: '  "a": [\n    "Error: ohaider"\n  ]\n', added: true, removed: false },
        { count: 1, value: '}', removed: false, added: false }
      ]);
    });

    it('should only run each value through stringifyReplacer once', function() {
      expect(
        diffJson(
          {foo: '123ab'},
          {foo: '123xy'},
          {stringifyReplacer: (k, v) => typeof v === 'string' ? v.slice(0, v.length - 1) : v}
        )
      ).to.deep.equal(
        [
          { count: 1, value: '{\n', removed: false, added: false },
          { count: 1, value: '  "foo": "123a"\n', added: false, removed: true },
          { count: 1, value: '  "foo": "123x"\n', added: true, removed: false },
          { count: 1, value: '}', removed: false, added: false }
        ]
      );
    });

    it("should pass the same 'key' values to the replacer as JSON.stringify would", function() {
      const calls = [],
            obj1 = {a: ['q', 'r', 's', {t: []}]},
            obj2 = {a: ['x', 'y', 'z', {bla: []}]};
      diffJson(
        obj1,
        obj2,
        {stringifyReplacer: (k, v) => {
          calls.push([k, v]);
          return v;
        }}
      );

      // We run the same objects through JSON.stringify just to make unambiguous when reading this
      // test that we're checking for the same key/value pairs that JSON.stringify would pass to
      // the replacer.
      const jsonStringifyCalls = [];
      JSON.stringify(
        obj1,
        (k, v) => {
          jsonStringifyCalls.push([k, v]);
          return v;
        }
      );
      JSON.stringify(
        obj2,
        (k, v) => {
          jsonStringifyCalls.push([k, v]);
          return v;
        }
      );

      expect(jsonStringifyCalls).to.deep.equal([
        ['', {a: ['q', 'r', 's', {t: []}]}],
        ['a', ['q', 'r', 's', {t: []}]],
        ['0', 'q'],
        ['1', 'r'],
        ['2', 's'],
        ['3', {t: []}],
        ['t', []],
        ['', {a: ['x', 'y', 'z', {bla: []}]}],
        ['a', ['x', 'y', 'z', {bla: []}]],
        ['0', 'x'],
        ['1', 'y'],
        ['2', 'z'],
        ['3', {bla: []}],
        ['bla', []]
      ]);

      expect(calls).to.deep.equal(jsonStringifyCalls);
    });

    it('should call toJSON before the replacer, like JSON.stringify does', function() {
      const obj = {
        at: new Date('2026-01-02T03:04:05Z'),
        named: {toJSON: (k) => `key: ${k}`}
      };
      const calls = [];
      diffJson(obj, {}, {stringifyReplacer: (k, v) => {
        calls.push([k, v]);
        return v;
      }});

      const jsonStringifyCalls = [];
      JSON.stringify(obj, (k, v) => {
        jsonStringifyCalls.push([k, v]);
        return v;
      });

      expect(calls.slice(0, 3)).to.deep.equal(jsonStringifyCalls);
      expect(jsonStringifyCalls.slice(1)).to.deep.equal([
        ['at', '2026-01-02T03:04:05.000Z'],
        ['named', 'key: named']
      ]);
    });

    it('does not invoke a "toJSON" method of a replacer-returned object', function() {
      // Regression test: previously, if a replacer returned an object with a toJSON method, we'd
      // call the replacer, then pass the resulting object to JSON.stringify, which would call the
      // toJSON method. Thus the result would be inconsistent with what would happen if you just
      // called JSON.stringify. That's undesirable; this test confirms it no longer happens.
      const obj = { x: 'bla' };
      function replacer(k, v) {
        return k === 'x'
          ? { y: 'bla', toJSON() { return 'unexpected'; } }
          : v;
      }
      const diffResult = diffJson(obj, obj, {
        stringifyReplacer: replacer
      });
      expect(diffResult).to.eql([
        { count: 5, value: JSON.stringify({x: {y: 'bla'}}, null, '  '), added: false, removed: false }
      ]);
      // Proof that the result above is consistent with JSON.stringify:
      expect(diffResult[0].value).to.eql(JSON.stringify(obj, replacer, '  '));
    });

    it('does not invoke "toJSON" on a replacer-returned function (array slots become null; object properties are omitted)', function() {
      // Regression test for both array and object branches in canonicalize(). If the replacer
      // returns a function with an own `toJSON` property, JSON.stringify with that replacer would
      // NOT call that toJSON (because replacer runs after toJSON). It would serialize array elements
      // as null and omit object properties. But if we copy the function through unchanged and then do
      // a final replacer-less JSON.stringify call, that final call would invoke function.toJSON() and
      // produce a string instead. We must pre-resolve unrepresentable values ourselves to avoid this
      // second-pass toJSON call.
      function replacementFunction() {}
      replacementFunction.toJSON = function() {
        return 'unexpected-second-pass-call';
      };

      const arrayObj = ['original'];
      function arrayReplacer(k, v) {
        return k === '0' ? replacementFunction : v;
      }
      const arrayDiffResult = diffJson(arrayObj, arrayObj, {
        stringifyReplacer: arrayReplacer
      });
      expect(arrayDiffResult).to.eql([
        { count: 3, value: JSON.stringify([null], null, '  '), added: false, removed: false }
      ]);
      expect(arrayDiffResult[0].value).to.eql(JSON.stringify(arrayObj, arrayReplacer, '  '));

      const objectObj = {x: 'original'};
      function objectReplacer(k, v) {
        return k === 'x' ? replacementFunction : v;
      }
      const objectDiffResult = diffJson(objectObj, objectObj, {
        stringifyReplacer: objectReplacer
      });
      expect(objectDiffResult).to.eql([
        { count: 1, value: JSON.stringify({}, null, '  '), added: false, removed: false }
      ]);
      expect(objectDiffResult[0].value).to.eql(JSON.stringify(objectObj, objectReplacer, '  '));
    });

    it('unboxes a replacer-returned String object before serialization (array: value kept, object: property kept)', function() {
      // Regression test: when replacer returns a boxed primitive wrapper object (e.g. new String()),
      // JSON.stringify unboxes it after replacer runs. We need to mirror that; if we recurse into the
      // wrapper as a plain object, we'd emit character-index keys instead of the primitive string.
      function makeReplacementStringObject() {
        const replacementStringObject = Object('abc');
        replacementStringObject.toJSON = function() {
          return 'unexpected-second-pass-call';
        };
        return replacementStringObject;
      }

      const arrayObj = ['orig'];
      function arrayReplacer(k, v) {
        return k === '0' && v === 'orig' ? makeReplacementStringObject() : v;
      }
      const arrayDiffResult = diffJson(arrayObj, arrayObj, {
        stringifyReplacer: arrayReplacer
      });
      expect(arrayDiffResult).to.eql([
        { count: 3, value: JSON.stringify(['abc'], null, '  '), added: false, removed: false }
      ]);
      expect(arrayDiffResult[0].value).to.eql(JSON.stringify(arrayObj, arrayReplacer, '  '));

      const objectObj = {x: 'orig'};
      function objectReplacer(k, v) {
        return k === 'x' && v === 'orig' ? makeReplacementStringObject() : v;
      }
      const objectDiffResult = diffJson(objectObj, objectObj, {
        stringifyReplacer: objectReplacer
      });
      expect(objectDiffResult).to.eql([
        { count: 3, value: JSON.stringify({x: 'abc'}, null, '  '), added: false, removed: false }
      ]);
      expect(objectDiffResult[0].value).to.eql(JSON.stringify(objectObj, objectReplacer, '  '));
    });

    it('does not invoke a "toJSON" method an object returned by a "toJSON" method', function() {
      // Regression test: previously, if a `toJSON` method returned an object which itself had a
      // toJSON method, we'd call the first `toJSON` in `canonicalize`, then pass the resulting
      // object to JSON.stringify, which would call the second toJSON method. Thus the result
      // would be inconsistent with what would happen if you just called JSON.stringify (which
      // would only invoke the first `toJSON`). That's undesirable; this test confirms it no
      // longer happens.
      const oldObj = { toJSON: () => ({ x: 'bla', toJSON: () => 'foo' }) };
      const newObj = { x: 'bla' };
      const diffResult = diffJson(oldObj, newObj);
      expect(diffResult).to.eql([
        { count: 3, value: JSON.stringify({x: 'bla'}, null, '  '), added: false, removed: false }
      ]);
      // Proof that the result above is consistent with JSON.stringify:
      expect(diffResult[0].value).to.eql(JSON.stringify(oldObj, null, '  '));
      expect(diffResult[0].value).to.eql(JSON.stringify(newObj, null, '  '));
    });

    it('DOES invoke a "toJSON" method NESTED in an object returned by a "toJSON" method', function() {
      // Like the test above, this is just confirming that our behaviour is consistent with JSON.stringify
      const obj = { toJSON: () => ({ x: { toJSON: () => 'foo' } }) };
      const diffResult = diffJson(obj, obj);
      expect(diffResult).to.eql([
        { count: 3, value: JSON.stringify({ x: 'foo' }, null, '  '), added: false, removed: false }
      ]);
      // Proof that the result above is consistent with JSON.stringify:
      expect(diffResult[0].value).to.eql(JSON.stringify(obj, null, '  '));
    });

    it("doesn't throw on Object.create(null)", function() {
      let diff;
      expect(function() {
        diff = diffJson(
          Object.assign(Object.create(null), {a: 123}),
          {b: 456}
        );
      }).not.to['throw']();
      expect(diff).to.eql([
        { count: 1, value: '{\n', removed: false, added: false },
        { count: 1, value: '  "a": 123\n', removed: true, added: false },
        { count: 1, value: '  "b": 456\n', removed: false, added: true },
        { count: 1, value: '}', removed: false, added: false }
      ]);
    });
  });
});
