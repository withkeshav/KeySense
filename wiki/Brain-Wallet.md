# Brain Wallet

## Warning: always unsafe for real money

Brain wallets are always unsafe for real money. Attackers precompute hashes of billions of phrases: quotes, lyrics, passwords, Bible verses, Wikipedia sentences. Funds on brain wallets are routinely stolen within hours. Even a strong passphrase has far less entropy than 12 random BIP39 words. Use the Derive Keys tab for real wallets. This tab exists only to demonstrate cryptographic concepts. See `index.html:481-485`.

## Flow: SHA-256 to 24 words

1. The source passphrase is hashed with SHA-256 to produce 32 bytes of entropy. See `src/brain-wallet-service.js:43-44`.
2. Those bytes become a 24-word BIP39 mnemonic via `entropyToMnemonic`. See `src/brain-wallet-service.js:45`.
3. An optional BIP39 passphrase (the 25th word) can be applied to the derived mnemonic. See `index.html:505-508`.
4. Account and address index inputs shape the fixed paths. See `index.html:510-519`.

SHA-256 always emits 256 bits, but hashing cannot create randomness that was not in the input. See `index.html:498-501`.

## Fixed 5 paths

These are never changed by the custom override. See `src/brain-wallet-service.js:48-52`.

- Ethereum / EVM: `m/44'/60'/account'/0/index`
- Bitcoin Legacy: `m/44'/0'/account'/0/index`
- Bitcoin Native SegWit: `m/84'/0'/account'/0/index`
- Tron: `m/44'/195'/account'/0/index`
- Solana: `m/44'/501'/account'/index'`

## Optional custom path override

The `brainCustomPath` input accepts one extra path for comparison. Empty means no override. The `brainSyncPathBtn` button fills it from the account and index inputs. The 5 fixed paths above are always derived unchanged. See `index.html:521-528` and `src/brain-wallet-service.js:91-94`.

## Auto-harden for 501, 784, 637

Ed25519 coins auto-harden like the Derive tab does. If the custom path uses coin type 501 (Solana), 784 (Sui), or 637 (Aptos), every segment is hardened and the result notes the resolved path. See `src/brain-wallet-service.js:101-107` and `src/constants.js:20-21`.

## Where outputs show

Results render under `brainOutput`. See `index.html:535-578`.

- `brainMnemonic`: 24-word mnemonic.
- `brainAddress` and `brainPrivateKey`: Ethereum address and key, with QR at `brainQrHost`.
- `brainBtcLeg`, `brainBtcSw`, `brainBtcWif`: Legacy, Native SegWit, and WIF.
- `brainTrx`: Tron address.
- `brainSol`: Solana address, derived async via `deriveBrainSolAddress`. See `src/brain-wallet-service.js:83-86`.
- `brainCustomWrap` with `brainCustomAddress` and `brainCustomPrivateKey`: shown only when the override is used.

## Frozen vectors

Pinned in `test/vectors.js:258-271`. They lock the demo, not endorse it.

- `brain-xkcd`: passphrase `correct horse battery staple`, expected Ethereum address.
- `brain-xkcd-custom-evm`: same passphrase at `m/44'/60'/1'/0/5`, expected address plus private key.
- `brain-xkcd-custom-sol`: same passphrase at `m/44'/501'/0'/0/0`, resolved to `m/44'/501'/0'/0'/0'`.

## How to verify

```bash
npm test
```

The brain section of `test/run-vectors.js:475-502` re-derives each vector through the shipped code and compares addresses, keys, and resolved paths.
