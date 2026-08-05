

/* SLIP-0010 hierarchical key derivation for Ed25519.
 *
 * Used by Solana, Sui and Aptos. Ed25519 has no public parent to public child
 * derivation, so SLIP-0010 defines hardened children only: every path segment
 * must end in ' or h. That is why those chains cannot offer xpub style
 * watch-only accounts.
 *
 * This replaces ed25519-hd-key and its ten transitive Node shim packages
 * (safe-buffer, cipher-base, hash-base, create-hmac, create-hash, sha.js,
 * ripemd160, inherits twice, tweetnacl). That whole graph existed to provide
 * HMAC-SHA512 through a Node shaped API, carrying a Buffer polyfill to reach a
 * function ethers 5.7.2 already ships. Removing it also removed the last
 * dynamic import() in the codebase, which is what blocked Solana, Sui and
 * Aptos from working on a file:// origin.
 *
 * Verified against both published SLIP-0010 ed25519 test vectors, every level.
 * See test/vectors.js. */

var SLIP10_ED25519_CURVE = "ed25519 seed";

function slip10Hmac512(keyBytes, dataBytes) {
  return ethers.utils.arrayify(ethers.utils.computeHmac("sha512", keyBytes, dataBytes));
}

/* Parse an all-hardened path into 32-bit indices with the hardened bit set. */
function slip10ParsePath(path) {
  var raw = String(path == null ? "" : path).trim();
  var segments = raw.replace(/^m\/?/i, "").split("/");
  var indices = [];
  for (var i = 0; i < segments.length; i++) {
    var seg = segments[i];
    if (seg === "") continue;
    if (!/^\d+['h]$/i.test(seg)) {
      /* main.js matches /invalid derivation path/i against this text to show
       * the friendly "all segments must be hardened" hint. Keep that wording. */
      throw new Error(
        "Invalid derivation path for SLIP-0010 (Ed25519): segment \"" + seg +
        "\" is not hardened. Every segment must end with ' or h, for example 0'."
      );
    }
    var n = parseInt(seg.replace(/['h]/gi, ""), 10);
    if (!isFinite(n) || n < 0 || n >= 0x80000000) {
      throw new Error(
        "Invalid derivation path: index out of range in segment \"" + seg + "\"."
      );
    }
    indices.push((n + 0x80000000) >>> 0);
  }
  return indices;
}

/* Master node: I = HMAC-SHA512("ed25519 seed", seed), key = I[0..32], chain code = I[32..64]. */
function slip10MasterEd25519(seedBytes) {
  var I = slip10Hmac512(ethers.utils.toUtf8Bytes(SLIP10_ED25519_CURVE), seedBytes);
  return { key: I.slice(0, 32), chainCode: I.slice(32) };
}

/* Hardened child: I = HMAC-SHA512(c_par, 0x00 || k_par || ser32(i)). */
function slip10ChildEd25519(key, chainCode, index) {
  var data = new Uint8Array(37);
  data[0] = 0x00;
  data.set(key, 1);
  data[33] = (index >>> 24) & 255;
  data[34] = (index >>> 16) & 255;
  data[35] = (index >>> 8) & 255;
  data[36] = index & 255;
  var I = slip10Hmac512(chainCode, data);
  return { key: I.slice(0, 32), chainCode: I.slice(32) };
}

/* Walk a full path. Returns {key, chainCode}, both 32-byte Uint8Array. */
function slip10DeriveEd25519(seedBytes, path) {
  var node = slip10MasterEd25519(seedBytes);
  var indices = slip10ParsePath(path);
  for (var i = 0; i < indices.length; i++) {
    node = slip10ChildEd25519(node.key, node.chainCode, indices[i]);
  }
  return node;
}
