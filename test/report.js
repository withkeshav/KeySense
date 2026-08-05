/* Browser rendering for the self-test page. No framework, and every value goes
 * in through textContent, because some of these strings are derived from user
 * supplied input in the negative cases. */

(function () {
  function cell(text, mono, color) {
    var td = document.createElement("td");
    td.textContent = text == null ? "" : String(text);
    td.style.padding = "6px 10px";
    td.style.borderBottom = "1px solid var(--border)";
    td.style.verticalAlign = "top";
    if (mono) {
      td.style.fontFamily = "var(--mono)";
      td.style.fontSize = "11px";
      td.style.wordBreak = "break-all";
    }
    if (color) td.style.color = color;
    return td;
  }

  function render(results) {
    var host = document.getElementById("results");
    var summary = document.getElementById("summary");
    host.textContent = "";

    var failed = results.filter(function (r) { return !r.pass; });
    var passed = results.length - failed.length;

    summary.textContent = passed + " passed, " + failed.length + " failed";
    summary.style.color = failed.length ? "var(--error)" : "var(--success)";

    var groups = [];
    results.forEach(function (r) { if (groups.indexOf(r.group) === -1) groups.push(r.group); });

    groups.forEach(function (g) {
      var rows = results.filter(function (r) { return r.group === g; });
      var h = document.createElement("div");
      h.className = "output-label";
      h.style.marginTop = "18px";
      h.textContent = g + "  (" + rows.filter(function (r) { return r.pass; }).length + "/" + rows.length + ")";
      host.appendChild(h);

      var wrap = document.createElement("div");
      wrap.style.overflowX = "auto";
      var table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.fontSize = "12px";

      rows.forEach(function (r) {
        var tr = document.createElement("tr");
        tr.appendChild(cell(r.pass ? "pass" : "FAIL", false, r.pass ? "var(--success)" : "var(--error)"));
        tr.appendChild(cell(r.id));
        tr.appendChild(cell(r.source || ""));
        if (r.pass) {
          tr.appendChild(cell(r.actual, true, "var(--text-muted)"));
        } else {
          var d = document.createElement("td");
          d.style.padding = "6px 10px";
          d.style.borderBottom = "1px solid var(--border)";
          d.style.fontFamily = "var(--mono)";
          d.style.fontSize = "11px";
          d.style.wordBreak = "break-all";
          var e1 = document.createElement("div");
          e1.textContent = "expected " + r.expected;
          var e2 = document.createElement("div");
          e2.textContent = "actual   " + r.actual;
          e2.style.color = "var(--error)";
          d.appendChild(e1);
          d.appendChild(e2);
          if (r.error) {
            var e3 = document.createElement("div");
            e3.textContent = "error    " + r.error;
            e3.style.color = "var(--error)";
            d.appendChild(e3);
          }
          tr.appendChild(d);
        }
        table.appendChild(tr);
      });
      wrap.appendChild(table);
      host.appendChild(wrap);
    });
  }

  window.addEventListener("DOMContentLoaded", function () {
    runAllVectors().then(render, function (e) {
      var summary = document.getElementById("summary");
      summary.textContent = "harness error: " + (e && e.message ? e.message : e);
      summary.style.color = "var(--error)";
    });
  });
})();
