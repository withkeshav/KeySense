# Release checklist

A release is any change to `index.html`, `src/*.js`, `src/vendor/*`, or the
security posture documented in `SECURITY.md`. This is a browser-based tool with
no build step, so "release" means: make sure the artifacts you are about to push
are the ones you intend, then push a tag.

## Pre-release

1. **Run the full test suite.**
   `npm test` must end with `0 failed`. It covers every address vector, the
   entropy lab, the brain wallet, the Key paths live values, and the RNG
   fail-closed suite added in the security pass.
2. **Verify vendored supply chain.**
   - `bash tools/verify-vendor.sh` re-checks the three copied vendors
     (ethers, qrcode, tweetnacl) against their pinned upstream SHA-384 hashes.
   - `bash tools/build-crypto.sh --check` proves `src/vendor/keysense-hashes.js`
     reproduces byte for byte from its pinned inputs.
   A mismatch means: either upstream rotated a file at the same URL, or the
   local copy changed. Understand which before shipping.
3. **Browser and release checks.** Run `npm run test:browser` with Chrome installed
   (or set `CHROME_BIN` to its executable). Run `npm run test:release`,
   `npm run test:readability` and `npm run test:viz`. Then open `index.html` and confirm:
   - Generate a 12-word and a 24-word seed; the seed bar updates.
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

## Public artifact and privacy

- `npm run package:site` creates a new public folder from `tools/site-files.json`.
  The default package is tracker-free. Use `npm run package:site -- /tmp/keysense-hosted --hosted`
  only for the hosted website, never for downloadable offline archives. Check the
  generated head has exactly one tracker and that script and collection requests
  pass its CSP.
  Deploy only that folder. Never deploy the checkout or ignored local files.
- Review `git status --short`, `git diff` and `git ls-files --cached --others --exclude-standard`, including new documents, for credentials,
  workstation paths and operational notes. Ignore rules do not remove tracked history.
- Check upstream dependency advisories separately from byte verification.
- Review Git history separately from the current files. Removing text in a new commit
  does not remove it from older commits, tags or existing copies of the repository.
  Keep detailed findings outside the public checkout. If a real credential is found,
  revoke or rotate it before considering history cleanup. Rewriting published history
  requires a separate, coordinated decision because it changes commit identifiers and
  affects other contributors' copies.
- Test the deployed security headers and private-path denials in the deployment guide.
- Reader-session scores require real readers; automated checks are not comprehension evidence.

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

10. The scheduled `vendor-check` runs against the default branch, not a release tag.
    To verify a past release, check out its tag separately and rerun the vendor checks.
    Confirm scheduled checks stay green, and review upstream advisories separately.

## Local hosted analytics settings

The hosted build reads `private/hosted-analytics.json`. This file is git-ignored,
required only with `--hosted`, and never copied into the public package. Keep a
private backup for deployment recovery. A fresh clone can create a tracker-free
package without this file. The generated hosted HTML necessarily exposes the
tracker URL and public site ID to visitors; this is not a way to hide credentials.

Create the local file using this schema, replacing the example values:

```json
{
  "scriptUrl": "https://analytics.example.test/script.js?siteId=YOUR_PUBLIC_SITE_ID",
  "scriptOrigins": ["https://analytics.example.test"],
  "connectOrigins": ["'self'", "https://analytics.example.test"]
}
```

Add any other required beacon script and collection origins to those arrays.
Only exact HTTPS origins are accepted; `connectOrigins` also accepts `'self'`.
Run the hosted package command above locally, then upload only its generated files.
Do not upload the private settings file or the repository checkout. Public tests
use fictional example settings and do not need the deployment configuration.
