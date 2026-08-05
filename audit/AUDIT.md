# KeySense: notes for a security review

This document exists so a reviewer does not have to reverse engineer the intent of the codebase
before starting on the substance. It states what is in scope, what the tool is defending
against, where the dependencies came from, and what has already been checked.

KeySense is a static, single page HD wallet derivation tool. It turns a BIP39 mnemonic plus a
derivation path into addresses and keys for several chains, and it teaches how that works. It
does not store keys, does not sign transactions, and makes no network requests after load.

---

## 1. Scope

### In scope

| Path | What it is |
|---|---|
| `index.html` | The entire UI, the CSP, and all page copy |
| `src/*.js` (excluding `src/vendor/`) | All first-party logic: derivation, address encoding, entropy, UI |
| `src/vendor/keysense-hashes.js` | Generated. In scope specifically for **build reproducibility**, see section 4 |
| `test/`, `tools/` | The verification harness and the build script |

### Out of scope, beyond confirming provenance

`src/vendor/ethers-5.7.2.umd.min.js`, `src/vendor/tweetnacl-1.0.3-nacl-fast.min.js`,
`src/vendor/qrcode-1.5.1.min.js`, and the `@noble/hashes` source contained inside
`keysense-hashes.js`.

These are pinned, widely reviewed upstream artifacts. We are asking you to confirm that the
bytes we ship are the bytes upstream published (section 4 tells you how), not to review the
internals of ethers.

This boundary is stated explicitly so the report does not come back saying "we did not audit
ethers". That is correct and expected.

### Explicit non-goals of the software

- It never persists a key. `localStorage` holds one value, the theme preference.
- It never signs a transaction or constructs one.
- It makes no network requests at all after the page has loaded.

---

## 2. Threat model

### Assets

1. The mnemonic and optional BIP39 passphrase, typed or generated, held in DOM input values.
2. The 512-bit BIP39 seed, transiently in memory during derivation.
3. Derived private keys, WIF, and extended private keys, rendered into DOM text nodes and onto
   the printable paper wallet.
4. The clipboard, when the user copies any of the above.

### In scope adversaries

| Adversary | Mitigation to check |
|---|---|
| A malicious or compromised web host serving modified JS | Every dependency is same-origin and hash-published (section 4). There is no CDN, so there is no third party who can change the code without changing what the host serves. This does not defend against the host itself, which is stated plainly in section 5. |
| Supply chain attack on a dependency | Exact version pins, npm tarball integrity hash for the one built file, SHA-384 for each copied file. |
| DOM XSS through mnemonic, passphrase, or custom path input | CSP `script-src 'self'` with no `'unsafe-inline'` and no `'unsafe-eval'`. Sinks that take user input build DOM nodes rather than HTML strings. `escapeHtml` in `src/html-escape.js` for the remaining string-built HTML. |
| Exfiltration after any script execution | CSP `connect-src 'none'`. The app makes no legitimate network calls, so this costs nothing and makes exfiltration structurally impossible rather than merely unlikely. |
| Weak or predictable entropy | `crypto.getRandomValues` only. `Math.random` appears nowhere near key material. Rejection sampling for the simulated dice, so no modulo bias. The entropy lab refuses to mint a phrase claiming more bits than the input supplied. |
| A user talked into pasting a hostile "seed phrase" | The mnemonic typo checker deliberately runs on *invalid* input, so it is the one place a mnemonic reaches the DOM without validation. It builds nodes, never markup. This was a live XSS before 2026-08-04 and is worth re-checking. |

### Explicitly out of scope

Stated rather than left implied, because a reader should know where the line is:

- Malware, keyloggers, or a compromised OS on the user's machine.
- Malicious browser extensions. A content script can read the DOM and defeats everything here.
- Screen capture, camera over the shoulder, or a photographed paper wallet.
- Printer firmware, print spool residue, and anything downstream of `window.print()`.
- The trustworthiness of the host serving the page. See section 5.

---

## 3. Where to start

1. `npm test` — 92 vectors against the shipped files. Green on arrival.
2. `test/self-test.html` — the same suite in a browser, under the same CSP as the app.
3. `bash tools/build-crypto.sh --check` — proves the one generated file matches its pinned inputs.
4. `src/address-service.js` — chain dispatch and every address format.
5. `src/crypto-utils.js` — Base58Check, Bech32/Bech32m, hash160, WIF, and the BIP86 tweak.
6. `src/slip10-ed25519.js` — Ed25519 hierarchical derivation, about 40 lines.
7. `src/entropy-generator.js` — the entropy pool, the mixing, and the minimum gate.
8. `audit/reference/` — noble sources unbuilt, for reading against the bundle.

---

## 4. Dependency provenance

Four libraries, three copied verbatim and one built. `SECURITY.md` carries the SHA-384 of each
copied file and the full evidence chain for the built one. To verify a copied file:

```bash
curl -sL <upstream-url> | openssl dgst -sha384 -binary | openssl base64 -A
```

For `src/vendor/keysense-hashes.js`, which is the only generated file:

```bash
bash tools/build-crypto.sh --check
```

That reinstalls `@noble/hashes@1.5.0`, verifies its npm tarball integrity against a pinned
hash, rebuilds with a pinned `esbuild@0.28.1`, and diffs against the committed copy. esbuild
output is a pure function of (version, input bytes, flags), with no timestamps or randomness.
The one input that changes the bytes is the working directory, because esbuild writes each
source path into the output as a comment; the script enforces running from the repository root.

The bundle is deliberately **not minified**, and `audit/reference/noble-hashes-1.5.0/` holds the
seven upstream ESM files verbatim so the bundle can be read against its sources without running
a build or trusting esbuild at all.

`@noble/hashes` has zero dependencies. SLIP-0010, secp256k1 and BIP86 need no library beyond
ethers, so the tree really is this small.

---

## 5. Known limitations worth challenging

Listed here rather than left for you to find, so review time goes on things we have not already
thought about.

- **Serving the page is a trusted role.** Same-origin vendoring removes third parties, but a
  compromised host can still serve modified JS. Nothing running inside the page can fix that.
  The mitigations available to a user are to run it from `file://` off a local clone, or to
  diff what the server sends against the repository. The tool is built so both are practical:
  there is no build step to run, and every chain works offline.
- **A BIP39 passphrase is weakly protected on its own.** BIP39 uses PBKDF2 with 2048 rounds.
  Against a 128-bit mnemonic that is irrelevant. If the words leak and the passphrase is all
  that remains, 2048 rounds is close to no work factor. The UI does not currently say this.
- **The brain wallet is intentionally insecure.** A single unsalted, unstretched SHA-256 of a
  chosen phrase. It exists to demonstrate why brain wallets get emptied and is fenced with
  warnings. Please confirm the warnings are adequate rather than reporting the design as a bug.
- **Passphrase strength numbers are upper bounds.** The comparison widget shows character-space
  size, which a long invented phrase can push above the 128-bit baseline. That is flagged in the
  UI as a ceiling rather than a measurement, and the flag is covered by tests, but the framing
  is a judgement call and worth a second opinion.
- **Sui and Aptos address formats were wrong until 2026-08-05.** Both are now verified against
  independent implementations, but neither has yet been confirmed against an official SDK or
  block explorer. That check is outstanding and would be a good early target.
- **`purpose` 86 on altcoins.** Litecoin Taproot is derived by the same code path as Bitcoin.
  The BIP86 vectors cover Bitcoin only; the Litecoin value is cross-tool, not from a spec.

---

## 6. What has already been verified

So that effort is not duplicated.

- **Derivation was checked against an independent implementation.** BIP39, BIP32, secp256k1,
  Base58Check, Bech32 and Keccak-256 were rewritten from the specifications in Python using only
  `hashlib` and `hmac`, sharing no code with the app, and compared. That comparison is what
  found the Sui bug; testing the app against its own libraries would not have.
- **Published vectors pass:** BIP39, BIP32, BIP44/49/84, all three BIP86 vectors, and both
  SLIP-0010 ed25519 vectors at every level.
- **The SLIP-0010 replacement was diffed against the library it replaced** across 1500 paths
  (5 mnemonics x 2 passphrases x 3 coin types x 50 indices) before that library was deleted.
  Zero mismatches.
- **The CSP is enforced, not merely present.** Verified by attempting a blocked cross-origin
  `fetch` and an inline `<script>` injection, both refused.
- **Zero off-origin requests**, confirmed through `performance.getEntriesByType("resource")`.
- **`file://` works for every tab and every chain**, confirmed in headless Chrome with no CSP or
  CORS errors.
- **The simulated dice are unbiased.** 360,000 draws, six independent runs, chi-square 5.21,
  7.45, 2.91, 7.51, 9.13 and 6.84 against a 0.05 critical value of 11.07 at five degrees of
  freedom. Rejection sampling discards bytes at or above 252, since 256 is not a multiple of 6.

---

## 7. Reporting

Please open issues on GitHub. This is an educational tool and issues are tracked publicly.

If you find something that could cause loss of funds, say so in the title. The Sui bug in
section 5 is the standard this project wants to be measured against: an address that looked
entirely plausible, was documented as correct in three places, and was wrong.
