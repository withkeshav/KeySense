# Deploying KeySense

KeySense is a static site. Keep the repository checkout separate from the public web root.
`.gitignore` does not prevent a web server from exposing ignored files.

## Prepare a release

1. Start from a reviewed commit with a clean working tree. Record its commit ID.
2. Run `npm test`, `npm run test:readability`, `npm run test:viz`,
   `npm run test:release`, `npm run test:browser`,
   `bash tools/verify-vendor.sh` and `npm run test:build`.
3. Run `npm run package:site`. This creates a new `dist/` directory containing only
   files listed in `tools/site-files.json`. It refuses an existing output directory
   or any symlink input. For a later release, choose a new directory with
   `npm run package:site -- /path/to/new-release`. Review the file list, then deploy
   that output directory. Public privacy/security pages and library notices are included.
4. Never copy `.git`, private notes, environment files, local tooling, test reports or
   credential files. Do not use `cp -r .` or serve the checkout directly.
5. Serve that directory over HTTPS. The adjacent nginx file is an example for a server
   behind an HTTPS proxy; replace its generic domain and public-directory placeholders.
   Configure TLS separately when nginx is exposed directly.
6. Check the deployed page, asset responses and framing protections. Requests for
   `/.git/HEAD`, `/.env`, `/AGENTS.md` and private notes must return 403 or 404.
7. Keep the previous release directory so rollback can switch to it without rewriting
   or deleting the development checkout.

Do not put actual hostnames, server paths, access tokens or operational notes into public docs.

## Caching, and why the asset names carry a hash

Measured failure this policy exists to prevent: the edge served a cached older
`src/learn-visuals.js` (13,889 bytes) alongside a fresh `index.html`, and the page
ran the previous version of the code while every file on disk was correct. The
cause was the origin sending no cache headers at all, so the CDN applied its
default, which caches `.js` and `.css` but never `.html`.

Two changes fix it, and they are deliberately belt and braces:

1. **`tools/stamp-assets.js`** rewrites every local script and stylesheet
   reference in `index.html` and `test/self-test.html` with `?v=<first 8 hex of
   the file's sha256>`. When an asset changes, its URL changes, so an old copy
   sitting in a browser or at an edge is under a different address and cannot be
   reached. Run `npm run stamp` after touching any file under `src/`.

   Forgetting is not silent: the suite runs the same checker in `--check` mode
   and fails with the exact reference and both hashes.

2. **nginx sends a policy rather than nothing** (example: `nginx-keysense.conf`
   beside this file):

   - `/index.html` and the app's own `/src/*.js` and `/src/*.css`: `no-cache`,
     which means revalidate, not "do not store". A 304 is cheap and a deploy is
     visible immediately.
   - `/src/vendor/*`: `public, max-age=31536000, immutable`, because those
     filenames carry their version (ethers-5.8.0, qrcode-1.5.1, tweetnacl-1.0.3).
     The stamp is still applied, which covers the one vendored file whose name
     does not carry a version, `keysense-hashes.js`.
   - Documentation and gate output (`*.md`, `*.txt`, `*.json`): `public,
     max-age=300`.

Verify the cache policy at the hosting provider too; it can override origin headers.
