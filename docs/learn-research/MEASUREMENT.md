# RQ6 measurement kit: how comprehension gets proven (or not proven)

Status: built, ready to run. This is Phase D of `docs/learn-research/PLAN.md`.

Benchmark, decided by the operator on 2026-09-26: **grade 8, with readers working in English as a
second language.** The pass bar below is written for that reader, so a reader who is at ease in
English is not the target case.

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
| Post 1, why the last word matters | the last word contains randomness and checksum bits; the checksum catches many mistakes, but some wrong phrases still pass |
| Post 2, two addresses from one seed | the path, account, index or BIP39 passphrase changed, or the wallet picked a different default path |
| Post 3, what makes a seed weak | weak input: words a person chose, a quote, a passphrase, not enough randomness |
| Post 4, never do with a real seed | never type it into a website, never share it, never photograph it, never store it online |

Pass bar for the page as a whole, fixed in advance so the result cannot be reinterpreted after the
fact: **4 of 5 readers complete tasks 1 and 2 alone, and 4 of 5 answer Post 1 and Post 2
correctly, and 4 of 5 answer Post 3 and Post 4 correctly.** Any answer suggesting that
a predictable seed is safe, or that a real seed may be shared, must be reported separately
and corrected before a release. Below that, the content is what failed, not the reader.

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

## Next-version evaluation

Use public test phrases only. For the path task, hold the phrase and BIP39 passphrase
constant so a changed path is the only cause of the changed address. Ask an additional
question about why a different passphrase can also produce a different wallet.

A 12-word phrase has four checksum bits. A checksum is a mistake check, not proof of
ownership or security; some incorrect phrases pass it. See the
[BIP39 specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki).

The expanded safety pass bar above applies to new sessions. Keep earlier results labelled
with the rubric used at the time. Five readers can reveal usability failures; they do not
prove effectiveness for every reader. Follow up later with a short explanation task to
check what readers remember. Keep raw notes private and publish only consented,
de-identified totals. No completed reader study is claimed by this protocol.

## Recovery Detective observation

The Learn Paths exercise uses fixed public fixtures and changes only the example
wallet path. Ask the reader to match the old address, then explain the cause.
Record hint use and corrected answers separately from an unaided explanation.
Its completion message is local feedback, not evidence of a completed reader study.

## Broader wallet course assessment

The twenty-lesson course expands the scope beyond derivation. See CURRICULUM.md
for the coverage map and limits. Evaluate new cases without showing the lesson text:

| Case | Evidence of understanding | Unsafe conclusion to record |
|---|---|---|
| A site is disconnected but still has an allowance | Separates browser connection from on-chain permission | Disconnecting revokes all spending rights |
| A hardware device shows an unexpected recipient | Stops and checks the request independently | Any hardware-approved request is safe |
| A 2-of-3 wallet has two seeds but lacks its policy | Identifies missing reconstruction data | Any two seeds always restore the wallet alone |
| A path scan finds no match | States exactly what was searched and names remaining hypotheses | No match proves there are no funds |
| A deposit uses an unsupported network | Separates address format, network and asset support | Matching address text guarantees recovery |

Score each case 0 for an unsafe or unsupported conclusion, 1 for a correct choice
without reasons, and 2 for correct reasoning with stated limits. Record help
separately. A useful pilot target is at least 8/10 with no unsafe conclusion,
followed by a later session using new examples. This target is provisional and
is not a professional certification. Do not combine these scores with results
from the earlier four-question study as though the tests were interchangeable.

Use disposable examples and public policy data. Keep names, recordings and raw
answers outside this repository. No reader results are claimed until sessions
have actually been conducted.

## Reviewing the ten practical cases

Ask the reader to answer each case before expanding its review. Use the two stated
criteria to discuss the answer. For a study, record 0 for an unsafe or unsupported
conclusion, 1 for a sound choice without reasons, and 2 for sound reasoning that
states a limit. Record help and opened reviews separately from unaided answers.
Use each changed case in discussion, then prepare a new unseen case for later recall.
Do not use the revealed model answer as evidence of independent understanding.

The five-case pilot target above applies only to that five-case instrument. Do not
reuse its 8/10 target for these ten cases or merge their results. This set has no
validated pass mark. No learner sessions or learning gains are claimed.
