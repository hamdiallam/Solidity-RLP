# RLP decoder/reader
[![Build Status](https://travis-ci.com/hamdiallam/Solidity-RLP.svg?branch=master)](https://travis-ci.com/hamdiallam/Solidity-RLP)
Currently supports solidity **v0.6.0**
> Please raise issues for bugs, and solidity updates. I will be monitoring the solidity changelogs and updating this package accordingly

## Installation
1. `npm install solidity-rlp` in the project directory. Make sure to install through npm for prompt updates!
2. `import "solidity-rlp/contracts/RLPReader.sol"` in the desired smart contract.

_See the example smart contract below_

## Usage
The reader contract provides an interface to first take RLP encoded bytes and convert them into
an internal data structure, `RLPItem` through the function, `toRlpItem(bytes)`. This data structure can then be
destructured into the desired data types.

Transformations (all take an RLPItem as an arg):
1. `isList(RLPItem) bool` : inidicator if the encoded data is a list
2. `toList(RLPItem) RLPItem[]` : returns a list of RLPItems
3. `toBytes(RLPItem) bytes` : returns the payload in bytes
4. `toAddress(RLPItem) address` : returns the encoded address. Must be exactly 20 bytes.
5. `toUint(RLPItem) uint` : returns the encoded uint. Enforced data is capped to 32 bytes.
6. `toUintStrict(RLPItem) uint` : returns the encoded uint. Encoded data must be padded to 32 bytes.
7. `toBoolean(RLPItem) bool` : returns the encoded boolean
8. `toRlpBytes(RLPItem) bytes ` : returns the raw rlp encoded byte form
9. `rlpLen(RLPItem) uint` : returns the byte length of the rlp item
10. `payloadLocation(RLPItem) (uint memPtr, uint len)` : returns the memory pointer and byte length of the data payload
11. `payloadLen(RLPItem) uint` : returns the byte length of the data payload; an alias to payloadLocation(item)[1]

**Note**: The reader contract only provides only these conversion functions. All other solidity data types can be derived from
this base. For example, a `bytes32` encoded data type is equivalent to `bytes32(toUint(RLPItem))`. Start with a uint and convert from there.
A string can be retrieved by `string(toBytes(RLPItem))`. See example for a sample smart contract.

Iteration functions:
1. `iterator(RLPItem) Iterator` : returns an `Iterator` over the RLPItem. RLPItem must be an encoded list
2. `hasNext(Iterator) bool` : indicator if there is another item to iterate on
3. `next(Iterator) RLPItem` : returns the next `RLPItem` in the iterator

Utility functions:
1. `rlpBytesKeccak256(RLPItem) bytes32` : returns keccak256 hash of RLP encoded bytes. A cheap version
   of `keccak256(toRlpBytes(RLPItem))` that avoids copying memory.
2. `payloadKeccak256(RLPItem) bytes32` : returns keccak256 hash of the item payload. A cheap
   version of `keccak256(toBytes(RLPItem))` that avoids copying memory.

## Example
```solidity
import "solidity-rlp/contracts/RLPReader.sol"

contract SomeContract {
    
    // optional way to attach library functions to these data types.
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for RLPReader.Iterator;
    using RLPReader for bytes;

    // lets assume that rlpBytes is an encoding of [[1, "nested"], 2, 0x<Address>]
    function someFunctionThatTakesAnEncodedItem(bytes memory rlpBytes) public {
        RLPReader.RLPItem[] memory ls = rlpBytes.toRlpItem().toList(); // must convert to an rlpItem first!

        RLPReader.RLPItem memory item = ls[0]; // the encoding of [1, "nested"].
        item.toList()[0].toUint(); // 1
        string(item.toList()[1].toBytes()); // "nested"

        ls[1].toUint(); // 2
        ls[2].toAddress(); // 0x<Address>
    }

    // lets assume rlpBytes is an encoding of [["sublist"]]
    function someFunctionThatDemonstratesIterators(bytes memory rlpBytes) public {
        RLPReader.Iterator memory iter = rlpBytes.toRlpItem().iterator();
        RLPReader.Iterator memory subIter = iter.next().iterator();

        // iter.hasNext() == false
        // string(subIter.next().toBytes()) == "sublist"
        // subIter.hasNext() == false
    }
}
```


## Tests
1. `git clone https://github.com/hamdiallam/solidity-rlp && cd solidity-rlp`
2. `npm install`
3. `npm install -g truffle ganache-cli` installed globally for the dev envirnoment
4. `ganache-cli` run in a background process or seperate terminal window.
4. `truffle compile && truffle test`


## Audits

### 2021-05: MixBytes

Version 2.0.5 of this library (commit [`a283779`](https://github.com/hamdiallam/Solidity-RLP/tree/a2837797e4da79070701339947f32f5725e08b56)) was audited by [MixBytes](https://github.com/mixbytes) as part of the Lido stETH price oracle audit.

Summary:

- Total Issues: 1 (1 Fixed)
- Critical Issues: 0 (0 Fixed)
- Major Issues: 0 (0 Fixed)
- Warning Issues: 0 (0 No issue)
- Comment Risk Issues: 1 (1 Fixed)

See [the full report](https://github.com/lidofinance/audits/blob/main/MixBytes%20stETH%20price%20oracle%20Security%20Audit%20Report%2005-2021.pdf) for details.
