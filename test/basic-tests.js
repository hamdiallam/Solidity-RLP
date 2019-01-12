let rlp = require("rlp");
let assert = require("chai").assert;
let helper = artifacts.require("Helper");

let toHex = (buf) => { 
    buf = buf.toString('hex');
    if (buf.substring(0, 2) == "0x")
        return buf;
    return "0x" + buf.toString("hex");
};

let catchError = function(promise) {
  return promise.then(result => [null, result])
      .catch(err => [err]);
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
        bytes = rlp.encode(str).toString('hex');
        result = await helper.toBytes.call(toHex(bytes));
        assert(result == str, "Incorrect toBytes conversion for bytes longer than 1 evm word");

        // toUint
        let num = 65537; // larger than a byte
        result = await helper.toUint.call(toHex(rlp.encode(num)))
        assert(result == num, "Incorrect toUint conversion");

        // toAddress
        str = accounts[0];
        result = await helper.toAddress.call(toHex(rlp.encode(str)));
        assert(result == str, "Incorrect toAddress conversion");

        // toAddress with a short address
        str = '0x0000000000000000000000000000000000000123';
        result = await helper.toAddress.call(toHex(rlp.encode("0x123")));
        assert(result == str, "Incorrect short address conversion");

        // toAddress with zero address
        str = '0x0000000000000000000000000000000000000000';
        result = await helper.toAddress.call(toHex(rlp.encode("0x0")));
        assert(result == str, "Incorrect zero short address conversion");

        // toBoolean
        result = await helper.toBoolean.call(toHex(rlp.encode(1)));
        assert(result == true, "Incorrect toBoolean conversion");

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
        [err] = await catchError(helper.toBoolean(toHex(rlp.encode(256))));
        if (!err) {
            assert.fail(null, null, "converted a boolean larger than a byte");
        }
        [err] = await catchError(helper.toBoolean(toHex('')));
        if (!err) {
            assert.fail(null, null, "converted a boolean of empty bytes");
        }

        [err] = await catchError(helper.toAddress(toHex('')));
        if (!err) {
            assert.fail(null, null, "converted an address larger than 20 bytes");
        }
        [err] = await catchError(helper.toAddress(toHex('')));
        if (!err) {
            assert.fail(null, null, "converted an address of empty bytes");
        }

        [err] = await catchError(helper.toUint(toHex('')));
        if (!err) {
            assert.fail(null, null, "converted a uint of empty bytes");
        }

        [err] = await catchError(helper.toBytes(toHex('')));
        if (!err) {
            assert.fail(null, null, "converted to bytes of empty bytes");
        }
    });
});
