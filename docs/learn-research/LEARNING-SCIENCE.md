# RQ3 Evidence Brief: Learning Techniques That Work, and Which Fit a Zero-Network Page

Status: research only. No repo file was changed. This brief answers RQ3 of
`docs/learn-research/PLAN.md` and feeds deliverable D2.
Repo: `/mnt/ai-archive/other-tools/keysense`, master at `c4ea8da`, 2026-09-26.

## 1. Question and filter

RQ3 asks two things: which learning techniques have real evidence, and which of
them can a static, offline page actually deliver. The page ships a
Content-Security-Policy with `connect-src 'none'`, makes zero network calls, and
promises in `PRIVACY.md` that it collects nothing, with no analytics, no
telemetry, and no accounts. It runs from `file://` with the network off, and its
libraries are vendored with no CDN.

That filter removes a whole class of techniques before evaluation. Anything that
needs per-user response data to adapt, anything that needs a schedule or a
reminder tied to a person, and anything that measures outcomes across users is
in scope for teaching theory and out of scope for this page. The task states this
directly: a technique whose benefit depends on click telemetry or on adaptivity
from user data is dropped, with that reason said out loud. Section 5 names each
one and why it fails the filter.

The brief keeps every surviving technique to one question: can a single HTML file
with no server do it, and if so, does the effect survive the change of setting.

## 2. Method

Primary sources only, fetched and read, not summaries. For each technique I
recorded the effect, the condition it was measured under, and whether a static
page can reproduce that condition. Where a meta-analysis exists it sits beside
the original experiment, so the effect is not resting on one small study.

All quotes used as evidence are attached to the source in the citation ledger at
the local evidence cache (`ledger.json`, kept out of the repository), and the Sources block at the end is rendered
from that ledger rather than typed by hand. The extracted page text is cached
under the local evidence cache (`texts/`, also kept out of the repository) so any claim can be re-checked against the
wording the source actually used.

One honest limitation up front: the studies are mostly lab experiments with
undergraduate students, on text, mathematics, or picture material. Extending them
to a seed phrase lesson is an inference, not a measured result. Section 7 lists
that and the other limits.

## 3. Findings table

One row per technique. Effect sizes are the ones the sources report; they come
from different designs and are not directly comparable to each other.

| # | Technique | Effect, as measured | Condition it was measured under | Fit for a static, no-network page | Verdict |
|---|---|---|---|---|---|
| 1 | Retrieval practice (testing effect) | On a one week test, the group that only restudied recalled 40 percent, the group tested three times recalled 61 percent [1]. Retrieval practice beat concept mapping by about one and a half standard deviations on a short answer test, d equal 1.50 [2]. Meta-analysis: practice tests against restudy, g equal 0.61 [15]. | Learners read a passage, then either restudied or were tested without looking back; outcome measured after a delay [1][2][15]. | The page can ask a question, hide the answer, and reveal it on a click. Scoring that only needs a lookup, a checksum, or a prefix check runs in the browser. | INCLUDE |
| 2 | Feedback on retrieval | Immediate and delayed feedback both increased correct responses and reduced carry over of the wrong multiple choice lures on a later test [13]. | Multiple choice test with the answer corrected afterward [13]. | Full fit for answers the browser can check (wordlist index, checksum, address prefix). For free text, a revealed model answer is the only available feedback. | INCLUDE, restricted to checkable items |
| 3 | Pretesting (attempt before instruction) | Posttest performance was better for the group asked questions before reading than the group given extra study, in all experiments, counting only items they had failed to retrieve [11]. | Readers answered questions before reading, then read, then were tested [11]. | The page can ask first and reveal after. No data needed. | INCLUDE |
| 4 | Spacing (distributed practice) | Spacing beats massing; review of 839 assessments in 317 experiments [3]. The gap that maximises retention grows as the retention interval grows [3]. | Sessions separated in time, with the benefit measured at a delayed test [3]. | PARTIAL. A single self-paced page cannot separate sessions, cannot know when the reader returns, and cannot remind them without storing history. It can only tell the reader to come back. | PARTIAL, advice only |
| 5 | Interleaving (mixing practice) | Mixed practice scored 63 percent against 20 percent for blocked practice on a test one week later, d equal 1.34 [4]. Meta-analysis: overall g equal 0.42, and for mathematical tasks g equal 0.34 [17]. | Problems of different types mixed in one set rather than grouped by type, tested after a delay [4][17]. | Full fit. The page chooses the order of its own questions. Mixing the five steps into one practice pool is markup and logic, nothing else. | INCLUDE |
| 6 | Worked examples and cognitive load | For novices, worked examples led to faster solving of later similar problems and fewer mathematical errors than solving unaided [5]. | Novices learning a new procedure, measured on problems identical in structure [5]. | Full fit. The live computed values in the Learn tab already are worked examples. Worked example, then a partly worked problem, then a full one, needs no server. | INCLUDE |
| 7 | Expertise reversal (boundary on 6) | A design that helps novices can lose its benefit and then hurt as expertise grows, so the recommended design reverses [12]. | The same materials tested across novice to expert [12]. | The rule can be honoured; the mechanism partly exists already. Keep the simple worked example as default and let an expert collapse it behind a control. | INCLUDE as a rule |
| 8 | Segmenting (learner pacing) | Segmentation effect: better transfer when the lesson is broken into learner controlled segments rather than one continuous unit. Effect size reported as 1.36 [8]. | Learners set the pace of the segments [8]. | Full fit. The five steps already are segments. Advance one idea per click, and keep the segments small. | INCLUDE |
| 9 | Signaling (cueing) | Signaling effect: better transfer when cues are included. Effect size reported as 0.74 [8]. | Cues that point to the structure of the material [8]. | Full fit. Numbered steps, headings, and labelled highlights are static markup. | INCLUDE |
| 10 | Coherence (cut extraneous material) | Coherence effect: better transfer when extraneous material is excluded. Effect size reported as 0.90 [8]. Interesting but irrelevant detail lowered comprehension [14]. | The same lesson with and without the extra material [8][14]. | Full fit. Delete or move asides, trivia, and decoration. This is a subtraction, and it needs nothing. | INCLUDE |
| 11 | Spatial contiguity (words next to the picture) | Better transfer when printed words sit near the part of the graphic they describe. Effect size reported as 0.48 [8]. | Text and picture on screen together, with and without alignment [8]. | Full fit. An inline SVG can carry its labels beside the part it names. CSP already allows it, and `file://` renders it. | INCLUDE where a diagram is added |
| 12 | Graphics (multimedia principle) | Adding graphics to text can improve learning, but only when they are directly relevant [18]. In one experiment every graphic type raised satisfaction, yet only the instructive ones raised recall [18]. | Online lesson, graphics of four kinds: instructive, seductive, decorative, none [18]. | Full fit for instructive diagrams. The current page has zero real diagrams, only monospace ASCII, so this is unused headroom. Decorative graphics would raise liking and not learning, so they are not worth the bytes. | INCLUDE, relevant graphics only |
| 13 | Concreteness fading | A three step progression from a concrete instance to the abstract form, which is argued to carry the benefits of both [6]. Support is increasing, but most evidence is indirect and limited to mathematics and science [6]. | Mathematics and science instruction [6]. | Full fit. Start from one concrete running example and let it fade into the abstract definition as the reader advances. | INCLUDE, weaker evidence than 1 |
| 14 | Self-explanation (teach back) | Self-explanation improved understanding of worked examples [7]. Meta-analysis of induced self-explanation: g equal 0.55 [16]. | Learners prompted to explain steps to themselves while studying examples [7][16]. | Full fit for the prompt and the model answer. Grading a free text answer would need a model or a server, so the page cannot mark it. Self comparison is the fallback. | INCLUDE, self compared not graded |
| 15 | Metacognitive calibration (fluency illusion) | Repeated reading was the most listed strategy, with 84 percent of students reporting it, and only 11 percent reported practising retrieval [10]. Learners could not predict the benefit of retrieval practice [2], and restudying raised confidence even though delayed recall was worse [1]. | Self report surveys and judgments of learning [1][2][10]. | Full fit. A short honest warning about rereading is static text, and it targets exactly the belief that keeps readers passive. | INCLUDE |
| 16 | Desirable difficulties (umbrella) | The set of conditions that make performance during learning worse but retention better: varying conditions, interleaving, spacing, and testing rather than presentation [9]. | Stated as a design principle over the techniques above [9]. | Full fit as a governing rule, not as a feature. | INCLUDE as the rule |

## 4. What the table says together

Two things stand out.

First, the strongest single technique is also the cheapest to add. Retrieval
practice has a large effect, a meta-analytic average of g equal 0.61 [15], and it
needs one button and one hidden answer, no network and no data. Pretesting and
feedback ride on the same machinery.

Second, several of the strongest effects are subtractions rather than additions.
Coherence is 0.90 [8], and the graphics experiment shows that extra graphics can
raise satisfaction while doing nothing for learning [18]. A page that is already
3,563 words with a readability grade of 8.2 and only twelve percent of sentences
over 25 words does not mainly need more content. It needs the content it has
recast as questions, and the extraneous parts moved or cut.

The techniques that need time or people, spacing and any scheduling built on it,
are the ones the page cannot deliver. That is a design constraint to state to the
reader, not a gap to paper over.

## 5. Techniques dropped, and why

Each of these has support in the learning literature. Each fails the page's own
rules, and the reason is the rule, not the evidence.

- **Adaptive sequencing from click data.** Choosing the next item from the
  reader's past answers needs per-user response data. The page cannot collect it,
  `connect-src 'none'` and `PRIVACY.md` forbid it, and the task marks adaptivity
  from user data as out of scope. DROPPED.
- **Spaced scheduling and reminders.** Space the repetitions correctly means
  knowing when the reader last visited and reaching them later. That is stored
  personal history plus a delivery channel. DROPPED. The advice survives as text,
  the mechanism does not.
- **Mastery tracking, streaks, and progress dashboards.** All need durable,
  identifiable user state and a place to keep it. DROPPED.
- **Accounts and cloud sync.** Excluded by `PRIVACY.md` and by the offline
  promise. DROPPED.
- **Automatic grading of free text answers.** Needs a language model or a
  server. Neither can ship in a vendored static page that runs offline. DROPPED.
  Self comparison against a model answer is the available substitute.
- **A/B testing two versions of the lesson.** Needs telemetry to know which
  version won. DROPPED.

A local `localStorage` variant of one or two of these, a small Leitner box that
never leaves the device, would not violate the network rule. It still builds
adaptivity from user data, which the task rules out, and `PRIVACY.md` says the
page collects nothing. This brief treats it as dropped and notes it only so the
operator can overrule that reading explicitly.

## 6. What this means for the Learn tab

The verdicts map onto the measured state from section 1 of the research plan.
Each line names a change the evidence supports, to be tested against RQ2 and RQ4
before any build.

- Retrieval is the best supported change, with a meta-analytic average of g
  equal 0.61 for practice tests against restudy [15]. Pretesting puts the same
  machinery one step earlier, before the explanation [11]. Both beat a read only
  design, which mirrors the repeated reading that students already prefer and
  that the evidence shows is weaker [1][10].
- Feedback is checkable. Wordlist index, checksum, and address prefix all can be
  marked in the browser [13]. Free text is self compared against a model answer [7][16].
- Interleaving replaces the current grouped practice. One pool mixing the five
  steps, not one block per step [4][17].
- Worked examples and their fade are already implicit in the live values. Make
  the sequence explicit: worked, then partly worked, then independent [5][12].
- Segmenting, signaling, coherence, and contiguity are mostly free. They are
  markup decisions, and their effect sizes, 1.36, 0.74, 0.90, and 0.48, are not
  small [8].
- One instructive diagram per hard idea, and none for decoration. Attaching a
  label to the part it names is the whole requirement [8][18].
- Concreteness fading sets the spine. One concrete running example, the published
  `abandon ... about` vector, fading into the abstract terms [6].
- The warning about rereading belongs on the page. It is the single most common
  wrong strategy among students, and it is why the retrieval items are there [10].
- The desirable difficulties rule governs the rest. A design that feels harder
  during learning and better at retention is the target [9].

## 7. Limits of this brief

- The studies are mostly lab experiments with undergraduates on text, maths, or
  picture material. The transfer to a seed phrase lesson is an extrapolation.
- Effect sizes come from different designs and populations. They are not directly
  comparable, and the table does not rank them.
- Concreteness fading rests more on theory and indirect evidence than on direct
  experiments [6], so it should carry less weight than retrieval practice.
- The expertise reversal effect means one fixed page must serve novices and
  experts at once [12]. The proposed answer is a simple default with depth behind
  a control, and that answer is untested here.
- Spacing is the clearest technique the page cannot deliver. Any claim that the
  page improves long term retention through spacing would be false, because the
  page cannot space anything.
- This brief measures nothing about the current readers. Comprehension of this
  specific page is RQ6, and it needs readers, not more readability scores.

## Sources

[1] https://learninglab.psych.purdue.edu/downloads/2006/2006_Roediger_Karpicke_PsychSci.pdf - Roediger & Karpicke 2006, Test-Enhanced Learning, Psychological Science
    > "The STTT group recalled more than the SSST group (61% vs. 56%), who in turn recalled more than the SSSS group (40%)"
[2] https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Blunt_Science.pdf - Karpicke & Blunt 2011, Retrieval Practice vs Concept Mapping, Science
    > "the advantage of retrieval practice (M = 0.67) over elaborative studying with concept mapping (M = 0.45) represented about a 50% improvement in long-term retention scores"
    > "students were largely unable to predict this benefit"
[3] https://augmentingcognition.com/assets/Cepeda2006.pdf - Cepeda et al. 2006, Distributed Practice in Verbal Recall Tasks, Psychological Bulletin
    > "This review found 839 assessments of distributed practice in 317 experiments located in 184 articles"
    > "the ISI producing maximal retention increased as retention interval increased"
[4] https://gwern.net/doc/psychology/spaced-repetition/2007-rohrer.pdf - Rohrer & Taylor 2007, The Shuffling of Mathematics Problems Improves Learning, Instructional Science
    > "the mean test performance of Mixers (63%, SE = 12%) was far greater than that of the Blockers (20%, SE = 9%)"
[5] https://onderwijs.felienne.nl/vakdidactiek/materiaal/sweller_worked_examples.pdf - Sweller & Cooper 1985, Worked Examples as Substitute for Problem Solving, Cognition and Instruction
    > "It was hypothesized that, as occurs in other domains, algebra problem-solving skill requires a large number of schemas"
[6] https://link.springer.com/article/10.1007/s10648-014-9249-3 - Fyfe et al. 2014, Concreteness Fading, Educational Psychology Review
    > "Concreteness fading refers specifically to a three-step progression by which the concrete, physical instantiation of a concept becomes increasingly abstract over time"
    > "most evidence in favor of this method is admittedly indirect and restricted to the domains of mathematics and science"
[7] https://andymatuschak.org/files/papers/Chi%20et%20al%20-%201994%20-%20Eliciting%20self-explanations%20improves%20understanding.pdf - Chi et al. 1994, Eliciting Self-Explanations Improves Understanding, Cognitive Science
    > "Learning involves the integration of new information into existing knowledge"
[8] https://www.uky.edu/~gmswan3/544/9_ways_to_reduce_CL.pdf - Mayer & Moreno 2003, Nine Ways to Reduce Cognitive Load in Multimedia Learning, Educational Psychologist
    > "Segmentation effect: Better transfer when lesson is presented in learner-controlled segments rather than as continuous unit"
    > "Students understand a multimedia explanation better"
    > "Signaling: Provide cues for how to process the material"
    > "Aligning: Place printed words near corresponding parts of graphics to reduce need for visual scanning"
    > "We define multimedia learning as learning from words and pictures"
[9] https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf - Bjork & Bjork 2011, Making Things Hard on Yourself, But in a Good Way
    > "include varying the conditions of learning, rather than keeping them constant and predictable; interleaving instruction on separate topics, rather than grouping instruction by topic"
[10] https://learninglab.psych.purdue.edu/downloads/2009/2009_Karpicke_Butler_Roediger.pdf - Karpicke, Butler & Roediger 2009, Metacognitive Strategies in Student Learning
    > "Only 11% of students (19 of 177) reported that they practised retrieval while studying"
    > "Repeated reading was by far the most frequently listed strategy with 84% of students reporting it"
[11] https://learninglab.uchicago.edu/Pre-Testing_files/RichlandKornellKao.pdf - Richland, Kornell & Kao 2009, The Pretesting Effect, JEP Applied
    > "Posttest performance was better in the test condition than in the extended study condition in all experiments"
[12] https://mrbartonmaths.com/resourcesnew/8.%20Research/Explicit%20Instruction/The%20Expertise%20Reversal%20Effect.pdf - Kalyuga et al. 2003, The Expertise Reversal Effect, Educational Psychologist
    > "with increased expertise, Design B can become superior"
[13] http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Butler-Roediger-2008_MemCog.pdf - Butler & Roediger 2008, Feedback and Multiple-Choice Testing, Memory & Cognition
    > "both immediate and delayed feedback increased the proportion of correct responses and reduced the proportion of intrusions"
[14] https://link.springer.com/content/pdf/10.3758/BF03193412.pdf - Sanchez & Wiley 2006, The Seductive Details Effect and Working Memory Capacity, Memory & Cognition
    > "Furthermore, the detriment in reading performance was accompanied by higher levels of emotional interest in the seductive conditions"
[15] https://gwern.net/doc/psychology/spaced-repetition/2017-adesope.pdf - Adesope, Trevisan & Sundararajan 2017, Meta-Analysis of Practice Testing, Review of Educational Research
    > "the overall weighted mean effect size was moderately large and statistically significant, indicating the effectiveness of learning with practice tests (g = 0.61, p < .001)"
    > "the effects of practice tests were larger when they were used only once (g = 0.70) than when they were used twice or more (g = 0.51)"
[16] https://gwern.net/doc/psychology/spaced-repetition/2018-bisra.pdf - Bisra et al. 2018, Inducing Self-Explanation: a Meta-Analysis, Educational Psychology Review
    > "The overall weighted mean effect size using a random effects model was g = .55"
[17] https://psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf - Brunmair & Richter 2019, Similarity Matters: Meta-Analysis of Interleaved Learning, Psychological Bulletin
    > "A multilevel meta-analysis revealed a moderate overall interleaving effect"
    > "Results for studies using mathematical tasks revealed a small interleaving effect (g = 0.34)"
[18] https://gwern.net/doc/design/visualization/2012-sung.pdf - Sung & Mayer 2012, When Graphics Improve Liking But Not Learning, Computers & Education
    > "The multimedia principle states that adding graphics to text can improve student learning"
    > "students who received any kind of graphic produced significantly higher satisfaction ratings than the no graphics group"
    > "Adding relevant graphics to words helps learning but adding irrelevant graphics does not"
