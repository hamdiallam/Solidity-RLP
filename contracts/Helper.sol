pragma solidity ^0.5.0;

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
            memPtr := add(item, 0x20)
        }

        return _itemLength(memPtr);
    }

    function rlpLen(bytes memory item) public pure returns (uint) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.rlpLen();
    }

    function payloadLen(bytes memory item) public pure returns (uint) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.payloadLen();
    }

    function numItems(bytes memory item) public pure returns (uint) {
        RLPReader.RLPItem[] memory rlpItem = item.toRlpItem().toList();
        return rlpItem.length;
    }

    function toRlpBytes(bytes memory item) public pure returns (bytes memory) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.toRlpBytes();
    }

    function toBytes(bytes memory item) public pure returns (bytes memory) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.toBytes();
    }

    function toUint(bytes memory item) public pure returns (uint) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.toUint();
    }

    function toUintStrict(bytes memory item) public pure returns (uint) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.toUintStrict();
    }

    function toAddress(bytes memory item) public pure returns (address) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.toAddress();
    }

    function toBoolean(bytes memory item) public pure returns (bool) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.toBoolean();
    }

    function bytesToString(bytes memory item) public pure returns (string memory) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return string(rlpItem.toBytes());
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

    function customNestedToRlpBytes(bytes memory item) public pure returns (bytes memory) {
        RLPReader.RLPItem[] memory items = item.toRlpItem().toList();
        return items[0].toRlpBytes();
    }

    /** Copied verbatim from the reader contract due to scope **/
    uint8 constant STRING_SHORT_START = 0x80;
    uint8 constant STRING_LONG_START  = 0xb8;
    uint8 constant LIST_SHORT_START   = 0xc0;
    uint8 constant LIST_LONG_START    = 0xf8;
    function _itemLength(uint memPtr) private pure returns (uint len) {
        uint byte0;
        assembly {
            byte0 := byte(0, mload(memPtr))
        }

        if (byte0 < STRING_SHORT_START)
            return 1;
        
        else if (byte0 < STRING_LONG_START)
            return byte0 - STRING_SHORT_START + 1;

        else if (byte0 < LIST_SHORT_START) {
            assembly {
                let byteLen := sub(byte0, 0xb7) // # of bytes the actual length is
                memPtr := add(memPtr, 1) // skip over the first byte
                
                /* 32 byte word size */
                let dataLen := div(mload(memPtr), exp(256, sub(32, byteLen))) // right shifting to get the len
                len := add(dataLen, add(byteLen, 1))
            }
        }

        else if (byte0 < LIST_LONG_START) {
            return byte0 - LIST_SHORT_START + 1;
        } 

        else {
            assembly {
                let byteLen := sub(byte0, 0xf7)
                memPtr := add(memPtr, 1)

                let dataLen := div(mload(memPtr), exp(256, sub(32, byteLen))) // right shifting to the correct length
                len := add(dataLen, add(byteLen, 1))
            }
        }
    }
}
