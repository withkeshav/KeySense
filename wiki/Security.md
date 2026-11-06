# Security

Summary of `SECURITY.md`. Read the full file for hashes and commands.

## No network

The app processes wallet inputs locally and does not upload them. Hosting receives normal page requests; external links open other services. The default page contains no `fetch`, no `XMLHttpRequest`, no `WebSocket`, no `sendBeacon`, and no analytics or telemetry. See `SECURITY.md`.

## CSP connect-src none

The default page ships a Content-Security-Policy that includes `connect-src 'none'`. This restricts interfaces such as fetch and WebSocket. It does not block every navigation or protect against a compromised browser, extension or device. The full policy is in `index.html`. See `SECURITY.md`.

## Vendored libs with versions

Every dependency is vendored into `src/vendor/` and served from the same origin. See `README.md`.

- ethers.js 5.8.0: BIP39 mnemonic, BIP32 HD derivation, EVM addresses.
- tweetnacl 1.0.3: Ed25519 key pairs (Solana, Sui, Aptos).
- qrcode 1.5.1: QR code rendering.
- `@noble/hashes` 1.5.0: `blake2b` (Sui) and `sha3_256` (Aptos), the only two primitives the others do not provide and Web Crypto does not expose.

Verify copies against upstream SHA-384 hashes with `bash tools/verify-vendor.sh`, and the generated hashes file with `bash tools/build-crypto.sh --check`. See `SECURITY.md`.

## No storage of keys

The app does not deliberately persist keys. Only the theme is kept in `localStorage`. Clear resets seed-dependent panels; Hide only masks the seed bar. Clipboard history, print jobs, PDFs and device memory can retain copies. See `PRIVACY.md`.

## Canary

A one-time runtime canary checks on every page load that `crypto.getRandomValues` is not silently returning degenerate output (identical draws, all-zero, or a single repeated byte) before anything trusts it for key material. If it ever fails, a warning appears at the top of the page and nothing should be generated until it is understood. Seeds come from `crypto.getRandomValues` via `ethers.utils.randomBytes`; `Math.random` is not used anywhere that touches key material. See `SECURITY.md` and `src/secure-random.js`.

## How to report issues

Open an issue on GitHub rather than emailing; this is an educational tool and issues are tracked publicly. See `SECURITY.md`.

## Testing only

KeySense is intended for learning, experimentation, and educational use. Use public or disposable examples, not real wallet backups. Always test derived addresses against known-good tools before relying on them. See `SECURITY.md`.

The optional `--hosted` package adds InsightFlare visit analytics and permits its
script and connections. Default downloads stay tracker-free. See `PRIVACY.md`
and `SECURITY.md` for storage, data use and the remote-script trust boundary.
