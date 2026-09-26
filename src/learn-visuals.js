/* ============================================================================
 * KeySense visual system
 * ============================================================================
 * Small diagram, chart and motion primitives for the Learn walkthrough.
 *
 * Why this exists: three diagrams drawn on three different days get three arrow
 * styles and three colours, and each new one tends to add words instead of
 * replacing them. These primitives keep every drawing consistent, keep the
 * accessibility decisions in one place, and make the reduced motion switch a
 * single decision rather than one per animation. Plan and reasoning:
 * docs/learn-research/VISUAL-SYSTEM.md.
 *
 * Rules the code enforces or assumes:
 *   - No dependencies. Vanilla DOM and SVG, works from file:// with no network.
 *   - Colour is never the only channel. Every role also has a shape rule.
 *   - Motion shows a value changing and nothing else. Nothing animates on first
 *     paint, and prefers-reduced-motion turns every primitive into an instant
 *     state change.
 *   - Motion never carries information: the end state reads correctly without
 *     having watched anything.
 *   - Colours are applied as CSS (element.style.stroke), never as SVG
 *     presentation attributes. var() is not valid in a presentation attribute,
 *     so `stroke="var(--viz-secret)"` silently paints nothing: the diagram
 *     renders as unstyled black shapes. A regression test walks a built diagram
 *     and fails if a var() ever appears in an attribute again.
 *
 * Exposes: window.KeySenseVisuals
 * ========================================================================== */

(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  /* Five semantic roles. `radius` and `dash` are the non-colour channel: a role
   * keeps its meaning in greyscale, for a colour blind reader, and in a black
   * and white print. Contrast targets, measured when a pairing is added:
   * 4.5:1 for text, 3:1 for shapes. See tools/viz-contrast.js. */
  var ROLES = {
    secret: { color: "var(--viz-secret)", radius: 0, dash: null, double: false, hatch: false, label: "Secret, never shared" },
    public: { color: "var(--viz-public)", radius: 6, dash: null, double: false, hatch: false, label: "Public, safe to share" },
    hashed: { color: "var(--viz-hashed)", radius: 6, dash: "5 4", double: false, hatch: false, label: "Hashed or encoded" },
    address: { color: "var(--viz-address)", radius: 6, dash: null, double: true, hatch: false, label: "Final address" },
    warn: { color: "var(--viz-warn)", radius: 0, dash: null, double: false, hatch: true, label: "What leaks or fails" }
  };

  /* Fixed motion grammar. Do not add a sixth duration without a reason that can
   * be written down: consistency is the whole point of a system. */
  var MOTION = { micro: 120, value: 240, trace: 600 };

  function role(name) {
    return ROLES[name] || ROLES.public;
  }

  function reducedMotion() {
    return typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, String(attrs[k]));
      });
    }
    return node;
  }

  function label(text, x, y, opts) {
    opts = opts || {};
    var t = svgEl("text", {
      x: x,
      y: y,
      "font-size": opts.size || 12,
      "text-anchor": opts.anchor || "start",
      "font-weight": opts.weight || 500
    });
    t.style.fontFamily = opts.mono ? "var(--mono)" : "var(--font)";
    t.style.fill = opts.fill || "var(--text)";
    t.textContent = text;
    return t;
  }

  /* A labelled box. `role` picks the colour and the corner shape. */
  function box(opts) {
    var r = role(opts.role);
    var g = svgEl("g", { class: "viz-node viz-" + (opts.role || "public") });
    var rect = svgEl("rect", {
      x: opts.x,
      y: opts.y,
      width: opts.w,
      height: opts.h,
      rx: r.radius,
      ry: r.radius
    });
    rect.style.fill = opts.fill || "var(--viz-surface)";
    rect.style.stroke = r.color;
    rect.style.strokeWidth = "1.5px";
    if (r.dash) rect.style.strokeDasharray = r.dash;
    if (r.hatch) rect.style.fill = "url(#vizHatch-" + (opts.role || "warn") + ")";
    g.appendChild(rect);

    if (r.double) {
      var inner = svgEl("rect", {
        x: opts.x + 3,
        y: opts.y + 3,
        width: Math.max(0, opts.w - 6),
        height: Math.max(0, opts.h - 6),
        rx: r.radius,
        ry: r.radius
      });
      inner.style.fill = "none";
      inner.style.stroke = r.color;
      inner.style.strokeWidth = "1px";
      inner.style.opacity = "0.55";
      g.appendChild(inner);
    }

    var cx = opts.x + opts.w / 2;
    var mid = opts.y + opts.h / 2;
    var title = opts.label || "";
    if (opts.sub) {
      g.appendChild(label(title, cx, mid - 3, { anchor: "middle", size: 12, weight: 600 }));
      g.appendChild(label(opts.sub, cx, mid + 13, { anchor: "middle", size: 10, fill: "var(--text-muted)" }));
    } else {
      g.appendChild(label(title, cx, mid + 4, { anchor: "middle", size: 12, weight: 600 }));
    }
    return g;
  }

  /* An arrow between two points. Straight, or an elbow when `elbow` is set,
   * which is what a ladder or a branch route needs. */
  function arrow(opts) {
    var r = role(opts.role);
    var id = "vizArrow-" + (opts.role || "public");
    var g = svgEl("g", { class: "viz-flow" });
    var d;
    if (opts.elbow) {
      var my = (opts.from[1] + opts.to[1]) / 2;
      d = "M " + opts.from[0] + " " + opts.from[1] +
          " L " + opts.from[0] + " " + my +
          " L " + opts.to[0] + " " + my +
          " L " + opts.to[0] + " " + opts.to[1];
    } else {
      d = "M " + opts.from[0] + " " + opts.from[1] + " L " + opts.to[0] + " " + opts.to[1];
    }
    var path = svgEl("path", { d: d });
    path.style.fill = "none";
    path.style.stroke = r.color;
    path.style.strokeWidth = (opts.width || 1.6) + "px";
    path.setAttribute("marker-end", "url(#" + id + ")");
    if (opts.dashed) path.style.strokeDasharray = "4 4";
    if (opts.noMarker) path.removeAttribute("marker-end");
    g.appendChild(path);

    if (opts.label) {
      var lx = (opts.from[0] + opts.to[0]) / 2;
      var ly = opts.elbow ? (opts.from[1] + opts.to[1]) / 2 - 5 : (opts.from[1] + opts.to[1]) / 2 - 6;
      g.appendChild(label(opts.label, lx, ly, { anchor: "middle", size: 10, fill: "var(--text-muted)" }));
    }
    return g;
  }

  /* One parent, several children. This is hardened against normal, and the
   * xpub reach question, drawn the same way every time. */
  function branch(opts) {
    var g = svgEl("g", { class: "viz-branch" });
    g.appendChild(box(opts.parent));
    var px = opts.parent.x + opts.parent.w;
    var py = opts.parent.y + opts.parent.h / 2;
    (opts.children || []).forEach(function (child) {
      g.appendChild(box(child));
      g.appendChild(arrow({
        from: [px, py],
        to: [child.x, child.y + child.h / 2],
        role: child.role || opts.parent.role,
        elbow: opts.elbow !== false,
        dashed: child.dashed,
        label: child.route
      }));
    });
    return g;
  }

  /* A labelled container, for a chain family or an address format group. */
  function group(opts) {
    var g = svgEl("g", { class: "viz-group" });
    var frame = svgEl("rect", {
      x: opts.x,
      y: opts.y,
      width: opts.w,
      height: opts.h,
      rx: 10,
      ry: 10
    });
    frame.style.fill = "none";
    frame.style.stroke = "var(--viz-line)";
    frame.style.strokeWidth = "1px";
    frame.style.strokeDasharray = "2 4";
    g.appendChild(frame);
    if (opts.title) {
      g.appendChild(label(opts.title, opts.x + 10, opts.y + 16, { size: 11, weight: 600, fill: "var(--text-muted)" }));
    }
    (opts.children || []).forEach(function (c) { g.appendChild(c); });
    return g;
  }

  /* The legend is generated from the same role table the drawings use, so it
   * cannot drift from what is on screen. */
  function legend(roles) {
    var g = svgEl("g", { class: "viz-legend" });
    var x = 0;
    (roles || Object.keys(ROLES)).forEach(function (name, i) {
      var r = role(name);
      var y = i * 20;
      var swatch = svgEl("rect", { x: x, y: y, width: 14, height: 14, rx: r.radius });
      swatch.style.fill = "none";
      swatch.style.stroke = r.color;
      swatch.style.strokeWidth = "1.6px";
      if (r.dash) swatch.style.strokeDasharray = r.dash;
      g.appendChild(swatch);
      if (r.double) {
        var inner = svgEl("rect", { x: x + 3, y: y + 3, width: 8, height: 8 });
        inner.style.fill = "none";
        inner.style.stroke = r.color;
        inner.style.strokeWidth = "1px";
        inner.style.opacity = "0.55";
        g.appendChild(inner);
      }
      g.appendChild(label(r.label, x + 22, y + 11, { size: 11, fill: "var(--text-muted)" }));
    });
    return g;
  }

  /* Horizontal bar chart. `log10` exists because the randomness comparison
   * spans 2^9 to 2^128, and a linear axis would make every weak row invisible
   * next to the strong ones, which is the opposite of the lesson. */
  function chart(opts) {
    var width = opts.width || 620;
    var rowH = opts.rowH || 26;
    var padLeft = opts.padLeft || 150;
    var padRight = opts.padRight || 76;
    var height = (opts.rows || []).length * rowH + 34;
    var g = svgEl("g", { class: "viz-chart" });
    var rows = opts.rows || [];
    var max = rows.reduce(function (m, r) { return Math.max(m, r.value); }, 1);
    var scale = opts.log10
      ? function (v) { return Math.max(0, Math.log(Math.max(1, v)) / Math.log(10)) / Math.log(Math.max(10, max)) / Math.LN10 * Math.LN10; }
      : function (v) { return v / max; };
    var span = width - padLeft - padRight;

    rows.forEach(function (r, i) {
      var y = i * rowH + 18;
      var frac = opts.log10 ? Math.log(Math.max(1, r.value)) / Math.log(Math.max(10, max)) : r.value / max;
      var w = Math.max(2, frac * span);
      g.appendChild(label(r.label, 0, y + 12, { size: 11, fill: "var(--text-muted)" }));
      var bar = svgEl("rect", { x: padLeft, y: y, width: w, height: 14, rx: 3, ry: 3 });
      bar.style.fill = role(r.role || (r.mine ? "address" : "hashed")).color;
      bar.style.opacity = r.mine ? "1" : "0.72";
      g.appendChild(bar);
      g.appendChild(label(r.display || String(r.value), padLeft + w + 8, y + 12, { size: 11, mono: true, fill: "var(--text)" }));
      if (r.mine) {
        /* The second channel: the reader's own row is outlined and marked, not
         * only coloured differently. */
        var outline = svgEl("rect", { x: padLeft - 2, y: y - 2, width: w + 4, height: 18, rx: 4, ry: 4 });
        outline.style.fill = "none";
        outline.style.stroke = "var(--text)";
        outline.style.strokeWidth = "1px";
        g.appendChild(outline);
        g.appendChild(label("yours", padLeft - 8, y + 12, { size: 10, anchor: "end", fill: "var(--text)" }));
      }
    });

    if (opts.axisLabel) {
      g.appendChild(label(opts.axisLabel, padLeft, height - 4, { size: 10, fill: "var(--text-subtle)" }));
    }
    return g;
  }

  /* Compose a diagram: returns a real SVG element sized for the container. */
  function diagram(opts) {
    var svg = svgEl("svg", {
      viewBox: "0 0 " + (opts.width || 620) + " " + (opts.height || 200),
      width: "100%",
      role: "img",
      "aria-label": opts.ariaLabel || "",
      preserveAspectRatio: "xMidYMid meet",
      style: "display:block;max-width:" + (opts.width || 620) + "px;margin:16px auto 0;"
    });
    var defs = svgEl("defs");
    Object.keys(ROLES).forEach(function (name) {
      var marker = svgEl("marker", {
        id: "vizArrow-" + name,
        viewBox: "0 0 10 10",
        refX: 9,
        refY: 5,
        markerWidth: 6,
        markerHeight: 6,
        orient: "auto-start-reverse"
      });
      var tip = svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z" });
      tip.style.fill = role(name).color;
      marker.appendChild(tip);
      defs.appendChild(marker);
      var hatch = svgEl("pattern", {
        id: "vizHatch-" + name,
        width: 6,
        height: 6,
        patternUnits: "userSpaceOnUse",
        patternTransform: "rotate(45)"
      });
      var hatchBg = svgEl("rect", { width: 6, height: 6 });
      hatchBg.style.fill = "none";
      hatch.appendChild(hatchBg);
      var hatchLine = svgEl("line", { x1: 0, y1: 0, x2: 0, y2: 6 });
      hatchLine.style.stroke = role(name).color;
      hatchLine.style.strokeWidth = "2px";
      hatchLine.style.opacity = "0.5";
      hatch.appendChild(hatchLine);
      defs.appendChild(hatch);
    });
    svg.appendChild(defs);
    (opts.children || []).forEach(function (c) { if (c) svg.appendChild(c); });
    return svg;
  }

  /* ---------------------------------------------------------------- motion --
   * Three primitives, and nothing else. All three are instant when the reader
   * asks for reduced motion, and none of them is required to understand the
   * end state. */

  function fadeValue(el) {
    if (!el) return;
    if (reducedMotion()) { el.style.opacity = "1"; return; }
    el.style.transition = "none";
    el.style.opacity = "0.35";
    /* Force a reflow so the browser does not coalesce the two states. */
    void el.offsetWidth;
    el.style.transition = "opacity " + MOTION.value + "ms ease-out";
    el.style.opacity = "1";
  }

  function drawTrace(pathEl) {
    if (!pathEl) return;
    var len = typeof pathEl.getTotalLength === "function" ? pathEl.getTotalLength() : 0;
    if (!len || reducedMotion()) {
      pathEl.style.strokeDasharray = "";
      pathEl.style.strokeDashoffset = "0";
      pathEl.style.opacity = "1";
      return;
    }
    pathEl.style.strokeDasharray = String(len);
    pathEl.style.strokeDashoffset = String(len);
    pathEl.style.opacity = "1";
    void pathEl.getBoundingClientRect();
    pathEl.style.transition = "stroke-dashoffset " + MOTION.trace + "ms ease-out";
    pathEl.style.strokeDashoffset = "0";
  }

  function pulseOnce(el) {
    if (!el) return;
    if (reducedMotion()) return;
    el.style.transition = "transform " + MOTION.micro + "ms ease-out";
    el.style.transform = "scale(1.03)";
    window.setTimeout(function () { el.style.transform = "scale(1)"; }, MOTION.micro);
  }

  window.KeySenseVisuals = {
    ROLES: ROLES,
    MOTION: MOTION,
    role: role,
    reducedMotion: reducedMotion,
    box: box,
    arrow: arrow,
    branch: branch,
    group: group,
    legend: legend,
    chart: chart,
    diagram: diagram,
    fadeValue: fadeValue,
    drawTrace: drawTrace,
    pulseOnce: pulseOnce
  };
})();
