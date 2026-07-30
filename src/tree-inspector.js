function buildTreeModel(mnemonic, passphrase) {
  var purposes = [44, 84, 49];
  var purposeChildren = purposes.map(function (p) {
    var coins;
    if (p === 44) {
      coins = [60, 0, 501];
    } else {
      coins = [0];
    }
    var coinChildren = coins.map(function (c) {
      var coinPath = "m/" + p + "'/" + c + "'";
      var accountPath = coinPath + "/0'";
      var accountChildren;
      if (c === 501) {
        var idxChildren = [];
        for (var i = 0; i < 3; i++) {
          idxChildren.push({
            label: "index " + i + "'",
            path: accountPath + "/" + i + "'",
            leaf: true
          });
        }
        accountChildren = idxChildren;
      } else {
        accountChildren = [0, 1].map(function (ch) {
          var changePath = accountPath + "/" + ch;
          var idxChildren = [];
          for (var j = 0; j < 3; j++) {
            idxChildren.push({
              label: "index " + j,
              path: changePath + "/" + j,
              leaf: true
            });
          }
          return {
            label: "change " + ch,
            path: changePath,
            children: idxChildren
          };
        });
      }
      return {
        label: "coin " + c + "'",
        path: coinPath,
        children: [
          {
            label: "account 0'",
            path: accountPath,
            children: accountChildren
          }
        ]
      };
    });
    return {
      label: "purpose " + p + "'",
      path: "m/" + p + "'",
      children: coinChildren
  };
  });
  return {
    label: "Root (m)",
    path: "m",
    children: purposeChildren
  };
}

function renderTree(model, containerEl, onSelect) {
  if (!containerEl) return containerEl;
  containerEl.innerHTML = "";
  var selectedNode = { value: null };

  function buildNode(node, depth) {
    var wrap = document.createElement("div");
    wrap.className = "tree-node";
    if (node.leaf) wrap.classList.add("leaf");
    wrap.setAttribute("data-path", node.path);

    var chevron = document.createElement("span");
    chevron.className = "tree-chevron";
    chevron.textContent = node.children && node.children.length ? "\u25B6" : "";
    chevron.style.fontSize = "9px";
    chevron.style.marginRight = "4px";
    wrap.appendChild(chevron);

    var label = document.createElement("span");
    label.className = "tree-label";
    label.textContent = node.label;
    wrap.appendChild(label);

    var childContainer = null;
    if (node.children && node.children.length) {
      childContainer = document.createElement("div");
      childContainer.className = "tree-children";
      if (depth > 0) {
        childContainer.style.display = "none";
      } else {
        wrap.classList.add("expanded");
      }
      for (var i = 0; i < node.children.length; i++) {
        childContainer.appendChild(buildNode(node.children[i], depth + 1));
      }
      wrap.appendChild(childContainer);
    }

    label.addEventListener("click", function (e) {
      e.stopPropagation();
      handleNodeClick();
    });
    function handleNodeClick() {
      if (childContainer) {
        if (wrap.classList.contains("expanded")) {
          wrap.classList.remove("expanded");
          childContainer.style.display = "none";
        } else {
          wrap.classList.add("expanded");
          childContainer.style.display = "";
        }
      }
      if (selectedNode.value) {
        selectedNode.value.classList.remove("selected");
      }
      wrap.classList.add("selected");
      selectedNode.value = wrap;
      if (typeof onSelect === "function") {
        onSelect(node.path);
      }
    }
    wrap.addEventListener("click", function (e) {
      e.stopPropagation();
      handleNodeClick();
    });

    return wrap;
  }

  containerEl.appendChild(buildNode(model, 0));
  return containerEl;
}

async function deriveNodeInfo(mnemonic, path, passphrase) {
  var info = {
    path: path,
    extendedKey: null,
    neuteredKey: null,
    privateKey: null,
    evmAddress: null,
    error: null
  };
  if (typeof ethers === "undefined") {
    info.error = "ethers library not loaded";
    return info;
  }
  try {
    var node = ethers.utils.HDNode.fromMnemonic(mnemonic, passphrase).derivePath(path);
    info.extendedKey = node.extendedKey ? node.extendedKey : null;
    try {
      info.neuteredKey = node.neuter ? node.neuter().extendedKey : null;
    } catch (e2) {
      info.neuteredKey = null;
    }
    if (node.privateKey) {
      info.privateKey = node.privateKey;
      try {
        info.evmAddress = new ethers.Wallet(node.privateKey).address;
      } catch (e3) {
        info.evmAddress = null;
      }
    }
  } catch (err) {
    info.error = err && err.message ? err.message : String(err);
  }
  return info;
}

function nodeInfoToHtml(info) {
  if (!info) return "";
  var rows = [];
  rows.push('<div class="info-row"><span class="info-label">Path:</span> <span>' + escapeHtml(info.path) + '</span></div>');
  if (info.error) {
    rows.push('<div class="info-row info-error"><span class="info-label">Error:</span> <span>' + escapeHtml(info.error) + '</span></div>');
    return '<div class="node-info">' + rows.join("") + '</div>';
  }
  if (info.extendedKey) {
    rows.push(infoRow("xprv (extended key):", info.extendedKey));
  }
  if (info.neuteredKey) {
    rows.push(infoRow("xpub (neutered key):", info.neuteredKey));
  }
  if (info.privateKey) {
    rows.push(infoRow("Private key:", info.privateKey));
  }
  if (info.evmAddress) {
    rows.push('<div class="info-row"><span class="info-label">EVM address:</span> <span style="font-family:var(--mono);font-size:11px;word-break:break-all">' + escapeHtml(info.evmAddress) + '</span></div>');
  }
  return '<div class="node-info">' + rows.join("") + '</div>';
}

function infoRow(label, value) {
  var truncated = value.length > 40 ? value.slice(0, 20) + "..." + value.slice(-12) : value;
  return '<div class="info-row"><span class="info-label">' + escapeHtml(label) + '</span> <span style="font-family:var(--mono);font-size:11px;word-break:break-all" title="' + escapeAttr(value) + '">' + escapeHtml(truncated) + '</span></div>';
}

function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}