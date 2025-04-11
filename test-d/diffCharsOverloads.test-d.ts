import {expectType} from 'tsd';
import {ChangeObject, diffChars} from '../libesm/index.js';

const result1 = diffChars('foo', 'bar', {ignoreCase: true});
expectType<ChangeObject<string>[]>(result1);

const result2 = diffChars('foo', 'bar');
expectType<ChangeObject<string>[]>(result2);

const result3 = diffChars('foo', 'bar', {timeout: 100});
expectType<ChangeObject<string>[] | undefined>(result3);

const result4 = diffChars('foo', 'bar', {maxEditLength: 100});
expectType<ChangeObject<string>[] | undefined>(result4);

const result5 = diffChars('foo', 'bar', cbResult => {
    expectType<ChangeObject<string>[]>(cbResult)
});
expectType<undefined>(result5);

const result6 = diffChars('foo', 'bar', {
    callback: cbResult => {
        expectType<ChangeObject<string>[]>(cbResult);
    }
});
expectType<undefined>(result6);

const result7 = diffChars('foo', 'bar', {
    timeout: 100,
    callback: cbResult => {
        expectType<ChangeObject<string>[] | undefined>(cbResult)
    }
});
expectType<undefined>(result7);
