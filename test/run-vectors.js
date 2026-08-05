/* Vector runner, shared verbatim by the browser page and the Node harness.
 *
 * Deliberately contains no DOM access and no Node APIs, so the exact same file
 * exercises the exact same src/*.js in both places. Rendering lives in
 * report.js (browser) and node-harness.js (terminal).
 *
 * Every check calls the shipped functions, not a copy of them. The entry point
 * mirrors what the UI does in main.js: derive the secp key with ethers, then
 * hand it to applyDevOutputFormat exactly as the Derive tab does. */

function runAllVectors() {
  var V = (typeof KEYSENSE_VECTORS !== "undefined")
    ? KEYSENSE_VECTORS
    : (typeof require === "function" ? require("./vectors.js") : null);
  if (!V) return Promise.reject(new Error("vectors.js not loaded"));

  var results = [];

  function record(group, id, expected, actual, extra) {
    var pass;
    if (expected === null || expected === undefined) {
      /* Unfrozen expectation. Report the value so it can be pasted in, but do
       * not count it as a pass: an unfrozen vector proves nothing. */
      pass = false;
      extra = extra || {};
      extra.unfrozen = true;
    } else {
      pass = String(expected) === String(actual);
    }
    var row = { group: group, id: id, expected: expected, actual: actual, pass: pass };
    if (extra) { for (var k in extra) if (extra.hasOwnProperty(k)) row[k] = extra[k]; }
    results.push(row);
    return row;
  }

  function fail(group, id, err) {
    results.push({
      group: group, id: id, expected: "(no throw)", actual: null, pass: false,
      error: (err && err.message) ? err.message : String(err)
    });
  }

  /* Call fn and always come back with a promise, even if fn throws
   * synchronously. Several of these functions used to be async and are now
   * sync, so a bare Promise.resolve(fn()) would let a throw escape the chain. */
  function attempt(fn) {
    try { return Promise.resolve(fn()); }
    catch (e) { return Promise.reject(e); }
  }

  function hex(u8) {
    var a = (u8 instanceof Uint8Array) ? u8 : new Uint8Array(u8);
    var s = "";
    for (var i = 0; i < a.length; i++) s += ("0" + a[i].toString(16)).slice(-2);
    return s;
  }

  function naclGlobal() {
    if (typeof nacl !== "undefined") return nacl;
    if (typeof globalThis !== "undefined" && globalThis.nacl) return globalThis.nacl;
    return null;
  }

  /* ---- 1. Full derivation, mnemonic to address ---- */
  function checkAddresses() {
    var chain = Promise.resolve();
    V.addresses.forEach(function (v) {
      chain = chain.then(function () {
        var mn = V.mnemonics[v.mnemonic];
        var pass = v.passphrase || "";
        var priv;
        try {
          priv = ethers.utils.HDNode.fromMnemonic(mn, pass).derivePath(v.path).privateKey;
        } catch (e) { fail("address", v.id, e); return; }
        return attempt(function () {
          return applyDevOutputFormat(mn, v.path, pass, priv, v.purpose, v.coinType, "auto");
        }).then(function (r) {
          record("address", v.id, v.expected, r && r.address, { source: v.source, path: v.path });
        }, function (e) { fail("address", v.id, e); });
      });
    });
    return chain;
  }

  /* ---- 2. WIF and extended keys ---- */
  function checkKeys() {
    var chain = Promise.resolve();
    (V.keys || []).forEach(function (v) {
      chain = chain.then(function () {
        var mn = V.mnemonics.abandon12;
        try {
          var node = ethers.utils.HDNode.fromMnemonic(mn).derivePath(v.path);
          if (v.kind === "neutered") {
            record("keys", v.id, v.expected, node.neuter().extendedKey, { source: v.source });
            return;
          }
          if (v.kind === "extended") {
            record("keys", v.id, v.expected, node.extendedKey, { source: v.source });
            return;
          }
          return attempt(function () {
            return applyDevOutputFormat(mn, v.path, "", node.privateKey, v.purpose, v.coinType, "auto");
          }).then(function (r) {
            record("keys", v.id, v.expected, r && r.wif, { source: v.source });
          });
        } catch (e) { fail("keys", v.id, e); }
      });
    });
    return chain;
  }

  /* ---- 3. SLIP-0010 ed25519, against the published vectors ---- */
  function checkSlip10() {
    if (typeof slip10DeriveEd25519 !== "function") {
      results.push({
        group: "slip10", id: "(module)", expected: "slip10DeriveEd25519 defined",
        actual: "not defined", pass: false, pending: true,
        error: "src/slip10-ed25519.js not implemented yet (plan phase 1.2)"
      });
      return Promise.resolve();
    }
    var n = naclGlobal();
    V.slip10Ed25519.forEach(function (v) {
      try {
        var seed = ethers.utils.arrayify("0x" + v.seedHex);
        var node = slip10DeriveEd25519(seed, v.path);
        record("slip10", v.id || (v.seedHex.slice(0, 8) + " " + v.path), v.key, hex(node.key),
          { source: v.source, path: v.path });
        if (v.chainCode) {
          record("slip10", (v.id || v.path) + "-cc", v.chainCode, hex(node.chainCode), { source: v.source });
        }
        if (v.pub && n) {
          record("slip10", (v.id || v.path) + "-pub", v.pub,
            "00" + hex(n.sign.keyPair.fromSeed(node.key).publicKey), { source: v.source });
        }
      } catch (e) { fail("slip10", v.id || v.path, e); }
    });
    return Promise.resolve();
  }

  /* ---- 4. Negative cases: these must throw, with the message the UI keys off ---- */
  function checkNegative() {
    var chain = Promise.resolve();
    (V.negative || []).forEach(function (v) {
      chain = chain.then(function () {
        var mn = V.mnemonics.abandon12;
        var priv;
        try {
          priv = ethers.utils.HDNode.fromMnemonic(mn).derivePath(v.path).privateKey;
        } catch (e) {
          /* ethers itself rejected the path. Still a throw, still acceptable. */
          record("negative", v.id, "throws /" + v.throwsMatching + "/",
            new RegExp(v.throwsMatching, "i").test(e.message) ? "threw (matched)" : "threw: " + e.message);
          return;
        }
        return attempt(function () {
          return applyDevOutputFormat(mn, v.path, "", priv, v.purpose, v.coinType, "auto");
        }).then(function (r) {
          record("negative", v.id, "throws /" + v.throwsMatching + "/",
            "no throw, returned " + (r && r.address));
        }, function (e) {
          var msg = (e && e.message) ? e.message : String(e);
          record("negative", v.id, "throws /" + v.throwsMatching + "/",
            new RegExp(v.throwsMatching, "i").test(msg) ? "throws /" + v.throwsMatching + "/" : "threw: " + msg);
        });
      });
    });
    return chain;
  }

  /* ---- 5. Entropy lab, reproducible mode ---- */
  function checkEntropy() {
    if (typeof entropyToMnemonic !== "function") return Promise.resolve();
    var chain = Promise.resolve();
    (V.entropyLab || []).forEach(function (v) {
      chain = chain.then(function () {
        return attempt(function () {
          return entropyToMnemonic(v.dice, v.coins, v.words, "en", { deterministic: true });
        }).then(function (r) {
          record("entropy", v.id, v.expected, r && r.phrase, { source: v.source });
        }, function (e) { fail("entropy", v.id, e); });
      });
    });
    var D50 = "12345612345612345612345612345612345612345612345612";   /* 129 bits */
    var D49 = "1234561234561234561234561234561234561234561234561";     /* 126 bits */

    /* Reproducible mode must actually reproduce, and mixed mode must not. */
    chain = chain.then(function () {
      try {
        var a = entropyToMnemonic(D50, "", 12, "en", { deterministic: true });
        var b = entropyToMnemonic(D50, "", 12, "en", { deterministic: true });
        record("entropy", "reproducible-mode-is-stable", true, a.phrase === b.phrase);

        var m1 = entropyToMnemonic(D50, "", 12, "en", {});
        var m2 = entropyToMnemonic(D50, "", 12, "en", {});
        record("entropy", "mixed-mode-differs-each-run", true, m1.phrase !== m2.phrase);
        record("entropy", "mixed-mode-returns-salt", true, /^[0-9a-f]{64}$/.test(m1.saltHex || ""));

        /* The salt is what makes mixed mode recoverable from a written-down
         * backup, so replaying it must reproduce the phrase exactly. */
        var replay = entropyToMnemonic(D50, "", 12, "en", { saltHex: m1.saltHex });
        record("entropy", "mixed-mode-replays-from-salt", m1.phrase, replay.phrase);
      } catch (e) { fail("entropy", "mode-behaviour", e); }
    });

    /* Gate boundaries: one roll below the threshold must be refused. */
    chain = chain.then(function () {
      function gated(label, dice, coins, words, shouldThrow) {
        var threw = false, msg = "";
        try { entropyToMnemonic(dice, coins, words, "en", { deterministic: true }); }
        catch (e) { threw = true; msg = e.message; }
        record("entropy", label, shouldThrow ? "refused" : "accepted",
          threw ? "refused" : "accepted", threw ? { message: msg.slice(0, 60) } : null);
      }
      gated("gate-49-rolls-12w-refused", D49, "", 12, true);
      gated("gate-50-rolls-12w-accepted", D50, "", 12, false);
      gated("gate-127-flips-12w-refused", "", new Array(128).join("H"), 12, true);
      gated("gate-128-flips-12w-accepted", "", new Array(129).join("H"), 12, false);
      gated("gate-99-rolls-24w-refused", new Array(100).join("1"), "", 24, true);
      gated("gate-100-rolls-24w-accepted", new Array(101).join("1"), "", 24, false);

      /* Demo mode is the deliberate escape hatch and must still work. */
      try {
        var demo = entropyToMnemonic("3", "", 24, "en", { deterministic: true, allowLowEntropy: true });
        record("entropy", "demo-override-works", true, !!demo.phrase);
        record("entropy", "demo-override-flags-lowEntropy", true, demo.lowEntropy === true);
      } catch (e) { fail("entropy", "demo-override-works", e); }
    });
    return chain;
  }

  /* ---- 5b. Entropy comparison widget ----
   * Pure presentation logic, but it is the one place the tool makes a claim
   * about how strong something is, so the claims are pinned here. */
  function checkCompare() {
    if (typeof estimatePassphraseBits !== "function") return Promise.resolve();
    try {
      var known = estimatePassphraseBits("correct horse battery staple");
      record("compare", "famous-phrase-is-zero-bits", 0, known.bits);
      record("compare", "famous-phrase-flagged-known", true, known.known);
      record("compare", "famous-phrase-case-insensitive", true,
        estimatePassphraseBits("Correct Horse Battery Staple").known);

      var empty = estimatePassphraseBits("");
      record("compare", "empty-is-zero", 0, empty.bits);

      /* The trap this widget exists to avoid: a long typed string scores above
       * the 128-bit baseline on character-space maths, which would tell the
       * reader their invention beat a generated seed. It must be flagged as a
       * ceiling whenever the number gets high enough to flatter. */
      var long = estimatePassphraseBits("ThisIsAVeryLongPassphraseWith!@#$%^&*()1234567890AndMore");
      record("compare", "long-phrase-exceeds-baseline", true, long.bits > 128);
      record("compare", "long-phrase-flagged-as-ceiling", true, long.ceiling === true);
      record("compare", "short-phrase-not-flagged", false, estimatePassphraseBits("abc").ceiling === true);
      record("compare", "ceiling-note-exists", true, typeof ENTROPY_CEILING_NOTE === "string");

      /* Crack-time wording, so the headline numbers cannot drift silently. */
      record("compare", "crack-0-bits", "already known", entropyCrackLabel(0));
      record("compare", "crack-26-bits-instant", "instant", entropyCrackLabel(26));
      record("compare", "crack-52-bits", "45 seconds", entropyCrackLabel(52));
      record("compare", "crack-128-bits", "8 million x the age of the universe", entropyCrackLabel(128));

      /* The reference table itself. 6^50 must clear 2^128, and ten Diceware
       * words must match a 12-word phrase, which is the argument the Learn tab
       * closes on. */
      var rows = entropyReferenceRows();
      var byLabel = {};
      rows.forEach(function (r) { byLabel[r.label] = r.bits; });
      record("compare", "50-dice-clears-128", true, byLabel["50 dice rolls"] >= 128);
      record("compare", "10-diceware-clears-128", true, byLabel["10 random Diceware words"] >= 128);
      record("compare", "4-diceware-matches-20-dice", byLabel["20 dice rolls"], byLabel["4 random Diceware words"]);
      record("compare", "no-row-claims-safety-below-128", true,
        rows.every(function (r) { return r.bits >= 128 ? r.kind !== "weak" : r.kind !== "baseline"; }));
    } catch (e) { fail("compare", "entropy-compare", e); }
    return Promise.resolve();
  }

  /* ---- 6. Brain wallet, locking the demo in place ---- */
  function checkBrain() {
    if (typeof deriveBrainWalletData !== "function") return Promise.resolve();
    var chain = Promise.resolve();
    (V.brainWallet || []).forEach(function (v) {
      chain = chain.then(function () {
        return attempt(function () {
          return deriveBrainWalletData(v.passphrase, "", 0, 0);
        }).then(function (b) {
          record("brain", v.id, v.expectedEth, b && b.ethAddress, { source: v.source });
        }, function (e) { fail("brain", v.id, e); });
      });
    });
    return chain;
  }

  return checkAddresses()
    .then(checkKeys)
    .then(checkSlip10)
    .then(checkNegative)
    .then(checkEntropy)
    .then(checkCompare)
    .then(checkBrain)
    .then(function () { return results; });
}

if (typeof module !== "undefined" && module.exports) { module.exports = { runAllVectors: runAllVectors }; }
