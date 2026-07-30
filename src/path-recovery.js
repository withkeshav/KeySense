var WALLET_PATHS = [
  { name: "MetaMask", path: "m/44'/60'/0'/0/0", purpose: 44, coinType: 60 },
  { name: "MetaMask (account 1)", path: "m/44'/60'/1'/0/0", purpose: 44, coinType: 60 },
  { name: "Trust Wallet (ETH)", path: "m/44'/60'/0'/0/0", purpose: 44, coinType: 60 },
  { name: "Ledger Legacy (ETH)", path: "m/44'/60'/0'/0", purpose: 44, coinType: 60 },
  { name: "Ledger Live (ETH)", path: "m/44'/60'/0'/0/0", purpose: 44, coinType: 60 },
  { name: "Ledger Live (account)", path: "m/44'/60'/0'/0/0", purpose: 44, coinType: 60 },
  { name: "Bitcoin Legacy (BIP44)", path: "m/44'/0'/0'/0/0", purpose: 44, coinType: 0 },
  { name: "Bitcoin Wrapped SegWit (BIP49)", path: "m/49'/0'/0'/0/0", purpose: 49, coinType: 0 },
  { name: "Bitcoin Native SegWit (BIP84)", path: "m/84'/0'/0'/0/0", purpose: 84, coinType: 0 },
  { name: "Bitcoin Taproot (BIP86)", path: "m/86'/0'/0'/0/0", purpose: 86, coinType: 0 },
  { name: "Solana (Phantom)", path: "m/44'/501'/0'/0'", purpose: 44, coinType: 501 },
  { name: "Solana (Solflare)", path: "m/44'/501'/0'/0'", purpose: 44, coinType: 501 },
  { name: "Tron (TronLink)", path: "m/44'/195'/0'/0/0", purpose: 44, coinType: 195 },
  { name: "Litecoin Legacy", path: "m/44'/2'/0'/0/0", purpose: 44, coinType: 2 },
  { name: "Dogecoin Legacy", path: "m/44'/3'/0'/0/0", purpose: 44, coinType: 3 }
];

function normalizeTargetAddress(addr) {
  if (!addr) return "";
  return String(addr).trim().toLowerCase();
}

async function scanPathsForAddress(mnemonic, passphrase, targetAddress) {
  if (typeof ethers === "undefined" || !ethers || !ethers.utils) {
    throw new Error("ethers library is not loaded. Cannot scan derivation paths.");
  }
  if (!mnemonic || !ethers.utils.isValidMnemonic(mnemonic)) {
    throw new Error("Enter a valid BIP39 mnemonic");
  }
  if (!targetAddress || !String(targetAddress).trim()) {
    throw new Error("Enter a target address to search for");
  }

  var normalizedTarget = normalizeTargetAddress(targetAddress);
  var matches = [];
  var errors = [];

  for (var i = 0; i < WALLET_PATHS.length; i++) {
    var entry = WALLET_PATHS[i];
    var path = entry.path;
    var purpose = entry.purpose;
    var coinType = entry.coinType;
    try {
      var hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic, passphrase || "");
      var derived = hdNode.derivePath(path);
      var secpPk = derived.privateKey;
      var result = await formatAddress(mnemonic, path, purpose, coinType, secpPk, passphrase || "");
      var derivedAddr = normalizeTargetAddress(result && result.address ? result.address : "");
      if (derivedAddr && derivedAddr === normalizedTarget) {
        matches.push({
          name: entry.name,
          path: path,
          address: result.address,
          purpose: purpose,
          coinType: coinType
        });
      }
    } catch (e) {
      errors.push({
        name: entry.name,
        path: path,
        error: (e && e.message) ? e.message : String(e)
      });
    }
  }

  return {
    matches: matches,
    errors: errors,
    scanned: WALLET_PATHS.length,
    target: targetAddress
  };
}

function matchesToHtml(scanResult) {
  if (!scanResult) return "";
  var matches = scanResult.matches || [];
  var errors = scanResult.errors || [];
  var html = "";

  if (matches.length === 0) {
    html += '<div style="color:var(--text-muted);padding:8px 0;">'
      + 'No matching path found. Check that your target address is correct and derived from this seed.'
      + '</div>';
  } else {
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      html += '<div style="color:var(--success);padding:6px 0;border-bottom:1px solid var(--border);">'
        + '<strong>' + escapeHtml(m.name) + '</strong> '
        + '<span style="color:var(--text-muted);">' + escapeHtml(m.path) + '</span><br>'
        + '<span style="font-family:monospace;">' + escapeHtml(m.address) + '</span>'
        + '</div>';
    }
  }

  if (errors.length > 0) {
    html += '<div style="color:var(--text-muted);padding-top:10px;font-size:0.9em;">'
      + 'Some paths could not be checked:'
      + '</div>';
    for (var j = 0; j < errors.length; j++) {
      var er = errors[j];
      html += '<div style="color:var(--text-muted);padding:4px 0;font-size:0.85em;">'
        + '<strong>' + escapeHtml(er.name) + '</strong> '
        + '<span>' + escapeHtml(er.path) + '</span> '
        + '<span style="opacity:0.8;">' + escapeHtml(er.error) + '</span>'
        + '</div>';
    }
  }

  return html;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}