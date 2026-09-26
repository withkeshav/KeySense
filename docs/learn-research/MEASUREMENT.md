# RQ6 measurement kit: how comprehension gets proven (or not proven)

Status: built, ready to run. This is Phase D of `docs/learn-research/PLAN.md`.

## Why this exists

The page ships `connect-src 'none'` and its privacy policy promises no analytics, so nothing about a
reader can be measured server side. That is a design commitment, not an obstacle to route around.
It means comprehension has exactly two honest evidence sources:

1. a real reader at the target level, watched while they use the page, scored on tasks;
2. the readability gate in `tools/learn-readability.js`, which protects the floor and can never
   prove understanding.

Everything else, including this kit, is a self check. Say so when reporting results. A tool that
scores its own questions and a number that scores its own prose are not evidence about readers.

## What is in the kit

| Piece | Path | What it is |
|---|---|---|
| Readability gate | `tools/learn-readability.js` | Measures per-step prose grade level, word counts, jargon and the longest sentences. Exit 0 fine, exit 1 regression, exit 2 could not measure. |
| Recorded baseline | `tools/learn-readability-baseline.json` | Written by `--write-baseline`. The gate fails when a step gets worse than this. |
| Session page | `test/learn-comprehension.html` | Open from a local copy, in a browser, with the reader present. Collects nothing, has no network at all, stores nothing. It shows the session report for copying. |
| This file | `docs/learn-research/MEASUREMENT.md` | The protocol, scoring and pass bar. |

## Running it

```
node tools/learn-readability.js            # the floor; run after any content edit
node tools/learn-readability.js --show-longest
npm run test:readability
```

Reader session, per reader, about 20 minutes:

1. Open the app's Learn tab once, briefly, so the reader knows where it is, then close the tab.
   Do not read anything aloud from it.
2. Open `test/learn-comprehension.html` from a local copy. Ask the four Pre questions out loud,
   typing the reader's own words. Do not correct, prompt, or explain. "I do not know" is recorded
   as said.
3. Hand the app back. Read the three tasks once. Then stop talking. Watch what they do. Note any
   pause over 30 seconds and any nudge, verbatim.
4. Ask the five Post questions the same way.
5. Press Copy, keep the report, and press Clear before the next reader.

Five readers from the target level. If the reader count is lower, the result is reported as an
indication, never as a pass.

## Scoring

| Item | Correct if the reader says |
|---|---|
| Post 1, why the last word matters | the last word carries a checksum, so a mistyped phrase is rejected rather than silently becoming a different wallet |
| Post 2, two addresses from one seed | the path changed, or the account or index changed, or the wallet picked a different default path |
| Post 3, what makes a seed weak | weak input: words a person chose, a quote, a passphrase, not enough randomness |
| Post 4, never do with a real seed | never type it into a website, never share it, never photograph it, never store it online |

Pass bar for the page as a whole, fixed in advance so the result cannot be reinterpreted after the
fact: **4 of 5 readers complete tasks 1 and 2 alone, and 4 of 5 answer Post 1 and Post 2
correctly.** Below that, the content is what failed, not the reader.

Falsifier, stated before the run: if 5 of 5 readers pass on the page as it stands today, this
plan's premise is wrong and the correct action is to stop, not to build a Learn v3.

## Reading the result honestly

- Record failures verbatim. A nudge is a failure of the page, and it is the most useful line in
  the whole report.
- A reader who passes after being told the answer has not passed.
- If a reader fails but their words show the page taught something adjacent, that is what the
  design should build on. Keep their sentence.
- Do not average away a single failure. One reader out of five failing on the last word is the
  finding.
