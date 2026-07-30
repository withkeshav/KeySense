import { HD_HARDENED } from "./constants.js";

/** Path with last two segments removed (BIP44 account-level branch). */
export function branchPathDropLastTwo(path) {
  var parts = path.replace(/^m\//i, "").split("/").filter(Boolean);
  if (parts.length <= 2) return "m";
  return "m/" + parts.slice(0, -2).join("/");
}

/** Infer purpose + coin_type from first two path segments when possible. */
export function inferPurposeCoinFromPath(path) {
  var parts = path.replace(/^m\//i, "").split("/").filter(Boolean);
  if (parts.length < 2) return null;
  var p = parseInt(parts[0].replace(/['h]/gi, ""), 10);
  var c = parseInt(parts[1].replace(/['h]/gi, ""), 10);
  if (isNaN(p) || isNaN(c)) return null;
  return { purpose: p, coinType: c };
}

/** Derive child from an HDNode (from extended key) using a relative path like 0/0 or 0'/0. */
export function deriveFromRelativePath(rootNode, relPath) {
  if (!relPath || !String(relPath).trim()) return rootNode;
  var segs = String(relPath).trim().replace(/^m\//i, "").split("/").filter(Boolean);
  var cur = rootNode;
  for (var i = 0; i < segs.length; i++) {
    var s = segs[i];
    var hardened = /'$/.test(s) || /h$/i.test(s);
    var idx = parseInt(s.replace(/['h]/gi, ""), 10);
    if (isNaN(idx)) throw new Error("Bad path segment: " + s);
    cur = cur.deriveChild(hardened ? idx + HD_HARDENED : idx);
  }
  return cur;
}

export function pathWithLastIndexReplaced(path, newIndex) {
  var parts = path.replace(/^m\//i, "").split("/").filter(Boolean);
  if (parts.length === 0) return path;
  var last = parts[parts.length - 1];
  var hardened = /'$/.test(last) || /h$/i.test(last);
  parts[parts.length - 1] = hardened ? newIndex + "'" : String(newIndex);
  return "m/" + parts.join("/");
}

/** Map dev format dropdown -> coin_type for Step 4 labels / QR. */
export function uiCoinTypeFromDevFmt(devFmt, coinType) {
  if (!devFmt || devFmt === "auto") return coinType;
  if (devFmt === "evm") return 60;
  if (devFmt === "tron") return 195;
  if (devFmt === "sol") return 501;
  if (devFmt === "raw_sec256") return -1;
  if (devFmt.indexOf("btc_") === 0) return 0;
  if (devFmt.indexOf("ltc_") === 0) return 2;
  if (devFmt.indexOf("doge_") === 0) return 3;
  return coinType;
}

export function devUtxoCoinForAllFormats(devFmt, coinType) {
  var u = uiCoinTypeFromDevFmt(devFmt, coinType);
  if (u === 0 || u === 2 || u === 3) return u;
  return null;
}

export function buildPathFromInputs() {
  var purposeEl = document.getElementById("purpose");
  var coinEl = document.getElementById("coinType");
  var accountEl = document.getElementById("account");
  var changeEl = document.getElementById("change");
  var indexEl = document.getElementById("index");
  var purpose = parseInt(purposeEl.value, 10);
  var coinType = parseInt(coinEl.value, 10);
  var account = parseInt(accountEl.value, 10);
  var change = parseInt(changeEl.value, 10);
  var index = parseInt(indexEl.value, 10);
  if (coinType === 501) {
    return "m/" + purpose + "'/" + coinType + "'/" + account + "'/" + index + "'";
  }
  return "m/" + purpose + "'/" + coinType + "'/" + account + "'/" + change + "/" + index;
}

/** Convert every path segment to hardened — required for SLIP-0010 (Ed25519/Solana). */
export function hardenAllPathSegments(path) {
  var parts = path.replace(/^m\//i, "").split("/").filter(Boolean);
  var hardened = parts.map(function (seg) {
    return (/'$/.test(seg) || /h$/i.test(seg)) ? seg : seg + "'";
  });
  return "m/" + hardened.join("/");
}

export function updateSolanaUiHints() {
  var coinEl = document.getElementById("coinType");
  var note = document.getElementById("solanaPathNote");
  var ct = parseInt(coinEl.value, 10);
  if (note) note.style.display = ct === 501 ? "block" : "none";
}
