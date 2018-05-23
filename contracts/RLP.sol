pragma solidity ^0.4.24;

library RLP {
    uint8 constant STRING_START = 0x80;
    uint8 constant STRING_LONG_START = 0xb8;

    /*
    *   Encoding
    */

    function encodeItem(bytes memory data) internal pure returns (bytes memory result) {

        uint256 len = data.length;
        uint data_;
        assembly {
            data_ := add(data, 0x20) // first byte is the length

            result := mload(0x40) // free memory
        }
        
        if (len < STRING_START)
        {
            result = data;
        }

        else if (len < STRING_LONG_START)
        {
            assembly {
                mstore(0x40, add(result, and(add(add(add(len, 0x20), 0x8), 0x1f), not(0x1f)))) // padding
                mstore(result, add(len, 0x80))
                mstore8(add(result, 0x20), add(len, 0x80))

                // copy the bytes
                for {let i := 0} lt(i, len) { i := add(i, 1) }
                {
                    mstore8(add(result, add(i, 1)), byte(i, data_))
                }
            }
        }

        else
        {
            assembly {
                mstore(0x40, add(result, and(add(add(len, 0x40), 0x1f), not(0x1f)))) // padding
            }
        }

    }

    /*
    *   Decoding
    */
}
