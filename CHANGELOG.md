# Changelog

## Unreleased

### Fixed, wrong addresses

- **Sui addresses were wrong, and funds sent to them are unrecoverable.** The tool displayed the raw 32-byte Ed25519 public key where the address belongs. A Sui address is `BLAKE2b-256(0x00 || publicKey)`. Both values are 32 bytes and both render as a plausible `0x` string, so there was no visual tell, and the tool's own explanation text confidently described the wrong rule in three places. Anyone who sent SUI to an address this tool displayed sent it somewhere no private key can open. For the standard `abandon ... about` test mnemonic at `m/44'/784'/0'/0'/0'`, the tool showed `0x900b4d81...` where the correct address is `0x5e93a736...`.
- **Aptos never produced an address at all.** The code called `crypto.subtle.digest("SHA3-256", ...)`, but Web Crypto implements only SHA-1, SHA-256, SHA-384 and SHA-512. No browser has ever supported SHA3 there, so the call always threw and the tab only ever printed a fallback message. The formula itself was right. It now uses a vendored SHA3-256. Note SHA3-256 is not Keccak-256; they differ in padding, so ethers' `keccak256` cannot substitute.
- **Bitcoin Taproot returned a Legacy address.** Purpose 86 fell through to P2PKH with a caveat label, while the preset was named "Taproot" and the guide promised `bc1p...`. Real BIP86 is now implemented: `Q = P + int(TaggedHash("TapTweak", x(P)))G`, encoded as bech32m at witness version 1. Verified against all three published BIP86 test vectors. No funds were ever at risk here, since the legacy address was real and spendable, but it was not Taproot. Path recovery now matches `bc1p` addresses on that row instead of legacy ones.

### Added, learning

- **Entropy comparison.** A new panel in Learn step 1 puts every way of making a seed on one axis: 24 words, 12 words, 50 dice rolls, ten Diceware words, twenty rolls, four Diceware words, ten rolls, one roll, and "correct horse battery staple". Type a passphrase and it slots into the ranking. Each row carries a bit count and a plain-language search time.

  It is deliberately a comparison and never a score. There is no pass mark and no green zone, because any meter with one teaches that some passphrase is good enough, and none is. Character-space maths lets a long typed string score *above* the 128-bit baseline, so whenever that happens the panel says out loud that the number is a ceiling assuming uniformly random characters, not a measurement of something you invented and can remember.
- **The brain wallet strength meter is now that comparison**, two rows, your phrase against a generated seed. It previously turned green and said "Better" or "High bits*" for long input, on a page whose entire message is that brain wallets get emptied, and that asterisk pointed at a footnote that did not exist. Known phrases such as "correct horse battery staple" now read zero bits regardless of length, because they are a single dictionary entry to an attacker.
- **Blockchain guide rows are clickable.** Any of the 15 chain rows loads that preset into the Derive tab and derives it against your current seed, by mouse or by keyboard. The table stops being something you read and becomes something you run.
- **Guide explains the "why", not just the "what":** why every EVM chain shares coin type 60 and what that means for sending on the wrong network, why Bitcoin varies *purpose* rather than coin type and why that is the usual reason restored coins look missing, why Ed25519 chains cannot offer a watch-only xpub, and what an xpub actually leaks on its own versus combined with one unhardened child key.

### Added

- **A test suite, with no dependencies.** `npm test` runs 76 vectors against the shipped `src/*.js` in Node; `test/self-test.html` runs the identical suite in the browser under the same CSP the app uses. Covers BIP39/32/44/49/84, all three BIP86 vectors, both SLIP-0010 ed25519 vectors in full, every chain's address format, WIF and xpub, the entropy gate boundaries, and negative cases. A drift guard fails the run if the test page stops loading the same scripts as `index.html`.
- **Reproducible build for the one generated file.** `bash tools/build-crypto.sh --check` rebuilds `src/vendor/keysense-hashes.js` from pinned inputs and diffs it, so nobody has to trust whoever built it. Upstream ESM sources are also committed unbuilt under `audit/reference/` for reading by eye.

### Changed

- **Removed `ed25519-hd-key` and its 10 transitive Node shim packages** (~292 KB of Buffer and stream polyfill). SLIP-0010 is now ~40 lines in `src/slip10-ed25519.js` on top of `ethers.utils.computeHmac("sha512", ...)`, which ethers already shipped. Proven byte identical to the old library across 1500 paths before the swap, and verified against both published SLIP-0010 vectors.
- **The whole tool now works from `file://`.** Removing that library removed the last dynamic `import()`, and the entropy lab and brain wallet no longer need `crypto.subtle`. Solana, Sui and Aptos work offline for the first time. Open `index.html` from a USB stick on an air-gapped machine and every tab works.
- **The entropy lab now mixes the browser CSPRNG into the pool by default.** Previously dice *replaced* the CSPRNG, so the seed was capped by the dice alone: a biased die or an edited sequence weakened the result with nothing to fall back on. Mixing means the seed is never weaker than the better of the two sources. A **Reproducible mode** checkbox keeps the old behaviour for the teaching case, and mixed mode displays the 32-byte salt so a seed can still be rebuilt from (rolls + salt).
- **The entropy lab now refuses to mint a phrase claiming more bits than you supplied.** One dice roll previously produced a valid 24-word phrase backed by 2.58 bits. It now requires 50 rolls or 128 flips for 12 words, 100 or 256 for 24, matching the project's original spec. A **Demo mode** checkbox deliberately bypasses this so the lesson is still available.

### Fixed, other

- The sticky seed bar no longer goes stale. Eight code paths assigned `mnemonic.value` directly and only one refreshed the bar; the worst case left the previous seed on screen after a failed generation, which is exactly the value a user would copy. All eight now go through one `setMnemonic()` helper.
- `escapeHtml` moved to `src/html-escape.js`. It had been declared in two files, and the weaker copy (which did not escape apostrophes) was silently winning on load order.

### Security

- **The entropy lab's roll buttons used `Math.random`.** "Roll dice", "Flip coin", and "Auto-roll 50" wrote their output straight into the fields that get hashed into the seed, so a seed made with those buttons was backed by a non-cryptographic PRNG whose internal state is recoverable from its own output. They now use `crypto.getRandomValues` with rejection sampling, in a new `src/secure-random.js`. Naive `byte % 6` would have favoured faces 1 to 4 by about 2.4%, so the sampler discards bytes at or above 252.
- **Removed all CDN dependencies.** ethers, qrcode, tweetnacl, and ed25519-hd-key are now vendored in `src/vendor/` and served from the same origin. Previously they loaded unpinned and without Subresource Integrity, and since `ethers.utils.randomBytes` is the sole CSPRNG for the Generate button and the vanity miner, a tampered CDN response could have backdoored every generated key with nothing on screen looking wrong. Note the `ed25519-hd-key` `+esm` build pulled in 10 further modules at runtime, so this was 11 unverified files, not 1.
- **Added a Content-Security-Policy.** `connect-src 'none'` in particular: the app makes no network calls of its own, so injected script has no way to send a seed anywhere. `script-src` needs no `'unsafe-inline'` or `'unsafe-eval'`.
- **Fixed a cross-site scripting hole in the mnemonic typo checker.** An out-of-wordlist word was interpolated into `innerHTML`. That panel deliberately runs on *invalid* mnemonics, so the `isValidMnemonic` check that guards every other path did not apply. Pasting a crafted phrase and clicking "Check for typos" executed script on a page holding the plaintext seed. The suggestion list is now built from DOM nodes.
- Same treatment for the extended-key panel, the batch derivation table, the word-finder errors, and the tree inspector errors, all of which interpolated custom paths or library error messages that quote their offending input.
- **Fixed a duplicate global `escapeHtml`.** It was declared in both `path-recovery.js` and `tree-inspector.js`. These are classic scripts sharing one scope, and tree-inspector loads second, so its weaker version (which did not escape apostrophes) silently replaced the stronger one for both files.

### Changed

- Entropy lab roll buttons renamed to "Simulate a roll", "Simulate a flip", and "Simulate 50", with a note explaining that they draw from the browser CSPRNG and that typing real throws is the path that does not depend on the machine.
- Rewrote the "No software RNG" claims, which were the opposite of what the code did. The new wording explains that the browser CSPRNG is a wrapper over the OS hardware entropy pool, and that the value of physical dice is independence from your computer rather than more randomness.
- The "100% Offline" badge and the README are now accurate: no third-party requests, and the page works with the network off.
- Removed the claim about a "Download button saves the full page for offline or air-gapped use". No such button existed.
- Corrected the `file://` note. The entropy lab and brain wallet do work from `file://`. Only Solana, Sui, and Aptos need a server, because ES module loading is blocked from a `null` origin.
- `SECURITY.md` now documents network activity, how to verify the vendored libraries against upstream hashes, and where the randomness comes from.

### Removed

- Dead `diceToBytes` and `coinToBytes` from `src/entropy-generator.js`. They had no callers, and their 3-bit packing of a 6-sided die left the patterns `110` and `111` unreachable, discarding 0.415 bits per roll.

## 1.0.0 - 2026-07-30

### Added
- BIP86 Bitcoin Taproot preset (`m/86'/0'/0'/0/0`) with fallback address display
- `btc-taproot` dev mode override for custom path testing
- `CHANGELOG.md`
- Paper wallet print now includes the private key, WIF (Bitcoin-style chains), and public key, in addition to the address and seed words

### Changed
- **Renamed project** from "HD Wallet Derivation Playground" to **KeySense**
- Branding: new tagline, title, meta description, header, subtitle
- `package.json`: name → `keysense`, description, license → MIT, then replaced with a custom source-available license (see below)
- `README.md`: rewritten with VPS deployment instructions
- License changed from MIT to a custom **KeySense License 1.0**: free to download and use for any purpose including commercial, but modifying, rebranding, or redistributing a modified copy requires the copyright holder's written permission
- "Developer mode" toggle (Step 3, custom path) renamed to "Expert mode" for consistency with the Step 1 toggle
- Paper wallet print layout reordered: seed words on top, then address/path/keys, then branding and a fuller disclaimer at the bottom; added the `keysense.withkeshav.com` URL alongside the GitHub link

### Fixed
- file:// support: converted ES modules (`type=module` + `import`/`export`) to regular scripts loaded in dependency order
- `vanityInputLabel` naming conflict (DOM element vs global function)
- Removed dead `if (!inf)` block in batch derive loop
- SLIP-0010 error message now accurately explains hardening requirement
- Brain wallet Solana derivation: 15s timeout guard to prevent indefinite hang
- Sticky seed bar CSS was accidentally nested inside a `max-width: 480px` media query, so it rendered unstyled on desktop; fixed and set to wrap and show the full mnemonic at any word count, with sticky behavior disabled on mobile
- Paper wallet print silently dropped the private key even though it was passed in; it now actually renders
- "Learn Paths" link to the Physical entropy lab did not enable Expert mode, so the panel it tried to open was invisible
- A few hint texts pointed users to "Path recovery" on the Derive tab; it actually lives on the Experiments tab

### Notes
- BIP86 Taproot shows P2PKH (Legacy) address as fallback - full schnorr key tweak needs an ECC library
- Solana and Brain Wallet tabs require HTTPS (graceful error on file://)
