# Security

This tool runs entirely in your browser. No seed phrases, private keys, or derived addresses are transmitted anywhere.

## Network activity

There is none beyond loading the page itself.

Every library is vendored into `src/vendor/` and served from the same origin as the page, so nothing is fetched from a CDN or any other third party. The source contains no `fetch`, no `XMLHttpRequest`, no `WebSocket`, no `sendBeacon`, and no analytics or telemetry of any kind. Once the page has loaded you can disconnect the network entirely and everything still works, on every tab and every chain.

The page also ships a Content-Security-Policy that includes `connect-src 'none'`. Even if a bug allowed script execution on the page, that script would have no way to send your seed anywhere.

Opening the page as a `file://` URL works for everything, including Solana, Sui and Aptos. There is no dynamic `import()` and nothing requires a secure context, so the whole tool runs from a USB stick on a machine with no network stack. This is verified in CI-style by `npm test` plus a headless `file://` run.

## Verifying the vendored libraries

The vendored copies were downloaded from the upstream sources below. To check that the files in this repository are unmodified, download the originals and compare hashes:

| File | Upstream | SHA-384 (base64) |
|---|---|---|
| `src/vendor/ethers-5.7.2.umd.min.js` | `https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js` | `Htz1SE4Sl5aitpvFgr2j0sfsGUIuSXI6t8hEyrlQ93zflEF3a29bH2AvkUROUw7J` |
| `src/vendor/qrcode-1.5.1.min.js` | `https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js` | `kgapoJ184YmO0XnbSIH1J6dSp5rSYForqfjCgDat5yiSr8gjCnuTdRRCJXcVZ+pi` |
| `src/vendor/tweetnacl-1.0.3-nacl-fast.min.js` | `https://cdn.jsdelivr.net/npm/tweetnacl@1.0.3/nacl-fast.min.js` | `05+sicyRJQ56XpL4U9HJ8YbtSzFDvAg7apPKOGV6A0JsAJKFM68jp5oLnUjG5mEp` |

```bash
curl -sL <upstream-url> | openssl dgst -sha384 -binary | openssl base64 -A
```

### The one generated file

`src/vendor/keysense-hashes.js` is the only file here that is built rather than copied. It contains `blake2b` (Sui addresses) and `sha3_256` (Aptos addresses) from `@noble/hashes`, the two primitives neither ethers nor tweetnacl provides and no browser exposes through Web Crypto. It is not minified, so it can be read directly.

Rather than one hash, it carries three pieces of evidence:

| Evidence | Value |
|---|---|
| npm tarball integrity, `@noble/hashes@1.5.0` | `sha512-1j6kQFb7QRru7eKN3ZDvRcP13rugwdxZqCjbiAVZfIJwgj2A65UmT4TgARXGlXgnRkORLTDTrO19ZErt7+QXgA==` |
| Builder | `esbuild@0.28.1`, flags pinned in `tools/build-crypto.sh` |
| SHA-384 of the committed artifact | `7wBU9/jeUkBL9/L1R7mP5gxK3Ofn3VDPv/PZNJ0dGdCY6bYP1rPEHcZ3JCL4ryNA` |

Verify it reproduces from those inputs, with no trust in whoever built it:

```bash
bash tools/build-crypto.sh --check
```

esbuild output is a pure function of (version, input bytes, flags): no timestamps, no randomness, no machine identifiers. The one thing that would change the bytes is running it from somewhere other than the repository root, because esbuild writes each input path into the output as a comment. The script enforces that.

If you would rather not run a build at all, `audit/reference/noble-hashes-1.5.0/` holds the seven upstream ESM files verbatim, with their MIT license. The page never loads them; they are there so the bundle can be read against its sources by eye.

`@noble/hashes` has zero dependencies, which is why this is 7 modules and not a tree.

## Where the randomness comes from

Seeds from the **Generate** button come from `crypto.getRandomValues`, by way of `ethers.utils.randomBytes`. That is not a plain software RNG. It is a thin browser wrapper over the operating system CSPRNG, which is seeded from hardware sources: on-die thermal-noise generators (`RDSEED` on x86), interrupt timing, and device driver events. The same source backs the vanity miner and the simulated dice in the entropy lab.

`Math.random` is not used anywhere that touches key material.

The **physical entropy lab** is there for people who would rather not depend on that. Type real dice rolls or coin flips and they are hashed into the entropy, together with 32 fresh CSPRNG bytes unless you tick reproducible mode. Mixing means the result is never weaker than the better of your dice and the browser: if any one input is unpredictable, the digest is unpredictable, even if an attacker chose all the others. The lab also refuses to mint a phrase claiming more bits than you actually supplied, which takes 50 dice rolls for 12 words and 100 for 24. The point of real dice is not that they are more random than a hardware RNG. It is that they do not depend on your machine, so malware on it cannot predict them. The **Simulate** buttons in that panel draw from the browser CSPRNG, so they show the pipeline working rather than replacing it.

## Reporting a Vulnerability

If you find a security issue, please open an issue on GitHub rather than emailing; this is an educational tool and issues are tracked publicly.

## For Testing and Educational Purposes Only

KeySense is intended for learning, experimentation, and educational use. Do not use it to generate wallets that hold significant value without independent verification. Always test derived addresses against known-good tools before relying on them.

If you want to use a local version, download it from [https://github.com/withkeshav/KeySense](https://github.com/withkeshav/KeySense).
