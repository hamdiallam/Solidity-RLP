pragma solidity ^0.4.24;

library RLP {
    uint8 constant STRING_SHORT_START = 0x80;
    uint8 constant STRING_LONG_START  = 0xb8;
    uint8 constant LIST_SHORT_START   = 0xc0;
    uint8 constant LIST_LONG_START    = 0xf8;

    uint8 constant WORD_SIZE = 32;

    /*
    *   Decoder
    */

    struct RLPItem {
        uint len;
        uint memPtr;
    }

    struct Iterator {
        uint itemsLeft;
        uint nextPtr;
        RLPItem currItem;
    }

    /*
    * @param item RLP encoded bytes
    */
    function toRlpItem(bytes memory item) internal pure returns (RLPItem memory) {
        if (item.length == 0) 
            return RLPItem(0, 0);

        uint memPtr;
        assembly {
            memPtr := add(item, 0x20)
        }

        return RLPItem(item.length, memPtr);
    }

    /*
    * @param item RLP encoded list
    */
    function toList(RLPItem memory item) internal pure returns (RLPItem[] memory result) {
        // check if it is a list
        require(isList(item));

        uint numItems = 0;
        result = new RLPItem[](numItems);
        for (uint i = 0; i < numItems; i++) {
        }
    }


    /*
    * Helpers
    */

    function isList(RLPItem memory item) internal pure returns (bool) {
        uint len;
        uint memPtr = item.memPtr;
        assembly {
            len := byte(0, mload(memPtr))
        }

        if (len < LIST_SHORT_START)
            return false;
        return true;
    }

    // @return rlp item byte length
    function itemLength(RLPItem memory item) internal pure returns (uint) {
        uint len;
        uint memPtr = item.memPtr;
        assembly {
            len := byte(0, mload(memPtr))
        }

        if (len < STRING_SHORT_START)
            return 1
        
        else if (len < STRING_LONG_START)
            return len - STRING_SHORT_START + 1

        else if (len < LIST_SHORT_START) {
            assembly {
                len := sub(len, 0xb7) // # of bytes the actual length is
                memPtr := add(memPtr, 1) // skip over the first byte
                
                /* 32 byte word size */
                let data_len := div(mload(memPtr), exp(256, sub(32, len))) // right shifting to the correct length
                len := add(data_len, add(len, 1))
            }
            return len;
        }

        else if (len < LIST_LONG_START) {
            return len - LIST_SHORT_START + 1;
        } 

        else {
            assembly {
                len := sub(len, 0xf7)
                memPtr := add(memPtr, 1)

                data_len := div(mload(memPtr), exp(256, sub(32, len))) // right shifting to the correct length
                len := add(data_len, add(len, 1))
            }
            return len;
        }
    }

    function numItems(RLPItem memory items) internal pure returns (uint) {
    }

    function _validate(RLPItem memory item) internal pure returns (bool) {
    }

    /*
    * @param src Pointer to source
    * @param dest Pointer to destination
    * @param len Amount of memory to copy from the source
    */
    function copy(uint src, uint dest, uint len) internal pure {
        // copy as many word sizes as possible
        for (; len >= WORD_SIZE; len -= WORD_SIZE) {
            assembly {
                mstore(dest, mload(dest))
            }

            src += WORD_SIZE;
            dest += WORD_SIZE;
        }

        // left over bytes
        uint mask = 256 ** (WORD_SIZE - len) - 1;
        assembly {
            let srcpart := and(mload(src), not(mask)) // zero out src
            let destpart := and(mload(dest), mask) // retrieve the bytes
            mstore(dest, or(destpart, srcpart))
        }
    }
}
