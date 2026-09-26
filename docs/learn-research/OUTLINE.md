# Learn v3 outline (D5)

Status: APPROVED by the maintainer. Stage 1, the subtraction pass, is done; the remaining stages are in progress.
Date: 2026-09-26. Repo: /mnt/ai-archive/other-tools/keysense.
Inputs, all verified by the parent before use:
`docs/learn-research/MISCONCEPTIONS.md`, `LEARNING-SCIENCE.md`,
`learn-rq4-prior-art.md`, `learn-rq6-measurement-kit.md`, and the measured baseline in
`tools/learn-readability-baseline.json`.

---

## 1. What the three briefs changed about the plan

- RQ2 found the two strongest, best-evidenced misconceptions in this domain are **absent from the
  Learn tab entirely**: the password model, and coins-are-in-the-app. Source: Eleshin, Sun, Ye, Das
  and Hong, CHI 2025, DOI 10.1145/3706598.3713209. I read the full text directly rather than
  trusting the summary. Verified numbers: 643 survey respondents plus 20 interviews; 43.4 percent
  could identify a seed phrase at all; 58 percent of participants said they could choose any seed
  phrase like a password; 52 percent said username and password move a wallet, against 47 percent
  who said the recovery phrase; 75 percent of non-custodial users' answers never mentioned securing
  the phrase or private key; 59 percent of the 99 non-custodial respondents did not name it as what
  transfers a wallet; Table 5 storage among the 279 who identified a phrase: cloud 31.5 percent,
  email 25.1 percent, internal drive 22.6 percent.
- RQ3 says the biggest single win is a **subtraction**, not an addition. Coherence, cutting
  extraneous material, is the largest effect in the set at 0.90 (Mayer and Moreno). Retrieval
  practice is the strongest inclusion at g 0.61 (Adesope et al.), with Roediger and Karpicke's
  one week recall at 61 percent tested against 40 percent restudied. 30 of 30 quoted passages were
  re-checked verbatim in the cached primary sources.
- RQ4 says every deep explainer in the field **hides its depth** behind a reveal, a gate or a
  drill-down, and that the device KeySense uses least, the scenario ladder, is the one with the
  best practical return. All 8 cited URLs resolve (200).

None of that changes the goal. It changes the order of work: cut and recast first, add second.

## 2. The one design decision: two doors on one page

- **Door 1, the plain ladder.** Five segments, each two to four short sentences, one running
  example from start to finish, at most two new terms per segment, every term defined in a box at
  the point of first use rather than in a glossary at the end (RQ4 gap 4).
- **Door 2, the depth.** Everything technical that exists today stays on the page, collapsed per
  segment behind a "go deeper" control (RQ4: all 8 sources do this; RQ3 expertise reversal, Kalyuga
  et al., says the simple form must stay the default as expertise grows).

The target is measured, not asserted: prose Flesch-Kincaid at or below 8.0 for every segment, held
by `tools/learn-readability.js`.

## 3. The running example

One published vector, the standard `abandon ... about` phrase, carried through all five segments
so the reader sees the same value change shape rather than five unrelated illustrations. The
reader's own loaded seed takes over as soon as one exists, which is what the live-value boxes
already do. Evidence: RQ3 concreteness fading, and RQ4's carried worked example device.

## 4. Segment by segment

Each segment states what the reader does, what they should be able to say afterwards, the
misconception it kills, and what moves behind depth.

### Segment 1, the seed phrase (currently prose FK 8.53, the only segment above target)

- Reader does: answers two questions before reading anything (pretesting, Richland et al.), then the
  bit explorer, then a teach-back.
- Should be able to say: the phrase is the wallet, it is generated rather than chosen, it cannot be
  reset, and the last word is special.
- Kills: the password model (58 percent believed they could choose their phrase) and
  coins-are-in-the-app (75 percent). Both new. This is the highest-value content change in the plan.
- Storage misconception added as a scenario card: cloud, email and device notes are where people
  actually keep it (Table 5 above), and each is shown for what it exposes.
- Visual: one inline SVG, words to bits to checksum, with labels beside the parts (spatial
  contiguity, 0.48). The page currently has zero real diagrams.
- Moves behind depth: the Coldcard case study detail, the entropy comparison table, the dice and
  coin provenance explanation.

### Segment 2, from words to master key (currently 6.88, already under target)

- Reader does: predicts which half of the split is the private key, then reveals, then compares
  against the live value computed from their own seed.
- Should be able to say: the words become one large secret, and that secret splits into two halves,
  one private and one for deriving children.
- Recast: today's prose paragraph about the HMAC becomes the predict-then-reveal item. Worked
  example first, then a partly worked one, then the reader's own seed (completion problem).
- Moves behind depth: PBKDF2 iteration detail, HMAC internals, the extended key forms.

### Segment 3, the path (currently 5.97)

- Reader does: the empty-restore scenario first (a real support case, RQ2 misconception 3), then the
  path builder sliders, then the two task buttons that load Legacy and Native SegWit into the Derive
  tab.
- Should be able to say: the same words with a different path give a different address, which is why
  a restored wallet can look empty and is not empty.
- Device: the scenario ladder, which RQ4 calls the highest-return device and the one this page uses
  least. Problem named first, then the ordered list of things to check.
- Moves behind depth: the purpose and coin type reference table.

### Segment 4, hardened against normal (currently 7.25)

- Reader does: the access-scope exercise that already exists, extended to the xpub plus one child key
  case, then explains in one sentence what an xpub alone exposes.
- Should be able to say: a hardened step needs the parent secret, so an xpub is not a whole branch.
- Cut here: the hardened versus normal comparison table is printed **twice** on the page, in this
  segment and again in segment 5. I measured both copies in the longest-sentence dump while building
  the gate. Cut one. Under coherence, removing a duplicate is worth more than adding an explanation.

### Segment 5, private key to address (currently 7.83, and by far the biggest: 953 prose words plus
625 non-prose words)

- **Split into two segments.** Segmentation effect 1.36 (Mayer and Moreno). As one segment it is
  close to half the panel and is the single biggest comprehension load in the tool.
  - 5a: a private key becomes a public key becomes an address, Ethereum and Bitcoin side by side,
    one row per step, driven by the reader's own seed.
  - 5b: why the same key produces different address formats (Legacy, SegWit, Native SegWit, Taproot)
    with the task buttons, then the verification card as "check this copy yourself".
- Reader does: follows the running example through 5a, then checks the verification card and explains
  what a FAIL would mean.
- Should be able to say: the address is calculated from the secret, and different chains and formats
  encode it differently.
- Cut here: the hardened versus normal comparison table is printed **twice**, at `index.html:890`
  in segment 4 and again at `index.html:1027` in this segment. That is a literal duplicate, measured,
  not an impression. Cut one. Under coherence, removing a duplicate is worth more than adding an
  explanation.
- Also a coherence candidate, and stated precisely: the line "Often increments the final
  address_index" appears once, at `index.html:1042`, so it is **not** a literal duplicate. It does
  overlap an idea segment 3 already states in its own words ("Most wallets increment this for each
  new address"), so let segment 3 own that idea and drop the repeat. My first draft of this outline
  called it a duplicate; the grep falsified that and the correction is recorded here.

## 5. Practices applied, each with its evidence

| Practice | Where it lands | Evidence |
|---|---|---|
| Pretesting | Two questions before each segment, revealed after | Richland, Kornell and Kao 2009 |
| Retrieval practice | The per-segment quizzes, kept, plus a mixed pool | Roediger and Karpicke 2006; Adesope et al. 2017, g 0.61 |
| Feedback limited to checkable items | Checksum, word index, address prefix can be checked by the page; free text gets a model answer, never a grade | Butler and Roediger 2008 |
| Interleaving | One mixed practice pool across all five segments, not five separated sets | Rohrer and Taylor 2007, 63 against 20 percent |
| Worked example then completion | Segments 2 and 5 | Sweller and Cooper 1985 |
| Segmenting | Five segments become six, each one click | Mayer and Moreno, segmenting 1.36 |
| Signaling | Numbered segments, headings, labelled highlights | Mayer and Moreno, 0.74 |
| Coherence, subtract | The duplicated tables and the asides | Mayer and Moreno, 0.90, the largest effect available |
| Concreteness fading | One running example that fades into the abstract rule | Fyfe et al. 2014 |
| Self-explanation, self compared | Teach-back boxes with a model answer beside them | Chi et al. 1994; Bisra et al. 2018, g 0.55 |
| Metacognitive warning | One honest line that rereading feels like learning and is not | Karpicke, Butler and Roediger 2009, 84 percent reread against 11 percent self test |
| Instructive graphics only | Inline SVG diagrams, no decoration | Sung and Mayer 2012, decorative graphics raised liking, not recall |
| Expertise reversal rule | Simple stays default, depth collapses | Kalyuga et al. 2003 |

## 6. What stays exactly as it is

The live-value boxes, the bit explorer, the checksum demo, the path builder, the task buttons, the
chain grid, the verification card, the quizzes' answer-first reveal, the glossary as a lookup, and
the "Never type a real seed here" warning. These are the strongest existing assets and three of them
are named in RQ4 as devices the field's best explainers use.

## 7. What must not change

Derivation logic, address formats, presets, the brain wallet flow, and `src/learn-live.js`'s
computations, which the test suite locks at 189 vectors. Teaching copy and layout are documentation
and cosmetic work under AGENTS.md; anything touching computed values is not, and will be raised
before it is touched. The boundary sentence per segment stays: this tool is not a wallet, verify an
address with an independent tool before real funds move.

## 8. Acceptance criteria

1. `node tools/learn-readability.js` reports prose FK at or below 8.0 for every segment, with
   `--fail-above-target` passing.
2. `npm test` stays at 189 passed, 0 failed, drift guard included.
3. Five readers, the protocol in `learn-rq6-measurement-kit.md`: 4 of 5 complete the two tasks alone
   and answer the last-word and two-addresses questions correctly.
4. Jargon at first use: every one of the terms now counted (entropy 25 uses, hardened 22, checksum
   15, xpub 14) either carries an inline definition at first use or is moved behind depth.

Criteria 1 and 2 are automated. Criterion 3 needs the operator to recruit readers. Without it, the
result is an indication and must be reported as one.

## 8b. Single-pass finish (operator asked for everything in one go, 2026-09-26)

Everything below runs in one session, in this order, each step committed and deployed as it
lands, so nothing waits on a later approval. The visual system it uses is already built
(`VISUAL-SYSTEM.md`), so no step has to invent a drawing style mid-flight.

| # | Work | Proves itself by |
|---|---|---|
| 1 | Segment 2 recast: predict, do, explain, the 512-bit split drawn, the 43 word sentence gone | reading gate, live DOM, screenshot |
| 2 | Segment 3 recast: the path drawn as a labelled ladder with the reader's own path lit | same |
| 3 | Segment 4 recast: one parent and two children drawn, showing what an xpub reaches | same |
| 4 | Segment 5: the key to address pipeline drawn | same |
| 5 | Segment 6: the four Bitcoin formats and the chain set drawn | same |
| 6 | Segment 1: words to bits to checksum drawn with the reader's own last word, plus the randomness chart | same |
| 7 | A mixed practice pool across all six segments, and teach-back boxes with model answers | against the misconception list |
| 8 | The ESL sentence ceiling added to the gate, at the level the content now holds | gate exits 0, and exits 1 when a long sentence is put back |

All eight landed in one session on 2026-09-26. Verified after deploy: seven drawings
present in the live Learn tab with the reader's real values (path segments 44/60/0/0/0, the
three branch nodes, eight pipeline nodes), resolved colours, six labelled drawings, no
reproducible JavaScript error. Drawings are exercised in the suite too, with a stubbed DOM,
including the check that nothing is built at load time.

Two things stay outside this pass, and neither is a matter of effort:

- **The reader sessions.** Five readers at the grade 8 ESL level. A page with no network and no
  analytics cannot measure its own comprehension, so this needs people. Protocol: `MEASUREMENT.md`.
- **Anything inside the protected derivation code.** Nothing here touches derivation, address
  formats, vanity mining or the brain wallet flow.

## 9. Effort and order

Reconciled against what actually shipped. The stage numbers below are the plan of record.

| Stage | Work | State |
|---|---|---|
| 1 | Cut and recast: remove the duplicated tables, split the address segment | **Done.** Duplicates removed in 4a51491, split into two segments in 7a78d49. |
| 2 | Segment 1 new content: the misconceptions, the pretest, the definition box | **Done** in 3da87cd. Its inline diagram moved to stage 5, so the diagram and the words are designed together. |
| 3 | Build the visual system first (primitives plus a fixture page, no content changes), then recast segments 2, 3 and 4 as predict, do, explain with definition boxes at first use, drawing the diagrams as the words are written | **Next.** Building the primitives first is what stops each diagram inventing its own arrows and colours. Detail in `VISUAL-SYSTEM.md`. |
| 4 | Mixed practice pool across all six segments, teach-back boxes with model answers | Not started. |
| 5 | Apply the visual layer to segments 1, 5 and 6, and build the randomness chart | Not started. The primitives themselves are built in stage 3; this stage is the application to the remaining segments. |
| 6 | Gate and suite on every change, then the reader sessions | Gate and suite are automated and running on every change already. Readers need the operator. |

Four build stages remain, then the reader sessions. Stage 1 was worth doing first because it is pure
subtraction and the gate can prove it. It did: segment 5 went from 955 prose words in one click to
116, and segment 6 now carries the cross-chain material.

## 11. The visual layer

Added at the operator's request: diagrams, charts and motion rather than text alone. What the
evidence supports, and where I have to stop.

- **Diagrams that carry information help.** Spatial contiguity 0.48 (Mayer and Moreno 2003), and the
  prior art teardown found that every deep source reviewed uses a small labelled figure, while this
  page currently has none.
- **Signalling helps.** 0.74 for cues that point at the part being explained: labels, arrows,
  numbered marks, a highlight on the segment under discussion.
- **Decoration does not.** Sung and Mayer 2012: decorative graphics raised how much people liked the
  material and not how much they recalled. So no mascots, no background art, no animation for its
  own sake.
- **Motion: I have no evidence that animation improves learning, and I will not claim it does.** What
  it can honestly do is show a transformation the reader would otherwise have to picture, such as a
  word becoming eleven bits, or a key becoming an address. So motion is allowed only where it shows
  a value changing, never on first paint, never delaying the text, and it is switched off entirely
  for anyone whose browser asks for reduced motion.
- **Colour as a second channel only.** The teardown flagged the one source that tracks a value in
  colour as using colour as its only channel. Every colour cue here gets a text or shape equivalent,
  so it survives colour blindness and a black and white print.

Concrete pieces, one per segment: words to bits to checksum with the reader's own last word marked;
the 512-bit seed splitting into two halves; the path as a labelled ladder with the reader's own path
lit; hardened against normal as two branches showing what an xpub can and cannot reach; the key to
address pipeline as a labelled flow per chain; and the multi-chain grid plus the four Bitcoin address
formats, one shape per family. The randomness chart gets axis labels, a stated scale, and a marker
for the reader's own value.

**How it gets verified, because the readability gate does not measure beauty and will not be asked
to.** No new dependencies; still works offline and from `file://`. Rendered in a real browser at
desktop and mobile widths, in both themes, with a screenshot kept per segment. A contrast check on
every new colour pairing. The print stylesheet still correct, since the paper wallet path depends on
it. Reduced motion proven by loading with the media feature forced and confirming nothing transitions.
And the reading gate re-run after every visual change, because a diagram can add words as easily as
it can replace them.

## 10. What needs your decision

1. Approve this outline, or name what changes.
2. Answered by the operator on 2026-09-26: benchmark is **grade 8 with ESL readers**; the deep
   material **stays verbatim** and only moves behind disclosures; the printable worksheet is **not
   now**, and is tracked in the roadmap in `VISUAL-SYSTEM.md`.
3. Can you recruit 5 readers at the target level? Without them criterion 3 is never measured.
