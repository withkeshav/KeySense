# Contributing

KeySense is source-available under KeySense License 1.0, not an OSI open source license. Free to download and use unmodified, including commercially. Modifying, rebranding, or redistributing a changed version requires prior written permission. See `LICENSE` and `README.md:97-100`.

## How to participate

Issues and discussions on GitHub are welcome:

* Report: `https://github.com/withkeshav/KeySense/issues`
* Good reports: what you did, what you expected, what you saw, browser and OS, derivation path if relevant. Never paste seeds, passphrases, or private keys.
* Security issues: open an issue as `SECURITY.md` describes. This is an educational tool and issues are tracked publicly.

## What fits well

* Docs, Learn content, quizzes, glossary, typo fixes.
* Accessibility, mobile layout, print layout.
* Tests and vectors with official BIP, SLIP, or maintainer SDK fixtures including repo path and commit hash, as `test/vectors.js` does.
* Bug reports with independent recomputation, wrong versus right values, and impact.

## What needs prior approval

Per `AGENTS.md`, do not change derivation logic, address formats, vanity mining, brain wallet flow, presets, or path assembly without explicit `approved` or `go ahead` from the maintainer. If you found a bug there, open an issue with evidence first. Do not publish your own modified version.

## Research and evidence

* A research claim needs a source someone can check in one hop, with the number or the quote and a link. A claim nobody can check is an assertion, not a finding.
* Say how a number was measured and by whom. A figure produced by hand and a figure produced by a script are different claims, so label them.
* Learn content changes should hold the reading level at or below the recorded baseline. Run `npm run test:readability`, which reports fine, a regression, or that it could not measure.
* Reader sessions are voluntary and run from `test/learn-comprehension.html`, a local page with no network access that stores nothing.
* Research documents live in `docs/learn-research/` and wiki pages in `wiki/`. After changing a wiki page, publish it with `bash tools/publish-wiki.sh`, which pushes every page and then verifies the remote head matches. The wiki is live at https://github.com/withkeshav/KeySense/wiki

## Style

* Plain simple language. No em-dashes.
* DOM output via `textContent`, never `innerHTML` with user input.
* Keep offline and `file://` working. No new network calls. No new storage of secrets.
* Run `npm test` and include the tail in your report. For vendor or crypto changes also run `bash tools/build-crypto.sh --check` and `bash tools/verify-vendor.sh`.
