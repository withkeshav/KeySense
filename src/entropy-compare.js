

/* Entropy comparison widget.
 *
 * Design rule this thing exists under: it is a COMPARISON, never a score.
 *
 * Any meter with a green zone teaches that some passphrase is good enough, and
 * none are. So there is no verdict, no pass mark, and no praise. Every row is
 * plotted against the same 128-bit baseline, which is what one click of the
 * Generate button already gives you, and the only question the widget answers
 * is "how far short of that is this".
 *
 * The bar length is the bit count, not the guess count. Bits are already a
 * logarithm, so this IS the log scale: each extra bit doubles the work behind
 * it. Plotting guesses linearly would make everything except the baseline
 * invisible, and plotting bits linearly quietly understates the gap, so the
 * "time to search" column carries the real magnitude in words. */

/* A fast offline attack on an unsalted, unstretched hash. Brain wallets are a
 * single SHA-256, so this is the right order of magnitude for them. BIP39 goes
 * through PBKDF2 with 2048 rounds, which is far slower to attack, but the
 * numbers below are already so lopsided that the distinction never changes the
 * conclusion. */
var ENTROPY_GUESS_RATE = 1e14;

var ENTROPY_BASELINE_BITS = 128;

/* Phrases that are famous enough to be a single dictionary entry to an
 * attacker, no matter how many characters they contain. Bitcoin brain wallets
 * built on the first one were drained years ago. */
var ENTROPY_KNOWN_PHRASES = [
  "correct horse battery staple",
  "password",
  "satoshi nakamoto",
  "to be or not to be",
  "hello world",
  "let me in",
  "bitcoin"
];

function entropyCrackSeconds(bits) {
  if (!isFinite(bits) || bits <= 0) return 0;
  return Math.pow(2, bits) / ENTROPY_GUESS_RATE;
}

/* Plain words rather than a number, because the number stops meaning anything
 * somewhere around 10^20. */
function entropyCrackLabel(bits) {
  if (!isFinite(bits) || bits <= 0) return "already known";
  var s = entropyCrackSeconds(bits);
  if (s < 1) return "instant";
  if (s < 60) return Math.round(s) + " seconds";
  if (s < 3600) return Math.round(s / 60) + " minutes";
  if (s < 86400) return Math.round(s / 3600) + " hours";
  if (s < 31557600) return Math.round(s / 86400) + " days";
  var years = s / 31557600;
  if (years < 1000) return Math.round(years) + " years";
  if (years < 1e6) return Math.round(years / 1000) + " thousand years";
  if (years < 1e9) return Math.round(years / 1e6) + " million years";
  var universes = years / 1.38e10;
  if (universes < 1) return Math.round(years / 1e9) + " billion years";
  if (universes < 1e6) return Math.round(universes) + "x the age of the universe";
  if (universes < 1e9) return Math.round(universes / 1e6) + " million x the age of the universe";
  return "beyond any meaningful number";
}

/* Upper bound on a typed passphrase, never a measurement.
 *
 * This is character-space size: how many strings of that length exist in that
 * alphabet. A real attacker does not iterate the alphabet, they start from
 * wordlists, leetspeak rules and previous breaches, so the true guessing
 * entropy of anything memorable is far lower. Always presented as "at best". */
function estimatePassphraseBits(text) {
  var t = String(text || "");
  if (!t) return { bits: 0, known: false, ceiling: false };
  var normalized = t.toLowerCase().replace(/\s+/g, " ").trim();
  for (var i = 0; i < ENTROPY_KNOWN_PHRASES.length; i++) {
    if (normalized === ENTROPY_KNOWN_PHRASES[i]) return { bits: 0, known: true, ceiling: false };
  }
  var charSet = 0;
  if (/[a-z]/.test(t)) charSet += 26;
  if (/[A-Z]/.test(t)) charSet += 26;
  if (/[0-9]/.test(t)) charSet += 10;
  if (/[^a-zA-Z0-9]/.test(t)) charSet += 32;
  var bits = t.length * Math.log2(charSet || 26);
  /* Past roughly 60 bits this number stops being informative and starts being
   * actively misleading: a long typed string can score higher than the 128-bit
   * baseline here, which would tell the reader their invention beat a generated
   * seed. It did not. The bound counts every string of that length in that
   * alphabet, and a human picked one of the tiny memorable subset. Callers use
   * this flag to say so out loud. */
  return { bits: bits, known: false, ceiling: bits > 60 };
}

/* The fixed reference rows. Numbers check out:
 *   6^50  = 8.1e38, just above 2^128 = 3.4e38
 *   7776^4  = 2^51.7, the same as 20 dice rolls
 *   7776^10 = 2^129, which is the punchline below the table */
function entropyReferenceRows() {
  return [
    { label: "Generate button, 24 words", bits: 256, kind: "baseline" },
    { label: "Generate button, 12 words", bits: 128, kind: "baseline" },
    { label: "50 dice rolls", bits: 129, kind: "physical" },
    { label: "10 random Diceware words", bits: 129, kind: "physical" },
    { label: "20 dice rolls", bits: 52, kind: "weak" },
    { label: "4 random Diceware words", bits: 52, kind: "weak" },
    { label: "10 dice rolls", bits: 26, kind: "weak" },
    { label: "1 dice roll", bits: 2.585, kind: "weak" },
    { label: "“correct horse battery staple”", bits: 0, kind: "weak" }
  ];
}

function entropyRowColor(kind) {
  if (kind === "baseline") return "var(--success)";
  if (kind === "physical") return "var(--accent)";
  if (kind === "you") return "var(--warning)";
  return "var(--error)";
}

/* The sentence to print when a typed phrase scores high enough that the number
 * alone would flatter it. Shared so the Learn tab and the brain wallet tab
 * cannot drift into saying different things about the same estimate. */
var ENTROPY_CEILING_NOTE =
  "That number is a ceiling, not a measurement. It assumes every character was " +
  "picked uniformly at random, which is never true of something you invented and " +
  "can remember. Attackers do not walk the alphabet: they start from wordlists, " +
  "substitution rules and previous breaches, so a phrase like this is cracked in " +
  "a tiny fraction of the time shown. A generated seed has no such gap between " +
  "its number and its real strength.";

/* Render into hostEl. rows is an array of {label, bits, kind, note}.
 * Built entirely from DOM nodes: some labels carry text the user typed. */
function renderEntropyComparison(hostEl, rows, opts) {
  if (!hostEl) return;
  opts = opts || {};
  hostEl.textContent = "";

  var table = document.createElement("div");
  table.style.display = "grid";
  table.style.gridTemplateColumns = "minmax(90px, 1.4fr) minmax(60px, 2fr) auto";
  table.style.gap = "6px 10px";
  table.style.alignItems = "center";
  table.style.fontSize = "12px";

  rows.forEach(function (r) {
    var bits = Math.max(0, r.bits || 0);

    var name = document.createElement("div");
    name.textContent = r.label;
    name.style.color = "var(--text-muted)";
    name.style.wordBreak = "break-word";
    if (r.kind === "you") { name.style.fontWeight = "700"; name.style.color = "var(--text)"; }
    table.appendChild(name);

    /* Reuses the entropy lab's own bar styling so this looks native. */
    var track = document.createElement("div");
    track.className = "entropy-bar-wrap";
    var fill = document.createElement("div");
    fill.className = "entropy-bar";
    fill.style.animation = "none";
    fill.style.background = entropyRowColor(r.kind);
    fill.style.width = Math.min(100, (bits / ENTROPY_BASELINE_BITS) * 100) + "%";
    track.appendChild(fill);
    table.appendChild(track);

    var val = document.createElement("div");
    val.style.fontFamily = "var(--mono)";
    val.style.fontSize = "11px";
    val.style.whiteSpace = "nowrap";
    val.style.color = entropyRowColor(r.kind);
    /* One decimal below 10, because rounding 2.585 to "3" overstates a single
     * dice roll by a noticeable fraction of its whole value. */
    val.textContent = (bits === 0 ? "0" : bits < 10 ? bits.toFixed(1) : String(Math.round(bits))) +
      " bits · " + entropyCrackLabel(bits);
    table.appendChild(val);
  });

  hostEl.appendChild(table);

  var axis = document.createElement("p");
  axis.className = "hint";
  axis.style.marginTop = "10px";
  axis.style.marginBottom = "0";
  axis.textContent = opts.axisNote ||
    "Bars are bit counts, and bits are already a logarithm: every extra bit doubles the work. " +
    "A full bar is 128 bits, which is what one click of Generate gives you. Search times assume " +
    "100 trillion guesses a second against a fast hash.";
  hostEl.appendChild(axis);

  if (opts.footnote) {
    var foot = document.createElement("p");
    foot.className = "hint";
    foot.style.marginTop = "8px";
    foot.style.marginBottom = "0";
    foot.textContent = opts.footnote;
    hostEl.appendChild(foot);
  }
}
