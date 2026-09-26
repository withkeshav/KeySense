#!/usr/bin/env node
/* Readability gate for the Learn Paths tab.
 *
 *   node tools/learn-readability.js                 # ratchet check (default)
 *   node tools/learn-readability.js --write-baseline
 *   node tools/learn-readability.js --file <path>   # measure a copy, for testing
 *   node tools/learn-readability.js --fail-above-target
 *
 * Exit codes, deliberately distinct:
 *   0  measured, nothing is worse than the recorded baseline
 *   1  measured, at least one step regressed past the baseline ceiling
 *   2  could NOT measure (panel or step blocks not found) - never report this as a pass
 *
 * Two grade numbers are reported per step. `prose` excludes lines that are
 * diagrams rather than sentences, and is the number that matters for the
 * "8th grade" goal. `full` includes everything including ASCII pipeline art
 * and hex strings, so it runs higher; both are kept so the difference stays
 * visible instead of being hidden by whichever filter flatters the result.
 *
 * Flesch-Kincaid grade level: 0.39 x (words/sentences) + 11.8 x (syllables/words) - 15.59.
 * Syllables are counted by the standard vowel-group approximation.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TARGET = 8.0;              /* operator target: an 8th grade reader, including ESL */
const HARD_SENTENCE = 25;        /* words; the guideline, counted and reported */
const ESL_CEILING = 30;          /* words; HARD failure. An ESL reader re-reads or stops at a sentence this long */
const DENSE_SHARE = 0.20;        /* HARD failure if more than this share of sentences pass the guideline */
const CEILING_SLACK = 0.05;      /* ratchet allowance so rounding noise is not a failure */
const BASELINE_PATH = path.join(ROOT, "tools", "learn-readability-baseline.json");

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const argVal = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1]; };

const FILE = argVal("--file") || path.join(ROOT, "index.html");

/* ---- text extraction -------------------------------------------------- */

function unescapeHtml(s) {
  return s.replace(/&nbsp;/g, " ").replace(/&mdash;/g, " ").replace(/&ndash;/g, " ")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&rarr;/g, " ");
}

/* A diagram line is not prose. Detected by symbol density, not by guessing at
 * meaning: several path separators, pipes, quotes or arrows in one line. */
function looksLikeDiagram(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^(m\/|\/|[|+=-])/.test(t)) return true;
  const symbols = (t.match(/[|/=><+']/g) || []).length;
  const letters = (t.match(/[A-Za-z]/g) || []).length;
  if (letters === 0) return true;
  if (symbols / Math.max(1, letters) > 0.25) return true;
  if (/\b(0x[0-9a-fA-F]{6,}|[0-9a-fA-F]{16,})\b/.test(t)) return true;
  if ((t.match(/ - /g) || []).length >= 3) return true;   /* "a - b - c - d" pipeline */
  /* Formula fragments written as list items, for example
   * "12 words = 128 bits of entropy + 4-bit checksum". Two or more equals
   * signs and no full stop is arithmetic, not a sentence. */
  const eq = (t.match(/=/g) || []).length;
  const plus = (t.match(/ \+ /g) || []).length;
  if ((eq >= 2 || plus >= 3) && !/\./.test(t)) return true;
  return false;
}

/* Classes whose text is not running prose: ASCII pipeline art, reference
 * tables, path segment cards, the glossary term list and the tree inspector.
 * A table row has no full stop, so counting it as a sentence distorts the
 * grade level in both directions. What is excluded here is counted and
 * reported separately as `visual`, never silently dropped. */
const NON_PROSE_CLASSES = ["learn-visual", "guide-table", "tree-container", "path-preview", "learn-segment", "glossary", "learn-connector"];
const NON_PROSE_TAGS = ["table", "pre", "thead", "tbody", "tr", "td", "th"];
const VOID_TAGS = new Set(["br", "img", "input", "meta", "link", "hr", "source", "col"]);

/* Minimal HTML scanner. Walks tags in order, keeps a stack, and routes text to
 * either the prose bucket or the visual bucket. Regex-per-line cannot do this
 * because the diagram containers are nested divs. */
function scan(html) {
  const re = /<!--[\s\S]*?-->|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<(\/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)/g;
  const stack = [];
  let prose = "";
  let visual = "";
  let m;
  const excludedNow = () => stack.some((s) => s.excluded);
  while ((m = re.exec(html))) {
    if (m[4] !== undefined) {
      const t = unescapeHtml(m[4]);
      if (excludedNow()) visual += t; else prose += t;
      continue;
    }
    const closing = m[1] === "/";
    const tag = (m[2] || "").toLowerCase();
    const attrs = m[3] || "";
    if (!tag) continue;
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
      continue;
    }
    if (VOID_TAGS.has(tag)) {
      if (tag === "br") { if (excludedNow()) visual += "\n"; else prose += "\n"; }
      continue;
    }
    const cls = (attrs.match(/class="([^"]*)"/) || [, ""])[1];
    /* var(--code-bg) marks the code-styled pipeline and formula cards, where a
     * chain like "Private key - public key - SHA-256 - RIPEMD-160 - encode"
     * reads as one 80 word sentence to any punctuation-based measure. */
    const selfExcluded = NON_PROSE_TAGS.includes(tag) ||
      attrs.includes("var(--code-bg)") ||
      cls.split(/\s+/).some((c) => NON_PROSE_CLASSES.includes(c));
    stack.push({ tag, excluded: selfExcluded || excludedNow() });
  }
  return { prose, visual };
}

function stripTags(html) { const r = scan(html); return r.prose + "\n" + r.visual; }

function normalise(s) { return s.replace(/[ \t\u00a0]+/g, " ").replace(/\s*\n\s*/g, "\n").trim(); }

function proseOnly(text) {
  return text.split("\n").map((l) => (looksLikeDiagram(l) ? " " : l)).join(" ");
}

/* ---- metrics ---------------------------------------------------------- */

function syllables(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  let n = (w.match(/[aeiouy]+/g) || []).length;
  if (w.endsWith("e") && !/(le|ee|ye)$/.test(w) && n > 1) n -= 1;
  return Math.max(1, n);
}

function sentences(text) {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
}

function metrics(text) {
  const sents = sentences(text);
  const words = text.match(/[A-Za-z][A-Za-z'-]*/g) || [];
  if (!sents.length || !words.length) return null;
  const syl = words.reduce((a, w) => a + syllables(w), 0);
  const asl = words.length / sents.length;
  const asw = syl / words.length;
  const fk = 0.39 * asl + 11.8 * asw - 15.59;
  let longest = 0;
  for (const s of sents) longest = Math.max(longest, (s.match(/[A-Za-z][A-Za-z'-]*/g) || []).length);
  return { words: words.length, sentences: sents.length, fk: Math.round(fk * 100) / 100, asl: Math.round(asl * 10) / 10, longest };
}

const JARGON = ["entropy", "checksum", "mnemonic", "PBKDF2", "HMAC", "SHA-512", "secp256k1", "Ed25519",
  "BIP39", "BIP32", "BIP44", "BIP49", "BIP84", "BIP86", "SLIP-0010", "xprv", "xpub", "chain code",
  "Bech32", "HRP", "WIF", "Keccak", "BLAKE2b", "SHA3", "base58", "hardened", "derivation path"];

function jargonCounts(text) {
  const low = text.toLowerCase();
  const out = {};
  for (const t of JARGON) {
    const n = low.split(t.toLowerCase()).length - 1;
    if (n) out[t] = n;
  }
  return out;
}

/* ---- panel extraction ------------------------------------------------- */

function extractSteps(html) {
  const start = html.search(/<div class="tab-content" data-content="learn"/);
  if (start === -1) return null;
  const rest = html.slice(start);
  const next = rest.slice(1).search(/<div class="tab-content" data-content="/);
  const panel = next === -1 ? rest : rest.slice(0, next + 1);

  /* Boundaries, in document order: the walkthrough segments, then the mixed
   * practice section, then the panel's shared remainder (the nav bar, the
   * self-verification card, the reference appendix and the glossary). Slicing
   * from the LAST step marker to the end of the panel - the obvious version -
   * attributes all of that trailing material to the final segment, which
   * inflates it and hides where the words actually live. Every region is
   * measured; nothing is dropped and nothing is attributed to the wrong block. */
  const hits = [];
  let m;
  const stepRe = /class="learn-content"\s+data-step="(\d)"/g;
  while ((m = stepRe.exec(panel))) hits.push({ step: m[1], at: m.index });
  const practiceRe = /class="[^"]*learn-practice/g;
  if ((m = practiceRe.exec(panel))) hits.push({ step: "practice", at: m.index });
  const sharedRe = /class="learn-nav"/g;
  if ((m = sharedRe.exec(panel))) hits.push({ step: "panel-extra", at: m.index });
  if (!hits.length) return null;
  hits.sort((a, b) => a.at - b.at);
  const blocks = [];
  for (let i = 0; i < hits.length; i++) {
    const end = i + 1 < hits.length ? hits[i + 1].at : panel.length;
    blocks.push({ step: hits[i].step, html: panel.slice(hits[i].at, end) });
  }
  return blocks;
}

function measure(rawHtml) {
  const parts = scan(rawHtml);
  const prose = normalise(proseOnly(parts.prose));
  const visual = normalise(parts.visual);
  const all = normalise(parts.prose + " " + parts.visual);
  return { full: metrics(all), prose: metrics(prose), visual: metrics(visual), jargon: jargonCounts(all) };
}

/* ---- main ------------------------------------------------------------- */

const html = fs.readFileSync(FILE, "utf8");
const blocks = extractSteps(html);
if (!blocks) {
  console.error("COULD NOT MEASURE: no learn tab panel or no data-step blocks found in " + FILE);
  console.error("This is rc 2. It is NOT a pass.");
  process.exit(2);
}

const results = {};
for (const b of blocks) {
  const r = measure(b.html);
  if (!r.full || !r.prose) {
    console.error("COULD NOT MEASURE: step " + b.step + " produced no sentences or words");
    process.exit(2);
  }
  /* ESL discipline. A grade average hides one sentence a reader has to read
   * twice, and a long sentence is where an ESL reader stops rather than
   * guesses. So the individual sentences are counted, not just averaged. */
  const proseText = normalise(proseOnly(scan(b.html).prose));
  const sents = sentences(proseText);
  const countWords = (s) => (s.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
  r.prose.over_guideline = sents.filter((s) => countWords(s) > HARD_SENTENCE).length;
  r.prose.over_ceiling = sents.filter((s) => countWords(s) > ESL_CEILING).length;
  r.prose.share_over_guideline = sents.length ? r.prose.over_guideline / sents.length : 0;
  results[b.step] = r;
}

const summary = {};
for (const [step, r] of Object.entries(results)) {
  summary[step] = {
    prose_fk: r.prose.fk,
    prose_words: r.prose.words,
    prose_sentences: r.prose.sentences,
    longest_sentence: r.prose.longest,
    sentences_over_guideline: r.prose.over_guideline,
    sentences_over_ceiling: r.prose.over_ceiling,
    share_over_guideline: Math.round(r.prose.share_over_guideline * 1000) / 1000,
    visual_fk: r.visual ? r.visual.fk : null,
    visual_words: r.visual ? r.visual.words : 0,
    full_fk: r.full.fk,
    jargon: r.jargon
  };
}

if (flag("--write-baseline")) {
  /* Re-recording the baseline is a deliberate act with a paper trail, never a
   * quiet way past the ratchet. Each re-record appends its reason and the
   * values it moved, the log is kept in the baseline file, and every run
   * prints it. The FK target and the sentence ceiling stay hard, so a
   * re-record can accept more words; it cannot accept harder prose. */
  let previous = null;
  try { previous = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")); } catch (e) { previous = null; }
  const log = (previous && previous.rebaseline_log) || [];
  const moved = [];
  if (previous && previous.steps) {
    for (const [step, now] of Object.entries(summary)) {
      const before = previous.steps[step];
      if (!before) { moved.push(step + " (new)"); continue; }
      if (before.prose_words !== now.prose_words || Math.abs((before.prose_fk || 0) - now.prose_fk) > 0.005) {
        moved.push(step + ": FK " + before.prose_fk + " to " + now.prose_fk + ", words " + before.prose_words + " to " + now.prose_words);
      }
    }
  }
  const reason = argVal("--reason");
  if (!reason) {
    console.error("\ncowardly refusing to --write-baseline without --reason: a re-record needs a reason on the record.");
    console.error("rc 2, nothing written.");
    process.exit(2);
  }
  log.push({ at: new Date().toISOString().slice(0, 10), reason, moved });
  const payload = {
    note: "Recorded by tools/learn-readability.js --write-baseline. The gate fails when a step gets WORSE than this, and always prints the gap to the 8th grade target so passing above target is never silent.",
    target_prose_fk: TARGET,
    measured_by: "tools/learn-readability.js",
    rebaseline_log: log,
    steps: summary
  };
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2) + "\n");
  console.log("baseline written to " + BASELINE_PATH + ", with " + log.length + " re-record(s) on the log");
}

console.log("Learn Paths readability, measured from " + path.relative(ROOT, FILE));
console.log("target prose FK grade <= " + TARGET.toFixed(1) + " (an 8th grade reader, including ESL readers)\n");
console.log("proseFK is running prose only. Tables, ASCII pipeline art, path cards and the glossary are counted separately as visualWords so nothing is hidden.");
console.log("\nstep  proseFK  words  sents  longest  txtFK  txtWords  target gap");

let regressions = [];
let aboveTarget = [];
for (const step of Object.keys(summary).sort()) {
  const s = summary[step];
  const gap = Math.round((s.prose_fk - TARGET) * 100) / 100;
  if (gap > 0) aboveTarget.push(step);
  console.log(
    "  " + step + "     " + s.prose_fk.toFixed(2).padStart(6) +
    "  " + String(s.prose_words).padStart(5) + "  " + String(s.prose_sentences).padStart(5) +
    "  " + String(s.longest_sentence).padStart(7) +
    "  " + (s.visual_fk === null ? "  n/a" : s.visual_fk.toFixed(2).padStart(5)) +
    "  " + String(s.visual_words).padStart(7) +
    "  " + (gap > 0 ? ("+" + gap.toFixed(2) + " ABOVE") : gap.toFixed(2)));
  if (s.longest_sentence > HARD_SENTENCE) {
    console.log("        note: longest sentence is " + s.longest_sentence + " words, and " +
      s.sentences_over_guideline + " of " + s.prose_sentences + " sentences are over the " +
      HARD_SENTENCE + " word guideline (" + Math.round(s.share_over_guideline * 100) + " percent)");
  }
}

const jargonTotals = {};
for (const step of Object.keys(summary)) {
  for (const [t, n] of Object.entries(summary[step].jargon)) jargonTotals[t] = (jargonTotals[t] || 0) + n;
}
const topJargon = Object.entries(jargonTotals).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log("\ntop jargon in the panel: " + topJargon.map(([t, n]) => t + " " + n).join(", "));

if (flag("--show-longest")) {
  console.log("\nlongest prose sentences per step (shows what the filter kept):");
  for (const b of blocks) {
    const text = normalise(proseOnly(scan(b.html).prose));
    const list = sentences(text).map((s) => ({ s, n: (s.match(/[A-Za-z][A-Za-z'-]*/g) || []).length }))
      .sort((a, b2) => b2.n - a.n).slice(0, 3);
    console.log("\n  step " + b.step + ":");
    for (const x of list) console.log("    [" + x.n + "w] " + x.s.slice(0, 160));
  }
}

if (fs.existsSync(BASELINE_PATH) && !flag("--write-baseline")) {
  const base = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  for (const [step, s] of Object.entries(summary)) {
    const b = base.steps[step];
    if (!b) { console.log("\nnew step " + step + " has no baseline entry, reporting only"); continue; }
    if (s.prose_fk > b.prose_fk + CEILING_SLACK) {
      regressions.push("step " + step + ": prose FK " + s.prose_fk + " vs baseline " + b.prose_fk);
    }
    if (s.prose_words > b.prose_words * 1.10) {
      regressions.push("step " + step + ": prose word count " + s.prose_words + " vs baseline " + b.prose_words + " (over 10 percent growth)");
    }
  }
  console.log("\nratchet: baseline recorded, ceiling = baseline prose FK + " + CEILING_SLACK);
} else if (!flag("--write-baseline")) {
  console.log("\nratchet: no baseline file yet, nothing to compare against");
}

/* The ceiling is a hard failure, not a note. It exists because the target is an
 * ESL reader, and one 35 word sentence is where that reader gives up; a grade
 * average cannot see it. Both checks measure the shipped content, so they were
 * added once the content already held them. */
const overCeiling = Object.entries(summary).filter(([, s]) => s.sentences_over_ceiling > 0);
const denseProse = Object.entries(summary).filter(([, s]) => s.share_over_guideline > DENSE_SHARE);

if (overCeiling.length) {
  console.log("\nFAIL (rc 1): sentence(s) over the " + ESL_CEILING + " word ceiling in step(s) " +
    overCeiling.map(([k, s]) => k + " (" + s.sentences_over_ceiling + ")").join(", ") +
    ". Split them: a long sentence is where an ESL reader stops.");
  process.exit(1);
}
if (denseProse.length) {
  console.log("\nFAIL (rc 1): more than " + Math.round(DENSE_SHARE * 100) + " percent of sentences are over the " +
    HARD_SENTENCE + " word guideline in step(s) " + denseProse.map(([k]) => k).join(", ") +
    ". The average can look fine while the page reads as a wall.");
  process.exit(1);
}

if (aboveTarget.length) {
  console.log("ABOVE TARGET on step(s) " + aboveTarget.join(", ") + ". This is reported, not hidden: the gate ratchets against the baseline until the content is rewritten to target.");
}

/* Print the re-record history every run, so a baseline that has been moved is
 * never mistaken for an untouched one. */
try {
  const rec = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  if (rec.rebaseline_log && rec.rebaseline_log.length) {
    console.log("\nbaseline re-records on the record:");
    for (const entry of rec.rebaseline_log) {
      console.log("  " + entry.at + ": " + entry.reason);
      if (entry.moved && entry.moved.length) console.log("      moved: " + entry.moved.join(" | "));
    }
  }
} catch (e) { /* no baseline yet is not an error here */ }

if (regressions.length) {
  console.log("\nREGRESSION against baseline:");
  for (const r of regressions) console.log("  " + r);
  if (flag("--fail-above-target")) {
    console.log("\nFAIL: content got worse, or --fail-above-target was set and a step is above target.");
    process.exit(1);
  }
  console.log("\nFAIL (rc 1): content got worse than the recorded baseline.");
  process.exit(1);
}

if (flag("--fail-above-target") && aboveTarget.length) {
  console.log("\nFAIL (rc 1): --fail-above-target and step(s) " + aboveTarget.join(", ") + " are above the target.");
  process.exit(1);
}

console.log("\nOK (rc 0): measured, nothing worse than the recorded baseline.");
process.exit(0);
