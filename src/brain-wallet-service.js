

async function sha256Bytes(text) {
  var enc = new TextEncoder();
  var buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return new Uint8Array(buf);
}

function brainStrengthInfo(text) {
  var len = text.length;
  if (len === 0) return { pct: 0, label: "-", color: "var(--text-muted)" };
  var charSet = 0;
  if (/[a-z]/.test(text)) charSet += 26;
  if (/[A-Z]/.test(text)) charSet += 26;
  if (/[0-9]/.test(text)) charSet += 10;
  if (/[^a-zA-Z0-9]/.test(text)) charSet += 32;
  var bits = len * Math.log2(charSet || 26);
  if (bits < 40) return { pct: 10, label: "Very Weak", color: "var(--error)" };
  if (bits < 60) return { pct: 25, label: "Weak", color: "#f97316" };
  if (bits < 80) return { pct: 45, label: "Poor", color: "var(--warning)" };
  if (bits < 100) return { pct: 65, label: "Fair", color: "#a3e635" };
  if (bits < 128) return { pct: 80, label: "Better", color: "var(--success)" };
  return { pct: 95, label: "High bits*", color: "var(--success)" };
}

async function deriveBrainWalletData(sourcePassphrase, bip39Passphrase, account, addressIndex) {
  var hash = await sha256Bytes(sourcePassphrase);
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
