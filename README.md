# KeySense

[![License: KeySense License 1.0](https://img.shields.io/badge/License-KeySense%201.0-blue.svg)](LICENSE)

> Crypto key math is confusing, but KeySense makes it simple and understandable.

Multi-chain HD derivation, vanity miner, brain wallet entropy lab. BIP39/32/44/49/84/86, extended keys, path discovery - all in your browser. No CDN, no third-party requests, and no seed, key, or address ever leaves your device.

Created by [Keshav Maheshwari](https://www.withkeshav.com)

## Features

- **Wallet course** - Twenty lessons from custody and keys to fees, permissions,
  backups, hardware signing, multisig, smart accounts and cross-chain risks.
  Worked examples, explained checks and official sources connect concepts to practice.
- **Workbench** - Multi-chain HD derivation: Ethereum, Bitcoin (Legacy, SegWit, Native SegWit, Taproot), Solana, Tron, Litecoin, Dogecoin, Cosmos, Sui, Aptos
- **Vanity Miner** - Offline EVM vanity address generator
- **Brain Wallet** - SHA-256 passphrase -> BIP39 mnemonic -> deterministic wallet, with optional custom path override
- **Key paths** - The live six-step derivation walkthrough, with interactive builder, quizzes, verify badges, and Recovery Detective: a public-example address-matching exercise.
- **Blockchain Guide** - Address format reference across chains
- **Advanced practice** - Typo suggestions, missing-word candidates and comparison
  against fifteen listed wallet paths. No match is not proof of no funds or wrong words.
- **Paper output** - Print example key data. The printer and its stored jobs are part
  of the exposure risk; printing does not create an air gap.
- **Entropy Lab** - Generate seeds from dice rolls or coin flips

## Quick Start (Local)

```bash
npm run dev
# or
python3 tools/devserver.py
```

Requires Python 3.9 or newer. Run the command from the project folder, leave that terminal
running, and open [the local preview](http://127.0.0.1:8731) in a browser. The preview
serves only approved app and test files and is reachable only from this machine.
Press Ctrl+C in the terminal to stop it.

For offline use, keep the complete project folder together and open `index.html` in a
normal browser. Every chain works from `file://`. An editor or chat attachment preview
may show only the HTML and block sibling CSS or scripts; use the local preview above
if the page looks unstyled. Opening a detached copy of `index.html` is not enough.

To try Recovery Detective, open **Key paths** and scroll below the mixed practice
questions. It uses fixed public examples, never reads the active seed, and saves no progress.

## Tests and CI

```bash
npm test
```

Runs the full vector and safety suite in Node against the same `src/*.js` files the browser loads: official BIP/SLIP and maintainer fixtures, plus explicitly labelled cross-tool regression examples, the entropy lab, the brain wallet including custom path vectors, the RNG fail-closed suite, and a vendor pin guard. GitHub Actions runs it on Node 22 and 24 for every push and PR, and re-verifies the vendored supply chain on a weekly schedule. See [RELEASE.md](RELEASE.md) for the release checklist.

## Privacy

The app itself collects nothing: no seeds, keys, or addresses ever leave your device, no analytics, no cookies. Theme only is kept in `localStorage`. Hosting still sees routine server traces such as IP and user agent. See [PRIVACY.md](PRIVACY.md) for the full policy, including offline use.

## Research

The Key paths tab is built on published research, and the research is done in the open. The plan, the misconception inventory, the learning science brief with its primary sources, the prior art teardown and the reader measurement kit all live in [docs/learn-research](docs/learn-research), and the plain language summary is on the wiki at [wiki/Learn-Research.md](wiki/Learn-Research.md).

Reading level is checked by a gate you can run yourself:

```bash
npm run test:readability
```

It measures running prose per teaching segment against a recorded baseline, keeps tables and diagrams in a separate reported bucket, and says plainly when it cannot measure rather than reporting a pass. Nothing in this research is measured on you: the reader session page runs offline and stores nothing. See [PRIVACY.md](PRIVACY.md) and the wiki at [github.com/withkeshav/KeySense/wiki](https://github.com/withkeshav/KeySense/wiki).

## Contributing

Issues and ideas are welcome at [https://github.com/withkeshav/KeySense/issues](https://github.com/withkeshav/KeySense/issues). Never paste seeds or private keys in an issue. This is source-available, so propose changes via issues first. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## Deploy on a VPS

Use a separate public directory containing only reviewed runtime files. Do not serve the
repository checkout or copy it wholesale: Git metadata, ignored files and private notes
can otherwise become downloadable. `.gitignore` controls Git, not web access.

See [docs/deploy/README.md](docs/deploy/README.md) for the deployment checklist.
Use HTTPS for a hosted copy. For local offline learning, open `index.html` directly.

## Tech Stack

Zero framework, zero build step. Pure HTML, CSS, and vanilla JavaScript.

**No CDN.** Every dependency is vendored into `src/vendor/` and served from the same origin as the page. A tool that generates spendable private keys should not let a third party ship code into it, and pinning a version in a CDN URL does not prevent that. Serving them locally also means the page works with the network switched off, and that you can diff what a server sends you against this repository.

- [ethers.js](https://github.com/ethers-io/ethers.js) 5.8.0 - BIP39 mnemonic, BIP32 HD derivation, EVM addresses
- [tweetnacl](https://github.com/dchest/tweetnacl-js) 1.0.3 - Ed25519 key pairs (Solana, Sui, Aptos)
- [qrcode](https://github.com/soldair/node-qrcode) 1.5.1 - QR code rendering for address display
- [@noble/hashes](https://github.com/paulmillr/noble-hashes) 1.5.0 - `blake2b` (Sui addresses) and `sha3_256` (Aptos addresses), the only two primitives neither ethers nor tweetnacl provides and no browser exposes through Web Crypto

SLIP-0010 Ed25519 derivation (Solana, Sui, Aptos) is implemented directly in `src/slip10-ed25519.js` on top of `ethers.utils.computeHmac("sha512", ...)`. It previously used `ed25519-hd-key`, whose module graph pulled in 10 Node shim packages carrying a Buffer polyfill purely to reach an HMAC ethers already had. Removing it also removed the last dynamic `import()`, which is what stopped those three chains working from `file://`.

### The one build step

Everything ships as plain files except `src/vendor/keysense-hashes.js`, which is generated. There is no build step to run, serve, or deploy this; there is one optional reproducible step to regenerate that single file:

```bash
bash tools/build-crypto.sh --check
```

That rebuilds it from pinned inputs and diffs against the committed copy, so anyone can confirm the artifact matches its sources without trusting whoever built it.

See [SECURITY.md](SECURITY.md) for the upstream URLs and SHA-384 hashes, so you can verify the vendored copies yourself.

### Deploy note

`frame-ancestors` cannot be set from a `<meta>` tag, so the in-page CSP does not cover clickjacking. Add a header at the web server too:

```nginx
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "no-referrer" always;
```

## License

Free to download and use, including commercially, unmodified. Modifying, rebranding, or redistributing a changed version requires the copyright holder's written permission. This is a source-available license, not an OSI open source license. See [LICENSE](LICENSE) for the full terms.

---

**Disclaimer:** For testing and educational purposes only. If you want to use a local version, download it from [https://github.com/withkeshav/KeySense](https://github.com/withkeshav/KeySense).

---

Made and maintained by <a href="https://www.withkeshav.com" target="_blank" rel="noopener">Keshav Maheshwari</a>.

The wallet course includes ten paper-based practice cases. Each asks for a decision,
evidence and limits before revealing a model answer. Changed cases test whether
the reasoning transfers. These are learning exercises, not a certificate or a
real-wallet recovery service.
