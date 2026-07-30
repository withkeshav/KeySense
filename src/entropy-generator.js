function diceToBytes(rolls) {
  rolls = String(rolls || "").replace(/\s+/g, "");
  if (!/^[1-6]*$/.test(rolls)) {
    throw new Error("Dice input may only contain digits 1 through 6.");
  }
  var bits = [];
  for (var i = 0; i < rolls.length; i++) {
    var val = (parseInt(rolls.charAt(i), 10) - 1) & 0x07;
    for (var b = 2; b >= 0; b--) {
      bits.push((val >> b) & 1);
    }
  }
  var byteCount = Math.ceil(bits.length / 8);
  var bytes = new Uint8Array(byteCount);
  for (var j = 0; j < bits.length; j++) {
    if (bits[j]) {
      bytes[j >> 3] |= (1 << (7 - (j & 7)));
    }
  }
  return { bytes: bytes, bitsCollected: bits.length, bitsNeeded: 256 };
}

function coinToBytes(flips) {
  flips = String(flips || "").replace(/\s+/g, "");
  if (!/^[HhTt]*$/.test(flips)) {
    throw new Error("Coin input may only contain H or T.");
  }
  var bits = [];
  for (var i = 0; i < flips.length; i++) {
    var ch = flips.charAt(i).toUpperCase();
    bits.push(ch === "H" ? 1 : 0);
  }
  var byteCount = Math.ceil(bits.length / 8);
  var bytes = new Uint8Array(byteCount);
  for (var j = 0; j < bits.length; j++) {
    if (bits[j]) {
      bytes[j >> 3] |= (1 << (7 - (j & 7)));
    }
  }
  return { bytes: bytes, bitsCollected: bits.length, bitsNeeded: 256 };
}

function bitsCollectedFromDice(rolls) {
  rolls = String(rolls || "").replace(/\s+/g, "");
  return Math.floor(rolls.length * 2.585);
}

function bitsCollectedFromCoins(flips) {
  flips = String(flips || "").replace(/\s+/g, "");
  return flips.length;
}

function bitsNeededForWords(wordCount) {
  return { 12: 128, 15: 160, 18: 192, 21: 224, 24: 256 }[wordCount] || 128;
}

function bytesNeededForWords(wordCount) {
  return bitsNeededForWords(wordCount) / 8;
}

async function entropyToMnemonic(diceInput, coinInput, wordCount, lang) {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Physical entropy needs HTTPS or localhost - open via a local server, not file://");
  }
  if (typeof ethers === "undefined") {
    throw new Error("ethers library is not loaded.");
  }
  var dice = String(diceInput || "").replace(/\s+/g, "");
  var coins = String(coinInput || "").replace(/\s+/g, "");
  if (!/^[1-6]*$/.test(dice)) throw new Error("Dice input may only contain digits 1 through 6.");
  if (!/^[HhTt]*$/.test(coins)) throw new Error("Coin input may only contain H or T.");
  if (!dice && !coins) {
    throw new Error("No entropy provided. Roll dice or flip coins first.");
  }
  /* Build a single entropy pool from BOTH sources so changing either one
   * always changes the seed. We prefix each source with a short tag so the
   * dice string "12" cannot collide with the coin string "TT" + dice "12".
   * The raw inputs are hashed directly (not bit-packed) - SHA-256 mixes them
   * uniformly regardless of input length, so a single roll and 1000 rolls are
   * both valid; more input just adds more entropy. */
  var tagDice = "D";
  var tagCoin = "C";
  var parts = [];
  if (dice) parts.push(tagDice + dice);
  if (coins) parts.push(tagCoin + coins.toUpperCase());
  var poolStr = parts.join("|");
  var enc = new TextEncoder();
  var poolBytes = enc.encode(poolStr);
  var hashBuffer;
  try {
    hashBuffer = await crypto.subtle.digest("SHA-256", poolBytes);
  } catch (err) {
    throw new Error("Hashing failed: " + (err && err.message ? err.message : String(err)));
  }
  var needBits = bitsNeededForWords(wordCount);
  var needBytes = needBits / 8;
  var fullHash = new Uint8Array(hashBuffer);
  var entropyBytes = new Uint8Array(needBytes);
  for (var i = 0; i < needBytes && i < fullHash.length; i++) {
    entropyBytes[i] = fullHash[i];
  }
  var wordlist = (ethers.wordlists && (ethers.wordlists[lang] || ethers.wordlists.en)) || ethers.wordlists.en;
  var phrase;
  try {
    phrase = ethers.utils.entropyToMnemonic(entropyBytes, wordlist);
  } catch (err) {
    throw new Error("Mnemonic generation failed: " + (err && err.message ? err.message : String(err)));
  }
  return { phrase: phrase, bitsUsed: needBits, wordCount: wordCount };
}

function entropyProgressHtml(bitsCollected, bitsNeeded) {
  var pct = bitsNeeded > 0 ? Math.floor((bitsCollected / bitsNeeded) * 100) : 0;
  return "Bits: " + bitsCollected + " / " + bitsNeeded + " (" + pct + "%)";
}