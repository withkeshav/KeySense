# KeySense

Crypto key math is confusing, but KeySense makes it simple and understandable.

KeySense is a multi-chain HD derivation, vanity miner, and brain wallet entropy lab. It supports BIP39/32/44/49/84/86, extended keys, and path discovery, all in the browser. See `README.md:7`.

## 100 percent offline

No CDN, no third-party requests. Every dependency is vendored into `src/vendor/` and served from the same origin. No seed, key, or address ever leaves the device. Once loaded, everything works with the network off. See `README.md:67` and `SECURITY.md:5-13`.

## Tabs

The app has six tabs. See `index.html:82-87`.

- Derive Keys
- Vanity (EVM)
- Brain Wallet
- Blockchain Guide
- Learn Paths
- Experiments (alpha)

Paper Wallet printing and the Physical entropy lab live inside the Derive tab flow. Path recovery lives on the Experiments tab.

## Quick start

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open in a browser. The whole tool also works straight from `file://` with no server and no network. Open `index.html` from a USB stick on an air-gapped machine and it works. See `README.md:22-30`.

## Tests

```bash
npm test
```

Runs the full vector suite in Node against the same `src/*.js` files the browser loads. Currently 189 vectors passing. See `README.md:32-38`.

Other checks:

- `bash tools/build-crypto.sh --check` rebuilds the one generated vendor file and diffs it.
- `bash tools/verify-vendor.sh` re-checks vendored files against upstream hashes.

## License

KeySense License 1.0. Free to download and use, including commercially, unmodified. Modifying, rebranding, or redistributing a changed version requires the copyright holder's written permission. This is a source-available license, not an OSI open source license. See `README.md:97-100` and `LICENSE`.

## Disclaimer

For testing and educational purposes only. Not a custodian or wallet provider. Always verify with an independent tool before sending real funds. See `README.md:103`.

## Privacy

The app collects nothing. Hosting sees routine server traces only. See `PRIVACY.md` and `wiki/Security.md`.

## Participate

Found an issue or idea. Open an issue at `https://github.com/withkeshav/KeySense/issues`. Never share seeds or private keys. See `CONTRIBUTING.md`.

## Research

The Learn tab is built on published research, and the research is in the open: the plan, the evidence briefs and the measurement kit live in `docs/learn-research/`, and the reading level is checked by a gate, `npm run test:readability`. Nothing is measured on you. The reader session page has no network and stores nothing. See [Learn Research](Learn-Research.md) and `PRIVACY.md`.

## More pages

- [Learn Research](Learn-Research.md)
- [Brain Wallet](Brain-Wallet.md)
- [Learn Paths](Learn-Paths.md)
- [Verification](Verification.md)
- [Security](Security.md)
