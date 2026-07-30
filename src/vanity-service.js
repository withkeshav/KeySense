function getSelectedVanityMode() {
  var el = document.querySelector("input[name='vanityMode']:checked");
  return el ? el.value : "prefix";
}

function vanityDifficulty(pattern, mode) {
  var hexLen = pattern.replace(/^0x/i, "").length;
  if (hexLen === 0) return null;
  var exp = Math.pow(16, hexLen);
  if (mode === "contains") exp = Math.max(1, exp / 38);
  var magnitude = exp < 1000 ? exp.toFixed(0)
    : exp < 1e6 ? (exp / 1e3).toFixed(1) + "K"
    : exp < 1e9 ? (exp / 1e6).toFixed(1) + "M"
    : (exp / 1e9).toFixed(1) + "B";
  return "Expected ~" + magnitude + " attempts (" + hexLen + " hex char" + (hexLen !== 1 ? "s" : "") + ")";
}

function vanityInputLabel(mode) {
  if (mode === "prefix") return "Prefix to match (e.g. 0xcafe - case-insensitive)";
  if (mode === "suffix") return "Suffix to match - hex chars at end of address (e.g. dead)";
  return "Substring to find anywhere in the address (e.g. beef)";
}

function normalizeVanityPattern(rawInput, mode) {
  if (!rawInput) throw new Error("Enter a pattern.");
  var raw = rawInput.trim();
  if (!raw) throw new Error("Enter a pattern.");

  var norm;
  if (mode === "prefix") {
    norm = raw.toLowerCase();
    if (!norm.startsWith("0x")) norm = "0x" + norm;
    if (norm.length < 3) throw new Error("Prefix too short - at least 0x + one hex char.");
    for (var j = 2; j < norm.length; j++) {
      var c = norm.charCodeAt(j);
      if (!((c >= 48 && c <= 57) || (c >= 97 && c <= 102))) {
        throw new Error("Addresses use hex digits (0-9, a-f) after 0x.");
      }
    }
    return norm;
  }

  norm = raw.toLowerCase().replace(/^0x/i, "");
  if (!norm) throw new Error("Enter hex characters to search for.");
  for (var k = 0; k < norm.length; k++) {
    var ch = norm.charCodeAt(k);
    if (!((ch >= 48 && ch <= 57) || (ch >= 97 && ch <= 102))) {
      throw new Error("Addresses use hex digits (0-9, a-f).");
    }
  }
  return norm;
}

function createVanityMiner(options) {
  var running = false;
  var attempts = 0;
  var startTime = 0;
  var mode = "prefix";
  var pattern = "";

  function setRunning(next) {
    running = next;
    if (options.onRunningChange) options.onRunningChange(next);
  }

  function runBatch() {
    if (!running) return;
    var BATCH = 800;
    var found = false;
    for (var i = 0; i < BATCH; i++) {
      var privKey = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      var address;
      try {
        address = ethers.utils.computeAddress(privKey);
      } catch (_) {
        continue;
      }
      attempts++;
      var addrLower = address.toLowerCase();
      if (mode === "prefix" && addrLower.startsWith(pattern)) {
        found = true;
      } else if (mode === "suffix" && addrLower.endsWith(pattern)) {
        found = true;
      } else if (mode === "contains" && addrLower.includes(pattern)) {
        found = true;
      }
      if (found) {
        setRunning(false);
        var elapsedFound = ((Date.now() - startTime) / 1000).toFixed(1);
        if (options.onFound) {
          options.onFound({
            address: address,
            privateKey: privKey,
            attempts: attempts,
            elapsed: elapsedFound
          });
        }
        break;
      }
    }

    if (!found && running) {
      var elapsed = (Date.now() - startTime) / 1000;
      var speed = elapsed > 0.5 ? Math.round(attempts / elapsed) : "...";
      var est = "";
      if (typeof speed === "number" && speed > 0) {
        var hexLen = pattern.replace(/^0x/i, "").length;
        if (hexLen > 0) {
          var exp = Math.pow(16, hexLen);
          if (mode === "contains") exp = Math.max(1, exp / 38);
          var remSec = Math.max(0, Math.round((exp - attempts) / speed));
          est = remSec < 60 ? " | ~" + remSec + "s remaining"
            : remSec < 3600 ? " | ~" + Math.round(remSec / 60) + "m remaining"
            : " | ~" + Math.round(remSec / 3600) + "h remaining";
        }
      }
      if (options.onProgress) {
        options.onProgress("Attempts: " + attempts.toLocaleString() + " | " + speed + " keys/s" + est);
      }
      setTimeout(runBatch, 0);
    }
  }

  return {
    start: function (normalizedPattern, selectedMode) {
      pattern = normalizedPattern;
      mode = selectedMode;
      attempts = 0;
      startTime = Date.now();
      setRunning(true);
      if (options.onProgress) options.onProgress("Attempts: 0");
      setTimeout(runBatch, 0);
    },
    stop: function () {
      setRunning(false);
    },
    isRunning: function () {
      return running;
    }
  };
}
