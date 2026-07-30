

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
    var addr = base58Encode(kp.publicKey);
    var sk32hex;
    if (kp.secretKey && kp.secretKey.length >= 32) {
      sk32hex = toHex(new Uint8Array(kp.secretKey.subarray(0, 32)));
    } else {
      sk32hex = toHex(seed32);
    }
    var pubSolHex = "0x" + toHex(new Uint8Array(kp.publicKey));
    var sec64hex = kp.secretKey && kp.secretKey.length >= 64
      ? "0x" + toHex(new Uint8Array(kp.secretKey))
      : null;
    return {
      address: addr,
      wif: null,
      addressLabel: "Solana address",
      privateHex: "0x" + sk32hex,
      publicKeyHex: pubSolHex,
      publicKeyUncompressedHex: null,
      solanaSecret64Hex: sec64hex,
      keyFormatNote:
        "Solana: the Base58 string above is the address (= encoding of the 32-byte Ed25519 public key). The 32-byte hex labeled 'private key' is the Ed25519 seed (same bytes TweetNaCl uses in fromSeed). Many wallets also export a 64-byte secret (seed || public key) - see below."
    };
  }
  if (coinType === 0 || coinType === 2 || coinType === 3) {
    return formatUtxoAddressPure(secpPrivateKeyHex, coinType, purpose);
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
  if (devOverride === "ltc_legacy") return formatUtxoAddressPure(secpPrivateKeyHex, 2, 44);
  if (devOverride === "ltc_native") return formatUtxoAddressPure(secpPrivateKeyHex, 2, 84);
  if (devOverride === "doge_legacy") return formatUtxoAddressPure(secpPrivateKeyHex, 3, 44);
  if (devOverride === "doge_native") return formatUtxoAddressPure(secpPrivateKeyHex, 3, 84);
  return formatAddress(mnemonic, path, purpose, coinType, secpPrivateKeyHex, passphrase);
}

function randomMnemonic(words) {
  var entropyBytes = words === 24 ? 32 : 16;
  var ent = ethers.utils.randomBytes(entropyBytes);
  return ethers.utils.entropyToMnemonic(ent);
}
