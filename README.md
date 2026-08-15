# KeySense

[![License: KeySense License 1.0](https://img.shields.io/badge/License-KeySense%201.0-blue.svg)](LICENSE)

> Crypto key math is confusing, but KeySense makes it simple and understandable.

Multi-chain HD derivation, vanity miner, brain wallet entropy lab. BIP39/32/44/49/84/86, extended keys, path discovery - all in your browser. No CDN, no third-party requests, and no seed, key, or address ever leaves your device.

Created by [Keshav Maheshwari](https://www.withkeshav.com)

## Features

- **Derive Keys** - Multi-chain HD derivation: Ethereum, Bitcoin (Legacy, SegWit, Native SegWit, Taproot), Solana, Tron, Litecoin, Dogecoin, Cosmos, Sui, Aptos
- **Vanity Miner** - Offline EVM vanity address generator
- **Brain Wallet** - SHA-256 passphrase -> BIP39 mnemonic -> deterministic wallet
- **Learn Paths** - Visual explanation of BIP44/49/84/86 derivation structure
- **Blockchain Guide** - Address format reference across chains
- **Path Recovery** - Find which derivation path matches a known address
- **Paper Wallet** - Print an air-gapped cold backup
- **Entropy Lab** - Generate seeds from dice rolls or coin flips

## Quick Start (Local)

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open in a browser. The whole tool, every tab and every chain, also works straight from `file://` with no server and no network at all. Open `index.html` from a USB stick on an air-gapped machine and it works.

## Tests and CI

```bash
npm test
```

Runs the full vector suite in Node against the same `src/*.js` files the browser loads: official BIP/SLIP maintainer fixtures for every chain, the entropy lab, the brain wallet, the RNG fail-closed suite, and a vendor pin guard. GitHub Actions runs it on Node 20 and 22 for every push and PR, and re-verifies the vendored supply chain on a weekly schedule. See [RELEASE.md](RELEASE.md) for the release checklist.

## Deploy on a VPS

```bash
# Clone
git clone https://github.com/withkeshav/KeySense.git
cd KeySense

# Pull updates
git pull

# Option A: serve (Node.js, quick)
npx serve . -p 80

# Option B: python (no install)
python3 -m http.server 80

# Option C: nginx (production)
sudo cp -r . /var/www/keysense
# Then configure nginx to serve /var/www/keysense on port 80/443
```

For HTTPS (required for Brain Wallet), use nginx with certbot or Caddy.

## Tech Stack

Zero framework, zero build step. Pure HTML, CSS, and vanilla JavaScript.

**No CDN.** Every dependency is vendored into `src/vendor/` and served from the same origin as the page. A tool that generates spendable private keys should not let a third party ship code into it, and pinning a version in a CDN URL does not prevent that. Serving them locally also means the page works with the network switched off, and that you can diff what a server sends you against this repository.

- [ethers.js](https://github.com/ethers-io/ethers.js) 5.7.2 - BIP39 mnemonic, BIP32 HD derivation, EVM addresses
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
