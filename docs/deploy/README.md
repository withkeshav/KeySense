# Deploying KeySense

The site is a static, no-build single page served by nginx straight out of the
checkout. There is no build step, no bundler and no minifier, so a deploy is a
pull and nothing else.

## The deploy

    ssh <vps>
    cd /apps/keysense
    git rev-parse HEAD          # record this first, it is the rollback point
    git pull --ff-only origin master
    git status --porcelain      # must be empty

No restart and no reload: nginx reads the files from disk on each request.

## Rollback

    cd /apps/keysense
    git reset --hard <sha recorded before the deploy>

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

2. **nginx sends a policy rather than nothing** (live copy: `nginx-keysense.conf`
   beside this file):

   - `/index.html` and the app's own `/src/*.js` and `/src/*.css`: `no-cache`,
     which means revalidate, not "do not store". A 304 is cheap and a deploy is
     visible immediately.
   - `/src/vendor/*`: `public, max-age=31536000, immutable`, because those
     filenames carry their version (ethers-5.7.2, qrcode-1.5.1, tweetnacl-1.0.3).
     The stamp is still applied, which covers the one vendored file whose name
     does not carry a version, `keysense-hashes.js`.
   - Documentation and gate output (`*.md`, `*.txt`, `*.json`): `public,
     max-age=300`.

With both in place no cache purge is needed after a deploy, which matters
because the available API tokens do not hold the Cache Purge permission.
