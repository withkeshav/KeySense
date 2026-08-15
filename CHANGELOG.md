# Changelog

## Unreleased

### Security, hardening round

- **An RNG fail-closed test suite in CI's `npm test` (now 185 vectors, was 139).** The Coldcard lesson restated as executable checks: `secure-random.js` and the entropy lab are loaded in fresh vm contexts with `crypto` present, absent, missing `getRandomValues`, or stubbed to return all-zero, identical, or single-repeated-byte output. Every degradation must fail loudly (throw or trip the canary with the right reason) rather than hand back key material; mixed mode must refuse without `crypto` while deterministic mode (the documented escape hatch) must keep working. A Math.random tripwire counts calls across the entire suite and fails on any (measured: 0). A vendor pin guard reads `tools/build-crypto.sh`'s pinned `@noble/hashes` and `esbuild` versions and checks the committed `src/vendor/keysense-hashes.js` banner still names exactly those versions, so a hand-edit or wrong-version rebuild cannot pass silently.
- **GitHub Actions CI** (`.github/workflows/ci.yml`). Pushes and PRs run `npm test` on Node 20 and 22. A weekly cron job re-runs `tools/verify-vendor.sh` (pinned upstream SHA-384 re-check of the copied vendors) and `tools/build-crypto.sh --check` (byte-for-byte reproduction of the built hashes file) plus the suite: visibility is not verification, only running the check on a schedule is.
- **`RELEASE.md`**, a release checklist covering the full suite, both vendor scripts, a browser smoke test, the self-test drift guard, tagging, and the post-release cron confirmation.

### Added, learning round 3 (teaching material)

- **An interactive bit-flip explorer in Learn step 1.** The seed's entropy as a clickable grid of 12 words x 11 bits, with the checksum bits visually distinct. Click an entropy bit and a completely different, still-valid phrase is re-derived live through the same public `ethers.utils.entropyToMnemonic` call the rest of the tool uses (watch which words move); click a checksum bit and the phrase becomes real words that fail validation. Reset and Break-the-checksum buttons included. Operates on a scratch copy; the loaded seed is never touched.
- **Per-step retrieval quizzes (steps 1-5), threat-model scenario cards ("What is the real offer?"), and an FAQ**, all as click-to-reveal blocks. Retrieval practice (answer before revealing) is the best-evidenced study technique there is; the scenarios drill the one trick every seed-phrase scam uses.
- **A "When defences actually help" section in step 1**, drawing the honest boundaries from the Coldcard incident: own entropy protects at creation only, a passphrase selects a different wallet rather than repairing a weak seed, updates cannot fix an already-created seed, two-tool verification catches bugs before they cost you, and failing closed beats failing quietly.
- **A live self-verification card.** The page recomputes the official BIP39 PBKDF2 seed, BIP32 master key and chain code, BIP44 EVM address, and BIP84 native segwit address of the standard `abandon...about` vector in your browser and shows PASS/FAIL per row. Any FAIL means the page copy is broken or tampered with.
- **A wordlist explorer**: searchable 2048-word list that also verifies, live on every query, that no two words share their first four letters.
- **A plain-language glossary** of the twelve terms this page leans on hardest.

### Added, UI

- **Seed bar Hide/Show and Clear buttons.** Hide masks the phrase (`-webkit-text-security`, blur fallback) so it cannot be read over your shoulder; Clear empties the seed and resets every panel that showed derived data: the Derive results, the HD tree (which displays xprvs), and the Experiments outputs. Previously the seed was always displayed in plain text.
- **An inline "Never type a real seed here" disclaimer** next to the mnemonic input.
- **The 12th/24th word-finder buttons are now built as DOM nodes**, matching the typo fixer's pattern, so no path in that panel concatenates strings into `innerHTML`.

### Governance

- `AGENTS.md` (untracked) now codifies the validate-first-then-ask exception path for protected-area changes, the discipline this project already followed for its Sui and Taproot fixes.

### Added, learning round 2

- **The entropy lab shows exactly what got hashed together**, not just the salt. Mixed mode now lists every tagged part (dice, coins, browser CSPRNG salt) that fed the SHA-256 pool, so "mixed mode" is something you can read rather than take on faith.
- **An attacker-speed slider on the entropy comparison panel**, 1 billion to 1 quadrillion guesses/sec. Move it and watch every row recompute live: 128 bits stays absurd at any realistic speed, while the weak rows only need a patient attacker, not a fast one.
- **A live passphrase-branching demo in step 1.** Same 12 words, type any passphrase, and two completely unrelated addresses compute side by side. Directly answers the most common real "why is my wallet empty" cause, a forgotten 25th word.
- **A "one seed, nine chains" grid in step 5.** The same account 0 / index 0, derived into every chain this tool supports, side by side, reusing the exact same `formatAddress` pipeline the Derive tab uses.
- **An access-scope exercise in step 4: what can someone actually do with...** four toggles, 12 words alone / 12 words + passphrase / xpub only / xpub + one leaked child private key, each computed live from your own seed. The last one recovers a real parent private key on screen from public data plus one child key, using the standard BIP32 CKD-priv inversion, `parent_priv = (child_priv - HMAC_SHA512(chaincode, serP(parent_pub) || index)[0:32]) mod n`, then confirms live that the recovered key matches the actual parent. This is the concrete version of "why hardened derivation matters" that step 4 already taught in prose.
- **A "why a restored wallet can look empty" demo in step 3.** Same seed, same Bitcoin account, Legacy vs Native SegWit default paths, two different addresses computed side by side.
- 12 new pure functions covering all of the above, tested: `npm test` is now 139 vectors (was 127). The BIP32 recovery formula is locked against a computed value, not just its own internal self-check, so a future change to it cannot silently start "recovering" the wrong key while still reporting success.

### Fixed

- **The paper wallet print produced a broken, mostly-blank layout.** The print CSS hid the rest of the page with `visibility: hidden`, which removes paint but not layout, so the app's full header/tabs/cards still reserved their normal height on the printed page and pushed the actual paper wallet content off it. Rebuilt to hide every other direct child of `<body>` with `display: none` instead, added an explicit `@page { size: A4 }`, and it is now a clean single page. Also added a KeySense-branded header, a real hyperlinked "Created by Keshav Maheshwari" credit (clickable in a PDF export, confirmed via a real headless print-to-PDF render, not just visually), and fixed the seed word grid to build DOM nodes instead of an HTML string, matching this project's standard defense even though BIP39 words are never attacker-controlled in practice.

### Added, learning

- **The 5-step Learn Paths walkthrough now computes live values from your own seed**, not just prose. Step 1 shows the real entropy hex and every word's 11-bit index, with the checksum bits picked out visually on the last word. Step 2 shows the actual 512-bit PBKDF2 seed and its HMAC-SHA512 split into master private key and chain code. Step 3 resolves your current path segment by segment. Step 4 derives the same index both hardened and normal, side by side, so "one apostrophe, two unrelated keys" is something you see rather than read. Step 5 decomposes the private-key-to-address pipeline for Ethereum and Bitcoin Native SegWit down to the intermediate hash values. Falls back to the standard `abandon...about` test vector whenever no valid seed is loaded, which doubles as a self-check since that vector is independently published.
- **Step 1 has an interactive checksum demo.** Edit the last word of your seed and watch the checksum pass or fail live, with the actual count of which of the 2048 candidate words would have worked (128 of them for a 12-word phrase, exactly 1 in 16, which is the checksum's real job stated as a number instead of a sentence).
- **A real-world case study.** Step 1 now cites the July 2026 Coldcard hardware wallet incident, where a firmware build flag was checked for whether it existed rather than what it was set to, silently routing seed generation to a poorly-seeded software RNG and collapsing 128 bits of entropy down to as little as 40, with completely normal-looking output, for five years. Framed honestly: this tool's own randomness is checked for the equivalent failure (see Security below), not claimed immune from every possible version of it.
- **A new "What this toolkit does not do" card** on the Blockchain Guide tab. It computes; it does not sign, broadcast, or hold funds. Stated plainly so the tool is not mistaken for more than it is, precisely because it is convincing at the part it does do.

### Security

- **A runtime entropy canary.** On every page load, a one-time check confirms `crypto.getRandomValues` returns two different, non-degenerate results before anything trusts it for key material. This cannot prove the source is strong, only catch the way a broken or silently substituted one tends to fail: still callable, still "random-looking" as an API, but constant or repeating output. Directly motivated by the Coldcard incident above, where nobody checked the RNG's actual output for five years. If it ever fails, a warning appears at the top of the page and nothing should be generated until it is understood. See `src/secure-random.js`.
- **`AUDIT.md`'s threat model now separately names a malicious extension patching `window.crypto` before the page's own scripts run**, distinct from the DOM-access framing already there. This variant needs no DOM read access at all and is the closest realistic analog to the Coldcard failure; the entropy canary above is a partial mitigation for it, not a complete one.
- **`tools/verify-vendor.sh`** re-checks the three copied (non-generated) vendored files against their pinned upstream SHA-384 hashes on demand. `SECURITY.md` now says plainly to run this before every release, not just once: a hash checked once is only proof for that moment, and "the code is open source" is not the same as "someone re-checked it," which is exactly the gap that let the Coldcard bug hide for five years.

### Fixed

- **The Learn tab's live values silently never updated after clicking Generate.** `setMnemonic()` (the single choke point every seed-setting path already goes through) could not call the new renderer by name: the renderer is declared inside a different function scope (the page's `DOMContentLoaded` handler) than `setMnemonic` itself, and `typeof` on an out-of-scope identifier quietly returns `"undefined"` instead of throwing, so a naive guard masked the bug instead of surfacing it. Fixed with a hook variable assigned once the renderer exists, the same shape of fix as the original sticky-seed-bar bug this project already fixed once. Caught in browser verification before shipping, not after.
- **The Blockchain Guide's social preview image (`og-image.svg`) was never rendering on Facebook, LinkedIn, Slack, or X.** Those platforms do not rasterize SVG for link previews, so `og:image` pointing at one shows no thumbnail at all, silently. Rendered to a proper `og-image.png` (1200x630) and added a matching `twitter:image`; the SVG stays as the editable source. The image itself is refreshed to light background to match the tool's own light theme, and the chain list now names all 9 supported chains instead of the 6 it launched with. `twitter:*` tags corrected to use `name=` rather than `property=` per the actual card spec, and `og:image:width/height/type/alt` and `og:site_name` added so crawlers do not need to fetch the image first to lay out the card.

### Changed, evidence only (no address changed)

- **No derived address, key, or encoding changed.** This entry only strengthens how those values are proven. Official maintainer fixtures for Sui, Aptos, and Cosmos are pinned in `test/vectors.js` with repository path and commit hash. Litecoin and Dogecoin encoding constants are cited from each chain's `chainparams.cpp`. Aptos UI copy now notes the legacy vs SingleKey dual-scheme so a user with a SingleKey wallet is not left guessing. Vector source tags distinguish ground truth (`sui-sdk`, `aptos-sdk`, `cosmjs`, BIP/SLIP) from regression locks (`crosstool-locked`, `no-official-vector`). `npm test` is now 99 vectors (was 92). `audit/AUDIT.md` and `SECURITY.md` updated to match. Tron remains without a citable official mnemonic-to-address fixture. SDK depth sweep against `@mysten/sui@2.23.1`, `@aptos-labs/ts-sdk@7.2.0`, and `@solana/web3.js@1.98.4` reported zero mismatches over 1001 paths (run outside the repo; nothing committed from it).

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
