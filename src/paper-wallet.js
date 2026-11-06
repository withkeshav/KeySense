function renderQrToHost(hostEl, text) {
  return new Promise(function (resolve, reject) {
    if (!hostEl || !text || typeof QRCode === "undefined" || !QRCode.toCanvas) { reject(new Error("Address QR code unavailable")); return; }
    try {
      var canvas = document.createElement("canvas");
      QRCode.toCanvas(canvas, text, { width: 180, margin: 4, color: { dark: "#000000", light: "#ffffff" } }, function (err) {
        if (err) { reject(new Error("Address QR code failed")); return; }
        hostEl.innerHTML = "";
        hostEl.appendChild(canvas);
        resolve();
      });
    } catch (e) { reject(e); }
  });
}

/* Built from DOM nodes, not an HTML string. BIP39 words only ever come from
 * a fixed 2048-word list so this was never exploitable in practice, but
 * every other sink in this app that touches a mnemonic builds nodes for the
 * same reason: it should stay true regardless of where the string came from,
 * not because of what the string happens to contain today. */
function buildWordGrid(mnemonic) {
  if (!mnemonic || typeof mnemonic !== "string") { return null; }
  var words = mnemonic.trim().split(/\s+/).filter(Boolean);
  if ([12, 15, 18, 21, 24].indexOf(words.length) === -1) { return null; }

  var wrap = document.createElement("div");
  wrap.className = "pw-word-grid";
  var table = document.createElement("table");

  for (var i = 0; i < words.length; i += 4) {
    var tr = document.createElement("tr");
    for (var j = 0; j < 4; j++) {
      var idx = i + j;
      var td = document.createElement("td");
      var numSpan = document.createElement("span");
      numSpan.className = "pw-num";
      var wordSpan = document.createElement("span");
      wordSpan.className = "pw-word";
      if (idx >= words.length) {
        td.className = "pw-slot pw-empty";
      } else {
        td.className = "pw-slot";
        numSpan.textContent = String(idx + 1);
        wordSpan.textContent = words[idx];
      }
      td.appendChild(numSpan);
      td.appendChild(wordSpan);
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  wrap.appendChild(table);
  return wrap;
}

function populatePaperWallet(data) {
  var host = document.getElementById("paperWalletPrint");
  if (!host) { return false; }
  if (!data) { return false; }

  var addrEl = document.getElementById("pwAddress");
  var pathEl = document.getElementById("pwPath");
  var netEl = document.getElementById("pwNetwork");
  var gridEl = document.getElementById("pwWordGrid");
  var qrHost = document.getElementById("pwQrHost");
  var privKeyEl = document.getElementById("pwPrivateKey");
  var wifWrap = document.getElementById("pwWifWrap");
  var wifEl = document.getElementById("pwWif");
  var pubKeyWrap = document.getElementById("pwPubKeyWrap");
  var pubKeyEl = document.getElementById("pwPubKey");

  var passNote = document.getElementById("pwPassphrase");
  if (passNote) passNote.textContent = data.passphraseRequired ? "Required. The separate BIP39 passphrase is NOT printed here. Words alone will restore different keys." : "No extra BIP39 passphrase was used.";
  if (addrEl) { addrEl.textContent = data.address || ""; }
  if (pathEl) { pathEl.textContent = data.path || ""; }
  if (netEl) { netEl.textContent = data.network || ""; }
  if (gridEl) {
    gridEl.textContent = "";
    var grid = buildWordGrid(data.mnemonic || "");
    if (grid) gridEl.appendChild(grid);
  }
  if (privKeyEl) { privKeyEl.textContent = data.privateKey || ""; }
  if (wifWrap && wifEl) {
    if (data.wif) { wifWrap.style.display = ""; wifEl.textContent = data.wif; }
    else { wifWrap.style.display = "none"; wifEl.textContent = ""; }
  }
  if (pubKeyWrap && pubKeyEl) {
    if (data.pubKey) { pubKeyWrap.style.display = ""; pubKeyEl.textContent = data.pubKey; }
    else { pubKeyWrap.style.display = "none"; pubKeyEl.textContent = ""; }
  }
  if (qrHost) qrHost.replaceChildren();
  return true;
}

async function printPaperWallet(data) {
  if (!populatePaperWallet(data)) throw new Error("Print layout unavailable");
  var cleanup = function () {
    document.body.classList.remove("print-active");
    clearPaperWallet();
    window.removeEventListener("afterprint", cleanup);
  };
  try {
    await renderQrToHost(document.getElementById("pwQrHost"), data.address);
    document.body.classList.add("print-active");
    window.addEventListener("afterprint", cleanup, {once: true});
    // Keep the page intact while the browser's print dialog is open.
    // A fixed timer could erase a preview before it is printed.
    window.print();
  } catch (e) { cleanup(); throw e; }
}

function clearPaperWallet() {
  var host = document.getElementById("paperWalletPrint");
  if (!host) { return; }

  var passNote = document.getElementById("pwPassphrase");
  if (passNote) passNote.textContent = "";
  var qrHost = document.getElementById("pwQrHost");
  if (qrHost) { qrHost.innerHTML = ""; }

  var gridEl = document.getElementById("pwWordGrid");
  if (gridEl) { gridEl.innerHTML = ""; }

  var addrEl = document.getElementById("pwAddress");
  if (addrEl) { addrEl.textContent = ""; }

  var pathEl = document.getElementById("pwPath");
  if (pathEl) { pathEl.textContent = ""; }

  var netEl = document.getElementById("pwNetwork");
  if (netEl) { netEl.textContent = ""; }

  var privKeyEl = document.getElementById("pwPrivateKey");
  if (privKeyEl) { privKeyEl.textContent = ""; }

  var wifWrap = document.getElementById("pwWifWrap");
  var wifEl = document.getElementById("pwWif");
  if (wifWrap) { wifWrap.style.display = "none"; }
  if (wifEl) { wifEl.textContent = ""; }

  var pubKeyWrap = document.getElementById("pwPubKeyWrap");
  var pubKeyEl = document.getElementById("pwPubKey");
  if (pubKeyWrap) { pubKeyWrap.style.display = "none"; }
  if (pubKeyEl) { pubKeyEl.textContent = ""; }
}