

/* Shared Ed25519 (SLIP-0010) derivation used by Solana, Sui and Aptos.
 * Returns {seed32, publicKey, secret64, seedHex, pubHex, sec64hex}.
 *
 * Synchronous. This used to load ed25519-hd-key through a dynamic import(),
 * which meant these three chains did not work from a file:// origin because
 * module loading is blocked there. The derivation now lives in
 * src/slip10-ed25519.js on top of ethers' own HMAC-SHA512, proven byte
 * identical to ed25519-hd-key@1.3.0 across 1500 paths before the swap. */
function deriveEd25519Key(mnemonic, path, passphrase) {
  var naclGlobal =
    (typeof globalThis !== "undefined" && globalThis.nacl) ||
    (typeof window !== "undefined" && window.nacl) ||
    null;
  if (!naclGlobal || !naclGlobal.sign || typeof naclGlobal.sign.keyPair.fromSeed !== "function") {
    throw new Error("TweetNaCl not loaded - ensure nacl-fast.min.js runs before this script.");
  }
  var seed512 = ethers.utils.arrayify(ethers.utils.mnemonicToSeed(mnemonic, passphrase || ""));
  var seed32 = slip10DeriveEd25519(seed512, path).key;
  var kp = naclGlobal.sign.keyPair.fromSeed(seed32);
  /* The first 32 bytes of an ed25519 expanded secret key are the seed itself,
   * so this is the same value either way. */
  var sec64hex = kp.secretKey && kp.secretKey.length >= 64
    ? "0x" + toHex(new Uint8Array(kp.secretKey))
    : null;
  return {
    seed32: seed32,
    publicKey: kp.publicKey,
    secret64: kp.secretKey,
    seedHex: "0x" + toHex(seed32),
    pubHex: "0x" + toHex(new Uint8Array(kp.publicKey)),
    sec64hex: sec64hex
  };
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
    var k = deriveEd25519Key(mnemonic, path, passphrase);
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
    var suiK = deriveEd25519Key(mnemonic, path, passphrase);
    /* Sui address = BLAKE2b-256(flag || pubkey), where flag is the signature
     * scheme byte: 0x00 Ed25519, 0x01 secp256k1, 0x02 secp256r1.
     *
     * The address is NOT the public key. This tool displayed the raw public key
     * here until 2026-08-05. Both are 32 bytes and both render as a plausible
     * 0x string, which is exactly why the bug survived so long. Anything sent
     * to the old value is unspendable.
     *
     * dkLen must be passed explicitly. BLAKE2b-256 is not a truncation of
     * BLAKE2b-512; the digest length is mixed into the parameter block, so the
     * wrong dkLen silently produces a different and wrong address. */
    var suiPub = ethers.utils.arrayify(suiK.pubHex);
    var suiPre = new Uint8Array(1 + suiPub.length);
    suiPre[0] = 0x00;
    suiPre.set(suiPub, 1);
    var suiAddr = "0x" + toHex(KeySenseHashes.blake2b(suiPre, { dkLen: 32 }));
    return {
      address: suiAddr,
      wif: null,
      addressLabel: "Sui address",
      privateHex: suiK.seedHex,
      publicKeyHex: suiK.pubHex,
      publicKeyUncompressedHex: null,
      solanaSecret64Hex: suiK.sec64hex,
      keyFormatNote:
        "Sui: address is 0x + BLAKE2b-256(0x00 || public key), where 0x00 is the Ed25519 signature scheme flag. It is not the public key itself, even though both are 32 bytes. The 32-byte hex labeled 'private key' is the Ed25519 seed. Derivation uses SLIP-0010 (all path segments hardened)."
    };
  }
  if (coinType === APTOS_COIN_TYPE) {
    var aptK = deriveEd25519Key(mnemonic, path, passphrase);
    /* Aptos single-signer Ed25519 account address = SHA3-256(pubkey || 0x00).
     *
     * This used to call crypto.subtle.digest("SHA3-256", ...), which always
     * threw: Web Crypto implements only SHA-1, SHA-256, SHA-384 and SHA-512, so
     * no browser has ever supported SHA3 there. The chain therefore never
     * produced an address at all, it only ever printed the fallback message.
     * The old comment blamed HTTPS, which was never the problem.
     *
     * SHA3-256 is not Keccak-256. They differ in padding, so ethers'
     * keccak256 cannot be substituted here. */
    var aptPub = ethers.utils.arrayify(aptK.pubHex);
    var aptIn = new Uint8Array(aptPub.length + 1);
    aptIn.set(aptPub, 0);
    aptIn[aptPub.length] = 0x00;
    var aptAddr = "0x" + toHex(KeySenseHashes.sha3_256(aptIn));
    return {
      address: aptAddr,
      wif: null,
      addressLabel: "Aptos address",
      privateHex: aptK.seedHex,
      publicKeyHex: aptK.pubHex,
      publicKeyUncompressedHex: null,
      solanaSecret64Hex: aptK.sec64hex,
      keyFormatNote:
        "Aptos: address is 0x + SHA3-256(public key || 0x00 scheme byte). Note this is SHA3-256, not Keccak-256; the two differ in padding and give different results. Derivation uses SLIP-0010 (all path segments hardened)."
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
