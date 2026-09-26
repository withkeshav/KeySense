# Learn Paths

A 5-step walkthrough from seed to address. Each step builds on the previous one. See `index.html:651-680`.

1. Seed (BIP39 phrase, entropy plus checksum)
2. Master Key (BIP32, HMAC-SHA512 split)
3. Path (BIP44 layout, purpose through index)
4. Hardened (hardened vs normal derivation)
5. Address (private key to chain address)

## Live boxes: your seed, not just prose

Each step computes live values from the loaded seed and falls back to the standard `abandon...about` test vector when no valid seed is loaded. See `src/learn-live.js:9-15`.

- Step 1: entropy hex, each word's 11-bit index, checksum bits picked out on the last word. See `src/learn-live.js:31-69` and `index.html:711-714`.
- Step 2: 512-bit PBKDF2 seed, master private key, chain code. See `src/learn-live.js:75-87` and `index.html:824-827`.
- Step 3: current Derive tab path resolved segment by segment. See `src/learn-live.js:92-107` and `index.html:849-852`.
- Step 4: same index derived hardened and normal, side by side. See `src/learn-live.js:113-126` and `index.html:900-903`.
- Step 5: private-key-to-address pipeline for Ethereum and Bitcoin Native SegWit with intermediate hashes. See `src/learn-live.js:131-164` and `index.html:959-962`.

## Bit explorer

The seed's entropy as a clickable grid of 12 words by 11 bits, with checksum bits visually distinct. Click an entropy bit and a new valid phrase is re-derived live; click a checksum bit and the phrase becomes real words that fail validation. Reset and Break-the-checksum buttons included. Operates on a scratch copy; the loaded seed is never touched. See `src/learn-live.js:874-1008` and `index.html:726-729`.

## Checksum demo

Edit the last word of the seed and watch the checksum pass or fail live, with the count of which of the 2048 candidate words would have worked. See `src/learn-live.js:381-450` and `index.html:717-723`.

## Path builder sliders

`learnPathAccount` and `learnPathIndex` are a read only preview. Moving them never changes the Derive tab. They show how the account and index segments reshape a Bitcoin path. See `index.html:854-862`.

## Empty wallet task buttons

`learnTryLegacyBtn` loads `m/44'/0'/0'/0/0` and `learnTryNativeBtn` loads `m/84'/0'/0'/0/0` into the Derive tab using the same presets as Step 2 there. Same seed, same account, Legacy vs Native SegWit defaults, two different addresses. See `index.html:864-873` and `src/learn-live.js:742-811`.

## Quizzes

Each step ends with a click-to-reveal retrieval quiz to be answered before opening. See `index.html:786-793` (step 1), `index.html:829-834` (step 2), `index.html:875-880` (step 3), `index.html:917-922` (step 4), `index.html:970-975` (step 5). Threat-model scenario cards live at `index.html:1074-1081` and the FAQ at `index.html:1104-1112`.

## Verify badges

The page recomputes the official BIP39 PBKDF2 seed, BIP32 master key and chain code, BIP44 EVM address, and BIP84 native segwit address of the standard `abandon...about` vector in the browser and shows PASS/FAIL per row. Any FAIL means the page copy is broken or tampered with. See `src/learn-live.js:1016-1081` and `index.html:986-990`.

## Glossary

Twelve plain-language terms: entropy, checksum, mnemonic, seed (BIP39), master key / chain code, xprv / xpub, hardened, derivation path, purpose / coin type, WIF, Bech32 / HRP, secp256k1 / Ed25519. See `index.html:1084-1100`.
