# RLP decoder/reader
  Currently support for solidity **v0.4.24**  

# Installation
1. Install the dependencies `npm install solidity-rlp`.
2. In the contract, `import "solidity-rlp/contracts/RLPReader.sol"`

# Usage
The reader contract provides an interface to take RLP encoded bytes and convert them into the
and interal data structure, `RLPItem` through the function, `toRlpItem(bytes)`. This data structure can then be
destructured data types.

Transformations(All take an RLPItem as an arg):  
1. `toList(RLPItem)` : returns a list of RLPItems, `RLPReader.RLPItem[]`
2. `toBytes(RLPItem)` : returns the payload in bytes
3. `toAddress(RLPItem` : returns the encoded address. Must be 20 bytes long.)
4. `toUint(RLPItem)` : returns the encoded uint
5. `toBoolean(RLPItem)`: returns the encoded boolean

**Note**: The reader contract only provides only these conversion functions. All other solidity data types can be derived from
this base. For example, a `byte32` encoded data type is equivalent to `bytes32(toUint(RLPItem))`.

# Example


# Tests
1. `npm install`
2
