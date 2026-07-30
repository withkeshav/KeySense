import { BECH32_CHARS, BECH32_GEN, BECH32M_CONST, COIN_PARAMS } from "./constants.js";

/** Uint8Array -> lowercase hex string (no 0x prefix). */
export function toHex(u8) {
  return Array.prototype.map.call(u8, function (b) {
    return ("0" + b.toString(16)).slice(-2);
  }).join("");
}

/** Bitcoin-style Base58 (same alphabet Solana uses for pubkey addresses). */
export function base58Encode(bytes) {
  var ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  if (!bytes || bytes.length === 0) return "";
  var u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  var digits = [0];
  for (var i = 0; i < u8.length; i++) {
    var carry = u8[i] & 255;
    for (var j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  var str = "";
  for (var k = 0; k < u8.length && u8[k] === 0; k++) str += ALPHABET[0];
  for (var m = digits.length - 1; m >= 0; m--) str += ALPHABET[digits[m]];
  return str;
}

/** Bitcoin / Tron style Base58Check: version byte + payload + 4-byte checksum (double SHA-256). */
export function doubleSha256Bytes(u8) {
  var h1 = ethers.utils.sha256(u8);
  return ethers.utils.arrayify(ethers.utils.sha256(h1));
}

export function base58CheckEncode(versionByte, payload20) {
  var body = new Uint8Array(21);
  body[0] = versionByte & 255;
  var p = payload20 instanceof Uint8Array ? payload20 : new Uint8Array(payload20);
  if (p.length !== 20) throw new Error("Base58Check payload must be 20 bytes.");
  body.set(p, 1);
  var checksum = doubleSha256Bytes(body).subarray(0, 4);
  var full = new Uint8Array(25);
  full.set(body, 0);
  full.set(checksum, 21);
  return base58Encode(full);
}

/** Tron mainnet (0x41 prefix): Keccak-256 of uncompressed pubkey (x||y, no 0x04), last 20 bytes. */
export function tronAddressFromPrivateKey(privHex) {
  var uncompressed = ethers.utils.computePublicKey(privHex, false);
  var hexNoPrefix = uncompressed.slice(4);
  var hash = ethers.utils.keccak256("0x" + hexNoPrefix);
  var hashBytes = ethers.utils.arrayify(hash);
  var addr20 = hashBytes.subarray(12, 32);
  return base58CheckEncode(0x41, addr20);
}

function bech32Polymod(v) {
  var c = 1;
  for (var i = 0; i < v.length; i++) {
    var c0 = (c >>> 25) & 0xff;
    c = ((c & 0x1ffffff) << 5) ^ v[i];
    for (var j = 0; j < 5; j++) if ((c0 >>> j) & 1) c ^= BECH32_GEN[j];
  }
  return c;
}

function bech32HrpExpand(hrp) {
  var ret = [];
  for (var i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >>> 5);
  ret.push(0);
  for (var i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
  return ret;
}

function bech32Checksum(hrp, data, bech32m) {
  var values = bech32HrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  var mod = bech32Polymod(values) ^ (bech32m ? BECH32M_CONST : 1);
  var ret = [];
  for (var p = 0; p < 6; p++) ret.push((mod >>> (5 * (5 - p))) & 31);
  return ret;
}

function convertbits(data, frombits, tobits, pad) {
  var acc = 0, bits = 0, ret = [], maxv = (1 << tobits) - 1;
  for (var p = 0; p < data.length; p++) {
    acc = ((acc << frombits) | (data[p] & 255)) & 0xffffff;
    bits += frombits;
    while (bits >= tobits) { bits -= tobits; ret.push((acc >>> bits) & maxv); }
  }
  if (pad && bits > 0) ret.push((acc << (tobits - bits)) & maxv);
  return ret;
}

function bech32Encode(hrp, data, bech32m) {
  var combined = data.concat(bech32Checksum(hrp, data, bech32m));
  var s = hrp + "1";
  for (var i = 0; i < combined.length; i++) s += BECH32_CHARS[combined[i]];
  return s;
}

/** RIPEMD160(SHA256(hexPubkey)) -> 20-byte Uint8Array */
function hash160(hexPubkey) {
  var sha = ethers.utils.sha256(hexPubkey);
  return ethers.utils.arrayify(ethers.utils.ripemd160(sha));
}

/** Generic Base58Check: accepts full Uint8Array payload (version already included). */
function base58CheckFull(payload) {
  var p = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
  var checksum = doubleSha256Bytes(p).subarray(0, 4);
  var full = new Uint8Array(p.length + 4);
  full.set(p, 0);
  full.set(checksum, p.length);
  return base58Encode(full);
}

/** WIF: version + 32-byte key + 0x01 (compressed flag) */
function utxoWIF(privHex, wifByte) {
  var privBytes = ethers.utils.arrayify(privHex);
  var payload = new Uint8Array(34);
  payload[0] = wifByte; payload.set(privBytes, 1); payload[33] = 0x01;
  return base58CheckFull(payload);
}

/** P2PKH: version + HASH160(compressed pubkey) */
function utxoP2PKH(pubkeyHex, p2pkhByte) {
  var h = hash160(pubkeyHex);
  var payload = new Uint8Array(21);
  payload[0] = p2pkhByte; payload.set(h, 1);
  return base58CheckFull(payload);
}

/** P2SH-P2WPKH: version + HASH160(OP_0 OP_PUSH20 HASH160(pubkey)) */
function utxoP2SHP2WPKH(pubkeyHex, p2shByte) {
  var h = hash160(pubkeyHex);
  var redeem = new Uint8Array(22);
  redeem[0] = 0x00; redeem[1] = 0x14; redeem.set(h, 2);
  var scriptHash = hash160("0x" + toHex(redeem));
  var payload = new Uint8Array(21);
  payload[0] = p2shByte; payload.set(scriptHash, 1);
  return base58CheckFull(payload);
}

/** P2WPKH: bech32(witness v0, HASH160(compressed pubkey)) */
function utxoP2WPKH(pubkeyHex, hrp) {
  var h = Array.from(hash160(pubkeyHex));
  var data = [0].concat(convertbits(h, 8, 5, true));
  return bech32Encode(hrp, data, false);
}

/** Build address without any external library - pure ethers.js crypto. */
export function formatUtxoAddressPure(privHex, coinType, purpose) {
  var cp = COIN_PARAMS[coinType];
  if (!cp) throw new Error("Unsupported coin type: " + coinType);
  var pubkeyHex = ethers.utils.computePublicKey(privHex, true);
  var pubkeyUncomp = ethers.utils.computePublicKey(privHex, false);
  var wif = utxoWIF(privHex, cp.wif);
  var address, label;
  if (purpose === 84) {
    if (coinType === 3) {
      address = utxoP2PKH(pubkeyHex, cp.p2pkh);
      label = cp.name + " (Legacy - DOGE SegWit not widely supported)";
    } else {
      address = utxoP2WPKH(pubkeyHex, cp.bech32);
      label = cp.name + " (Native SegWit - " + cp.bech32 + "1q...)";
    }
  } else if (purpose === 49) {
    address = utxoP2SHP2WPKH(pubkeyHex, cp.p2sh);
    label = cp.name + " (P2SH-SegWit)";
  } else if (purpose === 86) {
    address = utxoP2PKH(pubkeyHex, cp.p2pkh);
    label = cp.name + " (Taproot key-tweak requires an ECC lib - showing Legacy instead)";
  } else {
    address = utxoP2PKH(pubkeyHex, cp.p2pkh);
    label = cp.name + " (Legacy)";
  }
  return {
    address: address,
    wif: wif,
    addressLabel: label,
    privateHex: privHex,
    publicKeyHex: pubkeyHex,
    publicKeyUncompressedHex: pubkeyUncomp
  };
}
