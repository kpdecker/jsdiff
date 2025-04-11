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
