import {expectType} from 'tsd';
import {diffJson} from '../libesm/index.js';
import {canonicalize} from '../libesm/diff/json.js';

diffJson({omit: true, value: 12}, {}, {
    stringifyReplacer(key: string, value: any) {
        expectType<any>(this);
        expectType<string>(key);
        return key === 'value' && this.omit ? '<redacted>' : value;
    }
});

canonicalize({value: 1}, null, null, function(key, value) {
    expectType<any>(this);
    expectType<string>(key);
    return this[key] === value ? value : null;
});
