# Security

Summary of `SECURITY.md`. Read the full file for hashes and commands.

## No network

The tool runs entirely in the browser. No seed phrases, private keys, or derived addresses are transmitted anywhere. There is no network activity beyond loading the page itself. The source contains no `fetch`, no `XMLHttpRequest`, no `WebSocket`, no `sendBeacon`, and no analytics or telemetry. See `SECURITY.md:3-9`.

## CSP connect-src none

The page ships a Content-Security-Policy that includes `connect-src 'none'`. Even if a bug allowed script execution on the page, that script would have no way to send a seed anywhere. The full policy is in `index.html:16`. See `SECURITY.md:11`.

## Vendored libs with versions

Every dependency is vendored into `src/vendor/` and served from the same origin. See `README.md:67-72`.

- ethers.js 5.7.2: BIP39 mnemonic, BIP32 HD derivation, EVM addresses.
- tweetnacl 1.0.3: Ed25519 key pairs (Solana, Sui, Aptos).
- qrcode 1.5.1: QR code rendering.
- `@noble/hashes` 1.5.0: `blake2b` (Sui) and `sha3_256` (Aptos), the only two primitives the others do not provide and Web Crypto does not expose.

Verify copies against upstream SHA-384 hashes with `bash tools/verify-vendor.sh`, and the generated hashes file with `bash tools/build-crypto.sh --check`. See `SECURITY.md:15-63`.

## No storage of keys

Keys are never stored. Only the UI theme is kept in `localStorage` (see `src/ui.js:7`). Clearing or hiding the seed resets every panel that showed derived data.

## Canary

A one-time runtime canary checks on every page load that `crypto.getRandomValues` is not silently returning degenerate output (identical draws, all-zero, or a single repeated byte) before anything trusts it for key material. If it ever fails, a warning appears at the top of the page and nothing should be generated until it is understood. Seeds come from `crypto.getRandomValues` via `ethers.utils.randomBytes`; `Math.random` is not used anywhere that touches key material. See `SECURITY.md:65-78` and `src/secure-random.js`.

## How to report issues

Open an issue on GitHub rather than emailing; this is an educational tool and issues are tracked publicly. See `SECURITY.md:80-82`.

## Testing only

KeySense is intended for learning, experimentation, and educational use. Do not use it to generate wallets that hold significant value without independent verification. Always test derived addresses against known-good tools before relying on them. See `SECURITY.md:90-94`.
