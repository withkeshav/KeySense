if (typeof ethers === "undefined") {
  console.error("bip39-helper requires ethers.js");
}

function getWordlist(lang) {
  if (typeof ethers === "undefined" || !ethers.wordlists) return null;
  var wl = ethers.wordlists[lang] || ethers.wordlists.en;
  return wl || null;
}

function getWordlistArray(lang) {
  var wl = getWordlist(lang);
  if (!wl) return null;
  if (wl.words && wl.words.length) return wl.words;
  var arr = [];
  for (var i = 0; i < 2048; i++) {
    var w = null;
    if (typeof wl.getWord === "function") w = wl.getWord(i);
    else if (typeof wl.get === "function") w = wl.get(i);
    if (w == null) break;
    arr.push(w);
  }
  return arr.length ? arr : null;
}

function wordIndexInWordlist(word, wl) {
  if (!wl) return -1;
  var cmp = String(word).toLowerCase();
  if (typeof wl.getWordIndex === "function") {
    var idx = wl.getWordIndex(cmp);
    if (idx >= 0) return idx;
    idx = wl.getWordIndex(word);
    if (idx >= 0) return idx;
    return -1;
  }
  var arr = getWordlistArray(wl.locale);
  if (!arr) return -1;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] && arr[i].toLowerCase() === cmp) return i;
  }
  return -1;
}

function levenshtein(a, b) {
  if (a == null) a = "";
  if (b == null) b = "";
  a = String(a);
  b = String(b);
  var al = a.length;
  var bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  var prev = [];
  var curr = [];
  for (var j = 0; j <= bl; j++) prev[j] = j;
  for (var i = 1; i <= al; i++) {
    curr[0] = i;
    for (var j = 1; j <= bl; j++) {
      var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      var del = prev[j] + 1;
      var ins = curr[j - 1] + 1;
      var sub = prev[j - 1] + cost;
      var m = del < ins ? del : ins;
      curr[j] = m < sub ? m : sub;
    }
    var tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[bl];
}

function suggestWord(input, lang) {
  if (input == null) return [];
  var inLower = String(input).toLowerCase();
  var arr = getWordlistArray(lang);
  if (!arr) return [];
  for (var k = 0; k < arr.length; k++) {
    if (arr[k] && arr[k].toLowerCase() === inLower) {
      return [{ word: String(input), distance: 0 }];
    }
  }
  var scored = [];
  for (var i = 0; i < arr.length; i++) {
    var w = arr[i];
    if (!w) continue;
    var d = levenshtein(inLower, String(w).toLowerCase());
    scored.push({ word: w, distance: d });
  }
  scored.sort(function(x, y) {
    if (x.distance !== y.distance) return x.distance - y.distance;
    return x.word < y.word ? -1 : (x.word > y.word ? 1 : 0);
  });
  return scored.slice(0, 3);
}

function suggestMnemonicFixes(mnemonic, lang) {
  var result = { isValid: false, badWordIndices: [], suggestions: [], checksumOnly: false };
  if (typeof ethers === "undefined") return result;
  if (mnemonic == null || String(mnemonic).trim() === "") return result;
  var wl = getWordlist(lang);
  var words = String(mnemonic).trim().toLowerCase().split(/\s+/);
  if (!ethers.utils || typeof ethers.utils.isValidMnemonic !== "function") return result;
  var valid = ethers.utils.isValidMnemonic(words.join(" "), wl);
  var badIndices = [];
  var sugg = [];
  if (!valid) {
    for (var i = 0; i < words.length; i++) {
      if (wordIndexInWordlist(words[i], wl) < 0) {
        badIndices.push(i);
        var cands = suggestWord(words[i], lang);
        sugg.push({ index: i, original: words[i], candidates: cands });
      }
    }
  }
  result.isValid = valid;
  result.badWordIndices = badIndices;
  result.suggestions = sugg;
  if (!valid && badIndices.length === 0) {
    result.checksumOnly = true;
  }
  return result;
}

function findValidNthWords(prefixWordsStr, lang, totalWords) {
  if (typeof ethers === "undefined") {
    return { error: "ethers.js is not loaded" };
  }
  if (!ethers.utils || typeof ethers.utils.mnemonicToEntropy !== "function") {
    return { error: "ethers.utils.mnemonicToEntropy is not available" };
  }
  if (prefixWordsStr == null || String(prefixWordsStr).trim() === "") {
    return { error: "No words provided" };
  }
  var wl = getWordlist(lang);
  if (!wl) {
    return { error: "No wordlist available for language: " + lang };
  }
  var prefix = String(prefixWordsStr).trim().toLowerCase().split(/\s+/);
  var needed = totalWords - 1;
  if (prefix.length !== needed) {
    return { error: "Expected " + needed + " words, got " + prefix.length };
  }
  for (var i = 0; i < prefix.length; i++) {
    if (wordIndexInWordlist(prefix[i], wl) < 0) {
      return { error: "Invalid word at position " + (i + 1) + ": " + prefix[i] };
    }
  }
  var arr = getWordlistArray(lang);
  if (!arr) {
    return { error: "Could not load wordlist array for language: " + lang };
  }
  var base = prefix.join(" ");
  var validWords = [];
  for (var c = 0; c < arr.length; c++) {
    var candidate = arr[c];
    if (!candidate) continue;
    var phrase = base + " " + candidate;
    var ok = false;
    try {
      ethers.utils.mnemonicToEntropy(phrase, wl);
      ok = true;
    } catch (e) {
      ok = false;
    }
    if (ok) validWords.push(candidate);
  }
  var firstFew = [];
  var lim = validWords.length < 8 ? validWords.length : 8;
  for (var f = 0; f < lim; f++) firstFew.push(validWords[f]);
  return {
    validCount: validWords.length,
    validWords: validWords,
    firstFew: firstFew
  };
}

function findValid12thWords(first11Words, lang) {
  return findValidNthWords(first11Words, lang, 12);
}

function findValid24thWords(first23Words, lang) {
  return findValidNthWords(first23Words, lang, 24);
}