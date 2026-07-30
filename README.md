# KeySense

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Crypto key math is confusing, but KeySense makes it simple and understandable.

Multi-chain HD derivation, vanity miner, brain wallet entropy lab. BIP39/32/44/49/84/86, extended keys, path discovery — all in your browser, 100% offline.

Created by [Keshav Maheshwari](https://www.linkedin.com/in/withkeshav)

## Features

- **Derive Keys** — Multi-chain HD derivation: Ethereum, Bitcoin (Legacy, SegWit, Native SegWit, Taproot), Solana, Tron, Litecoin, Dogecoin
- **Vanity Miner** — Offline EVM vanity address generator
- **Brain Wallet** — SHA-256 passphrase → BIP39 mnemonic → deterministic wallet
- **Learn Paths** — Visual explanation of BIP44/49/84/86 derivation structure
- **Blockchain Guide** — Address format reference across chains

## Quick Start (Local)

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open in a browser. The main Derive tab works from `file://` with no server.

> **Note:** The Brain Wallet tab and Solana derivation require HTTPS — `crypto.subtle` and dynamic `import()` are blocked on `file://` and insecure origins. Use a local server for full functionality.

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

Zero framework, zero build step. Pure HTML, CSS, and vanilla JavaScript. Only CDN dependencies:

- [ethers.js](https://cdn.jsdelivr.net/npm/ethers@5.7.2) — BIP39 mnemonic, BIP32 HD derivation, EVM addresses
- [tweetnacl](https://cdn.jsdelivr.net/npm/tweetnacl@1.0.3) — Ed25519 key pairs (Solana)
- [ed25519-hd-key](https://cdn.jsdelivr.net/npm/ed25519-hd-key@1.3.0) — SLIP-0010 Ed25519 derivation (Solana)

## License

MIT — see [LICENSE](LICENSE).

---

**Disclaimer:** For testing and educational purposes only.

---

Made and maintained by <a href="https://www.withkeshav.com" target="_blank" rel="noopener">Keshav Maheshwari</a>.
