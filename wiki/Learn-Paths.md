# Learn Paths

A six-step walkthrough from seed to address. Each step builds on the previous one.

1. Seed (BIP39 phrase, entropy plus checksum)
2. Master Key (BIP32, HMAC-SHA512 split)
3. Path (BIP44 layout, purpose through index)
4. Hardened (hardened vs normal derivation)
5. Address (private key to chain address)
6. Formats (address formats and chain comparisons)

## Live boxes: your seed, not just prose

Each step computes live values from the loaded seed and falls back to the standard `abandon...about` test vector when no valid seed is loaded.

- Step 1: entropy hex, each word's 11-bit index, checksum bits picked out on the last word.
- Step 2: 512-bit PBKDF2 seed, master private key, chain code.
- Step 3: current Derive tab path resolved segment by segment.
- Step 4: same index derived hardened and normal, side by side.
- Step 5: private-key-to-address pipeline for Ethereum and Bitcoin Native SegWit with intermediate hashes.

## Bit explorer

The seed's entropy as a clickable grid of 12 words by 11 bits, with checksum bits visually distinct. Click an entropy bit and a new valid phrase is re-derived live; click a checksum bit and the phrase becomes real words that fail validation. Reset and Break-the-checksum buttons included. Operates on a scratch copy; the loaded seed is never touched.

## Checksum demo

Edit the last word of the seed and watch the checksum pass or fail live, with the count of which of the 2048 candidate words would have worked.

## Path builder sliders

`learnPathAccount` and `learnPathIndex` are a read only preview. Moving them never changes the Derive tab. They show how the account and index segments reshape a Bitcoin path.

## Empty wallet task buttons

`learnTryLegacyBtn` loads `m/44'/0'/0'/0/0` and `learnTryNativeBtn` loads `m/84'/0'/0'/0/0` into the Derive tab using the same presets as Step 2 there. Same seed, same account, Legacy vs Native SegWit defaults, two different addresses.

## Quizzes

Each step ends with a click-to-reveal retrieval quiz to be answered before opening. The reference section also includes security scenarios and frequently asked questions.

## Verify badges

The page recomputes the official BIP39 PBKDF2 seed, BIP32 master key and chain code, BIP44 EVM address, and BIP84 native segwit address of the standard `abandon...about` vector in the browser and shows PASS/FAIL per row. Any FAIL means the page copy is broken or tampered with.

## Glossary

Twelve plain-language terms: entropy, checksum, mnemonic, seed (BIP39), master key / chain code, xprv / xpub, hardened, derivation path, purpose / coin type, WIF, Bech32 / HRP, secp256k1 / Ed25519.

## Recovery Detective

Below the mixed practice questions, try matching an old Bitcoin address record.
Choose a format, compare the address, then explain why it changed. The example
keeps the words, passphrase, network, account and address index fixed. The format
choices use different standard wallet paths, so the key changes too.

This exercise uses public test words only. It does not read the seed in the Derive
tab, accept private input, check balances or save progress. Never fund its example
addresses. Hints and corrected answers are labelled as completion with help.
