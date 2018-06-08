pragma solidity ^0.4.24;

import "./RLPReader.sol";

contract Helper {
    using RLPReader for uint;
    using RLPReader for bytes;
    using RLPReader for RLPReader.RLPItem;

    function isList(bytes memory item) public pure returns (bool) {
        return item.isList();
    }

    function testItemLength(bytes memory item) public pure returns (uint) {
        uint memPtr;
        assembly {
            memPtr := add(0x20, item)
        }

        return memPtr._itemLength();
    }

    function numItems(bytes memory item) public pure returns (uint) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.numItems();
    }
}
