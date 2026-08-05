/* There used to be diceToBytes and coinToBytes here, packing each roll into a
 * fixed 3 bits. They had no callers: the live path hashes the typed characters
 * instead, which is both simpler and unbiased. The packing was worth removing
 * rather than leaving around, because mapping 1..6 onto 3 bits leaves the
 * patterns 110 and 111 unreachable, so it threw away 3 - log2(6) = 0.415 bits
 * per roll and produced a non-uniform bit stream. */

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

/* Total randomness the typed input carries. The two sources are independent so
 * their bits add. Flooring each separately under-counts slightly, which errs on
 * the safe side. */
function entropyBitsCollected(diceInput, coinInput) {
  return bitsCollectedFromDice(diceInput) + bitsCollectedFromCoins(coinInput);
}

/* One die roll carries log2(6) = 2.585 bits, one coin flip carries exactly 1.
 * These land on the numbers the project spec always intended: 50 rolls or 128
 * flips for a 12-word phrase, 100 rolls or 256 flips for 24 words. */
function minRollsForWords(wordCount) {
  return Math.ceil(bitsNeededForWords(wordCount) / 2.585);
}

function minFlipsForWords(wordCount) {
  return bitsNeededForWords(wordCount);
}

/* Returns null when the input carries enough randomness, or a user-facing
 * message when it does not. Shared by the hard gate below and by the live UI
 * hint in main.js so the rule is stated in exactly one place. */
function entropyShortfallMessage(diceInput, coinInput, wordCount) {
  var have = entropyBitsCollected(diceInput, coinInput);
  var need = bitsNeededForWords(wordCount);
  if (have >= need) return null;
  return "Not enough randomness yet. A " + wordCount + "-word phrase claims " + need +
    " bits and you have about " + have + ". That is " + minRollsForWords(wordCount) +
    " dice rolls, or " + minFlipsForWords(wordCount) + " coin flips, or any mix adding up to " +
    need + " bits.";
}

/* Turn typed dice and coin input into a BIP39 phrase.
 *
 * opts.deterministic  reproducible mode: the seed is a pure function of what
 *                     you typed, so the same rolls always give the same phrase.
 *                     Verifiable by hand, but capped by the dice alone.
 * opts.saltHex        explicit 32-byte salt, used to re-create a mixed-mode
 *                     seed from a written-down (rolls + salt) pair.
 * opts.allowLowEntropy  skip the gate. Demo mode only.
 *
 * DEFAULT IS MIXED. 32 fresh CSPRNG bytes join the pool, so the result is never
 * weaker than the better of your dice and the browser CSPRNG. Under the random
 * oracle assumption, if any one input is unpredictable the digest is
 * unpredictable, even if an attacker chose every other input. That means bad
 * dice cannot weaken the result, and a tampered CSPRNG cannot either.
 *
 * The cost is that mixed mode is not reproducible from the rolls alone, which
 * matters if someone writes their rolls down as a backup. That is why the salt
 * is returned and shown: (rolls + salt) still reproduces the seed exactly. */
function entropyToMnemonic(diceInput, coinInput, wordCount, lang, opts) {
  opts = opts || {};
  if (typeof ethers === "undefined") {
    throw new Error("ethers library is not loaded.");
  }
  var dice = String(diceInput || "").replace(/\s+/g, "");
  var coins = String(coinInput || "").replace(/\s+/g, "").toUpperCase();
  if (!/^[1-6]*$/.test(dice)) throw new Error("Dice input may only contain digits 1 through 6.");
  if (!/^[HT]*$/.test(coins)) throw new Error("Coin input may only contain H or T.");
  if (!dice && !coins) {
    throw new Error("No entropy provided. Roll dice or flip coins first.");
  }

  /* Never mint a phrase backed by less randomness than it advertises. SHA-256
   * spreads whatever it is given across 128 or 256 bits, but it cannot create
   * bits that were not there: two dice rolls hashed into 24 words is still a
   * 36-guess secret wearing a 256-bit costume. */
  var shortfall = entropyShortfallMessage(dice, coins, wordCount);
  if (shortfall && !opts.allowLowEntropy) {
    throw new Error(shortfall);
  }

  /* Each part is tagged so the dice string "12" cannot collide with coins "TT"
   * plus dice "12". R is the CSPRNG salt, tagged the same way. */
  var saltHex = null;
  if (!opts.deterministic) {
    if (opts.saltHex) {
      if (!/^[0-9a-fA-F]{64}$/.test(String(opts.saltHex).replace(/^0x/, ""))) {
        throw new Error("Salt must be 64 hex characters (32 bytes).");
      }
      saltHex = String(opts.saltHex).replace(/^0x/, "").toLowerCase();
    } else {
      if (!secureRandomAvailable()) {
        throw new Error(
          "This browser has no crypto.getRandomValues, so the browser randomness cannot be " +
          "mixed in. Tick reproducible mode to use your rolls alone."
        );
      }
      var salt = new Uint8Array(32);
      crypto.getRandomValues(salt);
      saltHex = "";
      for (var s = 0; s < salt.length; s++) saltHex += ("0" + salt[s].toString(16)).slice(-2);
    }
  }

  var parts = [];
  if (dice) parts.push("D" + dice);
  if (coins) parts.push("C" + coins);
  if (saltHex) parts.push("R" + saltHex);
  var poolStr = parts.join("|");

  /* ethers.utils.sha256 rather than crypto.subtle.digest: same algorithm, but
   * synchronous and with no secure-context requirement, so the entropy lab now
   * works from a file:// origin. */
  var fullHash = ethers.utils.arrayify(ethers.utils.sha256(ethers.utils.toUtf8Bytes(poolStr)));

  var needBits = bitsNeededForWords(wordCount);
  var needBytes = needBits / 8;
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
  return {
    phrase: phrase,
    bitsUsed: needBits,
    wordCount: wordCount,
    saltHex: saltHex,
    deterministic: !!opts.deterministic,
    lowEntropy: !!shortfall
  };
}

function entropyProgressHtml(bitsCollected, bitsNeeded) {
  var pct = bitsNeeded > 0 ? Math.floor((bitsCollected / bitsNeeded) * 100) : 0;
  return "Bits: " + bitsCollected + " / " + bitsNeeded + " (" + pct + "%)";
}