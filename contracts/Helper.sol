// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.5.0 <0.7.0;

/*
* Used to proxy function calls to the RLPReader for testing
*/
import "./RLPReader.sol";

contract Helper {
    using RLPReader for bytes;
    using RLPReader for uint;
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for RLPReader.Iterator;

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

    function rlpBytesKeccak256(bytes memory item) public pure returns (bytes32) {
        RLPReader.RLPItem memory rlpItem = item.toRlpItem();
        return rlpItem.rlpBytesKeccak256();
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

    function toIterator(bytes memory item) public pure {
        // we just care that this does not revert
        item.toRlpItem().iterator();
    }

    // expects [["somestring"]]
    function nestedIteration(bytes memory item) public pure returns (string memory) {
        RLPReader.Iterator memory iter = item.toRlpItem().iterator();
        RLPReader.Iterator memory subIter = iter.next().iterator();
        string memory result = string(subIter.next().toBytes());

        require(!iter.hasNext());
        require(!subIter.hasNext());

        return result;
    }

    function toBlockHeader(bytes memory rlpHeader) public pure returns (
        bytes32 parentHash, bytes32 sha3Uncles, bytes32 stateRoot, bytes32 transactionsRoot, bytes32 receiptsRoot,
        uint difficulty, uint number, uint gasLimit, uint gasUsed, uint timestamp, uint nonce) {

        RLPReader.Iterator memory it = rlpHeader.toRlpItem().iterator();
        uint idx;
        while(it.hasNext()) {
            if ( idx == 0 )      parentHash       = bytes32(it.next().toUint());
            else if ( idx == 1 ) sha3Uncles       = bytes32(it.next().toUint());
            else if ( idx == 3 ) stateRoot        = bytes32(it.next().toUint());
            else if ( idx == 4 ) transactionsRoot = bytes32(it.next().toUint());
            else if ( idx == 5 ) receiptsRoot     = bytes32(it.next().toUint());
            else if ( idx == 7 ) difficulty       = it.next().toUint();
            else if ( idx == 8 ) number           = it.next().toUint();
            else if ( idx == 9 ) gasLimit         = it.next().toUint();
            else if ( idx == 10 ) gasUsed         = it.next().toUint();
            else if ( idx == 11 ) timestamp       = it.next().toUint();
            else if ( idx == 14 ) nonce           = it.next().toUint();
            else it.next();

            idx++;
        }
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

    /* Copied verbatim from the reader contract due to scope */
    uint8 constant STRING_SHORT_START = 0x80;
    uint8 constant STRING_LONG_START  = 0xb8;
    uint8 constant LIST_SHORT_START   = 0xc0;
    uint8 constant LIST_LONG_START    = 0xf8;
    function _itemLength(uint memPtr) private pure returns (uint) {
       uint itemLen;
       uint byte0;
       assembly {
           byte0 := byte(0, mload(memPtr))
       }

       if (byte0 < STRING_SHORT_START)
           itemLen = 1;

       else if (byte0 < STRING_LONG_START)
           itemLen = byte0 - STRING_SHORT_START + 1;

       else if (byte0 < LIST_SHORT_START) {
           assembly {
               let byteLen := sub(byte0, 0xb7) // # of bytes the actual length is
               memPtr := add(memPtr, 1) // skip over the first byte

               /* 32 byte word size */
               let dataLen := div(mload(memPtr), exp(256, sub(32, byteLen))) // right shifting to get the len
               itemLen := add(dataLen, add(byteLen, 1))
           }
       }

       else if (byte0 < LIST_LONG_START) {
           itemLen = byte0 - LIST_SHORT_START + 1;
       }

       else {
           assembly {
               let byteLen := sub(byte0, 0xf7)
               memPtr := add(memPtr, 1)

               let dataLen := div(mload(memPtr), exp(256, sub(32, byteLen))) // right shifting to the correct length
               itemLen := add(dataLen, add(byteLen, 1))
           }
       }

       return itemLen;
    }
}

