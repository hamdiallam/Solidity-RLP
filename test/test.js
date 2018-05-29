let RLP = require('rlp');


let rlp = artifacts.require('RLP');

let toHex = (buff) => { return '0x' + buff.toString('hex') };

contract('RLP', async () => {
    let item, encodeItem, result;
    before(async () => {
        rlp = await rlp.deployed();
    });
});
