import {diffBytes} from '../../lib/diff/buffer';
import {convertChangesToXML} from '../../lib/convert/xml';

import {expect} from 'chai';

describe('diff/buffer', function() {
    describe('#diffBytes', function() {
        it('Should diff bytes', function() {
            const diffResult = diffBytes(Buffer.from('New Value.'), Buffer.from('New ValueMoreData.'));
            const diffResultWithStringValues = diffResult.map((change) => Object.assign({}, change, {value: change.value.toString()}));
            expect(convertChangesToXML(diffResultWithStringValues)).to.equal('New Value<ins>MoreData</ins>.');
        });

        describe('unicode character bytes', function() {
            it('will not be counted as a single character', function() {
                // Fóó: [46 C3 B3 C3 B3]
                // Föó: [46 C3 B6 C3 B3]
                const diffResult = diffBytes(Buffer.from('Fóó'), Buffer.from('Föó'));
                const diffResultWithByteArrays = diffResult.map((change) => Object.assign({}, change, {value: [...change.value]}));

                expect(diffResultWithByteArrays.length).to.equal(4);

                // First two bytes are the same
                expect(diffResultWithByteArrays[0].count).to.equal(2);
                expect(diffResultWithByteArrays[0].value).to.eql([0x46, 0xC3]);

                expect(diffResultWithByteArrays[1].count).to.equal(1);
                expect(diffResultWithByteArrays[1].removed).to.equal(true);
                expect(diffResultWithByteArrays[1].value).to.eql([0xB3]);

                expect(diffResultWithByteArrays[2].count).to.equal(1);
                expect(diffResultWithByteArrays[2].added).to.equal(true);
                expect(diffResultWithByteArrays[2].value).to.eql([0xB6]);

                expect(diffResultWithByteArrays[3].count).to.equal(2);
                expect(diffResultWithByteArrays[3].value).to.eql([0xC3, 0xB3]);
            });
        });
    });
});
