/* Live values for the Learn Paths walkthrough, computed from the seed the
 * user actually has loaded.
 *
 * Pure computation and DOM-render functions only. No top-level side effects,
 * no event listeners: wiring lives in main.js, the same split entropy-compare.js
 * uses, so this file stays loadable (and its pure functions testable) in the
 * Node harness the way the DOM-touching parts of that file already are.
 *
 * Falls back to the standard "abandon...about" test vector whenever the
 * loaded mnemonic is empty or does not pass its checksum, since a page that
 * goes blank mid-typing teaches nothing and the fallback is itself a
 * published, independently verifiable vector. */

var LEARN_FALLBACK_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

/* BIP39: checksum bits = entropy bits / 32, and words = (entropy + checksum) / 11.
 * Solving for checksum bits from word count alone: checksumBits = words * 11 / 33. */
function learnChecksumBitCount(wordCount) {
  return Math.round((wordCount * 11) / 33);
}

function learnBinary11(index) {
  var s = index.toString(2);
  while (s.length < 11) s = "0" + s;
  return s;
}

/* Step 1: entropy hex, each word's 11-bit index, and which trailing bits of
 * the last word are checksum rather than entropy. */
function learnEntropyBreakdown(mnemonic, lang) {
  var out = { valid: false, usedFallback: false, words: [], entropyHex: null,
    entropyBits: 0, checksumBits: 0, wordCount: 0, error: null };
  if (typeof ethers === "undefined") { out.error = "ethers not loaded"; return out; }
  var wl = (ethers.wordlists && (ethers.wordlists[lang] || ethers.wordlists.en)) || null;
  var trimmed = (mnemonic || "").trim();
  var candidate = trimmed;
  var usedFallback = false;
  if (!trimmed || !ethers.utils.isValidMnemonic(trimmed, wl)) {
    candidate = LEARN_FALLBACK_MNEMONIC;
    usedFallback = true;
  }
  try {
    out.entropyHex = ethers.utils.mnemonicToEntropy(candidate, wl);
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
    return out;
  }
  var words = candidate.split(/\s+/);
  out.wordCount = words.length;
  out.checksumBits = learnChecksumBitCount(words.length);
  out.entropyBits = words.length * 11 - out.checksumBits;
  var lastWordEntropyBits = 11 - out.checksumBits;
  out.words = words.map(function (w, i) {
    var idx = wordIndexInWordlist(w, wl);
    var binary = idx >= 0 ? learnBinary11(idx) : null;
    var isLast = i === words.length - 1;
    return {
      word: w,
      index: idx,
      binary: binary,
      checksumBitCount: isLast ? out.checksumBits : 0,
      entropyBitCount: isLast ? lastWordEntropyBits : 11
    };
  });
  out.valid = true;
  out.usedFallback = usedFallback;
  return out;
}

/* Step 2: the 512-bit PBKDF2 seed, then HMAC-SHA512(key="Bitcoin seed", seed)
 * split into master private key and chain code. ethers computes this split
 * internally when building the root HDNode; the two halves are exposed
 * directly on the node as .privateKey and .chainCode. */
function learnMasterKeyBreakdown(mnemonic, passphrase) {
  var out = { seedHex: null, masterPrivateKeyHex: null, chainCodeHex: null, error: null };
  if (typeof ethers === "undefined") { out.error = "ethers not loaded"; return out; }
  try {
    out.seedHex = ethers.utils.mnemonicToSeed(mnemonic, passphrase || "");
    var root = ethers.utils.HDNode.fromMnemonic(mnemonic, passphrase || "");
    out.masterPrivateKeyHex = root.privateKey;
    out.chainCodeHex = root.chainCode;
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
  }
  return out;
}

/* Step 3: label each segment of a path by its conventional BIP44 role.
 * Handles both the 5-segment Bitcoin-style layout and the 4-segment
 * all-hardened layout this tool uses for Solana/Sui/Aptos. */
function learnPathSegments(path) {
  var parts = String(path || "").replace(/^m\//i, "").split("/").filter(Boolean);
  var labels5 = ["purpose", "coin_type", "account", "change", "address_index"];
  var labels4 = ["purpose", "coin_type", "account", "address_index"];
  var labels = parts.length === 4 ? labels4 : labels5;
  return parts.map(function (seg, i) {
    var hardened = /'$/.test(seg) || /h$/i.test(seg);
    var value = parseInt(seg.replace(/['h]/gi, ""), 10);
    return {
      label: labels[i] || ("level " + i),
      raw: seg,
      value: isNaN(value) ? null : value,
      hardened: hardened
    };
  });
}

/* Step 4: derive the same index both hardened and normal from the same
 * parent, so the two different resulting keys sit side by side. Only valid
 * on secp256k1 paths (Ed25519/SLIP-0010 requires every segment hardened, so
 * there is no "normal" counterpart to show for those chains). */
function learnHardenedComparison(mnemonic, passphrase, parentPath, index) {
  var out = { normal: null, hardened: null, error: null };
  if (typeof ethers === "undefined") { out.error = "ethers not loaded"; return out; }
  try {
    var parent = ethers.utils.HDNode.fromMnemonic(mnemonic, passphrase || "").derivePath(parentPath);
    var normalNode = parent.derivePath(String(index));
    var hardenedNode = parent.derivePath(index + "'");
    out.normal = { path: parentPath + "/" + index, privateKeyHex: normalNode.privateKey };
    out.hardened = { path: parentPath + "/" + index + "'", privateKeyHex: hardenedNode.privateKey };
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
  }
  return out;
}

/* Step 5: decompose the private-key-to-address pipeline for two archetypal
 * chains, at fixed illustrative paths independent of whatever the Derive tab
 * currently has selected, so this box is self-contained. */
function learnAddressPipeline(mnemonic, passphrase) {
  var out = { evm: null, btc: null, error: null };
  if (typeof ethers === "undefined") { out.error = "ethers not loaded"; return out; }
  try {
    var evmNode = ethers.utils.HDNode.fromMnemonic(mnemonic, passphrase || "").derivePath("m/44'/60'/0'/0/0");
    var evmPubUncompressed = ethers.utils.computePublicKey(evmNode.privateKey, false);
    var evmHash = ethers.utils.keccak256("0x" + evmPubUncompressed.slice(4));
    var evmWallet = new ethers.Wallet(evmNode.privateKey);
    out.evm = {
      privateKeyHex: evmNode.privateKey,
      publicKeyUncompressedHex: evmPubUncompressed,
      keccakHashHex: evmHash,
      last20BytesHex: "0x" + evmHash.slice(-40),
      address: evmWallet.address
    };
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
    return out;
  }
  try {
    var btcNode = ethers.utils.HDNode.fromMnemonic(mnemonic, passphrase || "").derivePath("m/84'/0'/0'/0/0");
    var btcPubCompressed = ethers.utils.computePublicKey(btcNode.privateKey, true);
    var btcHash160 = hash160(btcPubCompressed);
    out.btc = {
      privateKeyHex: btcNode.privateKey,
      publicKeyCompressedHex: btcPubCompressed,
      hash160Hex: "0x" + toHex(btcHash160),
      address: utxoP2WPKH(btcPubCompressed, "bc")
    };
  } catch (e2) {
    out.error = e2 && e2.message ? e2.message : String(e2);
  }
  return out;
}

/* ── DOM rendering ─────────────────────────────────────────────────────
 * Built from DOM nodes throughout, never innerHTML with interpolated text.
 * Step 1's box in particular runs on live, unvalidated keystrokes, which is
 * exactly the situation that produced a real XSS hole here before. */

function learnRenderKeyValueRow(container, label, value, opts) {
  opts = opts || {};
  var row = document.createElement("div");
  row.style.marginTop = "6px";
  var l = document.createElement("div");
  l.className = "output-label";
  l.style.fontSize = "10px";
  l.textContent = label;
  row.appendChild(l);
  var v = document.createElement("div");
  v.className = "output-value";
  v.style.fontSize = opts.small ? "11px" : "12px";
  v.style.wordBreak = "break-all";
  if (opts.color) v.style.color = opts.color;
  v.textContent = value == null ? "-" : String(value);
  row.appendChild(v);
  container.appendChild(row);
}

function learnRenderStep1(hostEl, breakdown) {
  if (!hostEl) return;
  hostEl.textContent = "";
  if (breakdown.error) {
    var err = document.createElement("p");
    err.className = "hint";
    err.textContent = "Could not compute: " + breakdown.error;
    hostEl.appendChild(err);
    return;
  }
  if (breakdown.usedFallback) {
    var note = document.createElement("p");
    note.className = "hint";
    note.style.marginBottom = "8px";
    note.textContent = "No valid seed is loaded yet (or the checksum does not pass), so this box " +
      "shows the standard published test phrase instead. Generate a seed on the Derive tab, or " +
      "fix the checksum below, to see your own.";
    hostEl.appendChild(note);
  }
  learnRenderKeyValueRow(hostEl, "Entropy (hex)", breakdown.entropyHex);
  var summary = document.createElement("p");
  summary.className = "hint";
  summary.style.marginTop = "8px";
  summary.textContent = breakdown.wordCount + " words = " + breakdown.entropyBits +
    " entropy bits + " + breakdown.checksumBits + " checksum bits, 11 bits each.";
  hostEl.appendChild(summary);

  var grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(150px, 1fr))";
  grid.style.gap = "6px";
  grid.style.marginTop = "8px";
  breakdown.words.forEach(function (w, i) {
    var cell = document.createElement("div");
    cell.style.padding = "6px 8px";
    cell.style.background = "var(--code-bg)";
    cell.style.border = "1px solid var(--border)";
    cell.style.borderRadius = "var(--radius-sm)";
    cell.style.fontFamily = "var(--mono)";
    cell.style.fontSize = "10px";

    var wordLine = document.createElement("div");
    wordLine.style.color = "var(--text)";
    wordLine.style.fontWeight = "600";
    wordLine.textContent = (i + 1) + ". " + w.word;
    cell.appendChild(wordLine);

    if (w.binary) {
      var binLine = document.createElement("div");
      binLine.style.marginTop = "3px";
      binLine.style.wordBreak = "break-all";
      if (w.checksumBitCount > 0) {
        var entropyPart = w.binary.slice(0, 11 - w.checksumBitCount);
        var checksumPart = w.binary.slice(11 - w.checksumBitCount);
        var ePart = document.createElement("span");
        ePart.style.color = "var(--text-muted)";
        ePart.textContent = entropyPart;
        binLine.appendChild(ePart);
        var cPart = document.createElement("span");
        cPart.style.color = "var(--warning)";
        cPart.style.fontWeight = "700";
        cPart.textContent = checksumPart;
        binLine.appendChild(cPart);
      } else {
        binLine.style.color = "var(--text-muted)";
        binLine.textContent = w.binary;
      }
      cell.appendChild(binLine);

      var idxLine = document.createElement("div");
      idxLine.style.marginTop = "2px";
      idxLine.style.color = "var(--text-muted)";
      idxLine.textContent = "index " + w.index + " / 2048";
      cell.appendChild(idxLine);
    } else {
      var bad = document.createElement("div");
      bad.style.marginTop = "3px";
      bad.style.color = "var(--error)";
      bad.textContent = "not in wordlist";
      cell.appendChild(bad);
    }
    grid.appendChild(cell);
  });
  hostEl.appendChild(grid);

  var legend = document.createElement("p");
  legend.className = "hint";
  legend.style.marginTop = "8px";
  legend.style.marginBottom = "0";
  legend.textContent = "The " + breakdown.checksumBits + " bits in orange on the last word are " +
    "the checksum, not entropy. They are not random: they are computed from the other words, " +
    "which is exactly what lets a typo be caught below.";
  hostEl.appendChild(legend);
}

function learnRenderStep2(hostEl, breakdown) {
  if (!hostEl) return;
  hostEl.textContent = "";
  if (breakdown.error) {
    var err = document.createElement("p");
    err.className = "hint";
    err.textContent = "Could not compute: " + breakdown.error;
    hostEl.appendChild(err);
    return;
  }
  learnRenderKeyValueRow(hostEl, "512-bit seed (PBKDF2 output)", breakdown.seedHex, { small: true });
  learnRenderKeyValueRow(hostEl, "Left 256 bits -> master private key", breakdown.masterPrivateKeyHex,
    { color: "var(--accent)" });
  learnRenderKeyValueRow(hostEl, "Right 256 bits -> master chain code", breakdown.chainCodeHex,
    { color: "var(--accent)" });
}

function learnRenderStep3(hostEl, segments, path) {
  if (!hostEl) return;
  hostEl.textContent = "";
  var pathLine = document.createElement("div");
  pathLine.className = "path-preview";
  pathLine.style.textAlign = "left";
  pathLine.style.fontSize = "12px";
  pathLine.textContent = path;
  hostEl.appendChild(pathLine);
  segments.forEach(function (seg) {
    var row = document.createElement("div");
    row.style.marginTop = "6px";
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.alignItems = "baseline";
    var label = document.createElement("span");
    label.style.fontFamily = "var(--mono)";
    label.style.fontSize = "11px";
    label.style.color = "var(--accent)";
    label.style.minWidth = "110px";
    label.textContent = seg.label;
    row.appendChild(label);
    var val = document.createElement("span");
    val.style.fontFamily = "var(--mono)";
    val.style.fontSize = "11px";
    val.textContent = seg.raw + (seg.hardened ? "  (hardened)" : "  (normal)");
    row.appendChild(val);
    hostEl.appendChild(row);
  });
}

function learnRenderStep4(hostEl, cmp) {
  if (!hostEl) return;
  hostEl.textContent = "";
  if (cmp.error) {
    var err = document.createElement("p");
    err.className = "hint";
    err.textContent = "Could not compute: " + cmp.error;
    hostEl.appendChild(err);
    return;
  }
  var grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "1fr 1fr";
  grid.style.gap = "10px";
  [["Normal", cmp.normal], ["Hardened", cmp.hardened]].forEach(function (pair) {
    var box = document.createElement("div");
    box.style.padding = "8px 10px";
    box.style.background = "var(--code-bg)";
    box.style.border = "1px solid var(--border)";
    box.style.borderRadius = "var(--radius-sm)";
    var title = document.createElement("div");
    title.style.fontWeight = "700";
    title.style.fontSize = "11px";
    title.style.marginBottom = "4px";
    title.textContent = pair[0] + ": " + pair[1].path;
    box.appendChild(title);
    var key = document.createElement("div");
    key.style.fontFamily = "var(--mono)";
    key.style.fontSize = "10px";
    key.style.wordBreak = "break-all";
    key.textContent = pair[1].privateKeyHex;
    box.appendChild(key);
    grid.appendChild(box);
  });
  hostEl.appendChild(grid);
  var note = document.createElement("p");
  note.className = "hint";
  note.style.marginTop = "8px";
  note.style.marginBottom = "0";
  note.textContent = "Same parent, same index, one apostrophe of difference: two completely " +
    "unrelated private keys.";
  hostEl.appendChild(note);
}

/* L2: the interactive checksum demo. The caller owns the actual <input> (so
 * re-renders on every keystroke do not steal focus or cursor position); this
 * only renders the result panel below it. Runs on live, unvalidated keystrokes
 * by design, so everything here is DOM nodes, never innerHTML. */
function learnRenderChecksumDemo(hostEl, firstWords, typedLastWord, lang) {
  if (!hostEl) return;
  hostEl.textContent = "";
  var wl = getWordlist(lang);
  var totalWords = firstWords.split(/\s+/).filter(Boolean).length + 1;
  var checksumBits = learnChecksumBitCount(totalWords);
  var word = (typedLastWord || "").trim().toLowerCase();

  if (!word) {
    var prompt = document.createElement("p");
    prompt.className = "hint";
    prompt.textContent = "Type a last word above to test it.";
    hostEl.appendChild(prompt);
    return;
  }

  var inList = wordIndexInWordlist(word, wl) >= 0;
  var result = document.createElement("p");
  result.style.fontWeight = "600";
  result.style.margin = "0";

  if (!inList) {
    result.style.color = "var(--error)";
    result.textContent = '"' + word + '" is not a BIP39 word.';
    hostEl.appendChild(result);
    var suggestions = suggestWord(word, lang);
    if (suggestions.length) {
      var sug = document.createElement("p");
      sug.className = "hint";
      sug.style.marginTop = "4px";
      sug.textContent = "Closest real words: " + suggestions.map(function (s) { return s.word; }).join(", ");
      hostEl.appendChild(sug);
    }
    return;
  }

  var fullPhrase = firstWords + " " + word;
  var valid = false;
  try { valid = ethers.utils.isValidMnemonic(fullPhrase, wl); } catch (e) { valid = false; }

  if (valid) {
    result.style.color = "var(--success)";
    result.textContent = "Valid. This combination passes the checksum.";
    hostEl.appendChild(result);
    return;
  }

  result.style.color = "var(--error)";
  result.textContent = "Checksum fails. \"" + word + "\" is a real word, but not the right one here.";
  hostEl.appendChild(result);

  var odds = document.createElement("p");
  odds.className = "hint";
  odds.style.marginTop = "6px";
  odds.style.marginBottom = "0";
  odds.textContent = "Only 1 in " + Math.pow(2, checksumBits) + " possible last words would pass, " +
    "because " + checksumBits + " of its 11 bits are checksum, computed from the words before it.";
  hostEl.appendChild(odds);

  var lookup = totalWords === 24 ? findValid24thWords(firstWords, lang) : findValidNthWords(firstWords, lang, totalWords);
  if (lookup && !lookup.error && lookup.firstFew && lookup.firstFew.length) {
    var validNote = document.createElement("p");
    validNote.className = "hint";
    validNote.style.marginTop = "6px";
    validNote.style.marginBottom = "0";
    validNote.textContent = "Words that would actually work here (" + lookup.validCount + " total): " +
      lookup.firstFew.join(", ") + (lookup.validCount > lookup.firstFew.length ? ", ..." : "");
    hostEl.appendChild(validNote);
  }
}

/* Same mnemonic, two passphrases, side by side. Reuses learnAddressPipeline
 * exactly as step 5 does; the only thing that differs between the two calls
 * is the passphrase argument. */
function learnRenderPassphraseBranch(hostEl, mnemonicForDerive, typedPassphrase) {
  if (!hostEl) return;
  hostEl.textContent = "";
  var withoutPass = learnAddressPipeline(mnemonicForDerive, "");
  if (withoutPass.error || !withoutPass.evm) {
    var err = document.createElement("p");
    err.className = "hint";
    err.textContent = "Could not compute.";
    hostEl.appendChild(err);
    return;
  }
  var grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "1fr 1fr";
  grid.style.gap = "10px";

  var col1 = document.createElement("div");
  col1.style.padding = "8px 10px";
  col1.style.background = "var(--code-bg)";
  col1.style.border = "1px solid var(--border)";
  col1.style.borderRadius = "var(--radius-sm)";
  var title1 = document.createElement("div");
  title1.style.fontWeight = "700";
  title1.style.fontSize = "11px";
  title1.style.marginBottom = "4px";
  title1.textContent = "No passphrase";
  col1.appendChild(title1);
  var addr1 = document.createElement("div");
  addr1.style.fontFamily = "var(--mono)";
  addr1.style.fontSize = "11px";
  addr1.style.wordBreak = "break-all";
  addr1.textContent = withoutPass.evm.address;
  col1.appendChild(addr1);
  grid.appendChild(col1);

  var col2 = document.createElement("div");
  col2.style.padding = "8px 10px";
  col2.style.background = "var(--code-bg)";
  col2.style.border = "1px solid var(--border)";
  col2.style.borderRadius = "var(--radius-sm)";
  var title2 = document.createElement("div");
  title2.style.fontWeight = "700";
  title2.style.fontSize = "11px";
  title2.style.marginBottom = "4px";
  var typed = typedPassphrase || "";
  if (typed) {
    var withPass = learnAddressPipeline(mnemonicForDerive, typed);
    title2.textContent = 'With "' + typed + '"';
    col2.appendChild(title2);
    var addr2 = document.createElement("div");
    addr2.style.fontFamily = "var(--mono)";
    addr2.style.fontSize = "11px";
    addr2.style.wordBreak = "break-all";
    addr2.textContent = (withPass.evm && !withPass.error) ? withPass.evm.address : "Could not compute.";
    col2.appendChild(addr2);
  } else {
    title2.textContent = "With a passphrase";
    col2.appendChild(title2);
    var hint = document.createElement("div");
    hint.style.fontSize = "11px";
    hint.style.color = "var(--text-muted)";
    hint.textContent = "Type any passphrase above to see it branch.";
    col2.appendChild(hint);
  }
  grid.appendChild(col2);

  hostEl.appendChild(grid);

  if (typed) {
    var note = document.createElement("p");
    note.className = "hint";
    note.style.marginTop = "8px";
    note.style.marginBottom = "0";
    note.textContent = "Same 12 words, one character of difference in the passphrase, a completely " +
      "unrelated address. Nothing links these two wallets without both pieces.";
    hostEl.appendChild(note);
  }
}

function learnRenderStep5(hostEl, pipeline) {
  if (!hostEl) return;
  hostEl.textContent = "";
  if (pipeline.error && !pipeline.evm) {
    var err = document.createElement("p");
    err.className = "hint";
    err.textContent = "Could not compute: " + pipeline.error;
    hostEl.appendChild(err);
    return;
  }
  if (pipeline.evm) {
    var evmTitle = document.createElement("div");
    evmTitle.style.fontWeight = "700";
    evmTitle.style.color = "var(--accent)";
    evmTitle.style.marginTop = "4px";
    evmTitle.textContent = "Ethereum / EVM, at m/44'/60'/0'/0/0";
    hostEl.appendChild(evmTitle);
    learnRenderKeyValueRow(hostEl, "Uncompressed public key", pipeline.evm.publicKeyUncompressedHex, { small: true });
    learnRenderKeyValueRow(hostEl, "Keccak-256(public key)", pipeline.evm.keccakHashHex, { small: true });
    learnRenderKeyValueRow(hostEl, "Last 20 bytes -> address", pipeline.evm.address, { color: "var(--success)" });
  }
  if (pipeline.btc) {
    var btcTitle = document.createElement("div");
    btcTitle.style.fontWeight = "700";
    btcTitle.style.color = "var(--accent)";
    btcTitle.style.marginTop = "14px";
    btcTitle.textContent = "Bitcoin (Native SegWit), at m/84'/0'/0'/0/0";
    hostEl.appendChild(btcTitle);
    learnRenderKeyValueRow(hostEl, "Compressed public key", pipeline.btc.publicKeyCompressedHex, { small: true });
    learnRenderKeyValueRow(hostEl, "HASH160 = RIPEMD160(SHA256(pubkey))", pipeline.btc.hash160Hex, { small: true });
    learnRenderKeyValueRow(hostEl, "Bech32(witness v0, hash160) -> address", pipeline.btc.address, { color: "var(--success)" });
  }
}

/* W1: one seed across every supported chain, side by side. Takes an array of
 * {label, address, error} already computed by the caller (address derivation
 * is async, so it cannot happen inside a pure render function); this only
 * builds the DOM. */
function learnRenderChainGrid(hostEl, results) {
  if (!hostEl) return;
  hostEl.textContent = "";
  var grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
  grid.style.gap = "8px";
  results.forEach(function (r) {
    var cell = document.createElement("div");
    cell.style.padding = "8px 10px";
    cell.style.background = "var(--code-bg)";
    cell.style.border = "1px solid var(--border)";
    cell.style.borderRadius = "var(--radius-sm)";
    var label = document.createElement("div");
    label.style.fontSize = "11px";
    label.style.fontWeight = "700";
    label.style.color = "var(--accent)";
    label.style.marginBottom = "3px";
    label.textContent = r.label;
    cell.appendChild(label);
    var addr = document.createElement("div");
    addr.style.fontFamily = "var(--mono)";
    addr.style.fontSize = "10.5px";
    addr.style.wordBreak = "break-all";
    addr.style.color = r.error ? "var(--error)" : "var(--text)";
    addr.textContent = r.error ? "Could not derive" : r.address;
    cell.appendChild(addr);
    grid.appendChild(cell);
  });
  hostEl.appendChild(grid);
}

/* W2, scope "xpub only": derive the account-level xpub, then derive a few
 * receiving addresses from THAT alone, via ethers' own public-only child
 * derivation (fromExtendedKey on an xpub has no private key anywhere in it,
 * so any node it derives has none either - confirmed no privateKey field
 * appears on the derived nodes below). Proves the claim rather than stating
 * it: this really cannot sign anything, because the derivation never touches
 * a private key at all. */
function learnXpubOnlyDemo(mnemonic, passphrase, accountPath) {
  var out = { xpub: null, addresses: [], error: null };
  if (typeof ethers === "undefined") { out.error = "ethers not loaded"; return out; }
  try {
    var account = ethers.utils.HDNode.fromMnemonic(mnemonic, passphrase || "").derivePath(accountPath);
    var neutered = account.neuter();
    out.xpub = neutered.extendedKey;
    var fromXpub = ethers.utils.HDNode.fromExtendedKey(out.xpub);
    for (var i = 0; i < 3; i++) {
      var node = fromXpub.derivePath("0/" + i);
      out.addresses.push({
        path: accountPath + "/0/" + i,
        address: ethers.utils.computeAddress(node.publicKey),
        hasPrivateKey: !!node.privateKey
      });
    }
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
  }
  return out;
}

/* W2, scope "xpub + one child private key": the actual leak, computed live
 * rather than asserted. Standard BIP32 CKD-priv for a NORMAL (non-hardened)
 * child is invertible given only public data plus that one child's private
 * key:
 *
 *   I  = HMAC-SHA512(parent_chaincode, serP(parent_pubkey) || ser32(index))
 *   IL = I[0:32]
 *   child_priv = (IL + parent_priv) mod n   <-  the forward direction
 *   parent_priv = (child_priv - IL) mod n   <-  inverted here
 *
 * Everything on the right of IL's definition (parent pubkey, chain code,
 * index) is exactly what an xpub already contains. matchesRealParent is a
 * live sanity check against the actual parent key derived the normal way,
 * not something a real attacker would have to confirm against. */
function learnParentKeyRecovery(mnemonic, passphrase, parentPath, childIndex) {
  var out = { parentXpub: null, childPath: null, childPrivateKeyHex: null,
    recoveredParentPrivateKeyHex: null, matchesRealParent: false, error: null };
  if (typeof ethers === "undefined") { out.error = "ethers not loaded"; return out; }
  try {
    var parent = ethers.utils.HDNode.fromMnemonic(mnemonic, passphrase || "").derivePath(parentPath);
    var child = parent.derivePath(String(childIndex));
    out.parentXpub = parent.neuter().extendedKey;
    out.childPath = parentPath + "/" + childIndex;
    out.childPrivateKeyHex = child.privateKey;

    var parentPubComp = ethers.utils.computePublicKey(parent.privateKey, true);
    var idxHex = childIndex.toString(16);
    while (idxHex.length < 8) idxHex = "0" + idxHex;
    var data = "0x" + parentPubComp.slice(2) + idxHex;
    var I = ethers.utils.computeHmac(ethers.utils.SupportedAlgorithm.sha512, parent.chainCode, data);
    var IL = I.slice(0, 66);

    var n = BigInt(SECP256K1_N);
    var recovered = ((BigInt(child.privateKey) - (BigInt(IL) % n)) % n + n) % n;
    out.recoveredParentPrivateKeyHex = "0x" + recovered.toString(16).padStart(64, "0");
    out.matchesRealParent = out.recoveredParentPrivateKeyHex.toLowerCase() === parent.privateKey.toLowerCase();
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
  }
  return out;
}

/* Renders whichever of the four access-scope panels is currently selected.
 * scope is one of "words", "words-pass", "xpub", "xpub-child". */
function learnRenderAccessScope(hostEl, scope, ctx) {
  if (!hostEl) return;
  hostEl.textContent = "";

  function para(text, color) {
    var p = document.createElement("p");
    p.className = "hint";
    p.style.marginBottom = "0";
    if (color) p.style.color = color;
    p.textContent = text;
    hostEl.appendChild(p);
  }

  if (scope === "words") {
    para("Full control. These 12 words alone compute the master key, and from it every private key on " +
      "every chain this tool supports, at any path. Whoever has them can derive and spend everything, " +
      "instantly, forever - there is nothing else standing between these words and every address they touch.");
    learnRenderKeyValueRow(hostEl, "Master private key, derived from the words alone",
      ctx.masterKeyBreakdown ? ctx.masterKeyBreakdown.masterPrivateKeyHex : null, { color: "var(--error)" });
    return;
  }

  if (scope === "words-pass") {
    para("Two separate secrets now. The words alone reach a different, unfunded wallet; only words + the " +
      "exact passphrase reach this one. See the passphrase demo above step 1 for this computed live. One " +
      "real caveat: the passphrase alone is protected by only 2048 rounds of PBKDF2, which is fast to " +
      "brute-force if the words ever leak and the passphrase is short or guessable.");
    return;
  }

  if (scope === "xpub") {
    var x = ctx.xpubOnly;
    if (!x || x.error) { para("Could not compute."); return; }
    learnRenderKeyValueRow(hostEl, "Account xpub (account 0)", x.xpub, { small: true });
    x.addresses.forEach(function (a) {
      learnRenderKeyValueRow(hostEl, a.path + (a.hasPrivateKey ? " (has private key!)" : " (no private key present)"),
        a.address, { small: true, color: "var(--accent)" });
    });
    para("Computed from the xpub alone: every receiving address in this account, with no private key " +
      "anywhere in the computation. This can watch a balance. It cannot sign a single transaction.",
      "var(--success)");
    return;
  }

  if (scope === "xpub-child") {
    var r = ctx.parentRecovery;
    if (!r || r.error) { para("Could not compute."); return; }
    learnRenderKeyValueRow(hostEl, "Account xpub (public, safe to share, or so it seems)", r.parentXpub, { small: true });
    learnRenderKeyValueRow(hostEl, "One leaked child private key (" + r.childPath + ")", r.childPrivateKeyHex,
      { small: true, color: "var(--error)" });
    learnRenderKeyValueRow(hostEl, "Recovered parent private key, from the two rows above and nothing else",
      r.recoveredParentPrivateKeyHex, { color: "var(--error)" });
    para(r.matchesRealParent
      ? "That recovered key is the real parent private key, confirmed live against this seed's actual " +
        "derivation. Every other address under this xpub is now exposed too, hardened children included, " +
        "because they all derive from the same parent key this just recovered."
      : "Recovery did not match; this should not happen and would indicate a bug.",
      r.matchesRealParent ? "var(--error)" : "var(--text-muted)");
    return;
  }
}

/* W3: same seed, same Bitcoin account, two different wallet-default purposes.
 * Reuses formatUtxoAddressPure exactly as step 5 does; the only thing that
 * differs between the two calls is the purpose argument. */
function learnWalletMismatchDemo(mnemonic, passphrase) {
  var out = { legacy: null, native: null, error: null };
  if (typeof ethers === "undefined") { out.error = "ethers not loaded"; return out; }
  try {
    var root = ethers.utils.HDNode.fromMnemonic(mnemonic, passphrase || "");
    var legacyPriv = root.derivePath("m/44'/0'/0'/0/0").privateKey;
    var nativePriv = root.derivePath("m/84'/0'/0'/0/0").privateKey;
    out.legacy = formatUtxoAddressPure(legacyPriv, 0, 44);
    out.native = formatUtxoAddressPure(nativePriv, 0, 84);
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
  }
  return out;
}

function learnRenderWalletMismatch(hostEl, demo) {
  if (!hostEl) return;
  hostEl.textContent = "";
  if (demo.error || !demo.legacy || !demo.native) {
    var err = document.createElement("p");
    err.className = "hint";
    err.textContent = "Could not compute.";
    hostEl.appendChild(err);
    return;
  }
  var grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "1fr 1fr";
  grid.style.gap = "10px";
  [
    { title: "\"Wallet A\": Legacy default (purpose 44)", path: "m/44'/0'/0'/0/0", address: demo.legacy.address },
    { title: "\"Wallet B\": Native SegWit default (purpose 84)", path: "m/84'/0'/0'/0/0", address: demo.native.address }
  ].forEach(function (w) {
    var box = document.createElement("div");
    box.style.padding = "8px 10px";
    box.style.background = "var(--code-bg)";
    box.style.border = "1px solid var(--border)";
    box.style.borderRadius = "var(--radius-sm)";
    var title = document.createElement("div");
    title.style.fontWeight = "700";
    title.style.fontSize = "11px";
    title.style.marginBottom = "4px";
    title.textContent = w.title;
    box.appendChild(title);
    var path = document.createElement("div");
    path.style.fontFamily = "var(--mono)";
    path.style.fontSize = "10px";
    path.style.color = "var(--text-muted)";
    path.style.marginBottom = "3px";
    path.textContent = w.path;
    box.appendChild(path);
    var addr = document.createElement("div");
    addr.style.fontFamily = "var(--mono)";
    addr.style.fontSize = "11px";
    addr.style.wordBreak = "break-all";
    addr.textContent = w.address;
    box.appendChild(addr);
    grid.appendChild(box);
  });
  hostEl.appendChild(grid);

  var note = document.createElement("p");
  note.className = "hint";
  note.style.marginTop = "8px";
  note.style.marginBottom = "0";
  note.textContent = "Send BTC to the first address, restore the same 12 words in a wallet defaulting to " +
    "the second, and it will show a zero balance. The funds are not lost. They are one purpose byte away, " +
    "recoverable by entering the correct path or trying the other preset on the Derive tab.";
  hostEl.appendChild(note);
}

/* ══════════════════════════════════════════════════════════════════════
 * Tier 3 teaching additions. Everything below is presentation layered on
 * the same public calls the rest of the tool makes; none of it reimplements
 * derivation. Pure helpers come first so run-vectors.js can pin them.
 * ══════════════════════════════════════════════════════════════════════ */

/* ---- 3b. Bit-flip explorer: pure helpers ---- */

function learnBytesToBits(bytes) {
  var bits = [];
  for (var i = 0; i < bytes.length * 8; i++) {
    bits.push((bytes[Math.floor(i / 8)] >> (7 - (i % 8))) & 1);
  }
  return bits;
}

function learnBitsToBytes(bits) {
  var out = new Uint8Array(Math.ceil(bits.length / 8));
  for (var i = 0; i < bits.length; i++) {
    if (bits[i]) out[Math.floor(i / 8)] |= (0x80 >> (i % 8));
  }
  return out;
}

function learnWordAtIndex(lang, idx) {
  var wl = getWordlist(lang);
  if (!wl) return null;
  if (typeof wl.getWord === "function") return wl.getWord(idx);
  if (typeof wl.get === "function") return wl.get(idx);
  return null;
}

/* Re-derive a VALID phrase from mutated entropy bits. BIP39 recomputes the
 * checksum itself, which is exactly the behaviour being demonstrated: the
 * checksum is a function of the entropy, so change one bit and the last word
 * changes with it. */
function learnPhraseFromEntropyBits(bits, lang) {
  var wl = getWordlist(lang);
  return ethers.utils.entropyToMnemonic(learnBitsToBytes(bits), wl);
}

/* Build a phrase from a full entropy+checksum bitstring WITHOUT recomputing
 * the checksum. If only checksum bits were tampered with, the phrase will be
 * a perfectly real-looking set of words that fails validation. */
function learnPhraseFromFullBits(bits, lang) {
  var words = [];
  for (var i = 0; i + 11 <= bits.length; i += 11) {
    var idx = 0;
    for (var b = 0; b < 11; b++) idx = idx * 2 + (bits[i + b] ? 1 : 0);
    words.push(learnWordAtIndex(lang, idx));
  }
  return words.join(" ");
}

/* ---- 3b. Bit-flip explorer: state and renderer ----
 *
 * The explorer is a playground COPY of the loaded seed's entropy. Flipping
 * bits never touches the mnemonic input; the state re-seeds whenever the
 * underlying seed's entropy changes. Clicking an entropy bit re-derives a new
 * valid phrase (watch the last word move); clicking a checksum bit keeps the
 * entropy but corrupts the stored checksum, so the phrase fails validation. */
var learnBitExplorerState = null;

function learnBitExplorerSeedState(breakdown) {
  var bits = [];
  for (var i = 0; i < breakdown.words.length; i++) {
    var bin = breakdown.words[i].binary;
    if (!bin) return null;
    for (var b = 0; b < bin.length; b++) bits.push(bin.charAt(b) === "1" ? 1 : 0);
  }
  return {
    sourceEntropyHex: breakdown.entropyHex,
    entropy: bits.slice(0, breakdown.entropyBits),
    checksum: bits.slice(breakdown.entropyBits),
    entropyBits: breakdown.entropyBits,
    originalWords: breakdown.words.map(function (w) { return w.word; })
  };
}

function learnRenderBitExplorer(hostEl, breakdown, lang) {
  if (typeof document === "undefined") return;
  if (!hostEl) return;
  lang = lang || "en";
  if (!breakdown || !breakdown.valid) {
    hostEl.textContent = "";
    learnBitExplorerState = null;
    return;
  }
  if (!learnBitExplorerState || learnBitExplorerState.sourceEntropyHex !== breakdown.entropyHex) {
    learnBitExplorerState = learnBitExplorerSeedState(breakdown);
    if (!learnBitExplorerState) { hostEl.textContent = ""; return; }
  }
  var st = learnBitExplorerState;

  var full = st.entropy.concat(st.checksum);
  var wl = getWordlist(lang);
  var phrase = learnPhraseFromFullBits(full, lang);
  var valid = false;
  try { valid = ethers.utils.isValidMnemonic(phrase, wl); } catch (e) { valid = false; }
  var words = phrase.split(" ");

  hostEl.textContent = "";

  var intro = document.createElement("p");
  intro.className = "hint";
  intro.style.marginBottom = "8px";
  intro.textContent = "This is a scratch copy of " + (breakdown.usedFallback ? "the example seed" : "your seed") +
    " - flipping bits here never touches the real one. Click any bit: entropy bits re-derive a brand new valid phrase " +
    "(watch which words move), checksum bits corrupt the phrase so it fails validation.";
  hostEl.appendChild(intro);

  var badge = document.createElement("div");
  badge.className = valid ? "bit-valid-badge" : "bit-invalid-badge";
  badge.textContent = valid
    ? "Checksum passes - this bitstring is a valid " + words.length + "-word phrase"
    : "Checksum FAILS - real words, but the phrase is not a valid seed";
  hostEl.appendChild(badge);

  var grid = document.createElement("div");
  grid.className = "bit-grid";
  for (var w = 0; w < words.length; w++) {
    var row = document.createElement("div");
    row.className = "bit-row";
    if (words[w] !== st.originalWords[w]) row.className += " bit-row-changed";
    var num = document.createElement("span");
    num.className = "bit-word-num";
    num.textContent = String(w + 1);
    row.appendChild(num);
    var wordEl = document.createElement("span");
    wordEl.className = "bit-word";
    wordEl.textContent = words[w];
    row.appendChild(wordEl);
    for (var b = 0; b < 11; b++) {
      (function (pos, isChecksum, value) {
        var cell = document.createElement("button");
        cell.type = "button";
        cell.className = "bit-cell" + (isChecksum ? " bit-cell-checksum" : "") + (value ? " bit-cell-on" : "");
        cell.textContent = value ? "1" : "0";
        cell.setAttribute("aria-label", (isChecksum ? "checksum" : "entropy") + " bit " + (pos + 1) + ", value " + value + ". Click to flip.");
        cell.addEventListener("click", function () {
          if (pos < st.entropyBits) {
            st.entropy[pos] = st.entropy[pos] ? 0 : 1;
            /* Re-derive the valid phrase for the mutated entropy and adopt its
             * recomputed checksum bits, so the checksum cells move with it. */
            var newPhrase = learnPhraseFromEntropyBits(st.entropy, lang);
            var newWords = newPhrase.split(" ");
            var lastIdx = (typeof wl.getWordIndex === "function") ? wl.getWordIndex(newWords[newWords.length - 1]) : -1;
            if (lastIdx >= 0) {
              var bin = learnBinary11(lastIdx);
              for (var c = 0; c < st.checksum.length; c++) {
                st.checksum[c] = bin.charAt(bin.length - st.checksum.length + c) === "1" ? 1 : 0;
              }
            }
          } else {
            var ci = pos - st.entropyBits;
            st.checksum[ci] = st.checksum[ci] ? 0 : 1;
          }
          learnRenderBitExplorer(hostEl, breakdown, lang);
        });
        row.appendChild(cell);
      })(w * 11 + b, w * 11 + b >= st.entropyBits, full[w * 11 + b] ? true : false);
    }
    grid.appendChild(row);
  }
  hostEl.appendChild(grid);

  var legend = document.createElement("p");
  legend.className = "hint";
  legend.style.marginTop = "8px";
  legend.style.marginBottom = "8px";
  legend.textContent = "Blue cells are entropy (the actual data). Accent cells at the end of the last word are checksum (derived from the entropy). " +
    "Changed words are highlighted.";
  hostEl.appendChild(legend);

  var controls = document.createElement("div");
  controls.className = "action-buttons";
  var resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "btn-secondary";
  resetBtn.textContent = "Reset to the loaded seed";
  resetBtn.addEventListener("click", function () {
    learnBitExplorerState = learnBitExplorerSeedState(breakdown);
    learnRenderBitExplorer(hostEl, breakdown, lang);
  });
  controls.appendChild(resetBtn);
  var breakBtn = document.createElement("button");
  breakBtn.type = "button";
  breakBtn.className = "btn-secondary";
  breakBtn.textContent = "Break the checksum";
  breakBtn.addEventListener("click", function () {
    st.checksum[0] = st.checksum[0] ? 0 : 1;
    learnRenderBitExplorer(hostEl, breakdown, lang);
  });
  controls.appendChild(breakBtn);
  hostEl.appendChild(controls);
}

/* ---- 3g. Live verification badges ----
 *
 * Transparency: the tool does not ask to be trusted, it recomputes the
 * official BIP39/BIP32/BIP44/BIP84 test vectors in the reader's browser and
 * shows the verdict. Any red row means this copy of the page is broken or
 * tampered with and must not be trusted. */
function learnVerifyVectors() {
  var out = [];
  if (typeof ethers === "undefined") return out;
  var MN = LEARN_FALLBACK_MNEMONIC;
  try {
    var mk = learnMasterKeyBreakdown(MN, "");
    out.push({
      label: "BIP39 PBKDF2 seed of abandon...about (2048 rounds)",
      expect: "0x5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4",
      got: mk.seedHex
    });
    out.push({
      label: "BIP32 master private key",
      expect: "0x1837c1be8e2995ec11cda2b066151be2cfb48adf9e47b151d46adab3a21cdf67",
      got: mk.masterPrivateKeyHex
    });
    out.push({
      label: "BIP32 master chain code",
      expect: "0x7923408dadd3c7b56eed15567707ae5e5dca089de972e07f3b860450e2a3b70e",
      got: mk.chainCodeHex
    });
    var pipe = learnAddressPipeline(MN, "");
    out.push({
      label: "BIP44 EVM address m/44'/60'/0'/0/0",
      expect: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94",
      got: pipe.evm && pipe.evm.address
    });
    out.push({
      label: "BIP84 Bitcoin native segwit m/84'/0'/0'/0/0",
      expect: "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu",
      got: pipe.btc && pipe.btc.address
    });
  } catch (e) {
    out.push({ label: "verification runner", expect: "ran without throwing", got: String((e && e.message) || e) });
  }
  out.forEach(function (r) { r.pass = String(r.expect) === String(r.got); });
  return out;
}

function learnRenderVerifyBadges(hostEl, checks) {
  if (typeof document === "undefined") return;
  if (!hostEl) return;
  hostEl.textContent = "";
  checks.forEach(function (c) {
    var row = document.createElement("div");
    row.className = "verify-row " + (c.pass ? "verify-ok" : "verify-bad");
    var mark = document.createElement("span");
    mark.className = "verify-mark";
    mark.textContent = c.pass ? "PASS" : "FAIL";
    row.appendChild(mark);
    var label = document.createElement("span");
    label.className = "verify-label";
    label.textContent = c.label;
    row.appendChild(label);
    if (!c.pass) {
      var got = document.createElement("span");
      got.className = "verify-got";
      got.style.fontFamily = "var(--mono)";
      got.style.fontSize = "10px";
      got.style.wordBreak = "break-all";
      got.textContent = "got " + c.got;
      row.appendChild(got);
    }
    hostEl.appendChild(row);
  });
}

/* ---- 3h. Wordlist explorer ---- */

function learnWordlistStats(lang) {
  var arr = getWordlistArray(lang);
  if (!arr) return null;
  var seen = {};
  var unique4 = true;
  for (var i = 0; i < arr.length; i++) {
    var p = String(arr[i]).slice(0, 4);
    if (seen[p]) { unique4 = false; break; }
    seen[p] = true;
  }
  return { count: arr.length, firstFourUnique: unique4 };
}

/* Prefix matches first, then contains matches, capped at limit. */
function learnWordlistSearchMatches(arr, query, limit) {
  var q = String(query || "").toLowerCase();
  var matches = [];
  var contains = [];
  if (!q) {
    for (var i = 0; i < arr.length && i < limit; i++) matches.push(arr[i]);
    return { matches: matches, total: arr.length };
  }
  for (var j = 0; j < arr.length; j++) {
    var w = String(arr[j]);
    if (w.indexOf(q) === 0) matches.push(w);
    else if (w.indexOf(q) !== -1) contains.push(w);
    if (matches.length >= limit) break;
  }
  matches = matches.concat(contains).slice(0, limit);
  return { matches: matches, total: matches.length };
}

function learnRenderWordlistExplorer(hostEl, lang, query) {
  if (typeof document === "undefined") return;
  if (!hostEl) return;
  var arr = getWordlistArray(lang);
  hostEl.textContent = "";
  if (!arr) {
    var p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Wordlist not available.";
    hostEl.appendChild(p);
    return;
  }
  var stats = learnWordlistStats(lang);
  var statsLine = document.createElement("p");
  statsLine.className = "hint";
  statsLine.style.marginBottom = "6px";
  statsLine.textContent = arr.length + " words in this list. " +
    (stats && stats.firstFourUnique
      ? "Verified just now: no two of them share their first four letters, so typing four letters is always enough to name one."
      : "First-four-letter uniqueness could not be verified for this list.");
  hostEl.appendChild(statsLine);

  var res = learnWordlistSearchMatches(arr, query, 48);
  var countLine = document.createElement("p");
  countLine.className = "hint";
  countLine.style.marginBottom = "6px";
  countLine.textContent = query
    ? "Showing " + res.total + " matching word" + (res.total === 1 ? "" : "s") + " for \"" + query + "\" (first 48)."
    : "First " + res.matches.length + " words:";
  hostEl.appendChild(countLine);

  var grid = document.createElement("div");
  grid.className = "wordlist-grid";
  res.matches.forEach(function (w, i) {
    var chip = document.createElement("span");
    chip.className = "wordlist-chip";
    chip.textContent = (i + 1) + " " + w;
    grid.appendChild(chip);
  });
  hostEl.appendChild(grid);
}
