# Release checklist

A release is any change to `index.html`, `src/*.js`, `src/vendor/*`, or the
security posture documented in `SECURITY.md`. This is a browser-based tool with
no build step, so "release" means: make sure the artifacts you are about to push
are the ones you intend, then push a tag.

## Pre-release

1. **Run the full test suite.**
   `npm test` must end with `0 failed`. It covers every address vector, the
   entropy lab, the brain wallet, the Learn tab's live values, and the RNG
   fail-closed suite added in the security pass.
2. **Verify vendored supply chain.**
   - `bash tools/verify-vendor.sh` re-checks the three copied vendors
     (ethers, qrcode, tweetnacl) against their pinned upstream SHA-384 hashes.
   - `bash tools/build-crypto.sh --check` proves `src/vendor/keysense-hashes.js`
     reproduces byte for byte from its pinned inputs.
   A mismatch means: either upstream rotated a file at the same URL, or the
   local copy changed. Understand which before shipping.
3. **Browser smoke test.** Open `index.html` and confirm:
   - Generate a 12-word and a 24-word seed; the sticky seed bar updates.
   - Seed bar Hide masks the phrase, Show reveals it, Clear empties it and
     resets every derived result.
   - Derive an address on at least one EVM and one non-EVM chain (e.g. Ethereum
     preset and Bitcoin native) and confirm the result matches a wallet you
     trust.
   - The seed bar and results render correctly in both light and dark themes.
4. **Check the drift guard.** `npm test` prints `self-test.html loads the same
   scripts as index.html`; if it reports drift, add the missing script tags to
   `test/self-test.html` before releasing.
5. **Confirm CI is green** on the branch: push and check the `ci` workflow. The
   weekly `vendor-check` job re-runs step 2 on a schedule, so an unreleased
   drift is caught within a week even if you miss it at release time.

## Tag and announce

6. Bump the version in `package.json` if the change warrants it (matching the
   pattern in `CHANGELOG.md`).
7. Add a `CHANGELOG.md` entry describing what changed and why, with the
   security-relevant items called out.
8. Create a signed tag: `git tag -s vX.Y.Z -m "vX.Y.Z"` and push it with
   `git push origin vX.Y.Z`.
9. Write the release notes from the changelog entry. Mention any vector or
   security fix explicitly; link to `SECURITY.md` if the notes touch on
   trust or verification.

## Post-release

10. Within a week, the CI `vendor-check` cron runs `verify-vendor.sh` and
    `build-crypto.sh --check` against the tagged commit. Confirm it stays green;
    that is the automated proof the shipped vendors have not changed upstream.
