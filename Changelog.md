# Changelog

## 2.0.0
### Added
- `payloadLen` returns the length of the data payload

### Changed/Breaking
- `size` to `rlpLen` returns the size of the rlp payload

## 1.2.3
### Added
- `toUintStrict` strict uint conversion. Encoded data must be 32 bytes in length

## 1.2.2
### Changed
- `toAddress` expects a fixed 20 byte item. wil revert otherwise
- `toUint` explicit check added to cap the encoded byte length to 32 bytes

### Bugfix
- `toUint` edge case with a 32 byte uint. Do not need to right shift if the uint is 32 bytes in length.
right shifting caused a revert otherwise.

## 1.2.1
### Changed
- removed error strings in `require` statements to reduce deployment gas costs for users of this reader

## 1.2.0

### Added
- `size(RlpItem)` returns the byte length of the rlp item

### Changed
- Upgraded contract to solidity version `v0.5.0`
- added checks for when the rlp item is empty.
- More tests for the added checks

## 1.1.0

### Added
- `toRlpBytes(RlpItem)` converts an rlp item back into its raw rlp encoded byte form

### Changed
- relax the `toAddress(RlpItem)` requirement to allow short address conversions.

## 1.0.1

### Changed
- Bugfix in `copy` that did not work properly if the length to copy was an evm word or longer

## 1.0.0

- First Release. RLP decoding
