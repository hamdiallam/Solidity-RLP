let rlp = require("rlp");
let assert = require("chai").assert;
let helper = artifacts.require("Helper");

let toHex = (buf) => { 
    buf = buf.toString('hex');
    if (buf.substring(0, 2) == "0x")
        return buf;
    return "0x" + buf.toString("hex");
};

let catchError = (promise) => {
  return promise.then(result => [null, result])
      .catch(err => [err]);
};

let toRLPHeader = (block) => {
    return rlp.encode([
        block.parentHash,
        block.sha3Uncles,
        block.miner,
        block.stateRoot,
        block.transactionsRoot,
        block.receiptsRoot,
        block.logsBloom,
        new web3.utils.BN(block.difficulty),
        new web3.utils.BN(block.number),
        block.gasLimit,
        block.gasUsed,
        block.timestamp,
        block.extraData,
        block.mixHash,
        block.nonce,
    ]);
};

contract("RLPReader", async (accounts) => {
    before(async () => {
        helper = await helper.deployed();
    });

    it("detects an encoded list", async () => {
        let list = [1,2,3];
        list = toHex(rlp.encode(list));

        let result = await helper.isList.call(list);
        assert(result === true, "encoded list not detected");

        list = 'thisisnotalistbutjustareallylongstringsoyeahdealwithit';
        list = toHex(rlp.encode(list));

        result = await helper.isList.call(list);
        assert(result === false, "list wrongly detected");
    });

    // covers 4 different scenarios listed on the spec in addition to the nested/empty structures
    it("detects the entire byte length of an RLP item" , async () => {
        let str = [1, 2, 3];
        str = rlp.encode(str);
        let result = await helper.itemLength.call(toHex(str));
        assert(result.toNumber() == str.length, `[1, 2, 3] should only take ${str.length} bytes to rlp encode`);

        str = [];
        for (let i = 0; i < 1024; i++) {
            str.push('a');
        }
        str = rlp.encode(str);
        result = await helper.itemLength.call(toHex(str));
        assert(result.toNumber() == str.length, `list of 1024 a characters should only take ${str.length} bytes to rlp encode`);

        str = rlp.encode(1);
        result = await helper.itemLength.call(toHex(str));
        assert(result.toNumber() == str.length, `the number 1 should only take ${str.length} bytes to rlp encode`);

        str = '';
        for (let i = 0; i < 1024; i++) {
            str += 'a';
        }
        str = rlp.encode(str);
        result = await helper.itemLength.call(toHex(str));
        assert(result.toNumber() == str.length, `string of 1024 a characters should only take ${str.length} bytes to rlp encode`);

        str = 'somenormalstringthatisnot55characterslong';
        let len = str.length;
        str = rlp.encode(str);
        result = await helper.itemLength.call(toHex(str));
        assert(result.toNumber() == str.length, `string of ${len} a characters should only take ${str.length} bytes to rlp encode`);

        str = [[2,3], 1]; // test nested structures
        str = rlp.encode(str);
        result = await helper.itemLength.call(toHex(str));
        assert(result.toNumber() == str.length, "Incorrect calculated rlp item byte length for nested structure");

        str = [];
        str = rlp.encode(str);
        result = await helper.itemLength.call(toHex(str));
        // should only contain the list prefix
        assert(result.toNumber() == 1, "Incorrect calculate rlp item byte length for empty list");
    });

    it("detects the payload length of encoded data", async () => {
        let result;

        result = await helper.payloadLen.call(toHex(rlp.encode(1)));
        assert(result.toNumber() == 1, "incorrect payload length of a single byte encoding");

        result = await helper.payloadLen.call(toHex(rlp.encode(toHex(Array(36).fill(0).join('')))));
        assert(result.toNumber() == 18, "incorrect payload length of a 18 bytes");

        result = await helper.payloadLen.call(toHex(rlp.encode(toHex(Array(200).fill(0).join('')))));
        assert(result.toNumber() == 100, "incorrect payload length of a 100 bytes");
    });

    it("detects the correct amount of items in a list", async () => {
        let assertString = "Number of items in an rlp encoded list wrongly detected: ";
        let str = [1, 2, 3];
        let result = await helper.numItems.call(toHex(rlp.encode(str)));
        assert(result.toNumber() == str.length, assertString);

        str = [];
        for (let i = 0; i < 1024; i++) {
            str.push('a');
        }
        result = await helper.numItems.call(toHex(rlp.encode(str)));
        assert(result.toNumber() == str.length, assertString + "string of 1024 `a` characters");

        str = [];
        result = await helper.numItems.call(toHex(rlp.encode(str)));
        assert(result.toNumber() == str.length, assertString + "empty list");

        str = [[2,3], 1]; // test nested structures
        result = await helper.numItems.call(toHex(rlp.encode(str)));
        assert(result.toNumber() == str.length, assertString + "nested structure");
    });

    it("properly handles data conversions", async () => {
        // toBytes
        let str = "0x12345abc";
        let bytes = rlp.encode(str).toString('hex');
        let result = await helper.toBytes.call(toHex(bytes));
        assert(result == str, "Incorrect toBytes conversion");

        str = "0x1234" + Buffer.alloc(33).toString('hex'); // 35 str total. longer than 1 evm word
        result = await helper.toBytes.call(toHex(rlp.encode(str).toString('hex')));
        assert(result == str, "Incorrect toBytes conversion for bytes longer than 1 evm word");

        // toUint
        let num = 65537; // larger than a byte
        result = await helper.toUint.call(toHex(rlp.encode(num)))
        assert(result == num, "Incorrect toUint conversion");

        result = await helper.toUint.call(toHex(rlp.encode(toHex(Array(64).fill(0).join('')))));
        assert(result == 0, "Incorrect toUint conversion")

        // toUintStrict
        num = Array(63).fill(0).join('') + '1';
        result = await helper.toUint.call(toHex(rlp.encode(toHex(num))));
        assert(result == 1, "Incorrect toUint conversion")

        // toAddress
        str = accounts[0];
        result = await helper.toAddress.call(toHex(rlp.encode(str)));
        assert(result == str, "Incorrect toAddress conversion");

        // toBoolean
        result = await helper.toBoolean.call(toHex(rlp.encode(1)));
        assert(result == true, "Incorrect toBoolean true conversion");

        result = await helper.toBoolean.call(toHex(rlp.encode(0)));
        assert(result == false, "Incorrect toBoolean false conversion");

        // Mix of data types
        str = [accounts[0], 1, 65537];
        result = await helper.customDestructure.call(toHex(rlp.encode(str)));
        assert(result[0] == str[0], "First element incorrectly decoded");
        assert(result[1] == true, "Second element incorrectly decoded")
        assert(result[2].toNumber() == str[2], "Third element incorrectly decoded");

        str = [[accounts[0], 1024]];
        result = await helper.customNestedDestructure.call(toHex(rlp.encode(str)));
        assert(result[0] == str[0][0], "Nested first element incorrectly decoded");
        assert(result[1].toNumber() == str[0][1], "Nested second element incorrectly decoded");

        // String conversion
        str = "hello";
        result = await helper.bytesToString.call(toHex(rlp.encode(str)));
        assert(result == str, "Incorrect conversion to a string");
    });

    it("correctly converts an rlpItem to it's raw byte from", async () => {
        let str = rlp.encode([1,2,3]).toString('hex');

        let result = await helper.toRlpBytes.call(toHex(str));
        assert(toHex(str) == toHex(result), "incorrectly converted to the raw byte form");

        // check nested structures
        let nestedStr = ["something"];
        str = rlp.encode([nestedStr, "foo"]).toString('hex');
        nestedStr = rlp.encode(nestedStr).toString('hex');
        result = await helper.customNestedToRlpBytes.call(toHex(str));
        assert(toHex(result) == toHex(nestedStr),
            "incorrectly converted nested structure to it's raw rlp bytes");
    });

    it("catches bad input", async () => {
        let err;
        [err] = await catchError(helper.toBoolean.call(toHex(rlp.encode(256))));
        if (!err) {
            assert.fail(null, null, "converted a boolean larger than a byte");
        }
        [err] = await catchError(helper.toBoolean.call(toHex('')));
        if (!err) {
            assert.fail(null, null, "converted a boolean of empty bytes");
        }

        [err] = await catchError(helper.toAddress.call(toHex(rlp.encode("0x123"))));
        if (!err)
            assert.fail(null, null, "converted an address less than 20 bytes");

        [err] = await catchError(helper.toAddress.call(toHex(rlp.encode(accounts[0] + "1"))));
        if (!err)
            assert.fail(null, null, "converted an address larger than 20 bytes");

        [err] = await catchError(helper.toAddress.call(toHex('')));
        if (!err) {
            assert.fail(null, null, "converted an address of empty bytes");
        }

        [err] = await catchError(helper.toUint.call(toHex('')));
        if (!err) {
            assert.fail(null, null, "converted a uint of empty bytes");
        }
        [err] = await catchError(helper.toUint.call(toHex(rlp.encode(toHex(Array(66).fill(0).join(''))))));
        if (!err) {
            assert.fail(null, null, "converted a uint larger than 32 bytes");
        }
        [err] = await catchError(helper.toUintStrict.call(toHex(rlp.encode(10))));
        if (!err) {
            assert.fail(null, null, "converted a uint without padding to 32 bytes with strict enforcement");
        }

        [err] = await catchError(helper.toBytes.call(toHex('')));
        if (!err) {
            assert.fail(null, null, "converted to bytes of empty bytes");
        }
    });

    it("correctly creates an iterator", async () => {
        let err;

        let data = rlp.encode("foo");
        [err] = await catchError(helper.toIterator.call(toHex(data)));
        if (!err)
            assert.fail(null, null, "constructed an iterator from something not a list");

        data = rlp.encode([1, "isvalid", 2]);
        [err, _] = await catchError(helper.toIterator.call(toHex(data)));
        if (err)
            assert.fail(null, null, "could not construct iterator out of a valid list")

        data = rlp.encode([["yeah!"]])
        let result = await helper.nestedIteration.call(toHex(data));
        assert(result == "yeah!", "could not retrieve the string in the sublist")
    });

    it("correctly iterates over an RLP list (e.g., an RLP encoded block header)", async () => {
        // Block 8000000 from the Ethereum main net with a couple of fields omitted
        const block = {
            parentHash: '0x487e074bba7f0749950d7e2f226307c8ac388cb0410cfe817931a5a44077e159',
            sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
            stateRoot: '0x7b814195793c699d345339dd7a4225112ad91b9ba7f03787563a9e98ba692e52',
            transactionsRoot: '0xad6c9f611dfdd446855cb430b8392e20538db4f0349336063e710c6c483e9e43',
            receiptsRoot: '0xf022ddad6e90316614df496922cb73508a9abecfda2d3076a5f1129a01497869',
            difficulty: '2037888242889388',
            number: 8000000,
            extraData: '0x5050594520737061726b706f6f6c2d6574682d636e2d687a',
            gasLimit: 8002255,
            gasUsed: 7985243,
            timestamp: 1561100149,
            nonce: '0x00daa7b00156a516',
            hash: '0x4e454b49dc8a2e2a229e0ce911e9fd4d2aa647de4cf6e0df40cf71bff7283330',
            logsBloom: '0xc29754f51412a148104c6716000a3084218a2c2eb411080f0204cc2000182520544cd8896089451840a4c3d492209909825614420c21350104e0a81810b82018838f088200f3022616869299810060089f08291289c920ea25d1006460513529851001477aa905491218501179c40b01348430400ad167600e0141344140022135a01484482520131c40141583050710042168c050220010c1c443f2291b41688340084524418d0048b1328844438630c88000940524800c4001202a1540b00498350932001812960220043b200016c02cf06433548b5100429220aa00423421e25121330b410051204098d8406a600b3610403d208c8381c51bd15a9dc30004',
            miner: '0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c',
            mixHash: '0x8a24dc2c8fb497ff40a622173d9c7804a274de3da4b335b2ba0e3c53e3fae714',
            totalDifficulty: '10690776258913596267754',
        };
        const rlpHeader = toRLPHeader(block);
        const result = await helper.toBlockHeader.call(rlpHeader);
        assert(result.parentHash == block.parentHash, "parentHash not equal");
        assert(result.sha3Uncles == block.sha3Uncles, "sha3Uncles not equal");
        assert(result.stateRoot  == block.stateRoot,  "stateRoot not equal");
        assert(result.transactionsRoot == block.transactionsRoot, "transactionsRoot not equal");
        assert(result.receiptsRoot == block.receiptsRoot, "receiptsRoot not equal");
        assert(result.difficulty == block.difficulty, "difficulty not equal");
        assert(result.number == block.number, "number not equal");
        assert(result.gasLimit == block.gasLimit, "gasLimit not equal");
        assert(result.gasUsed == block.gasUsed, "gasUsed not equal");
        assert(result.timestamp == block.timestamp, "timestamp not equal");
        assert(result.nonce.toString() == web3.utils.toBN(block.nonce).toString(), "nonce not equal");
    });
});
