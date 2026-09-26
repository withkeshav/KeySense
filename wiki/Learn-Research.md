# Learn Research

This page explains the research behind the Learn Paths tab: what we are trying to find out, what we
measured, what the evidence says, and how you can reproduce or challenge any of it.

Status: research in the open. The plan, the evidence briefs and the measurement kit all live in the
repository under `docs/learn-research/`. Nothing on this page is a claim you have to take on trust.
Every source is named with a link, and every number was produced by a command anyone can run.

## Why this exists

The Learn Paths tab teaches how a seed phrase becomes an address. Most people who read it can repeat
the steps, and that is not the same thing as understanding it. So we asked three narrow questions and
went looking for evidence rather than opinion.

1. What do people actually get wrong about seed phrases, and how often.
2. Which teaching techniques are proven to work, judged only by what a page with no server and no
   tracking can actually do.
3. What does the best existing teaching on this subject do that we do not.

## What we found, in short

- The two most common misconceptions we measured are missing from our own Learn tab. People believe a
  seed phrase behaves like a password they chose and could reset, and people believe coins live in the
  app or the device. The largest published survey on this (643 respondents, plus 20 interviews) reports
  58 percent believing they could choose their recovery phrase, and 52 percent naming a username and
  password as what moves a wallet, against 47 percent naming the recovery phrase.
- The biggest single improvement available to us is subtraction, not more content. The strongest
  effects in the learning research are for removing material that does not serve the lesson. We found
  one comparison table printed twice in the same tab and removed the duplicate.
- Reading level was not the problem. Measured, our five teaching segments sit between grade 6.0 and
  8.5 on the Flesch-Kincaid scale. The real load is volume and repeated jargon, so the work is to
  shorten and to define terms once, in place.

## How we measure it

Two instruments, both in the repository.

1. A readability gate, `tools/learn-readability.js`, run with `npm run test:readability`. It measures
   running prose only, keeps tables and diagrams in a separate reported bucket so nothing is quietly
   dropped, and compares against a recorded baseline so the reading level can go down but not drift up.
   It reports three distinct outcomes: fine, a regression, or that it could not measure at all.
2. A reader session page, `test/learn-comprehension.html`. Five readers try three tasks with the
   page, then answer five questions, and we record the answers. The page has no network access and
   stores nothing. It cannot report anything back to us, so the numbers come from a person who was
   in the room, and we say so.

The acceptance bar was set before any of this work started: four of five readers complete the first
two tasks without help, and four of five answer the key questions correctly. If that bar is missed,
the redesign is the thing that failed, not the readers.

## The evidence base

- Eleshin, Sun, Ye, Das and Hong, "Of Secrets and Seedphrases", CHI 2025,
  https://doi.org/10.1145/3706598.3713209. Survey of 643 people plus 20 interviews.
- Learning science, 18 primary sources including Roediger and Karpicke 2006, Karpicke and Blunt 2011,
  Rohrer and Taylor 2007, Sweller and Cooper 1985, Fyfe et al. 2014, Chi et al. 1994, Mayer and
  Moreno 2003, Bjork and Bjork 2011, plus meta-analyses by Adesope 2017, Bisra 2018 and Brunmair and
  Richter 2019. Full list and the quoted evidence: `docs/learn-research/LEARNING-SCIENCE.md`.
- Prior art teardown of eight existing explainers, naming the teaching device each one uses:
  `docs/learn-research/PRIOR-ART.md`.

## What we do not collect

Nothing. The reader session page runs from a local file, makes no network requests, and stores
nothing. There is no telemetry anywhere in this project and there are no plans for any. All research
output is qualitative and volunteered, and it is published in the repository as we go. See
`PRIVACY.md`.

## Where it stands

| Piece | State |
|---|---|
| Research plan, 7 questions | Published: `docs/learn-research/PLAN.md` |
| Misconception inventory | Published, sources verified |
| Learning science brief | Published, 18 primary sources with quoted evidence |
| Prior art teardown | Published, 8 explainers |
| Readability gate and baseline | Live in the repo, wired as `npm run test:readability` |
| Reader session protocol | Published, needs readers |
| Learn redesign outline | Published as a proposal: `docs/learn-research/OUTLINE.md` |
| Visual system: diagrams, charts, motion | Published as a plan: `docs/learn-research/VISUAL-SYSTEM.md` |
| Rebuild | Two segments done, four build stages to go. Subtraction first, then the words, then the graphics |

## Challenge it

If a claim here looks wrong, the useful thing to send is the source that contradicts it, or the
command output that disagrees. Both are easy to check and both are welcome at
https://github.com/withkeshav/KeySense/issues
