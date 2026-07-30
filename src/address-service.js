

function toSeed32Bytes(keyMaterial) {
  if (!keyMaterial) throw new Error("Solana derivation returned empty key.");
  var u8;
  if (keyMaterial instanceof Uint8Array) {
    u8 = keyMaterial;
  } else {
    var len = keyMaterial.length || keyMaterial.byteLength || 0;
    u8 = new Uint8Array(len);
    for (var i = 0; i < len; i++) u8[i] = keyMaterial[i];
  }
  if (u8.length < 32) throw new Error("Solana SLIP-0010 key must be >= 32 bytes.");
  return u8.subarray(0, 32);
}

var solanaDepsPromise = null;

function loadSolanaDeps() {
  if (!solanaDepsPromise) {
    solanaDepsPromise = import("https://cdn.jsdelivr.net/npm/ed25519-hd-key@1.3.0/+esm").then(function (ed) {
      var edObj = ed && (ed.default || ed);
      var derivePath = (ed && ed.derivePath) || (edObj && edObj.derivePath);
      if (typeof derivePath !== "function") throw new Error("ed25519-hd-key derivePath missing");
      return { derivePath: derivePath };
    });
  }
  return solanaDepsPromise;
}

/* Shared Ed25519 (SLIP-0010) derivation used by Solana, Sui, and Aptos.
 * Returns {seed32, publicKey32, secret64, seedHex, pubHex} from mnemonic+path. */
async function deriveEd25519Key(mnemonic, path, passphrase) {
  var deps = await loadSolanaDeps();
  var naclGlobal =
    (typeof globalThis !== "undefined" && globalThis.nacl) ||
    (typeof window !== "undefined" && window.nacl) ||
    null;
  if (!naclGlobal || !naclGlobal.sign || typeof naclGlobal.sign.keyPair.fromSeed !== "function") {
    throw new Error("TweetNaCl not loaded - ensure nacl-fast.min.js runs before this script.");
  }
  var seed512u8 = ethers.utils.arrayify(ethers.utils.mnemonicToSeed(mnemonic, passphrase || ""));
  var seed512hex = toHex(seed512u8);
  var d = deps.derivePath(path, seed512hex);
  if (!d || !d.key) throw new Error("SLIP-0010 derivePath returned no key for " + path);
  var seed32 = toSeed32Bytes(d.key);
  var kp = naclGlobal.sign.keyPair.fromSeed(seed32);
  var sk32hex;
  if (kp.secretKey && kp.secretKey.length >= 32) {
    sk32hex = toHex(new Uint8Array(kp.secretKey.subarray(0, 32)));
  } else {
    sk32hex = toHex(seed32);
  }
  var pubHex = "0x" + toHex(new Uint8Array(kp.publicKey));
  var sec64hex = kp.secretKey && kp.secretKey.length >= 64
    ? "0x" + toHex(new Uint8Array(kp.secretKey))
    : null;
  return { seed32: seed32, publicKey: kp.publicKey, secret64: kp.secretKey, seedHex: "0x" + sk32hex, pubHex: pubHex, sec64hex: sec64hex };
}

async function formatAddress(mnemonic, path, purpose, coinType, secpPrivateKeyHex, passphrase) {
  if (coinType === 60) {
    var wallet = new ethers.Wallet(secpPrivateKeyHex);
    var pubC = ethers.utils.computePublicKey(secpPrivateKeyHex, true);
    var pubU = ethers.utils.computePublicKey(secpPrivateKeyHex, false);
    return {
      address: wallet.address,
      wif: null,
      addressLabel: "EVM address",
      privateHex: wallet.privateKey,
      publicKeyHex: pubC,
      publicKeyUncompressedHex: pubU
    };
  }
  if (coinType === 195) {
    var wTron = new ethers.Wallet(secpPrivateKeyHex);
    var pubCt = ethers.utils.computePublicKey(secpPrivateKeyHex, true);
    var pubUt = ethers.utils.computePublicKey(secpPrivateKeyHex, false);
    return {
      address: tronAddressFromPrivateKey(secpPrivateKeyHex),
      wif: null,
      addressLabel: "Tron address",
      privateHex: wTron.privateKey,
      publicKeyHex: pubCt,
      publicKeyUncompressedHex: pubUt,
      evmStyleAddress: wTron.address
    };
  }
  if (coinType === 501) {
    var k = await deriveEd25519Key(mnemonic, path, passphrase);
    var addr = base58Encode(k.publicKey);
    return {
      address: addr,
      wif: null,
      addressLabel: "Solana address",
      privateHex: k.seedHex,
      publicKeyHex: k.pubHex,
      publicKeyUncompressedHex: null,
      solanaSecret64Hex: k.sec64hex,
      keyFormatNote:
        "Solana: the Base58 string above is the address (= encoding of the 32-byte Ed25519 public key). The 32-byte hex labeled 'private key' is the Ed25519 seed (same bytes TweetNaCl uses in fromSeed). Many wallets also export a 64-byte secret (seed || public key) - see below."
    };
  }
  if (coinType === SUI_COIN_TYPE) {
    var suiK = await deriveEd25519Key(mnemonic, path, passphrase);
    /* Sui address = 0x + lowercase hex of the 32-byte Ed25519 public key. */
    var suiAddr = suiK.pubHex.toLowerCase();
    return {
      address: suiAddr,
      wif: null,
      addressLabel: "Sui address",
      privateHex: suiK.seedHex,
      publicKeyHex: suiK.pubHex,
      publicKeyUncompressedHex: null,
      solanaSecret64Hex: suiK.sec64hex,
      keyFormatNote:
        "Sui: address is 0x + the 32-byte Ed25519 public key hex. The 32-byte hex labeled 'private key' is the Ed25519 seed. Derivation uses SLIP-0010 (all path segments hardened)."
    };
  }
  if (coinType === APTOS_COIN_TYPE) {
    var aptK = await deriveEd25519Key(mnemonic, path, passphrase);
    /* Aptos single-sig Ed25519 address = 0x + sha3-256(pubkey || 0x00).
     * ethers v5 has no SHA3, so this uses the browser Web Crypto API (requires HTTPS). */
    var aptAddr;
    if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest) {
      try {
        var pubBytes = ethers.utils.arrayify(aptK.pubHex);
        var withScheme = new Uint8Array(pubBytes.length + 1);
        withScheme.set(pubBytes, 0);
        withScheme[pubBytes.length] = 0x00;
        var hashBuf = await crypto.subtle.digest("SHA3-256", withScheme);
        aptAddr = "0x" + toHex(new Uint8Array(hashBuf));
      } catch (sha3e) {
        aptAddr = "SHA3-256 unsupported in this browser - public key: " + aptK.pubHex;
      }
    } else {
      aptAddr = "SHA3-256 needs HTTPS/crypto.subtle - public key: " + aptK.pubHex;
    }
    return {
      address: aptAddr,
      wif: null,
      addressLabel: "Aptos address",
      privateHex: aptK.seedHex,
      publicKeyHex: aptK.pubHex,
      publicKeyUncompressedHex: null,
      solanaSecret64Hex: aptK.sec64hex,
      keyFormatNote:
        "Aptos: address is 0x + SHA3-256(public key || 0x00 scheme byte). ethers v5 lacks SHA3, so this uses the browser Web Crypto API (requires HTTPS). Derivation uses SLIP-0010 (all path segments hardened)."
    };
  }
  if (coinType === 0 || coinType === 2 || coinType === 3) {
    return formatUtxoAddressPure(secpPrivateKeyHex, coinType, purpose);
  }
  if (coinType === 118) {
    var cosPubC = ethers.utils.computePublicKey(secpPrivateKeyHex, true);
    var cosPubU = ethers.utils.computePublicKey(secpPrivateKeyHex, false);
    return {
      address: cosmosAddress(cosPubC, COSMOS_HRP),
      wif: null,
      addressLabel: "Cosmos address",
      privateHex: secpPrivateKeyHex,
      publicKeyHex: cosPubC,
      publicKeyUncompressedHex: cosPubU
    };
  }
  var fallback = new ethers.Wallet(secpPrivateKeyHex);
  return {
    address: fallback.address,
    wif: null,
    addressLabel: "EVM-style (fallback)",
    privateHex: fallback.privateKey,
    publicKeyHex: ethers.utils.computePublicKey(secpPrivateKeyHex, true),
    publicKeyUncompressedHex: ethers.utils.computePublicKey(secpPrivateKeyHex, false)
  };
}

async function applyDevOutputFormat(mnemonic, path, passphrase, secpPrivateKeyHex, purpose, coinType, devOverride) {
  if (!devOverride || devOverride === "auto") {
    return formatAddress(mnemonic, path, purpose, coinType, secpPrivateKeyHex, passphrase);
  }
  if (devOverride === "raw_sec256") {
    return {
      address: "—",
      wif: null,
      addressLabel: "Raw secp256k1 (override)",
      privateHex: secpPrivateKeyHex,
      publicKeyHex: ethers.utils.computePublicKey(secpPrivateKeyHex, true),
      publicKeyUncompressedHex: ethers.utils.computePublicKey(secpPrivateKeyHex, false),
      rawOnly: true
    };
  }
  if (devOverride === "evm") {
    return formatAddress(mnemonic, path, 44, 60, secpPrivateKeyHex, passphrase);
  }
  if (devOverride === "tron") {
    return formatAddress(mnemonic, path, 44, 195, secpPrivateKeyHex, passphrase);
  }
  if (devOverride === "cosmos") {
    return formatAddress(mnemonic, path, 44, 118, secpPrivateKeyHex, passphrase);
  }
  if (devOverride === "sui") {
    var suiPath = hardenAllPathSegments(path);
    var suiResult = await formatAddress(mnemonic, suiPath, 44, SUI_COIN_TYPE, secpPrivateKeyHex, passphrase);
    if (suiPath !== path) {
      suiResult.resolvedPath = suiPath;
      suiResult.pathNote = "Path auto-hardened for SLIP-0010 (Ed25519): " + suiPath;
    }
    return suiResult;
  }
  if (devOverride === "aptos") {
    var aptPath = hardenAllPathSegments(path);
    var aptResult = await formatAddress(mnemonic, aptPath, 44, APTOS_COIN_TYPE, secpPrivateKeyHex, passphrase);
    if (aptPath !== path) {
      aptResult.resolvedPath = aptPath;
      aptResult.pathNote = "Path auto-hardened for SLIP-0010 (Ed25519): " + aptPath;
    }
    return aptResult;
  }
  if (devOverride === "sol") {
    var solPath = hardenAllPathSegments(path);
    var solResult = await formatAddress(mnemonic, solPath, purpose, 501, secpPrivateKeyHex, passphrase);
    if (solPath !== path) {
      solResult.resolvedPath = solPath;
      solResult.pathNote = "Path auto-hardened for SLIP-0010 (Ed25519): " + solPath;
    }
    return solResult;
  }
  if (devOverride === "btc_legacy") return formatUtxoAddressPure(secpPrivateKeyHex, 0, 44);
  if (devOverride === "btc_p2sh") return formatUtxoAddressPure(secpPrivateKeyHex, 0, 49);
  if (devOverride === "btc_native") return formatUtxoAddressPure(secpPrivateKeyHex, 0, 84);
  if (devOverride === "btc_taproot") return formatUtxoAddressPure(secpPrivateKeyHex, 0, 86);
  if (devOverride === "ltc_legacy") return formatUtxoAddressPure(secpPrivateKeyHex, 2, 44);
  if (devOverride === "ltc_native") return formatUtxoAddressPure(secpPrivateKeyHex, 2, 84);
  if (devOverride === "doge_legacy") return formatUtxoAddressPure(secpPrivateKeyHex, 3, 44);
  if (devOverride === "doge_native") return formatUtxoAddressPure(secpPrivateKeyHex, 3, 84);
  return formatAddress(mnemonic, path, purpose, coinType, secpPrivateKeyHex, passphrase);
}

function randomMnemonic(words, lang) {
  var entropyBytes = {12:16, 15:20, 18:24, 21:28, 24:32}[words] || 16;
  var ent = ethers.utils.randomBytes(entropyBytes);
  var wordlist = ethers.wordlists[lang] || ethers.wordlists.en;
  return ethers.utils.entropyToMnemonic(ent, wordlist);
}
