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
          /* Official Aptos (and similar) fixtures publish seed and public key
           * alongside the address. Checking them catches a derivation bug
           * directly instead of only at the final hash. */
          if (v.expectedSeed) {
            record("address", v.id + "-seed", v.expectedSeed, r && r.privateHex,
              { source: v.source, path: v.path });
          }
          if (v.expectedPublicKey) {
            record("address", v.id + "-pub", v.expectedPublicKey, r && r.publicKeyHex,
              { source: v.source, path: v.path });
          }
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

  /* ---- 5c. Learn Paths live values (L1/L2) ----
   * Pure computation only; the DOM-render half of learn-live.js is exercised
   * by hand in the browser, not here. Values checked against the standard
   * abandon...about test vector so they can be verified independently. The
   * EVM and BTC pipeline outputs are cross-checked against the eth-0 and
   * btc-native-0 address vectors above: same seed, same paths, same
   * addresses, computed through a completely different code path in this
   * file. Agreement there is a second confirmation, not just a frozen value. */
  function checkLearnLive() {
    if (typeof learnEntropyBreakdown !== "function") return Promise.resolve();
    try {
      var MN = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

      record("learn", "checksum-bits-12-words", 4, learnChecksumBitCount(12));
      record("learn", "checksum-bits-24-words", 8, learnChecksumBitCount(24));

      var bd = learnEntropyBreakdown(MN, "en");
      record("learn", "breakdown-valid", true, bd.valid);
      record("learn", "breakdown-not-fallback", false, bd.usedFallback);
      record("learn", "breakdown-entropy-hex", "0x00000000000000000000000000000000", bd.entropyHex);
      record("learn", "breakdown-word-count", 12, bd.wordCount);
      record("learn", "breakdown-entropy-bits", 128, bd.entropyBits);
      record("learn", "breakdown-checksum-bits", 4, bd.checksumBits);
      record("learn", "breakdown-first-word-index", 0, bd.words[0].index);
      record("learn", "breakdown-first-word-binary", "00000000000", bd.words[0].binary);
      record("learn", "breakdown-last-word", "about", bd.words[11].word);
      record("learn", "breakdown-last-word-checksum-bits", 4, bd.words[11].checksumBitCount);

      /* Empty input must fall back rather than throw or go blank. */
      var bdEmpty = learnEntropyBreakdown("", "en");
      record("learn", "breakdown-empty-uses-fallback", true, bdEmpty.valid && bdEmpty.usedFallback);

      var mk = learnMasterKeyBreakdown(MN, "");
      record("learn", "master-key-seed-hex",
        "0x5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4",
        mk.seedHex);
      record("learn", "master-key-private",
        "0x1837c1be8e2995ec11cda2b066151be2cfb48adf9e47b151d46adab3a21cdf67", mk.masterPrivateKeyHex);
      record("learn", "master-key-chain-code",
        "0x7923408dadd3c7b56eed15567707ae5e5dca089de972e07f3b860450e2a3b70e", mk.chainCodeHex);

      var seg5 = learnPathSegments("m/44'/60'/0'/0/0");
      record("learn", "segments-5-count", 5, seg5.length);
      record("learn", "segments-5-labels", "purpose,coin_type,account,change,address_index",
        seg5.map(function (s) { return s.label; }).join(","));
      record("learn", "segments-5-hardened-flags", "true,true,true,false,false",
        seg5.map(function (s) { return s.hardened; }).join(","));

      var seg4 = learnPathSegments("m/44'/501'/0'/0'");
      record("learn", "segments-4-count", 4, seg4.length);
      record("learn", "segments-4-labels", "purpose,coin_type,account,address_index",
        seg4.map(function (s) { return s.label; }).join(","));
      record("learn", "segments-4-all-hardened", true, seg4.every(function (s) { return s.hardened; }));

      var hc = learnHardenedComparison(MN, "", "m/44'/0'/0'", 0);
      record("learn", "hardened-cmp-paths-differ", true, hc.normal.path !== hc.hardened.path);
      record("learn", "hardened-cmp-keys-differ", true, hc.normal.privateKeyHex !== hc.hardened.privateKeyHex);
      record("learn", "hardened-cmp-normal-key",
        "0x83bda5c7add17ef9bbc1f03391913fe6cc947aa18c4a343607724e815c83eeb7", hc.normal.privateKeyHex);
      record("learn", "hardened-cmp-hardened-key",
        "0xebb3082a71cf4b29239175619eb3e78a6316b6987ae2581c729706e1eae25ce4", hc.hardened.privateKeyHex);

      /* Cross-check against the published eth-0 / btc-native-0 vectors above:
       * same mnemonic, same fixed paths this step always uses, so the final
       * address here must equal the one BIP44/BIP84 already proved correct. */
      var eth0 = (V.addresses || []).filter(function (v) { return v.id === "eth-0"; })[0];
      var btcNative0 = (V.addresses || []).filter(function (v) { return v.id === "btc-native-0"; })[0];
      var pipe = learnAddressPipeline(MN, "");
      record("learn", "pipeline-evm-matches-eth-0-vector", eth0 ? eth0.expected : null, pipe.evm.address);
      record("learn", "pipeline-btc-matches-btc-native-0-vector", btcNative0 ? btcNative0.expected : null, pipe.btc.address);

      /* Round 2 additions: E1 provenance tagging, W1 chain grid path building,
       * W2 the xpub/child-key exercise (the BIP32 CKD-priv inversion, the one
       * piece of new maths in this pass), W3 the purpose mismatch demo. */
      var prov = entropyProvenanceParts("123", "HTH", "aa".repeat(32));
      record("learn", "provenance-three-parts", 3, prov.length);
      record("learn", "provenance-dice-tag", "D", prov[0].tag);
      record("learn", "provenance-coins-tag", "C", prov[1].tag);
      record("learn", "provenance-salt-tag", "R", prov[2].tag);
      record("learn", "provenance-empty-when-nothing-given", 0, entropyProvenanceParts("", "", "").length);

      var mismatch = learnWalletMismatchDemo(MN, "");
      record("learn", "mismatch-legacy-matches-btc-legacy-0-vector",
        (V.addresses || []).filter(function (v) { return v.id === "btc-legacy-0"; })[0].expected,
        mismatch.legacy.address);
      record("learn", "mismatch-native-matches-btc-native-0-vector", btcNative0 ? btcNative0.expected : null,
        mismatch.native.address);
      record("learn", "mismatch-addresses-differ", true, mismatch.legacy.address !== mismatch.native.address);

      var xpubDemo = learnXpubOnlyDemo(MN, "", "m/44'/60'/0'");
      record("learn", "xpub-only-no-private-keys", false,
        xpubDemo.addresses.some(function (a) { return a.hasPrivateKey; }));
      record("learn", "xpub-only-first-address-matches-eth-0", eth0 ? eth0.expected : null,
        xpubDemo.addresses[0].address);

      /* The one piece of new cryptography this pass ships: recovering a
       * parent's private key from its xpub plus one normal (non-hardened)
       * child's private key. matchesRealParent is the function's own
       * internal check against the real parent, computed the ordinary way;
       * this vector additionally locks the exact recovered value so a future
       * change to the formula cannot silently start recovering the wrong
       * key while still reporting "matches". */
      var recovery = learnParentKeyRecovery(MN, "", "m/44'/0'/0'", 0);
      record("learn", "recovery-matches-real-parent", true, recovery.matchesRealParent);
      record("learn", "recovery-recovered-key",
        "0xfe64af825b5b78554c33a28b23085fc082f691b3c712cc1d4e66e133297da87a",
        recovery.recoveredParentPrivateKeyHex);
    } catch (e) { fail("learn", "learn-live", e); }
    return Promise.resolve();
  }

  /* ---- 5d. Tier 3 teaching helpers (bit explorer, badges, wordlist) ----
   * Pure compute only. The bit-flip explorer's whole point is that flipping
   * entropy bits re-derives a DIFFERENT valid phrase (checksum recomputed by
   * BIP39 itself), while corrupting checksum bits alone yields real words
   * that fail validation. These pins freeze that behaviour. */
  function checkLearnTier3() {
    if (typeof learnBytesToBits !== "function") return Promise.resolve();
    try {
      var MN = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      var wl = getWordlist("en");

      /* Byte <-> bit helpers round-trip both directions. */
      var ent = ethers.utils.mnemonicToEntropy(MN, wl);
      var bytes = ethers.utils.arrayify(ent);
      var back = learnBitsToBytes(learnBytesToBits(bytes));
      var hexBack = "";
      for (var i = 0; i < back.length; i++) hexBack += ("0" + back[i].toString(16)).slice(-2);
      record("learn3", "bits-bytes-roundtrip", ent.replace(/^0x/, ""), hexBack);

      /* Zero entropy is abandon x11 + about. Flipping single bits must give
       * deterministic, DIFFERENT, still-valid phrases. */
      var zero = learnBytesToBits(new Uint8Array(16));
      var b0 = zero.slice(); b0[0] = 1;
      record("learn3", "flip-entropy-bit-0",
        "length abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
        learnPhraseFromEntropyBits(b0, "en"));
      var b127 = zero.slice(); b127[127] = 1;
      record("learn3", "flip-entropy-bit-127",
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon actual",
        learnPhraseFromEntropyBits(b127, "en"));
      var valid0 = false;
      try { valid0 = ethers.utils.isValidMnemonic(learnPhraseFromEntropyBits(b0, "en"), wl); } catch (e2) {}
      record("learn3", "flipped-entropy-still-valid", true, valid0);

      /* Corrupt only a checksum bit: real words, invalid phrase. abandon12's
       * last word "about" is index 3 (00000000011); flipping the final
       * checksum bit gives index 2, "able", and validation must fail. */
      var bd = learnEntropyBreakdown(MN, "en");
      var bits = [];
      bd.words.forEach(function (w) {
        for (var c = 0; c < w.binary.length; c++) bits.push(w.binary.charAt(c) === "1" ? 1 : 0);
      });
      record("learn3", "full-bitstring-length", 132, bits.length);
      var corrupted = bits.slice();
      corrupted[131] = corrupted[131] ? 0 : 1;
      var corruptedPhrase = learnPhraseFromFullBits(corrupted, "en");
      record("learn3", "checksum-flip-last-word", "able", corruptedPhrase.split(" ").pop());
      var validC = false;
      try { validC = ethers.utils.isValidMnemonic(corruptedPhrase, wl); } catch (e3) {}
      record("learn3", "checksum-flip-invalid", false, validC);
      /* Untampered bitstring must rebuild the original phrase exactly. */
      record("learn3", "untampered-rebuild", MN, learnPhraseFromFullBits(bits, "en"));

      /* 3g: the self-verification must recompute all official vectors green. */
      var checks = learnVerifyVectors();
      record("learn3", "verify-vector-count", 5, checks.length);
      record("learn3", "verify-all-pass", true, checks.every(function (c) { return c.pass; }));

      /* 3h: wordlist stats and search. */
      var stats = learnWordlistStats("en");
      record("learn3", "wordlist-count", 2048, stats && stats.count);
      record("learn3", "wordlist-first-four-unique", true, stats && stats.firstFourUnique);
      var arr = getWordlistArray("en");
      var m = learnWordlistSearchMatches(arr, "abando", 48);
      record("learn3", "wordlist-search-prefix", "abandon", m && m.matches[0]);
      var none = learnWordlistSearchMatches(arr, "zzzzzzzz", 48);
      record("learn3", "wordlist-search-no-match", 0, none && none.matches.length);
    } catch (e) { fail("learn3", "tier3-helpers", e); }
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
    .then(checkLearnLive)
    .then(checkLearnTier3)
    .then(checkBrain)
    .then(function () { return results; });
}

if (typeof module !== "undefined" && module.exports) { module.exports = { runAllVectors: runAllVectors }; }
