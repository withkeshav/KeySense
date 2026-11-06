# KeySense

Crypto key math is confusing, but KeySense makes it simple and understandable.

KeySense is a multi-chain HD derivation, vanity miner, and brain wallet entropy lab. It supports BIP39/32/44/49/84/86, extended keys, and path discovery, all in the browser. See `README.md`.

## 100 percent offline

No CDN, no third-party requests. Every dependency is vendored into `src/vendor/` and served from the same origin. The app does not upload wallet inputs. Copying, printing or compromised equipment can expose them. Once loaded, everything works with the network off. See `README.md` and `SECURITY.md`.

## Tabs

The menu separates tools from learning. Home opens by default. On phones, tap
Menu beside the current section to open navigation. Larger screens show a sidebar.

**Tools**

- Home: seed and path inspection
- Key paths: six live derivation lessons and Recovery Detective
- Advanced practice: limited typo, missing-word and path searches
- Vanity lab: EVM address-prefix experiments
- Brain wallet lab: why chosen phrases are unsafe

**Learning**

- Wallet course: twenty lessons and ten practical cases
- Blockchain guide: chain and address reference

Print example backup and the Physical entropy lab are inside the Home.
The course checks reasoning without saving progress or claiming certification.

## Quick start

```bash
npm run dev
# or
python3 tools/devserver.py
```

Open `http://127.0.0.1` in your browser while the server is running. Python 3.9 or newer is required. Keep the full folder together for offline `file://` use; an HTML attachment preview may not load its sibling assets. See the README Quick Start.

## Tests

```bash
npm test
```

Runs the full vector suite in Node against the same `src/*.js` files the browser loads. The current check count is printed by `npm test`. See `README.md`.

Other checks:

- `bash tools/build-crypto.sh --check` rebuilds the one generated vendor file and diffs it.
- `bash tools/verify-vendor.sh` re-checks vendored files against upstream hashes.

## License

KeySense License 1.0. Free to download and use, including commercially, unmodified. Modifying, rebranding, or redistributing a changed version requires the copyright holder's written permission. This is a source-available license, not an OSI open source license. See `README.md` and `LICENSE`.

## Disclaimer

For testing and educational purposes only. Not a custodian or wallet provider. Always verify with an independent tool before sending real funds. See `README.md`.

## Privacy

The app collects nothing. Hosting sees routine server traces only. See `PRIVACY.md` and `wiki/Security.md`.

## Participate

Found an issue or idea. Open an issue at `https://github.com/withkeshav/KeySense/issues`. Never share seeds or private keys. See `CONTRIBUTING.md`.

## Research

The Key paths walkthrough is built on published research, and the research is in the open: the plan, the evidence briefs and the measurement kit live in `docs/learn-research/`, and the reading level is checked by a gate, `npm run test:readability`. Nothing is measured on you. The reader session page has no network and stores nothing. See [Learn Research](Learn-Research.md) and `PRIVACY.md`.

## More pages

- [Learn Research](Learn-Research.md)
- [Brain Wallet](Brain-Wallet.md)
- [Wallet course and Key paths](Learn-Paths.md)
- [Verification](Verification.md)
- [Security](Security.md)
