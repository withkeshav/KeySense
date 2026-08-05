

/* ethers.utils.sha256 rather than crypto.subtle.digest: same algorithm, but
 * synchronous and with no secure-context requirement, so the brain wallet demo
 * works from a file:// origin too. */
function sha256Bytes(text) {
  return ethers.utils.arrayify(ethers.utils.sha256(ethers.utils.toUtf8Bytes(text)));
}

/* Character-space size for a typed passphrase. Display only; nothing in
 * deriveBrainWalletData uses it.
 *
 * This is an UPPER BOUND, not a strength. It counts how many strings of that
 * length exist in that alphabet, which is not how anyone attacks a passphrase:
 * real cracking starts from wordlists, leetspeak rules and past breaches, so
 * anything memorable scores far lower in practice than it does here.
 *
 * The old version of this returned green labels ("Fair", "Better", "High
 * bits*") for long inputs, on a page whose entire message is that brain wallets
 * get emptied, and the asterisk pointed at a footnote that did not exist. The
 * thresholds are unchanged; the labels and colours no longer imply that any of
 * these is safe, because none of them is. */
function brainStrengthInfo(text) {
  var len = String(text || "").length;
  if (len === 0) return { pct: 0, bits: 0, label: "-", color: "var(--text-muted)" };
  var charSet = 0;
  if (/[a-z]/.test(text)) charSet += 26;
  if (/[A-Z]/.test(text)) charSet += 26;
  if (/[0-9]/.test(text)) charSet += 10;
  if (/[^a-zA-Z0-9]/.test(text)) charSet += 32;
  var bits = len * Math.log2(charSet || 26);
  var out;
  if (bits < 40) out = { pct: 10, label: "Trivially guessable", color: "var(--error)" };
  else if (bits < 60) out = { pct: 25, label: "Very weak", color: "var(--error)" };
  else if (bits < 80) out = { pct: 45, label: "Weak", color: "#f97316" };
  else if (bits < 100) out = { pct: 65, label: "Weak", color: "#f97316" };
  else if (bits < 128) out = { pct: 80, label: "Long, still guessable", color: "var(--warning)" };
  else out = { pct: 95, label: "Long, still guessable", color: "var(--warning)" };
  out.bits = bits;
  return out;
}

async function deriveBrainWalletData(sourcePassphrase, bip39Passphrase, account, addressIndex) {
  var hash = sha256Bytes(sourcePassphrase);
  var phrase = ethers.utils.entropyToMnemonic(hash);
  var hdRoot = ethers.utils.HDNode.fromMnemonic(phrase, bip39Passphrase);

  var ethPath = "m/44'/60'/" + account + "'/0/" + addressIndex;
  var btcLPath = "m/44'/0'/" + account + "'/0/" + addressIndex;
  var btcSPath = "m/84'/0'/" + account + "'/0/" + addressIndex;
  var trxPath = "m/44'/195'/" + account + "'/0/" + addressIndex;
  var solPath = "m/44'/501'/" + account + "'/" + addressIndex + "'";

  var ethNode = hdRoot.derivePath(ethPath);
  var ethWallet = new ethers.Wallet(ethNode.privateKey);

  var btcLNode = hdRoot.derivePath(btcLPath);
  var btcLRes = formatUtxoAddressPure(btcLNode.privateKey, 0, 44);

  var btcSNode = hdRoot.derivePath(btcSPath);
  var btcSRes = formatUtxoAddressPure(btcSNode.privateKey, 0, 84);

  var trxNode = hdRoot.derivePath(trxPath);

  return {
    phrase: phrase,
    paths: {
      ethPath: ethPath,
      btcLPath: btcLPath,
      btcSPath: btcSPath,
      trxPath: trxPath,
      solPath: solPath
    },
    ethAddress: ethWallet.address,
    ethPrivateKey: ethWallet.privateKey,
    btcLegacyAddress: btcLRes.address,
    btcNativeAddress: btcSRes.address,
    btcWif: btcSRes.wif,
    tronAddress: tronAddressFromPrivateKey(trxNode.privateKey)
  };
}

async function deriveBrainSolAddress(phrase, solPath, bip39Passphrase) {
  var solRes = await formatAddress(phrase, solPath, 44, 501, "", bip39Passphrase);
  return solRes.address;
}
