# RLP decoder/reader
  Currently support for solidity **v0.4.24**  

# Installation
1. Install the dependencies `npm install solidity-rlp`.
2. In the contract, `import "solidity-rlp/contracts/RLPReader.sol"`

# Usage
The reader contract provides an interface to first take RLP encoded bytes and convert them into the
an internal data structure, `RLPItem` through the function, `toRlpItem(bytes)`. This data structure can then be
destructured into the desired data types.

Transformations(All take an RLPItem as an arg):  
1. `toList(RLPItem)` : returns a list of RLPItems, `RLPReader.RLPItem[]`
2. `toBytes(RLPItem)` : returns the payload in bytes
3. `toAddress(RLPItem)` : returns the encoded address. Must be 20 bytes long.
4. `toUint(RLPItem)` : returns the encoded uint
5. `toBoolean(RLPItem)`: returns the encoded boolean

**Note**: The reader contract only provides only these conversion functions. All other solidity data types can be derived from
this base. For example, a `bytes32` encoded data type is equivalent to `bytes32(toUint(RLPItem))`. Start with a uint and convert from there

# Example
```solidity
import "solidity-rlp/contracts/RLPReader.sol"

contract SomeContract {
    
    // optional way to attach library functions to these data types.
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;

    // lets assume that rlpBytes is an encoding of [[1, "nested"], 2, 0x<Address>]
    function someFunctionThatTakesAnEncodedItem(bytes memory rlpBytes) public {
        RLPReader.RLPItem[] memory ls = rlpBytes.toRlpItem().toList(); // must convert to an rlpItem first!

        RLPReader.RLPItem memory item = ls[0] // the encoding of [1, "nested"].
        item.toList()[0].toUint() // 1
        string(item.toList()[1].toBytes) // "nested"

        ls[1].toUint() // 2
        ls[2].toAddress() // 0x<Address>
    }
}
```


# Tests
1. `npm install`
2
