# RLP decoder/reader
[![Build Status](https://travis-ci.com/hamdiallam/Solidity-RLP.svg?branch=master)](https://travis-ci.com/hamdiallam/Solidity-RLP)  
Currently support for solidity **v0.5.0**  
> Please raise issues for bugs, and solidity updates. I will be monitoring the solidity changelogs and updating this package accordingly

## Installation
1. `npm install solidity-rlp` in the project directory. Make sure to install through npm for prompt updates!
2. `import "solidity-rlp/contracts/RLPReader.sol"` in the desired smart contract.

_See the example smart contract below_

## Usage
The reader contract provides an interface to first take RLP encoded bytes and convert them into
an internal data structure, `RLPItem` through the function, `toRlpItem(bytes)`. This data structure can then be
destructured into the desired data types.

Transformations(All take an RLPItem as an arg):  
1. `isList(RLPItem) bool` : inidicator if the encoded data is a list
2. `toList(RLPItem) RLPItem[]` : returns a list of RLPItems
3. `iterator(RLPITem) Iterator` : returns an `Iterator` over the RLPItem. RLPItem must be an encoded list
4. `toBytes(RLPItem) bytes` : returns the payload in bytes
5. `toAddress(RLPItem) address` : returns the encoded address. Must be exactly 20 bytes.
6. `toUint(RLPItem) uint` : returns the encoded uint. Enforced data is capped to 32 bytes.
7. `toUintStrict(RLPItem) uint` : returns the encoded uint. Encoded data must be padded to 32 bytes.
8. `toBoolean(RLPItem) bool`: returns the encoded boolean
9. `toRlpBytes(RLPItem) bytes `: returns the raw rlp encoded byte form
10. `rlpLen(RLPItem) uint` : returns the byte length of the rlp item
11. `payloadLen(RLPItem) uint` : returns the byte length of the data payload
12. `hasNext(Iterator) bool` : indicator if there is another item to iterate on
13. `next(Iterator) RLPItem` : returns the next `RLPItem` in the iterator

**Note**: The reader contract only provides only these conversion functions. All other solidity data types can be derived from
this base. For example, a `bytes32` encoded data type is equivalent to `bytes32(toUint(RLPItem))`. Start with a uint and convert from there.
A string can be retrieved by `string(toBytes(RLPItem))`. See example for a sample smart contract.

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

