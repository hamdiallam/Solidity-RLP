pragma solidity ^0.4.24;

/*
* Used to proxy function calls to the RLPReader for testing
*/
import "./RLPReader.sol";

contract Helper {
    using RLPReader for bytes;
    using RLPReader for uint;
    using RLPReader for RLPReader.RLPItem;

    function isList(bytes memory item) public pure returns (bool) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.isList();
    }

    function itemLength(bytes memory item) public pure returns (uint) {
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

    function toBytes(bytes memory item) public pure returns (bytes) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.toBytes();
    }

    function toUint(bytes memory item) public pure returns (uint) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.toUint();
    }

    function toAddress(bytes memory item) public pure returns (address) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.toAddress();
    }

    function toBoolean(bytes memory item) public pure returns (bool) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.toBoolean();
    }

    /* custom destructuring */
    function customDestructure(bytes memory item) public pure returns (address, bool, uint) {
        // first three elements follow the return types in order. Ignore the rest
        RLPReader.RLPItem[] memory items = item.toRlpItem().toList();
        return (items[0].toAddress(), items[1].toBoolean(), items[2].toUint());
    }

    function customNestedDestructure(bytes memory item) public pure returns (address, uint) {
        RLPReader.RLPItem[] memory items = item.toRlpItem().toList();
        items = items[0].toList();
        return (items[0].toAddress(), items[1].toUint());
    }
}
