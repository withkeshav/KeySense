# Learn research

This folder is the research behind the Learn Paths tab, published as it is done. It is the canonical
copy: the numbered questions, the evidence, the measurements and the plan for the rebuild all live
here so anyone can read them, check them, or disagree with them in public.

## What is here

| File | What it is | Status |
|---|---|---|
| [PLAN.md](PLAN.md) | The research plan: 7 questions, 6 phases, the deliverables, and the progress log | Approved, in progress |
| [OUTLINE.md](OUTLINE.md) | The proposed rebuild of the Learn tab, segment by segment, with success criteria | Approved, in progress |
| [MISCONCEPTIONS.md](MISCONCEPTIONS.md) | What people get wrong about seed phrases, ranked, with sources | Evidence complete, 5 of 13 items still unconfirmed and labelled as such |
| [LEARNING-SCIENCE.md](LEARNING-SCIENCE.md) | Which teaching techniques are proven to work, filtered by what an offline page can do | Evidence complete, 18 primary sources |
| [PRIOR-ART.md](PRIOR-ART.md) | Teardown of 8 existing explainers, naming the teaching device each one uses | Complete |
| [MEASUREMENT.md](MEASUREMENT.md) | The protocol for the reader sessions, the scoring rubric and the pass bar | Ready, needs readers |
| [VISUAL-SYSTEM.md](VISUAL-SYSTEM.md) | The graphics, charts and motion system: colour roles, diagram and chart primitives, motion grammar, and how it gets verified | Plan, approved in principle, next to build |

## How any number here was produced

Two instruments, both in the repository.

1. `tools/learn-readability.js`, run as `npm run test:readability`. It measures running prose per
   teaching segment. Tables, ASCII pipeline art, path cards and the glossary are counted separately
   and reported, so nothing is quietly dropped from the measurement. It compares against
   `tools/learn-readability-baseline.json`, which is written by the tool itself and never by hand.
   It ends in one of three states: measured and fine, measured and worse, or unable to measure. It
   never reports a pass it could not compute, and it always prints the gap to the 8th grade target so
   passing above target is visible rather than silent.
2. `test/learn-comprehension.html`, the reader session page. Five readers try three tasks, then answer
   five questions. The page has no network access and stores nothing, so it cannot report anything
   back on its own: the numbers come from a person who was in the room, and they are published as
   counts.

## The rules this research follows

- Every claim carries a source someone can check in one hop, or it is labelled UNCONFIRMED.
- A negative is never inferred from an absent document. Where a source's own page does not carry a
  widely repeated figure, that figure is listed as unconfirmed rather than repeated.
- A number produced by hand and a number produced by a script are different claims, and both are
  labelled.
- Where a source's evidence is weaker than the claim built on it, the brief says so, including the
  items that were dropped after checking.

## What is deliberately not here

The evidence cache stays local: the verbatim quote ledger and the cached page text of third party
sources are not republished, because they are other people's pages. The briefs cite each source by
title and URL instead, so the quotes can be re-checked at the source.
