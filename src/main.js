(function () {
      initUiBasics();

      /* ── SEED BAR SYNC ────────────────────────────────────────────────
       * The seed bar is a sticky, read-only display of the current mnemonic.
       * It stays visible on scroll and tab change so the seed is always in view.
       * No controls here - the Generate button lives only in the Derive tab Step 1. */
      var seedBarValue = document.getElementById("seedBarValue");
      function syncSeedBar() {
        var mn = document.getElementById("mnemonic");
        var v = (mn && mn.value.trim()) || "";
        if (seedBarValue) {
          if (v) {
            seedBarValue.textContent = v.length > 64 ? v.slice(0, 61) + "..." : v;
            seedBarValue.classList.remove("seed-bar-empty");
          } else {
            seedBarValue.textContent = "No seed generated - click Generate in the Derive tab";
            seedBarValue.classList.add("seed-bar-empty");
          }
        }
      }
      var mnInput = document.getElementById("mnemonic");
      if (mnInput) {
        mnInput.addEventListener("input", syncSeedBar);
        mnInput.addEventListener("change", syncSeedBar);
      }
      syncSeedBar();

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
          "btc-taproot": { purpose: 86, coinType: 0, account: 0, change: 0, index: 0 },
          solana: { purpose: 44, coinType: 501, account: 0, change: 0, index: 0 },
          ltc: { purpose: 44, coinType: 2, account: 0, change: 0, index: 0 },
          doge: { purpose: 44, coinType: 3, account: 0, change: 0, index: 0 },
          tron: { purpose: 44, coinType: 195, account: 0, change: 0, index: 0 },
          polygon: { purpose: 44, coinType: 60, account: 0, change: 0, index: 0 },
          bsc: { purpose: 44, coinType: 60, account: 0, change: 0, index: 0 },
          avalanche: { purpose: 44, coinType: 60, account: 0, change: 0, index: 0 },
          cosmos: { purpose: 44, coinType: 118, account: 0, change: 0, index: 0 },
          sui: { purpose: 44, coinType: SUI_COIN_TYPE, account: 0, change: 0, index: 0 },
          aptos: { purpose: 44, coinType: APTOS_COIN_TYPE, account: 0, change: 0, index: 0 }
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
            } else if (uiCoin === SUI_COIN_TYPE || uiCoin === APTOS_COIN_TYPE) {
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
              if (uiCoin === 501 || uiCoin === SUI_COIN_TYPE || uiCoin === APTOS_COIN_TYPE) pubKeyLabel.textContent = "Public key (Ed25519, raw 32-byte hex)";
              else pubKeyLabel.textContent = "Public key (compressed secp256k1, SEC1 hex)";
            }
            if (pubKeyCompressed) pubKeyCompressed.textContent = result.publicKeyHex || "—";
            if (result.publicKeyUncompressedHex && pubKeyUncompressedWrap && pubKeyUncompressed) {
              pubKeyUncompressedWrap.style.display = "block";
              pubKeyUncompressed.textContent = result.publicKeyUncompressedHex;
            } else if (pubKeyUncompressedWrap) {
              pubKeyUncompressedWrap.style.display = "none";
            }

            if ((uiCoin === 501 || uiCoin === SUI_COIN_TYPE || uiCoin === APTOS_COIN_TYPE) && result.solanaSecret64Hex && solanaExtraWrap && solanaSecret64) {
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
               fillDevExtendedKeys(hdNode, path);   // reuse already-computed hdNode - no extra PBKDF2
              fillDevUtxoAllFormats(secpPrivateHex, devFmt, coinType);
            }

            var displayPath = result.resolvedPath || path;
            successDiv.textContent = "Derived path: " + displayPath +
              (result.pathNote ? "  -  " + result.pathNote : "");
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

        var genBtn = document.getElementById("genMnemonic");
        var wordCountSelect = document.getElementById("mnemonicWordCount");
        var langSelect = document.getElementById("mnemonicLang");
        if (genBtn) genBtn.addEventListener("click", function () {
          mnemonicInput.value = randomMnemonic(parseInt(wordCountSelect.value, 10), langSelect.value);
          syncSeedBar();
        });

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
                   lines.push("(XPUB only - no private key on this node)");
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

        /* ── TOAST + COPY FEEDBACK ───────────────────────────────────────── */
        var toastEl = document.getElementById("toast");
        var toastTimer = null;
        function showToast(msg) {
          if (!toastEl) return;
          toastEl.textContent = msg;
          toastEl.classList.add("show");
          if (toastTimer) clearTimeout(toastTimer);
          toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2000);
        }
        /* Wrap clipboard writes with toast feedback where copy buttons exist.
         * Kept minimal: any element with data-copy attribute gets a click handler. */
        document.querySelectorAll("[data-copy]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var target = btn.getAttribute("data-copy");
            var el = document.getElementById(target);
            if (el && el.textContent && navigator.clipboard) {
              navigator.clipboard.writeText(el.textContent).then(function () {
                showToast("\u2713 Copied to clipboard");
              }).catch(function () {});
            }
          });
        });

        /* ── EXPERT MODE TOGGLE + ENTROPY ACCORDION ──────────────────────── */
        var expertModeToggle = document.getElementById("expertModeToggle");
        var entropyAccord = document.getElementById("entropyAccord");
        var entropyHeader = document.getElementById("entropyHeader");
        var entropyBody = document.getElementById("entropyBody");

        function setAccordion(headerEl, bodyEl, open) {
          if (!headerEl || !bodyEl) return;
          if (open) {
            headerEl.classList.remove("acc-closed");
            headerEl.classList.add("open");
            headerEl.setAttribute("aria-expanded", "true");
            bodyEl.classList.remove("acc-closed");
          } else {
            headerEl.classList.add("acc-closed");
            headerEl.classList.remove("open");
            headerEl.setAttribute("aria-expanded", "false");
            bodyEl.classList.add("acc-closed");
          }
        }
        function toggleAccordion(which) {
          if (which === "entropy") {
            var openEnt = entropyBody.classList.contains("acc-closed");
            setAccordion(entropyHeader, entropyBody, openEnt);
          }
        }
        if (expertModeToggle) {
          expertModeToggle.addEventListener("change", function () {
            if (entropyAccord) {
              entropyAccord.style.display = expertModeToggle.checked ? "" : "none";
              if (!expertModeToggle.checked) {
                setAccordion(entropyHeader, entropyBody, false);
              }
            }
          });
        }
        if (entropyHeader) {
          entropyHeader.addEventListener("click", function () { toggleAccordion("entropy"); });
          entropyHeader.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleAccordion("entropy"); }
          });
        }

        /* ── BIP39 TYPO FIXER + 12TH WORD FINDER ─────────────────────────── */
        var typoCheckBtn = document.getElementById("typoCheckBtn");
        var find12thBtn = document.getElementById("find12thBtn");
        var find24thBtn = document.getElementById("find24thBtn");
        var typoSuggestOut = document.getElementById("typoSuggestOut");
        var wordFinderOut = document.getElementById("wordFinderOut");

        function currentLang() {
          var ls = document.getElementById("mnemonicLang");
          return ls ? ls.value : "en";
        }

        if (typoCheckBtn) typoCheckBtn.addEventListener("click", function () {
          var mn = mnemonicInput.value.trim();
          if (!mn) { if (typoSuggestOut) { typoSuggestOut.style.display = "block"; typoSuggestOut.innerHTML = '<p class="hint">Enter a mnemonic first.</p>'; } return; }
          var res = suggestMnemonicFixes(mn, currentLang());
          if (!typoSuggestOut) return;
          typoSuggestOut.style.display = "block";
          if (res.isValid) {
            typoSuggestOut.innerHTML = '<p class="hint" style="color:var(--success);">Mnemonic is valid.</p>';
            return;
          }
          if (res.checksumOnly) {
            typoSuggestOut.innerHTML = '<p class="hint" style="color:var(--error);">All words are valid but the checksum failed. The word order may be wrong, or extra/missing words.</p>';
            return;
          }
          var html = '<p class="hint" style="margin-bottom:8px;">Found ' + res.suggestions.length + ' word(s) not in the wordlist:</p>';
          res.suggestions.forEach(function (s) {
            html += '<div style="margin-bottom:8px;padding:8px;border:1px solid var(--border);border-radius:var(--radius-sm);">';
            html += '<div class="hint">Word #' + (s.index + 1) + ': <code style="font-family:var(--mono);color:var(--error);">' + s.original + '</code></div>';
            html += '<div style="margin-top:4px;">';
            s.candidates.forEach(function (c) {
              html += '<button type="button" class="btn-secondary" data-fix-index="' + s.index + '" data-fix-word="' + c.word + '" style="margin:2px;font-size:12px;">' + c.word + ' (d=' + c.distance + ')</button>';
            });
            html += '</div></div>';
          });
          typoSuggestOut.innerHTML = html;
          typoSuggestOut.querySelectorAll("[data-fix-index]").forEach(function (b) {
            b.addEventListener("click", function () {
              var idx = parseInt(b.getAttribute("data-fix-index"), 10);
              var w = b.getAttribute("data-fix-word");
              var words = mnemonicInput.value.trim().split(/\s+/);
              words[idx] = w;
              mnemonicInput.value = words.join(" ");
              showToast("Replaced word " + (idx + 1));
            });
          });
        });

        if (find12thBtn) find12thBtn.addEventListener("click", function () {
          var mn = mnemonicInput.value.trim();
          if (!wordFinderOut) return;
          var words = mn.split(/\s+/);
          if (words.length < 11) {
            wordFinderOut.style.display = "block";
            wordFinderOut.innerHTML = '<p class="hint" style="color:var(--error);">Enter at least 11 words first.</p>';
            return;
          }
          var first11 = words.slice(0, 11).join(" ");
          wordFinderOut.style.display = "block";
          wordFinderOut.innerHTML = '<p class="hint">Scanning all 2048 candidates...</p>';
          setTimeout(function () {
            var r = findValid12thWords(first11, currentLang());
            if (r.error) { wordFinderOut.innerHTML = '<p class="hint" style="color:var(--error);">' + r.error + '</p>'; return; }
            var html = '<p class="hint" style="margin-bottom:8px;">Found ' + r.validCount + ' valid 12th words:</p>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
            r.validWords.forEach(function (w) {
              html += '<button type="button" class="btn-secondary" data-append-word="' + w + '" style="font-size:12px;">' + w + '</button>';
            });
            html += '</div>';
            wordFinderOut.innerHTML = html;
            wordFinderOut.querySelectorAll("[data-append-word]").forEach(function (b) {
              b.addEventListener("click", function () {
                var w = b.getAttribute("data-append-word");
                var cur = mnemonicInput.value.trim().split(/\s+/);
                cur[11] = w;
                mnemonicInput.value = cur.slice(0, 12).join(" ");
                showToast("12th word set");
              });
            });
          }, 30);
        });

        if (find24thBtn) find24thBtn.addEventListener("click", function () {
          var mn = mnemonicInput.value.trim();
          if (!wordFinderOut) return;
          var words = mn.split(/\s+/);
          if (words.length < 23) {
            wordFinderOut.style.display = "block";
            wordFinderOut.innerHTML = '<p class="hint" style="color:var(--error);">Enter at least 23 words first.</p>';
            return;
          }
          var first23 = words.slice(0, 23).join(" ");
          wordFinderOut.style.display = "block";
          wordFinderOut.innerHTML = '<p class="hint">Scanning all 2048 candidates (24th word)...</p>';
          setTimeout(function () {
            var r = findValid24thWords(first23, currentLang());
            if (r.error) { wordFinderOut.innerHTML = '<p class="hint" style="color:var(--error);">' + r.error + '</p>'; return; }
            var show = r.validWords.slice(0, 40);
            var html = '<p class="hint" style="margin-bottom:8px;">Found ' + r.validCount + ' valid 24th words (showing first ' + show.length + '):</p>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:6px;max-height:160px;overflow-y:auto;">';
            show.forEach(function (w) {
              html += '<button type="button" class="btn-secondary" data-append-word24="' + w + '" style="font-size:11px;">' + w + '</button>';
            });
            html += '</div>';
            wordFinderOut.innerHTML = html;
            wordFinderOut.querySelectorAll("[data-append-word24]").forEach(function (b) {
              b.addEventListener("click", function () {
                var w = b.getAttribute("data-append-word24");
                var cur = mnemonicInput.value.trim().split(/\s+/);
                cur[23] = w;
                mnemonicInput.value = cur.slice(0, 24).join(" ");
                showToast("24th word set");
              });
            });
          }, 30);
        });

        /* ── PHYSICAL ENTROPY GENERATOR ──────────────────────────────────── */
        var diceInput = document.getElementById("diceInput");
        var coinInput = document.getElementById("coinInput");
        var entropyWordsSel = document.getElementById("entropyWords");
        var entropyGenBtn = document.getElementById("entropyGenBtn");
        var entropyProgress = document.getElementById("entropyProgress");
        var entropyErrorEl = document.getElementById("entropyError");
        var rollDiceBtn = document.getElementById("rollDiceBtn");
        var flipCoinBtn = document.getElementById("flipCoinBtn");
        var rollManyBtn = document.getElementById("rollManyBtn");
        var clearEntropyBtn = document.getElementById("clearEntropyBtn");
        var entropyStage = document.getElementById("entropyStage");
        var diceFaceEl = document.getElementById("diceFace");
        var coinFaceEl = document.getElementById("coinFace");
        var entropyBar = document.getElementById("entropyBar");
        var entropyMuted = false;

        /* Web Audio sound engine - synthesized, no external files.
         * A single lazy AudioContext created on first user gesture. */
        var audioCtx = null;
        function getAudio() {
          if (audioCtx) return audioCtx;
          try {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
          } catch (e) { audioCtx = null; }
          return audioCtx;
        }
        function playTone(freq, dur, type, vol) {
          if (entropyMuted) return;
          var ctx = getAudio();
          if (!ctx) return;
          try {
            if (ctx.state === "suspended") ctx.resume();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = type || "sine";
            osc.frequency.value = freq;
            gain.gain.value = vol || 0.12;
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + dur);
          } catch (e) {}
        }
        function diceClack() {
          playTone(180, 0.08, "square", 0.10);
          setTimeout(function () { playTone(120, 0.06, "square", 0.08); }, 60);
        }
        function coinDing() {
          playTone(880, 0.12, "triangle", 0.14);
          setTimeout(function () { playTone(1320, 0.18, "triangle", 0.10); }, 80);
        }
        function successChime() {
          playTone(523, 0.12, "sine", 0.12);
          setTimeout(function () { playTone(659, 0.12, "sine", 0.12); }, 110);
          setTimeout(function () { playTone(784, 0.22, "sine", 0.12); }, 220);
        }

        /* Render a dice face with the pip grid (3x3). val is 1-6. */
        function renderDiceFace(val) {
          if (!diceFaceEl) return;
          diceFaceEl.hidden = false;
          if (coinFaceEl) coinFaceEl.hidden = true;
          diceFaceEl.setAttribute("data-val", String(val));
          diceFaceEl.innerHTML =
            '<div class="dice-pip pip-tl"></div><div class="dice-pip pip-tr"></div><div class="dice-pip pip-ml"></div>' +
            '<div class="dice-pip pip-c"></div><div class="dice-pip pip-mr"></div>' +
            '<div class="dice-pip pip-bl"></div><div class="dice-pip pip-br"></div>';
          diceFaceEl.classList.remove("rolling");
          void diceFaceEl.offsetWidth;  /* force reflow so animation restarts */
          diceFaceEl.classList.add("rolling");
        }
        function renderCoinFace(val) {
          if (!coinFaceEl) return;
          coinFaceEl.hidden = false;
          if (diceFaceEl) diceFaceEl.hidden = true;
          coinFaceEl.textContent = val;
          coinFaceEl.classList.remove("flipping");
          void coinFaceEl.offsetWidth;
          coinFaceEl.classList.add("flipping");
        }
        function clearStage() {
          if (diceFaceEl) diceFaceEl.hidden = true;
          if (coinFaceEl) coinFaceEl.hidden = true;
        }

        function updateEntropyProgress() {
          if (!entropyProgress) return;
          var wc = entropyWordsSel ? parseInt(entropyWordsSel.value, 10) : 12;
          var needed = bitsNeededForWords(wc);
          var rolls = diceInput ? diceInput.value.trim() : "";
          var flips = coinInput ? coinInput.value.trim() : "";
          var bits = 0;
          if (rolls) bits += bitsCollectedFromDice(rolls);
          if (flips) bits += bitsCollectedFromCoins(flips);
          entropyProgress.textContent = entropyProgressHtml(bits, needed);
          if (entropyBar) {
            var pct = Math.min(100, Math.round((bits / needed) * 100));
            entropyBar.style.width = pct + "%";
            if (pct >= 100) entropyBar.classList.add("full");
            else entropyBar.classList.remove("full");
          }
        }
        if (diceInput) diceInput.addEventListener("input", updateEntropyProgress);
        if (coinInput) coinInput.addEventListener("input", updateEntropyProgress);
        if (entropyWordsSel) entropyWordsSel.addEventListener("change", updateEntropyProgress);
        updateEntropyProgress();

        /* Append one char to the active input and trigger the visual+sound. */
        function appendRoll(mode, ch) {
          if (mode === "dice") {
            if (diceInput) {
              diceInput.value += ch;
              diceInput.dispatchEvent(new Event("input"));
            }
            renderDiceFace(parseInt(ch, 10));
            diceClack();
          } else {
            if (coinInput) {
              coinInput.value += ch;
              coinInput.dispatchEvent(new Event("input"));
            }
            renderCoinFace(ch);
            coinDing();
          }
        }

        if (rollDiceBtn) rollDiceBtn.addEventListener("click", function () {
          var r = 1 + Math.floor(Math.random() * 6);
          appendRoll("dice", String(r));
        });
        if (flipCoinBtn) flipCoinBtn.addEventListener("click", function () {
          var ch = Math.random() < 0.5 ? "H" : "T";
          appendRoll("coin", ch);
        });
        if (rollManyBtn) rollManyBtn.addEventListener("click", function () {
          /* Auto-roll 50 times with a small stagger so the animation is visible. */
          var i = 0;
          var total = 50;
          var timer = setInterval(function () {
            if (i >= total) { clearInterval(timer); successChime(); return; }
            var mode = (i % 2 === 0) ? "dice" : "coin";
            if (mode === "dice") appendRoll("dice", String(1 + Math.floor(Math.random() * 6)));
            else appendRoll("coin", Math.random() < 0.5 ? "H" : "T");
            i++;
          }, 90);
        });
        if (clearEntropyBtn) clearEntropyBtn.addEventListener("click", function () {
          if (diceInput) diceInput.value = "";
          if (coinInput) coinInput.value = "";
          clearStage();
          updateEntropyProgress();
        });

        if (entropyGenBtn) entropyGenBtn.addEventListener("click", async function () {
          clearFeatureError(entropyErrorEl);
          var rolls = diceInput ? diceInput.value.trim() : "";
          var flips = coinInput ? coinInput.value.trim() : "";
          var wc = entropyWordsSel ? parseInt(entropyWordsSel.value, 10) : 12;
          if (!rolls && !flips) {
            showFeatureError(entropyErrorEl, "Entropy", "Roll dice or flip coins first.", { userInput: true });
            return;
          }
          try {
            /* Both sources feed one entropy pool. Changing either changes the seed. */
            var r = await entropyToMnemonic(rolls, flips, wc, currentLang());
            mnemonicInput.value = r.phrase;
            showToast("Generated " + r.wordCount + "-word mnemonic from your rolls");
            successChime();
            updateEntropyProgress();
            deriveKeys();
            toggleAccordion("entropy");
          } catch (e) {
            /* On validation error, wipe stale results so the screen does not
             * show an old address that no longer matches the current input. */
            mnemonicInput.value = "";
            addrSpan.textContent = "\u2014";
            pkSpan.textContent = "\u2014";
            showFeatureError(entropyErrorEl, "Entropy", e, { userInput: true });
          }
        });

        /* ── LITE DERIVE FROM ROLLS (full pipeline in the entropy panel) ── */
        var entropyChainSelect = document.getElementById("entropyChainSelect");
        var entropyDeriveBtn = document.getElementById("entropyDeriveBtn");
        if (entropyDeriveBtn) entropyDeriveBtn.addEventListener("click", async function () {
          clearFeatureError(entropyErrorEl);
          var rolls = diceInput ? diceInput.value.trim() : "";
          var flips = coinInput ? coinInput.value.trim() : "";
          var wc = entropyWordsSel ? parseInt(entropyWordsSel.value, 10) : 12;
          if (!rolls && !flips) {
            showFeatureError(entropyErrorEl, "Entropy", "Roll dice or flip coins first.", { userInput: true });
            return;
          }
          try {
            var r = await entropyToMnemonic(rolls, flips, wc, currentLang());
            mnemonicInput.value = r.phrase;
            /* Apply the selected chain preset (reuses the existing presets map). */
            var presetName = entropyChainSelect ? entropyChainSelect.value : "eth";
            var preset = presets[presetName];
            if (preset) {
              purposeInput.value = preset.purpose;
              coinTypeInput.value = preset.coinType;
              accountInput.value = preset.account;
              changeInput.value = preset.change;
              indexInput.value = preset.index;
              var devToggle = document.getElementById("devModeToggle");
              var devCp = document.getElementById("devCustomPath");
              if (devToggle && devToggle.checked && devCp) devCp.value = "";
              updatePathDisplay();
              updateSolanaUiHints();
            }
            showToast("Derived " + (presetName) + " address from your rolls");
            successChime();
            updateEntropyProgress();
            deriveKeys();
            toggleAccordion("entropy");
            /* Scroll the results into view so the user sees the address. */
            var resultsCard = document.querySelector('[data-content="derive"] .card:nth-of-type(4)');
            if (resultsCard) resultsCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
          } catch (e) {
            mnemonicInput.value = "";
            addrSpan.textContent = "\u2014";
            pkSpan.textContent = "\u2014";
            showFeatureError(entropyErrorEl, "Entropy", e, { userInput: true });
          }
        });

        /* ── PATH RECOVERY ASSISTANT ────────────────────────────────────── */
        var recoveryTarget = document.getElementById("recoveryTarget");
        var recoveryScanBtn = document.getElementById("recoveryScanBtn");
        var recoveryOut = document.getElementById("recoveryOut");
        var recoveryErrorEl = document.getElementById("recoveryError");

        if (recoveryScanBtn) recoveryScanBtn.addEventListener("click", async function () {
          clearFeatureError(recoveryErrorEl);
          var mn = mnemonicInput.value.trim();
          var target = recoveryTarget ? recoveryTarget.value.trim() : "";
          if (!mn) { showFeatureError(recoveryErrorEl, "Recovery", "Enter a mnemonic in Step 1 first.", { userInput: true }); return; }
          if (!target) { showFeatureError(recoveryErrorEl, "Recovery", "Enter the target address to match.", { userInput: true }); return; }
          if (!ethers.utils.isValidMnemonic(mn)) { showFeatureError(recoveryErrorEl, "Recovery", "Mnemonic is invalid.", { userInput: true }); return; }
          if (recoveryOut) { recoveryOut.style.display = "block"; recoveryOut.innerHTML = '<p class="hint">Scanning ' + WALLET_PATHS.length + ' paths...</p>'; }
          var passEl = document.getElementById("bip39Pass");
          var pass = passEl ? passEl.value : "";
          try {
            var res = await scanPathsForAddress(mn, pass, target);
            if (recoveryOut) recoveryOut.innerHTML = matchesToHtml(res);
          } catch (e) {
            showFeatureError(recoveryErrorEl, "Recovery", e);
          }
        });

        /* ── PAPER WALLET PRINT ─────────────────────────────────────────── */
        var printWalletBtn = document.getElementById("printWalletBtn");
        if (printWalletBtn) printWalletBtn.addEventListener("click", async function () {
          var mn = mnemonicInput.value.trim();
          if (!mn || !ethers.utils.isValidMnemonic(mn)) { showToast("Enter a valid mnemonic first"); return; }
          var path = getEffectivePath();
          var data = {
            mnemonic: mn,
            address: addrSpan ? addrSpan.textContent : "",
            path: path,
            network: addressLabel ? addressLabel.textContent : "",
            privateKey: pkSpan ? pkSpan.textContent : ""
          };
          await printPaperWallet(data);
        });

        /* ── HD TREE INSPECTOR ──────────────────────────────────────────── */
        var treeBuildBtn = document.getElementById("treeBuildBtn");
        var treeContainer = document.getElementById("treeContainer");
        var treeInfo = document.getElementById("treeInfo");
        var treeErrorEl = document.getElementById("treeError");

        if (treeBuildBtn) treeBuildBtn.addEventListener("click", function () {
          clearFeatureError(treeErrorEl);
          var mn = mnemonicInput.value.trim();
          if (!mn || !ethers.utils.isValidMnemonic(mn)) {
            showFeatureError(treeErrorEl, "Tree", "Enter a valid mnemonic in Step 1 first.", { userInput: true });
            return;
          }
          var passEl = document.getElementById("bip39Pass");
          var pass = passEl ? passEl.value : "";
          var model = buildTreeModel(mn, pass);
          renderTree(model, treeContainer, async function (path) {
            if (!treeInfo) return;
            treeInfo.innerHTML = '<p class="hint">Deriving ' + path + '...</p>';
            try {
              var info = await deriveNodeInfo(mn, path, pass);
              treeInfo.innerHTML = nodeInfoToHtml(info);
            } catch (e) {
              treeInfo.innerHTML = '<p class="hint" style="color:var(--error);">' + (e.message || e) + '</p>';
            }
          });
          if (treeInfo) treeInfo.innerHTML = '<p class="hint" style="color:var(--text-subtle);">Tree built. Click any node on the left to derive its keys (xprv, xpub, EVM address). Click a branch node again to expand or collapse its children.</p>';
        });

        /* ── LEARN -> ENTROPY CROSS-LINK ─────────────────────────────────── */
        var learnOpenEntropy = document.getElementById("learnOpenEntropy");
        if (learnOpenEntropy) learnOpenEntropy.addEventListener("click", function (e) {
          e.preventDefault();
          var deriveTab = document.querySelector('.tab[data-tab="derive"]');
          if (deriveTab) deriveTab.click();
          toggleAccordion("entropy");
          if (entropyHeader) entropyHeader.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });
    })();
