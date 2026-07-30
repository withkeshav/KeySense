function renderQrToHost(hostEl, text) {
  return new Promise(function (resolve) {
    if (!hostEl || !text || typeof QRCode === "undefined" || !QRCode.toCanvas) { resolve(); return; }
    try {
      var canvas = document.createElement("canvas");
      QRCode.toCanvas(canvas, text, { width: 140, margin: 1, color: { dark: "#000000", light: "#ffffff" } }, function (err) {
        if (err) { resolve(); return; }
        hostEl.innerHTML = "";
        hostEl.appendChild(canvas);
        resolve();
      });
    } catch (e) { resolve(); }
  });
}

function buildWordGrid(mnemonic) {
  if (!mnemonic || typeof mnemonic !== "string") { return ""; }
  var words = mnemonic.trim().split(/\s+/).filter(Boolean);
  if (words.length !== 12 && words.length !== 24) { return ""; }
  var rows = "";
  for (var i = 0; i < words.length; i += 4) {
    var cells = "";
    for (var j = 0; j < 4; j++) {
      var idx = i + j;
      if (idx >= words.length) {
        cells += '<td class="pw-slot pw-empty"><span class="pw-num"></span><span class="pw-word"></span></td>';
      } else {
        var num = idx + 1;
        cells += '<td class="pw-slot"><span class="pw-num">' + num + '</span><span class="pw-word">' + words[idx] + '</span></td>';
      }
    }
    rows += "<tr>" + cells + "</tr>";
  }
  return '<div class="pw-word-grid"><table>' + rows + "</table></div>";
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

  if (addrEl) { addrEl.textContent = data.address || ""; }
  if (pathEl) { pathEl.textContent = data.path || ""; }
  if (netEl) { netEl.textContent = data.network || ""; }
  if (gridEl) { gridEl.innerHTML = buildWordGrid(data.mnemonic || ""); }
  if (privKeyEl) { privKeyEl.textContent = data.privateKey || ""; }
  if (wifWrap && wifEl) {
    if (data.wif) { wifWrap.style.display = ""; wifEl.textContent = data.wif; }
    else { wifWrap.style.display = "none"; wifEl.textContent = ""; }
  }
  if (pubKeyWrap && pubKeyEl) {
    if (data.pubKey) { pubKeyWrap.style.display = ""; pubKeyEl.textContent = data.pubKey; }
    else { pubKeyWrap.style.display = "none"; pubKeyEl.textContent = ""; }
  }
  if (qrHost) {
    renderQrToHost(qrHost, data.address || "").catch(function () {});
  }
  return true;
}

async function printPaperWallet(data) {
  var ok = populatePaperWallet(data);
  if (!ok) {
    alert("Paper wallet element not found");
    return;
  }

  var qrHost = document.getElementById("pwQrHost");
  if (qrHost && data && data.address) {
    try {
      await renderQrToHost(qrHost, data.address);
    } catch (e) {}
  }

  document.body.classList.add("print-active");

  var cleanup = function () {
    document.body.classList.remove("print-active");
    clearPaperWallet();
  };

  if (typeof window !== "undefined") {
    window.onafterprint = function () {
      cleanup();
      window.onafterprint = null;
    };
  }

  setTimeout(function () {
    if (document.body.classList.contains("print-active")) { cleanup(); }
  }, 500);

  if (typeof window !== "undefined" && typeof window.print === "function") {
    window.print();
  }
}

function clearPaperWallet() {
  var host = document.getElementById("paperWalletPrint");
  if (!host) { return; }

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