# Verification

## How to run npm test

```bash
npm test
```

This runs `node test/node-harness.js` (see `package.json:9`). It loads the shipped `src/*.js` files in Node and checks them against `test/vectors.js`. Currently 189 vectors pass. `test/self-test.html` runs the identical suite in the browser under the same CSP the app uses, with a drift guard that fails if the test page stops loading the same scripts as `index.html`.

## build-crypto check

```bash
bash tools/build-crypto.sh --check
```

`src/vendor/keysense-hashes.js` is the only generated file. It holds `blake2b` (Sui) and `sha3_256` (Aptos) from `@noble/hashes@1.5.0`, built with `esbuild@0.28.1`. The check rebuilds it from pinned inputs and diffs against the committed copy. See `SECURITY.md:41-63` and `README.md:76-84`.

## verify-vendor

```bash
bash tools/verify-vendor.sh
```

Re-checks the three copied vendored files against their pinned upstream SHA-384 hashes. Run before every release, not just once. See `SECURITY.md:29-39`.

## BIP and SLIP fixtures

Published in the spec itself. Tagged in `test/vectors.js:9-10`.

- `bip39`, `bip44`: Ethereum and Bitcoin Legacy vectors on the `abandon...about` phrase. See `test/vectors.js:40-46`.
- `bip49`: wrapped segwit vector. See `test/vectors.js:47-48`.
- `bip84`: native segwit vectors, plus the WIF row. See `test/vectors.js:49-52` and `test/vectors.js:161-162`.
- `bip32`: account xpub row. See `test/vectors.js:163-165`.
- `bip86`: all three published Taproot vectors. See `test/vectors.js:54-60`.
- `slip10`: both published Ed25519 test vectors, every level. See `test/vectors.js:168-226`.

## SDK fixtures with file paths and commits

Published by the chain maintainers. Ground truth, not a second opinion. See `test/vectors.js:11-13`.

- Sui SDK, three cases. Repo `MystenLabs/ts-sdks`, file `packages/sui/test/unit/cryptography/ed25519-keypair.test.ts`, commit `013ea22520d668ec8259c8c4535f3b344b82ce66`, double-sourced against the Rust keytool CLI at `MystenLabs/sui crates/sui/src/unit_tests/keytool_tests.rs`, commit `edd2cd31e0b05d336b1b03b6e79a67d8dd00d06b`. See `test/vectors.js:122-135`.
- Aptos TS SDK wallet fixture. Repo `aptos-labs/aptos-ts-sdk`, file `tests/unit/helper.ts`, commit `9451281f85f828cf7fa8562a07b4099fcd15965b`. Path `m/44'/637'/0'/0'/0'`, with published seed and public key intermediates. See `test/vectors.js:143-156`.
- CosmJS fixture. Repo `cosmos/cosmjs`, file `packages/proto-signing/src/directsecp256k1hdwallet.spec.ts`, commit `fcaa08011c343b350b7fc260e6681924a5f66f62`. See `test/vectors.js:101-107`.
- Litecoin and Dogecoin encoding constants cited from each chain's `chainparams.cpp`: Litecoin `litecoin-project/litecoin`, commit `b250b016a9166928c0e702d48ecd037a57a489a4`; Dogecoin `dogecoin/dogecoin`, commit `7237da74b8c356568644cbe4fba19d994704355b`. See `test/vectors.js:66-77`.

## crosstool-locked vs no-official-vector

From `test/vectors.js:14-21`:

- `crosstool-locked`: regression lock on a value this tool already produces. Derivation maths is already proven by the Bitcoin BIP vectors; only the address-encoding constants differ. Drift detection, not proof.
- `no-official-vector`: no citable official mnemonic-to-address fixture was found. Regression lock only. See `audit/AUDIT.md` section 5.

## Tron note

Tron encoding is base58check of `0x41` plus the last 20 bytes of Keccak-256 over the uncompressed public key. No citable official mnemonic-to-address vector was found in java-tron or Tron developer docs at the time of entry. The `tron-0` row is a regression lock. See `test/vectors.js:90-94` and `SECURITY.md:86`.
