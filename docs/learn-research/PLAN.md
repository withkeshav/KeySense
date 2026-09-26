# Learning Experience Research Plan (Learn Paths, KeySense)

Status: APPROVED by the maintainer and in progress. The published copy of this plan is the one in the repository; the working notes live outside it.
Date: 2026-09-26. Repo: /mnt/ai-archive/other-tools/keysense (master, 7c4e306).
Prior art that must not be duplicated: the earlier Learn rounds 1 and 2, both shipped (internal notes, not published).

**Goal:** make the Learn tab teach, so a reader with no crypto background and no help can do two
things: explain in their own words what a seed phrase is and why the last word is special, and
then on the Derive tab show why one seed produces two different Bitcoin addresses. Depth stays
available on demand. "Understood" is proven by measurement, not by assertion.

---

## 1. Baseline, measured today (not from memory)

Learn panel extracted from the shipped `index.html`, prose paragraph text only.

| Measure | Value | How it was measured |
|---|---|---|
| Panel size | 48,485 chars, 505 lines | Python slice of `data-content="learn"` to next tabpanel |
| Prose | 3,563 words, 231 sentences | tag strip + sentence split |
| Reading grade | FK 8.2 overall with a cruder extractor, superseded by the per-step gate numbers below | standard FK formula, vowel-group syllables |
| Long sentences | 28 of 231 (12%) over 25 words | same split |
| Real visuals | **0** images, 0 svg, 0 canvas | markup count; the "diagrams" are monospace ASCII |
| Interactive | 9 buttons, 7 inputs/sliders, 3 tables, 20 live-value hosts | markup count |
| Teaching blocks | 5 steps, bit explorer, checksum demo, path builder, 2 task buttons, verify card, glossary (12 terms), FAQ, scenario cards | `wiki/Learn-Paths.md` + markup |

Tooling: `/mnt/ai-data/projects/agent-hermes/home/cache/scratch/learn-audit.py`.

Two honest caveats on that table.

1. The average FK 8.2 is encouraging but an average hides the tail. The worst genuine prose
   sentences are 26 to 38 words, e.g. the Coldcard paragraph (35 words), "The point is what stays
   true regardless..." (31), "But if you can memorise ten random words..." (33), "There is a
   1-in-16 chance..." (27). Twelve percent of the page is built for a reader two grades above the
   target, and that 12% is exactly where the load-bearing ideas live.
2. The script's longest-sentence list also caught ASCII pipeline diagrams (81 and 95 "words")
   because a diagram is not a sentence. The genuine prose run-ons are the 26 to 38 word ones.

Per step, from the gate in `tools/learn-readability.js`, which is the authoritative instrument.
The first version of this plan quoted numbers from a cruder throwaway script that counted table
rows and ASCII pipeline art as sentences; those are superseded by these, and the difference is
recorded rather than quietly replaced.

| Step | Prose FK | Prose words | Prose sentences | Longest prose sentence | Non-prose words, excluded and reported |
|---|---|---|---|---|---|
| 1. Seed phrase | 8.53 | 1,024 | 63 | 53 | 71 |
| 2. Master key | 6.88 | 173 | 12 | 43 | 44 |
| 3. Derivation path | 5.97 | 204 | 20 | 22 | 104 |
| 4. Hardened vs normal | 7.25 | 256 | 22 | 22 | 42 |
| 5. Private key to address | 7.83 | 953 | 68 | 32 | 625 |

The last column is text the gate routes to a separate bucket (reference tables, ASCII pipeline
art, path cards, glossary, arithmetic fragments) and prints, so the split stays auditable rather
than being hidden by whichever filter flatters the number.

Three conclusions, and they change what the work should be:

1. Only step 1 is above the 8.0 target (8.53), and most of that gap is one merged formula line
   inside a list item. Its genuine prose tail runs 35 and 33 words.
2. Steps 2 to 5 already read between grade 6.0 and 7.8. The earlier impression that steps 2 and 4
   were the worst came from the crude extractor, not from the prose. Grade level is not the
   problem in those steps.
3. The real load is volume and jargon, not reading level. Step 5 carries 953 prose words plus 625
   non-prose, and the panel repeats entropy 25 times, hardened 22, checksum 15 and xpub 14. That
   is what an 8th grade reader has to hold, and it is what the depth and simplicity work should
   target first.

Jargon load inside the Learn panel, counted today: entropy 25, hardened 23, checksum 15, xpub 14,
chain code 9, BIP39 9, Ed25519 8, SLIP-0010 7, secp256k1 6, mnemonic 6, derivation path 6,
PBKDF2 5, HMAC 5, SHA-512 5, Bech32 5, Keccak 4, BIP32 2, BIP44 2, HRP 2, xprv 2, WIF 1.

---

## 2. Research questions

Each carries its method and the falsifier that would kill the finding. A claim that cannot be
falsified does not enter the design.

**RQ1. What is the actual comprehension load of the current Learn tab, per step?**
Method: finish the readability pass per step, list every undefined-at-first-use term, list every
sentence over 25 words, mark every step for prerequisite (does it need the previous step or a
chart?). Falsifier: if per-step FK is already under 8 everywhere and no undefined term survives,
this whole RQ returns nothing and the work moves to RQ2 only.

**RQ2. Which misconceptions do non-experts actually hold about seed phrases?**
Method: mine sources where people arrive confused, not where experts explain: Trezor and Ledger
support threads and their "restored wallet is empty" articles, Bitcoin StackExchange top-voted
questions, r/Bitcoin and r/CryptoCurrency recurring questions, and the incident record already in
the internal security audit note (not published). Count how often each misconception recurs.
Falsifier: if the top five are already each answered inside the current Learn tab in plain words,
RQ2 is closed and the FAQ gets no new content.

**RQ3. Which learning techniques have real evidence, and which of them fit a static, offline,
zero-network page?**
Method: read the primary sources, not summaries: retrieval practice (Roediger and Karpicke 2006,
Karpicke and Blunt 2011), spacing (Pashler et al.), interleaving (Rohrer), desirable difficulties
(Bjork), cognitive load and the worked-example effect (Sweller), concreteness fading (Fyfe et al.
2014), self-explanation (Chi), multimedia principles (Mayer). Record the effect and the condition
it was measured under. Reject anything that needs telemetry, accounts, or a server.
Falsifier: a technique whose measured benefit depends on feedback we cannot collect (for example
adaptivity from click data) is dropped, and that gets said out loud in the brief.

**RQ4. Prior art: how do the best explainers teach exactly this?**
Method: tear down six to eight, one page each, naming the specific device used: ethereum.org
learn, learnmeabitcoin.com, the Bitcoin Developer Guide, Ledger Academy, Trezor's blog and docs,
the Coldcard docs, and one non-crypto visual explainer for the diagramming approach. Record the
device, not the topic.
Falsifier: if the teardown shows the current tool already uses every device found, no design work
follows.

**RQ5. What is the readability target, and how is it held?**
Method: fix the benchmark, then make it enforceable. Candidate benchmark: WCAG 3.1.5 (AAA)
"lower secondary education level", which is roughly grade 9, tightened to grade 8 for this tool
because the audience includes readers working in a second language. Then write a `tools/` script
that extracts the Learn panel, computes per-step FK and jargon-at-first-use, and fails above
budget, so the standard cannot silently rot the way the earlier learning round's prose did.
Open question for the operator: is the benchmark US grade 8, or CBSE Class 8 with English as a
second language? Recommendation: assume the harder case, ESL readers, which forces short
sentences and a definition at first use of every term. Falsifier: a gate that no existing section
passes is a badly set gate, not a strict one; calibrate before enforcing.

**RQ6. How do we prove comprehension when the app is forbidden from collecting anything?**
This is the crux and it has no cheap answer. Server-side instrumentation is off the table by
design: `connect-src 'none'` in the page CSP, and `PRIVACY.md` promises no analytics.
Options, in order of evidence quality:
1. Facilitated reader sessions: 5 readers from the target level, each doing the same three tasks
   out loud, no help. Scored on the task, not on opinion. Best evidence, needs the operator to
   recruit readers.
2. A local-only comprehension page that ships with the repo and is opened from `file://`: pre and
   post questions, answers kept in memory, results shown on screen and copyable, nothing sent.
   Proves the questions work; proves nothing about real readers.
3. Teach-back prompts inside the Learn tab: the reader types their explanation, the page shows a
   model answer beside it for self-comparison. Useful as learning, and it produces no data at all.
4. Readability and jargon gates in CI (RQ5). Protects the floor, cannot measure understanding.
Falsifier: if 5 target readers pass the three tasks unaided on the current page, the premise of
this plan is wrong and it should be abandoned rather than embellished.

**RQ7. Where is the honest boundary, and does the ladder teach it?**
Method: name what a reader must not conclude after the lesson: this tool is not a wallet, the
brain wallet demo is a demonstration of failure, an address must be verified with an independent
tool before real funds move, and a "Strong" label on a passphrase would be a lie (the earlier plan
reached the same conclusion for the entropy meter). Then check each step ends with the boundary
that applies to it.
Falsifier: a step that raises a question the tool cannot answer honestly should say so rather than
imply an answer.

---

## 3. Deliverables

- **D1. Measured baseline.** Done in part today (section 1). Completed in Phase A: per-step FK,
  per-step jargon, the sentence tail list with the diagram artifacts excluded.
- **D2. Evidence brief.** RQ3 findings, one row per technique: effect, condition measured, fit for
  a no-network static page, verdict. Every row cited to a primary source.
- **D3. Misconception inventory.** RQ2, ranked by recurrence, each with its source, each mapped to
  the step that should kill it.
- **D4. Prior-art teardown.** RQ4, one page per explainer, device named, with a short list of
  devices worth copying.
- **D5. Learn v3 outline.** Step by step: what the reader does, what they should be able to say
  afterwards, the running example, the words allowed at that point, the visual, and the boundary
  sentence. This is the deliverable the operator reviews before any build.
- **D6. Measurement kit.** The 5-reader facilitator script with the three tasks, the local-only
  pre/post question page (no network), and the readability gate script in `tools/`.
- **D7. Optional: printable worksheet.** A one-page paper version of the ladder, for a classroom
  or an offline machine. Only if the operator wants it.

---

## 4. Hard constraints

- **No network, ever.** `connect-src 'none'` stays. No analytics, no remote fonts, no CDN. Every
  library keeps being served from the same origin.
- **No data collection, including for this research.** Any comprehension testing happens on paper
  or on a local copy with no server.
- **Depth is not deleted, it is moved.** The technical detail that experts want stays in the page,
  behind a "go deeper" control. Motion is progressive disclosure, not removal.
- **Protected areas stay untouched.** No change to derivation math, address formats, the brain
  wallet SHA-256 to BIP39 flow, or presets. `src/learn-live.js` computes live values that the test
  suite locks, and the drift guard ties `test/self-test.html` to `index.html`, so any edit there
  must leave `npm test` at 189 passed, 0 failed.
- **Plain language, no dashes of the decorative kind**, and no claim on the page that the tool
  cannot back with a computation it performs in front of the reader.

---

## 5. Proposed design direction, to be tested against RQ2 to RQ4, not assumed

The depth and simplicity tension is real and cannot be solved by rewriting the same page more
simply. Proposal: **two doors on one page.**

- **Door 1, the plain ladder.** Five steps, each four to six short sentences, one running example
  from start to finish, every technical word defined the first time it appears, at most one new
  word introduced per sentence group. Target: FK grade 8 or below, no sentence over 20 words.
- **Door 2, the depth.** The current technical material stays, collapsed behind "go deeper" per
  step. Nothing is lost for a reader who wants PBKDF2 and chain codes.
- **One running example throughout.** The published `abandon ... about` vector, because every
  value in it is checkable against the official vectors the suite already uses; the reader's own
  loaded seed takes over when one exists.
- **Every step ends with a task and a boundary.** Task: do one thing in the tool and come back.
  Boundary: the one thing this step does not prove.
- **Visuals.** The page currently has zero real diagrams, only ASCII. Adding inline SVG is
  compatible with the existing CSP (`img-src 'self' data:`) and with `file://` use. Candidate
  diagrams: one seed to many keys; HMAC split in two; hardened versus normal; public key to
  address. RQ4 decides which of these are worth drawing.

---

## 6. Phases and effort

| Phase | Work | Effort | Who |
|---|---|---|---|
| A | Finish the baseline: first-use jargon per step, sentence tail | 20 min, agent | agent |
| B | RQ2, RQ3, RQ4 research and evidence briefs (D2, D3, D4) | half a day, agent, parallel | agent |
| C | Learn v3 outline with per-step success criteria (D5) | 2 hours, agent | agent, then operator review |
| D | Measurement kit and readability gate (D6) | half a day, agent | agent |
| E | 5 reader sessions, scored on tasks (RQ6) | 1 hour of operator time plus reader time | operator recruits |
| F | Build the approved outline, tests green, deploy | scope set by D5 | agent after approval |

Phase B and D can run in parallel. Phase F must not start before the operator approves D5.

## 7. What this plan does not cover

- The Derive tab, the Blockchain Guide, the Experiments tab, and the brain wallet tab content.
  The brain wallet custom path display gap found earlier today is a separate item.
- Any change to derivation, address formats, or presets. Protected, and untouched.
- Hosting, deploy, or the privacy policy. The privacy policy data section was added separately.
- Translation. English only. If a second language is wanted, that is a new plan.

## 8. Open questions for the operator

1. Benchmark: US grade 8 or CBSE Class 8 for a reader working in English as a second language?
   Recommendation: assume ESL, because passing that bar also passes the easier one.
2. Can you recruit 5 readers at the target level for Phase E? Without them, comprehension is
   never actually measured, only inferred from readability, and that should be stated as a
   limitation rather than dressed up as proof.
3. Printable worksheet (D7): wanted or not?
4. Do you want the "go deeper" depth preserved verbatim, or edited down as well?

## 9. Progress log (newest first)

**2026-09-26, later still.** Phase B is done and verified; Phase C is drafted.

- Phase B, done, and the parent verified the load-bearing claims rather than taking the summaries:
  the CHI 2025 paper (DOI 10.1145/3706598.3713209) is real and I read its full text directly,
  confirming every number the misconception brief rests on (43.4 percent identified a phrase, 58
  percent thought they could choose it, 52 against 47 percent on username and password, 75 and 59
  percent on non-custodial users, Table 5 storage shares). All 30 ledger quotes across the 18
  learning-science sources were confirmed verbatim in the cached primary text. All 8 prior-art URLs
  return 200. Two claims from the delegated work were already dropped by the child itself, and one
  of my own verification passes was wrong first (I tested a URL with a trailing period) and is
  recorded as such.
- Phase C, done: `docs/learn-research/OUTLINE.md` (D5), approved by the maintainer.
- Still open and unchanged: the benchmark question (US grade 8 or CBSE Class 8 with ESL readers),
  the printable worksheet, whether depth is preserved verbatim, and the reader recruitment for
  Phase E. The wrong-priority item is closed: the gate says grade level is mostly fine, so stage 1
  of the outline is subtraction, not rewriting.
- Phase D, done except for CI wiring. Built: `tools/learn-readability.js` (exit 0 measured and not
  worse, exit 1 regression, exit 2 could not measure), `tools/learn-readability-baseline.json`
  (recorded by the gate itself, not typed by hand), `test/learn-comprehension.html` (local only,
  no network, stores nothing), and `docs/learn-research/MEASUREMENT.md` (protocol,
  scoring, pass bar fixed in advance).
- Every branch of the gate was proven to fire, not assumed: rc 2 on a file with no Learn panel,
  rc 1 on a deliberately bloated step, rc 0 on the unmodified page. Proof command and outputs are
  in this session's scratch directory.
- `npm run test:readability` added to `package.json`. Not yet wired into CI, because the gate
  ratchets rather than enforcing the 8.0 target, and putting a ratchet into CI is a separate
  decision about what should block a push.
- Four repository files are staged-ready but uncommitted, awaiting the operator's word:
  `package.json`, `tools/learn-readability.js`, `tools/learn-readability-baseline.json`,
  `test/learn-comprehension.html`.
- Phase E needs the operator to recruit readers. Phase F needs D5 approved.
