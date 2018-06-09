let rlp = require("rlp");
let assert = require("chai").assert;
let helper = artifacts.require("Helper");

let toHex = (buff) => { return "0x" + buff.toString("hex") };

let payloadOffset = (str) => {
    // predefined constants as stated in the RLP spec
    let STRING_SHORT_START = parseInt('0x80');
    let STRING_LONG_START = parseInt('0xb8');
    let LIST_SHORT_START = parseInt('0xc0');
    let LIST_LONG_START = parseInt('0xf8');

    let byte0 = parseInt('0x' + str.substring(0, 2))
    if (byte0 < STRING_SHORT_START) 
        return 0;
    else if(byte0 < STRING_LONG_START || (byte0 >= LIST_SHORT_START && byte0 < LIST_LONG_START))
        return 1;
    else if (byte0 < LIST_SHORT_START) // extra `+1` for the length of the length in bytes
        return byte0 - (STRING_LONG_START - 1) + 1;
    else 
        return byte - (LIST_LONG_START - 1) + 1;
}

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
        assert(result.toNumber() == str.length, `[1, 2, 3] should only take ${str.length} bytes to rlp encoded`);

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

        // empty structures
        str = [];
        str = rlp.encode(str);
        result = await helper.numItems.call(toHex(str));
        assert(result.toNumber() == 0, "Incorrect calculate rlp item byte length for empty list");

        str = '';
        str = rlp.encode(str);
        result = await helper.numItems.call(toHex(str));
        assert(result.toNumber() == 0, "Incorrect calculate rlp item byte length for empty string");

    });

    it("detects the correct about of items in a list", async () => {
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
        let str = rlp.encode([1, 2, 3]).toString('hex');
        let result = await helper.toBytes.call("0x" + str);
        str = str.slice(payloadOffset(str)*2); // remove '0x' and prefixes
        assert(result == "0x"+str, "Incorrect toByte conversion");

        let num = 1024;
        result = await helper.toUint.call(toHex(rlp.encode(num)))
        assert(result == num, "Incorrect toUint conversion");

        str = accounts[0];
        result = await helper.toAddress.call(toHex(rlp.encode(str)));
        assert(result == str, "Incorrect toAddress conversion");

        result = await helper.toBoolean.call(toHex(rlp.encode(1)));
        assert(result == true, "Incorrect toBoolean conversion");

        str = [accounts[0], 1, 10000];
        result = await helper.customDestructure.call(toHex(rlp.encode(str)));
        assert(result[0] == str[0], "First element incorrectly decoded");
        assert(result[1] == true, "Second element incorrectly decoded")
        assert(result[2].toNumber() == str[2], "Third element incorrectly decoded");

        str = [[accounts[0], 1024]];
        result = await helper.customNestedDestructure(toHex(rlp.encode(str)));
        assert(result[0] == str[0][0], "Nested first element incorrectly decoded");
        assert(result[1].toNumber() == str[0][1], "Nested second element incorrectly decoded");
    });
});
