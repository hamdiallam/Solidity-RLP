pragma solidity ^0.4.24;

library RLP {
    uint8 constant STRING_START = 0x80;
    uint8 constant STRING_LONG_START = 0xb8;

    uint8 constant WORD_SIZE = 32;

    /*
    *   Encoding
    */

    function encodeItem(bytes memory data) public pure returns (bytes memory result) {

        uint256 len = data.length;
        uint data_start;
        assembly {
            data_start := add(data, 0x20) // first byte is the length

            result := mload(0x40) // free memory
        }
        
        if (len == 1)
        {
            uint8 temp;
            assembly { // retrieve the value of this byte
                temp := mload(add(data, 0x20))
            }

            if (temp < STRING_START)
                return data;
            // if temp == STRING_START, flow into the next if condition
        }

        if (len < STRING_LONG_START)
        {
            uint result_start;
            assembly {
                mstore(0x40, add(result, and(add(add(len, 0x21), 0x1f), not(0x1f)))) // padding
                mstore(result, add(len, 1)) // store the correct length
                mstore8(add(result, 0x20), add(len, 0x80))

                result_start := add(result, 0x21)
            }
            
            copy(data_start, result_start, len);
        }

        else
        {
            assembly {
                mstore(0x40, add(result, and(add(add(len, 0x40), 0x1f), not(0x1f)))) // padding
            }
        }

    }

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

    /*
    *   Decoding
    */
}
