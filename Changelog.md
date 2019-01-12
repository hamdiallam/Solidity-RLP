# Changelog

## 1.2.0
- Upgraded contract to solidity version `v0.5.0`
- `size(RlpItem)` returns the byte length of the rlp item
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
