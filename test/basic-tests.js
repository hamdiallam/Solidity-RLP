let rlp = require("rlp");
let helper = artifacts.require("Helper");

let toHex = (buff) => { return "0x" + buff.toString("hex") };

contract("RLPReader", async () => {
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

    it("detects the entire byte length of an RLP item" , async () => {
        let str = [1, 2, 3];
        str = rlp.encode(str);
        let result = await helper.testItemLength.call(toHex(str));
        assert(result.toNumber() == str.length, `[1, 2, 3] should only take ${str.length} bytes to rlp encoded`);

        str = [];
        for (let i = 0; i < 1024; i++) {
            str.push('a');
        }
        str = rlp.encode(str);
        result = await helper.testItemLength.call(toHex(str));
        assert(result.toNumber() == str.length, `list of 1025 a characters should only take ${str.length} bytes to rlp encode`);

        str = rlp.encode(1);
        result = await helper.testItemLength.call(toHex(str));
        assert(result.toNumber() == str.length, `the number 1 should only take ${str.length} bytes to rlp encode`);

        str = '';
        for(let i = 0; i < 1024; i++) {
            str += 'a';
        }
        str = rlp.encode(str);
        result = await helper.testItemLength.call(toHex(str));
        assert(result.toNumber() == str.length, `string of 1024 a characters should only take ${str.length} bytes to rlp encode`);

        str = 'somenormalstringthatisnot55characterslong';
        let len = str.length;
        str = rlp.encode(str);
        result = await helper.testItemLength.call(toHex(str));
        assert(result.toNumber() == str.length, `string of ${len} a characters should only take ${str.length} bytes to rlp encode`);

    });

    it("detects the correct about of items in a list", async () => {
        let str = [1, 2, 3];
        let result = await helper.numItems.call(toHex(rlp.encode(str)));
        assert(result.toNumber() == str.length, "Number of items in an rlp encoded list wrongly detected");
    });
});
