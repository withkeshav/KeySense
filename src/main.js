(function () {
      initUiBasics();

      async function renderQr(hostEl, text) {
        if (!hostEl || !text) return;
        hostEl.innerHTML = "";
        if (typeof QRCode === "undefined" || !QRCode.toCanvas) return;
        try {
          var canvas = document.createElement("canvas");
          await new Promise(function (resolve, reject) {
            QRCode.toCanvas(canvas, text, { width: 120, margin: 1, color: { dark: "#000000", light: "#ffffff" } }, function (err) {
              if (err) reject(err);
              else resolve();
            });
          });
          hostEl.appendChild(canvas);
        } catch (e) {
          hostEl.textContent = "";
        }
      }

      function featureErrorText(feature, err, opts) {
        opts = opts || {};
        var raw = err && err.message ? err.message : String(err || "Something went wrong.");
        var isSlipPathError = /invalid derivation path/i.test(raw);
        var kind = opts.userInput || isSlipPathError ? "Input error" : "Unexpected error";
        var msg = raw;
        if (isSlipPathError) {
          msg = "SLIP-0010 (Ed25519/Solana) requires all path segments to be hardened. Use dev mode with Solana output override for auto-hardening, or ensure all segments end with ' in the custom path.";
        }
        return feature + " - " + kind + ": " + msg;
      }

      function showFeatureError(el, feature, err, opts) {
        if (!el) return;
        el.textContent = featureErrorText(feature, err, opts);
        el.style.display = "block";
      }

      function clearFeatureError(el) {
        if (!el) return;
        el.style.display = "none";
        el.textContent = "";
      }

      window.addEventListener("DOMContentLoaded", function () {
        var mnemonicInput = document.getElementById("mnemonic");
        var purposeInput = document.getElementById("purpose");
        var coinTypeInput = document.getElementById("coinType");
        var accountInput = document.getElementById("account");
        var changeInput = document.getElementById("change");
        var indexInput = document.getElementById("index");
        var deriveBtn = document.getElementById("derive");
        var addrSpan = document.getElementById("address");
        var pkSpan = document.getElementById("privateKey");
        var pathSpan = document.getElementById("fullPath");
        var errorDiv = document.getElementById("error");
        var successDiv = document.getElementById("success");
        var loadingDiv = document.getElementById("loading");
        var addressLabel = document.getElementById("addressLabel");
        var pkLabel = document.getElementById("privateKeyLabel");
        var wifBlock = document.getElementById("wifBlock");
        var wifOut = document.getElementById("wifOut");
        var tronEvmRow = document.getElementById("tronEvmRow");
        var tronEvmAddr = document.getElementById("tronEvmAddr");
        var pubKeyCompressed = document.getElementById("pubKeyCompressed");
        var pubKeyUncompressedWrap = document.getElementById("pubKeyUncompressedWrap");
        var pubKeyUncompressed = document.getElementById("pubKeyUncompressed");
        var solanaExtraWrap = document.getElementById("solanaExtraWrap");
        var solanaSecret64 = document.getElementById("solanaSecret64");
        var solanaKeyHint = document.getElementById("solanaKeyHint");
        var pubKeyLabel = document.getElementById("pubKeyLabel");
        var qrHost = document.getElementById("qrHost");
        var incrementIndex = document.getElementById("incrementIndex");
        var incrementAccount = document.getElementById("incrementAccount");

        var presets = {
          eth: { purpose: 44, coinType: 60, account: 0, change: 0, index: 0 },
          "btc-native": { purpose: 84, coinType: 0, account: 0, change: 0, index: 0 },
          "btc-legacy": { purpose: 44, coinType: 0, account: 0, change: 0, index: 0 },
          "btc-segwit": { purpose: 49, coinType: 0, account: 0, change: 0, index: 0 },
          solana: { purpose: 44, coinType: 501, account: 0, change: 0, index: 0 },
          ltc: { purpose: 44, coinType: 2, account: 0, change: 0, index: 0 },
          doge: { purpose: 44, coinType: 3, account: 0, change: 0, index: 0 },
          tron: { purpose: 44, coinType: 195, account: 0, change: 0, index: 0 },
          polygon: { purpose: 44, coinType: 60, account: 0, change: 0, index: 0 },
          bsc: { purpose: 44, coinType: 60, account: 0, change: 0, index: 0 },
          avalanche: { purpose: 44, coinType: 60, account: 0, change: 0, index: 0 }
        };

        document.querySelectorAll(".btn-preset").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var presetName = btn.getAttribute("data-preset");
            var preset = presets[presetName];
            if (!preset) return;
            purposeInput.value = preset.purpose;
            coinTypeInput.value = preset.coinType;
            accountInput.value = preset.account;
            changeInput.value = preset.change;
            indexInput.value = preset.index;
            /* If dev mode is on, clear the custom path so the preset path is actually used. */
            var devToggle = document.getElementById("devModeToggle");
            var devCp = document.getElementById("devCustomPath");
            if (devToggle && devToggle.checked && devCp) devCp.value = "";
            updatePathDisplay();
            updateSolanaUiHints();
            deriveKeys();
          });
        });

        function getEffectivePath() {
          var dvt = document.getElementById("devModeToggle");
          var dc = document.getElementById("devCustomPath");
          if (dvt && dvt.checked && dc) {
            var t = dc.value.trim().replace(/\s+/g, "");
            if (t) {
              if (!/^m\//i.test(t)) t = "m/" + t;
              return t;
            }
          }
          return buildPathFromInputs();
        }

        function updatePathDisplay() {
          pathSpan.textContent = getEffectivePath();
        }

        function clearDevDeriveExtras() {
          var xb = document.getElementById("devXpubBlock");
          var ub = document.getElementById("devUtxoAllBlock");
          if (xb) xb.style.display = "none";
          if (ub) ub.style.display = "none";
          var eo = document.getElementById("devExtKeyOut");
          var uo = document.getElementById("devUtxoAllOut");
          if (eo) eo.innerHTML = "";
          if (uo) uo.innerHTML = "";
        }

        function fillDevExtendedKeys(hdRoot, path) {
          var block = document.getElementById("devXpubBlock");
          var out = document.getElementById("devExtKeyOut");
          if (!block || !out) return;
          block.style.display = "block";
          try {
            var branchP = branchPathDropLastTwo(path);
            var branchN = hdRoot.derivePath(branchP);
            var leafN = hdRoot.derivePath(path);
            out.innerHTML =
              '<div class="dev-out-row"><span>Branch path</span><span>' + branchP + "</span></div>" +
              '<div class="dev-out-row"><span>Branch XPRV</span><span>' + branchN.extendedKey + "</span></div>" +
              '<div class="dev-out-row"><span>Branch XPUB</span><span>' + branchN.neuter().extendedKey + "</span></div>" +
              '<div class="dev-out-row"><span>Leaf path</span><span>' + path + "</span></div>" +
              '<div class="dev-out-row"><span>Leaf XPRV</span><span>' + leafN.extendedKey + "</span></div>" +
              '<div class="dev-out-row"><span>Leaf XPUB</span><span>' + leafN.neuter().extendedKey + "</span></div>";
          } catch (err) {
            out.innerHTML = '<span style="color:var(--error)">' + (err && err.message ? err.message : err) + "</span>";
          }
        }

        function fillDevUtxoAllFormats(secpPrivateKeyHex, devFmt, inferredCoin) {
          var block = document.getElementById("devUtxoAllBlock");
          var out = document.getElementById("devUtxoAllOut");
          if (!block || !out) return;
          var c = devUtxoCoinForAllFormats(devFmt, inferredCoin);
          if (c === null) {
            block.style.display = "none";
            return;
          }
          block.style.display = "block";
          var L = formatUtxoAddressPure(secpPrivateKeyHex, c, 44);
          var W = formatUtxoAddressPure(secpPrivateKeyHex, c, 49);
          var N = formatUtxoAddressPure(secpPrivateKeyHex, c, 84);
          out.innerHTML =
            '<div class="dev-out-row"><span>Legacy</span><span>' + L.address + "</span></div>" +
            '<div class="dev-out-row"><span>P2SH SegWit</span><span>' + W.address + "</span></div>" +
            '<div class="dev-out-row"><span>Native SegWit</span><span>' + N.address + "</span></div>" +
            '<div class="dev-out-row"><span>WIF</span><span>' + L.wif + "</span></div>";
        }

        async function deriveKeys() {
          clearFeatureError(errorDiv);
          successDiv.style.display = "none";
          successDiv.textContent = "";
          addrSpan.textContent = "Deriving…";
          pkSpan.textContent = "—";
          wifBlock.style.display = "none";
          wifOut.textContent = "—";
          if (tronEvmRow) tronEvmRow.style.display = "none";
          if (tronEvmAddr) tronEvmAddr.textContent = "—";
          if (pubKeyCompressed) pubKeyCompressed.textContent = "—";
          if (pubKeyUncompressedWrap) pubKeyUncompressedWrap.style.display = "none";
          if (pubKeyUncompressed) pubKeyUncompressed.textContent = "—";
          if (solanaExtraWrap) solanaExtraWrap.style.display = "none";
          if (solanaSecret64) solanaSecret64.textContent = "—";
          if (solanaKeyHint) solanaKeyHint.textContent = "";
          if (qrHost) qrHost.innerHTML = "";
          clearDevDeriveExtras();
          loadingDiv.style.display = "flex";

          var mnemonic = mnemonicInput.value.trim();
          if (!mnemonic) {
            showFeatureError(errorDiv, "Derive", "Enter a BIP39 mnemonic.", { userInput: true });
            loadingDiv.style.display = "none";
            addrSpan.textContent = "—";
            pkSpan.textContent = "—";
            wifBlock.style.display = "none";
            if (tronEvmRow) tronEvmRow.style.display = "none";
            if (pubKeyCompressed) pubKeyCompressed.textContent = "—";
            if (pubKeyUncompressedWrap) pubKeyUncompressedWrap.style.display = "none";
            if (solanaExtraWrap) solanaExtraWrap.style.display = "none";
            return;
          }

          try {
            if (!ethers.utils.isValidMnemonic(mnemonic)) {
              showFeatureError(errorDiv, "Derive", "Invalid BIP39 mnemonic (check words and checksum).", { userInput: true });
              loadingDiv.style.display = "none";
              addrSpan.textContent = "—";
              pkSpan.textContent = "—";
              wifBlock.style.display = "none";
              if (tronEvmRow) tronEvmRow.style.display = "none";
              if (pubKeyCompressed) pubKeyCompressed.textContent = "—";
              if (pubKeyUncompressedWrap) pubKeyUncompressedWrap.style.display = "none";
              if (solanaExtraWrap) solanaExtraWrap.style.display = "none";
              return;
            }

            updatePathDisplay();
            var path = getEffectivePath();

            var inferred = inferPurposeCoinFromPath(path);
            var purpose  = inferred ? inferred.purpose  : parseInt(purposeInput.value,  10);
            var coinType = inferred ? inferred.coinType : parseInt(coinTypeInput.value, 10);

            var passphraseEl = document.getElementById("bip39Pass");
            var passphrase = passphraseEl ? passphraseEl.value : "";

            var devToggle = document.getElementById("devModeToggle");
            var devFormatEl = document.getElementById("devOutputFormat");
            var devFmt = devToggle && devToggle.checked && devFormatEl ? devFormatEl.value : "auto";

            var hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic, passphrase);
            var secpPrivateHex = hdNode.derivePath(path).privateKey;

            var result = await applyDevOutputFormat(mnemonic, path, passphrase, secpPrivateHex, purpose, coinType, devFmt);

            var uiCoin = uiCoinTypeFromDevFmt(devFmt, coinType);

            addressLabel.textContent = result.addressLabel;
            if (uiCoin === 501) {
              pkLabel.textContent = "Private key (32-byte Ed25519 seed, hex)";
            } else if (uiCoin === 195) {
              pkLabel.textContent = "Private key (secp256k1, hex)";
            } else if (uiCoin === 60) {
              pkLabel.textContent = "Private key (secp256k1, hex)";
            } else if (uiCoin === 0 || uiCoin === 2 || uiCoin === 3) {
              pkLabel.textContent = "Private key (secp256k1, hex)";
            } else if (uiCoin === -1) {
              pkLabel.textContent = "Private key (secp256k1, hex)";
            } else {
              pkLabel.textContent = "Private key";
            }
            addrSpan.textContent = result.address;
            pkSpan.textContent = result.privateHex;

            if (result.wif) {
              wifBlock.style.display = "block";
              wifOut.textContent = result.wif;
            } else {
              wifBlock.style.display = "none";
            }

            if (uiCoin === 195 && result.evmStyleAddress && tronEvmRow && tronEvmAddr) {
              tronEvmRow.style.display = "block";
              tronEvmAddr.textContent = result.evmStyleAddress;
            } else if (tronEvmRow) {
              tronEvmRow.style.display = "none";
            }

            if (pubKeyLabel) {
              if (uiCoin === 501) pubKeyLabel.textContent = "Public key (Ed25519, raw 32-byte hex)";
              else pubKeyLabel.textContent = "Public key (compressed secp256k1, SEC1 hex)";
            }
            if (pubKeyCompressed) pubKeyCompressed.textContent = result.publicKeyHex || "—";
            if (result.publicKeyUncompressedHex && pubKeyUncompressedWrap && pubKeyUncompressed) {
              pubKeyUncompressedWrap.style.display = "block";
              pubKeyUncompressed.textContent = result.publicKeyUncompressedHex;
            } else if (pubKeyUncompressedWrap) {
              pubKeyUncompressedWrap.style.display = "none";
            }

            if (uiCoin === 501 && result.solanaSecret64Hex && solanaExtraWrap && solanaSecret64) {
              solanaExtraWrap.style.display = "block";
              solanaSecret64.textContent = result.solanaSecret64Hex;
              if (solanaKeyHint) solanaKeyHint.textContent = result.keyFormatNote || "";
            } else if (solanaExtraWrap) {
              solanaExtraWrap.style.display = "none";
            }

            if (result.rawOnly) {
              if (qrHost) qrHost.innerHTML = "";
            } else {
              await renderQr(qrHost, result.address);
            }

            if (devToggle && devToggle.checked) {
              fillDevExtendedKeys(hdNode, path);   // reuse already-computed hdNode — no extra PBKDF2
              fillDevUtxoAllFormats(secpPrivateHex, devFmt, coinType);
            }

            var displayPath = result.resolvedPath || path;
            successDiv.textContent = "Derived path: " + displayPath +
              (result.pathNote ? "  —  " + result.pathNote : "");
            successDiv.style.display = "block";
          } catch (e) {
            console.error(e);
            showFeatureError(errorDiv, "Derive", e);
            addrSpan.textContent = "—";
            pkSpan.textContent = "—";
            if (tronEvmRow) tronEvmRow.style.display = "none";
            if (pubKeyCompressed) pubKeyCompressed.textContent = "—";
            if (pubKeyUncompressedWrap) pubKeyUncompressedWrap.style.display = "none";
            if (solanaExtraWrap) solanaExtraWrap.style.display = "none";
            if (qrHost) qrHost.innerHTML = "";
          } finally {
            loadingDiv.style.display = "none";
          }
        }

        var gen12 = document.getElementById("genMnemonic12");
        var gen24 = document.getElementById("genMnemonic24");
        if (gen12) gen12.addEventListener("click", function () { mnemonicInput.value = randomMnemonic(12); });
        if (gen24) gen24.addEventListener("click", function () { mnemonicInput.value = randomMnemonic(24); });
        if (mnemonicInput && !mnemonicInput.value.trim()) {
          mnemonicInput.value = randomMnemonic(12);
        }

        deriveBtn.addEventListener("click", deriveKeys);

        incrementIndex.addEventListener("click", function () {
          indexInput.value = parseInt(indexInput.value, 10) + 1;
          updatePathDisplay();
          updateSolanaUiHints();
          deriveKeys();
        });

        incrementAccount.addEventListener("click", function () {
          accountInput.value = parseInt(accountInput.value, 10) + 1;
          updatePathDisplay();
          updateSolanaUiHints();
          deriveKeys();
        });

        [purposeInput, coinTypeInput, accountInput, changeInput, indexInput].forEach(function (el) {
          el.addEventListener("input", function () {
            updatePathDisplay();
            updateSolanaUiHints();
          });
        });

        coinTypeInput.addEventListener("input", updateSolanaUiHints);

        var bip39PassEl = document.getElementById("bip39Pass");
        [mnemonicInput, purposeInput, coinTypeInput, accountInput, changeInput, indexInput, bip39PassEl].forEach(function (el) {
          if (!el) return;
          el.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
              e.preventDefault();
              deriveKeys();
            }
          });
        });

        updatePathDisplay();
        updateSolanaUiHints();

        /* ── Developer mode (optional panel; hidden until checkbox) ─────────── */
        (function () {
          var devModeToggle = document.getElementById("devModeToggle");
          var devModePanel = document.getElementById("devModePanel");
          if (devModeToggle && devModePanel) {
            devModeToggle.addEventListener("change", function () {
              var on = devModeToggle.checked;
              devModePanel.classList.toggle("active", on);
              devModePanel.setAttribute("aria-hidden", on ? "false" : "true");
              if (on) {
                var dc = document.getElementById("devCustomPath");
                if (dc && !dc.value.trim()) dc.value = buildPathFromInputs();
                updatePathDisplay();
              }
            });
          }
          var devCustomPathEl = document.getElementById("devCustomPath");
          if (devCustomPathEl) {
            devCustomPathEl.addEventListener("input", function () {
              if (devModeToggle && devModeToggle.checked) updatePathDisplay();
            });
          }
          var devSyncPathBtn = document.getElementById("devSyncPathBtn");
          if (devSyncPathBtn) {
            devSyncPathBtn.addEventListener("click", function () {
              var dc = document.getElementById("devCustomPath");
              if (dc) dc.value = buildPathFromInputs();
              updatePathDisplay();
            });
          }
          var devBatchBtn = document.getElementById("devBatchBtn");
          if (devBatchBtn) {
            devBatchBtn.addEventListener("click", async function () {
              var errEl = document.getElementById("error");
              var mnemonic = mnemonicInput.value.trim();
              if (!mnemonic || !ethers.utils.isValidMnemonic(mnemonic)) {
                showFeatureError(errEl, "Dev batch", "Enter a valid mnemonic first.", { userInput: true });
                return;
              }
              var from = parseInt(document.getElementById("devBatchFrom").value, 10);
              var to = parseInt(document.getElementById("devBatchTo").value, 10);
              if (isNaN(from) || isNaN(to) || from > to) {
                showFeatureError(errEl, "Dev batch", "Invalid batch range (from <= to).", { userInput: true });
                return;
              }
              if (to - from + 1 > 50) {
                showFeatureError(errEl, "Dev batch", "Max 50 rows per batch (to - from + 1 <= 50).", { userInput: true });
                return;
              }
              var passphraseEl = document.getElementById("bip39Pass");
              var passphrase = passphraseEl ? passphraseEl.value : "";
              var devFormatEl = document.getElementById("devOutputFormat");
              var devFmt = devFormatEl ? devFormatEl.value : "auto";
              var basePath = getEffectivePath();
              var tbody = document.getElementById("devBatchTbody");
              var wrap = document.getElementById("devBatchTableWrap");
              if (!tbody || !wrap) return;
              tbody.innerHTML = "";
              clearFeatureError(errEl);
              try {
                var hd = ethers.utils.HDNode.fromMnemonic(mnemonic, passphrase);
                for (var bi = from; bi <= to; bi++) {
                  var bp = pathWithLastIndexReplaced(basePath, bi);
                  var inf = inferPurposeCoinFromPath(bp);
                  var purp = inf ? inf.purpose : parseInt(purposeInput.value, 10);
                  var ct = inf ? inf.coinType : parseInt(coinTypeInput.value, 10);
                  var node = hd.derivePath(bp);
                  var pk = node.privateKey;
                  var res = await applyDevOutputFormat(mnemonic, bp, passphrase, pk, purp, ct, devFmt);
                  var tr = document.createElement("tr");
                  var addrDisp = res.rawOnly ? "—" : res.address;
                  var displayPath = res.resolvedPath || bp;
                  tr.innerHTML = "<td>" + bi + "</td><td>" + displayPath + "</td><td>" + addrDisp + "</td><td>" + res.privateHex + "</td>";
                  tbody.appendChild(tr);
                }
                wrap.style.display = "block";
              } catch (be) {
                showFeatureError(errEl, "Dev batch", be);
              }
            });
          }
          var devExtDeriveBtn = document.getElementById("devExtDeriveBtn");
          if (devExtDeriveBtn) {
            devExtDeriveBtn.addEventListener("click", function () {
              var out = document.getElementById("devExtKeyResult");
              var errEl = document.getElementById("error");
              var ext = document.getElementById("devExtKeyInput");
              var cp = document.getElementById("devExtChildPath");
              if (!out || !ext) return;
              var keyStr = ext.value.trim();
              var childPath = cp && cp.value.trim() ? cp.value.trim() : "m/0/0";
              if (!keyStr) {
                out.style.display = "block";
                out.textContent = featureErrorText("Dev extended key", "Paste an xpub or xprv.", { userInput: true });
                return;
              }
              try {
                var root = ethers.utils.HDNode.fromExtendedKey(keyStr);
                var child = deriveFromRelativePath(root, childPath);
                var lines = [];
                lines.push("Resolved child path: " + (childPath.indexOf("m/") === 0 ? childPath : "m/" + childPath.replace(/^m\//i, "")));
                if (child.privateKey) {
                  lines.push("Private key: " + child.privateKey);
                  lines.push("EVM address: " + new ethers.Wallet(child.privateKey).address);
                } else {
                  lines.push("(XPUB only — no private key on this node)");
                  var pub = child.publicKey;
                  if (pub) {
                    try {
                      lines.push("EVM address (from pubkey): " + ethers.utils.computeAddress(pub));
                    } catch (_pe) {
                      lines.push("EVM address (from pubkey): (could not compute)");
                    }
                  }
                }
                lines.push("Node extended key: " + child.extendedKey);
                out.style.display = "block";
                out.textContent = lines.join("\n");
                clearFeatureError(errEl);
              } catch (xe) {
                out.style.display = "block";
                out.textContent = featureErrorText("Dev extended key", xe, { userInput: true });
              }
            });
          }
        })();

        /* ── VANITY MINER ───────────────────────────────────────────────────── */
        var vanityPattern = document.getElementById("vanityPattern");
        var vanityStart  = document.getElementById("vanityStart");
        var vanityStop   = document.getElementById("vanityStop");
        var vanityStats  = document.getElementById("vanityStats");
        var vanityError  = document.getElementById("vanityError");
        var vanityResult = document.getElementById("vanityResult");
        var vanityAddress    = document.getElementById("vanityAddress");
        var vanityPrivateKey = document.getElementById("vanityPrivateKey");
        var vanityQrHost     = document.getElementById("vanityQrHost");
        var vanityDiffHint   = document.getElementById("vanityDiffHint");
        var vanityInputLabelEl = document.getElementById("vanityInputLabel");

        function updateVanityHint() {
          var mode = getSelectedVanityMode();
          var raw = vanityPattern ? vanityPattern.value.trim() : "";
          if (vanityInputLabelEl) {
            vanityInputLabelEl.textContent = vanityInputLabel(mode);
          }
          if (vanityDiffHint) {
            var d = vanityDifficulty(raw, mode);
            vanityDiffHint.textContent = d || "";
            vanityDiffHint.style.display = d ? "block" : "none";
          }
        }

        function setVanityControls(r) {
          if (vanityStart) vanityStart.disabled = r;
          if (vanityStop)  vanityStop.disabled  = !r;
        }

        var vanityMiner = createVanityMiner({
          onRunningChange: setVanityControls,
          onProgress: function (txt) {
            vanityStats.textContent = txt;
          },
          onFound: function (result) {
            vanityStats.textContent = "Found in " + result.attempts.toLocaleString() + " attempts (" + result.elapsed + "s)";
            vanityAddress.textContent = result.address;
            vanityPrivateKey.textContent = result.privateKey;
            vanityResult.style.display = "block";
            renderQr(vanityQrHost, result.address);
          }
        });

        /* Update hint when mode or pattern changes */
        document.querySelectorAll("input[name='vanityMode']").forEach(function (r) {
          r.addEventListener("change", updateVanityHint);
        });
        if (vanityPattern) vanityPattern.addEventListener("input", updateVanityHint);
        updateVanityHint();

        if (vanityStart) {
          vanityStart.addEventListener("click", function () {
            clearFeatureError(vanityError);
            try {
              var mode = getSelectedVanityMode();
              var rawInput = vanityPattern ? vanityPattern.value.trim() : "";
              var norm = normalizeVanityPattern(rawInput, mode);
              vanityResult.style.display = "none";
              if (vanityQrHost) vanityQrHost.innerHTML = "";
              vanityMiner.start(norm, mode);
            } catch (ve) {
              showFeatureError(vanityError, "Vanity", ve, { userInput: true });
            }
          });
        }

        if (vanityStop) {
          vanityStop.addEventListener("click", function () {
            vanityMiner.stop();
            vanityStats.textContent = (vanityStats.textContent || "") + " — stopped";
          });
        }

        /* ── BRAIN WALLET ───────────────────────────────────────────────────── */
        var brainPass       = document.getElementById("brainPass");
        var brainBip39Pass  = document.getElementById("brainBip39Pass");
        var brainAccountEl  = document.getElementById("brainAccount");
        var brainAddrIdxEl  = document.getElementById("brainAddrIndex");
        var brainCompute    = document.getElementById("brainCompute");
        var brainError      = document.getElementById("brainError");
        var brainOutput     = document.getElementById("brainOutput");
        var brainMnemonic   = document.getElementById("brainMnemonic");
        var brainAddress    = document.getElementById("brainAddress");
        var brainPrivateKey = document.getElementById("brainPrivateKey");
        var brainQrHost     = document.getElementById("brainQrHost");
        var brainBtcLeg     = document.getElementById("brainBtcLeg");
        var brainBtcSw      = document.getElementById("brainBtcSw");
        var brainBtcWif     = document.getElementById("brainBtcWif");
        var brainTrx        = document.getElementById("brainTrx");
        var brainSol        = document.getElementById("brainSol");
        var brainStrengthWrap = document.getElementById("brainStrengthWrap");
        var brainStrengthBar  = document.getElementById("brainStrengthBar");
        var brainStrengthLabel = document.getElementById("brainStrengthLabel");
        var brainComputeRequestId = 0;

        if (brainPass) {
          brainPass.addEventListener("input", function () {
            var t = brainPass.value;
            if (!t) { if (brainStrengthWrap) brainStrengthWrap.style.display = "none"; return; }
            if (brainStrengthWrap) brainStrengthWrap.style.display = "block";
            var info = brainStrengthInfo(t);
            if (brainStrengthBar)   { brainStrengthBar.style.width = info.pct + "%"; brainStrengthBar.style.background = info.color; }
            if (brainStrengthLabel) { brainStrengthLabel.textContent = info.label; brainStrengthLabel.style.color = info.color; }
          });
        }

        if (brainCompute) {
          brainCompute.addEventListener("click", async function () {
            brainComputeRequestId += 1;
            var currentRequestId = brainComputeRequestId;
            clearFeatureError(brainError);
            var t = brainPass ? brainPass.value : "";
            if (!t.trim()) {
              showFeatureError(brainError, "Brain Wallet", "Enter a source passphrase.", { userInput: true });
              return;
            }
            if (!crypto || !crypto.subtle) {
              showFeatureError(brainError, "Brain Wallet", "SHA-256 needs HTTPS or localhost - open via Cloudflare Pages or a local server, not file://.", { userInput: true });
              return;
            }
            try {
              var bip39Extra = brainBip39Pass ? brainBip39Pass.value : "";
              var account    = brainAccountEl  ? Math.max(0, parseInt(brainAccountEl.value,  10) || 0) : 0;
              var addrIdx    = brainAddrIdxEl  ? Math.max(0, parseInt(brainAddrIdxEl.value, 10) || 0) : 0;

              var brain = await deriveBrainWalletData(t, bip39Extra, account, addrIdx);
              brainMnemonic.textContent = brain.phrase;
              var setPathLabel = function(id, p) { var el = document.getElementById(id); if (el) el.textContent = p; };
              setPathLabel("brainEthPath", brain.paths.ethPath);
              setPathLabel("brainBtcLegPath", brain.paths.btcLPath);
              setPathLabel("brainBtcSwPath", brain.paths.btcSPath);
              setPathLabel("brainTrxPath", brain.paths.trxPath);
              setPathLabel("brainSolPath", brain.paths.solPath);

              brainAddress.textContent = brain.ethAddress;
              brainPrivateKey.textContent = brain.ethPrivateKey;
              if (brainBtcLeg) brainBtcLeg.textContent = brain.btcLegacyAddress;
              if (brainBtcSw) brainBtcSw.textContent = brain.btcNativeAddress;
              if (brainBtcWif) brainBtcWif.textContent = brain.btcWif;
              if (brainTrx) brainTrx.textContent = brain.tronAddress;

              if (brainSol) brainSol.textContent = "Deriving…";
              brainOutput.style.display = "block";
              await renderQr(brainQrHost, brain.ethAddress);
              if (currentRequestId !== brainComputeRequestId) return;

              (async function () {
                try {
                  var solPromise = deriveBrainSolAddress(brain.phrase, brain.paths.solPath, bip39Extra);
                  var timeoutPromise = new Promise(function (_, reject) {
                    setTimeout(function () { reject(new Error("Solana derivation timed out")); }, 15000);
                  });
                  var solAddr = await Promise.race([solPromise, timeoutPromise]);
                  if (currentRequestId !== brainComputeRequestId) return;
                  if (brainSol) brainSol.textContent = solAddr;
                } catch (se) {
                  if (currentRequestId !== brainComputeRequestId) return;
                  if (brainSol) brainSol.textContent = featureErrorText("Brain Wallet", se);
                }
              })();

            } catch (e) {
              showFeatureError(brainError, "Brain Wallet", e);
            }
          });
        }
      });
    })();
