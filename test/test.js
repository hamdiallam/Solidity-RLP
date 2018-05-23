let RLP = require('rlp');


let rlp = artifacts.require('RLP');

let toHex = (buff) => { return '0x' + buff.toString('hex') };

contract('RLP', async () => {
    let item, encodeItem, result;
    before(async () => {
        rlp = await rlp.deployed();
    });

    it('properly encodes single byte item less than 0x7f', async () => {
        item = 0x10;
        encodedItem = toHex(RLP.encode(item));

        result = await rlp.encodeItem.call(item);
        assert(result == encodedItem, "library incorrectly encoded single byte item");
    });

    it('properly encodes a string with length less than 0xb8', async () => {
        item = 'hello world';
        encodedItem = toHex(RLP.encode(item))

        result = await rlp.encodeItem.call(item);
        assert(result == encodedItem, "library incorrect encoded the string");
    });
});
