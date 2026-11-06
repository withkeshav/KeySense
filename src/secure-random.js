

/* Cryptographically secure randomness.
 *
 * Anything produced here can end up inside a seed phrase, so this module uses
 * crypto.getRandomValues only and has no Math.random fallback. A weak source
 * must fail loudly rather than quietly hand back guessable key material.
 *
 * For reference on why Math.random is not acceptable here: V8 implements it as
 * xorshift128+, which is fast but not a CSPRNG. Its 128-bit internal state can
 * be recovered from a short run of outputs, so an attacker who sees part of a
 * sequence can reproduce the rest of it.
 *
 * crypto.getRandomValues is available in insecure contexts and on file://,
 * unlike crypto.subtle, so nothing here narrows where the tool works. */

var SECURE_RANDOM_UNAVAILABLE_MSG =
  "This browser does not expose crypto.getRandomValues, so the simulated roll " +
  "buttons are turned off. Type your own dice rolls or coin flips instead.";

function secureRandomAvailable() {
  return typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function";
}

/* One uniform byte 0..255 from the platform CSPRNG. */
function secureRandomByte() {
  requireSecureRandom();
  var buf = new Uint8Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

/* Uniform integer in [0, max) for max <= 256, by rejection sampling.
 *
 * 256 is not a multiple of 6, so a plain "byte % 6" would return 0..3 with
 * probability 43/256 each and 4..5 with probability 42/256 each, making faces
 * 1 through 4 come up about 2.4% more often than 5 and 6. We take the largest
 * multiple of max that fits in a byte (252 when max is 6), discard any byte at
 * or above it, and draw again. That removes the bias completely. A die
 * discards 4 bytes in 256, so this costs about 1.016 draws per roll. */
function secureRandomBelow(max) {
  if (typeof max !== "number" || max < 1 || max > 256 || max !== Math.floor(max)) {
    throw new Error("secureRandomBelow needs a whole number max between 1 and 256.");
  }
  var limit = 256 - (256 % max);
  for (var tries = 0; tries < 1000; tries++) {
    var b = secureRandomByte();
    if (b < limit) return b % max;
  }
  /* Unreachable in practice: for a die this is (4/256)^1000. */
  throw new Error("Secure random generation failed after 1000 attempts.");
}

/* Uniform die face as a string, "1" through "6". */
function secureDieFace() {
  return String(1 + secureRandomBelow(6));
}

/* Uniform coin face, "H" or "T". 256 is even, so the low bit of a uniform byte
 * is already unbiased and needs no rejection step. */
function secureCoinFace() {
  return (secureRandomByte() & 1) ? "H" : "T";
}

/* One-time random-source sanity check. This catches obvious failures, not
 * malicious sources designed to pass it. Generation must consult the cached
 * result; a warning alone is not a safety gate. */
var secureRandomCanaryResult = null;

function secureRandomCanaryCheck() {
  if (secureRandomCanaryResult) return secureRandomCanaryResult;
  if (!secureRandomAvailable()) {
    secureRandomCanaryResult = { ok: false, reason: "crypto.getRandomValues is not available in this browser." };
    return secureRandomCanaryResult;
  }
  var a = new Uint8Array(32);
  var b = new Uint8Array(32);
  try {
    crypto.getRandomValues(a);
    crypto.getRandomValues(b);
  } catch (_) {
    secureRandomCanaryResult = { ok: false, reason: "crypto.getRandomValues failed its sanity check." };
    return secureRandomCanaryResult;
  }
  var identical = true;
  var allZero = true;
  var allSameByte = true;
  var bAllZero = true;
  var bAllSameByte = true;
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) identical = false;
    if (a[i] !== 0) allZero = false;
    if (a[i] !== a[0]) allSameByte = false;
    if (b[i] !== 0) bAllZero = false;
    if (b[i] !== b[0]) bAllSameByte = false;
  }
  if (identical) {
    secureRandomCanaryResult = { ok: false, reason: "Two separate calls to crypto.getRandomValues returned identical output." };
  } else if (allZero || bAllZero) {
    secureRandomCanaryResult = { ok: false, reason: "crypto.getRandomValues returned an all-zero buffer." };
  } else if (allSameByte || bAllSameByte) {
    secureRandomCanaryResult = { ok: false, reason: "crypto.getRandomValues returned a single repeated byte value." };
  } else {
    secureRandomCanaryResult = { ok: true, reason: null };
  }
  return secureRandomCanaryResult;
}

function requireSecureRandom() {
  var result = secureRandomCanaryCheck();
  if (!result.ok) {
    throw new Error("Random generation is blocked. " + result.reason +
      " Use a trusted, up to date browser before generating keys.");
  }
}
