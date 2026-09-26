/* ============================================================================
 * Measure the contrast of every visual system role, in both themes.
 * ============================================================================
 * The visual system claims each colour role is readable on the surface it sits
 * on, and claims 4.5:1 for text and 3:1 for shapes. This script makes that a
 * measurement instead of a claim, and it reads the values out of src/styles.css
 * so it cannot drift from what ships.
 *
 * Exit codes:
 *   0  every pairing measured and above its target
 *   1  measured, and at least one pairing is below target
 *   2  could not measure (a token missing, or the stylesheet unreadable)
 *
 * Usage: node tools/viz-contrast.js
 * ========================================================================== */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
/* The roles come from the token file that every page links; --text and the page
 * background come from the app stylesheet. Reading both means the measurement
 * follows the shipped values rather than a copy of them. */
const CSS_FILES = ["src/viz-tokens.css", "src/styles.css"];
const CSS_BY_FILE = CSS_FILES.map((f) => ({ file: f, text: fs.readFileSync(path.join(ROOT, f), "utf8") }));

/* Text is 4.5:1. Shapes only need 3:1 per WCAG 1.4.11. */
const TEXT_TARGET = 4.5;
const SHAPE_TARGET = 3;

function tokenBlock(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) return null;
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  if (open === -1 || close === -1) return null;
  const block = css.slice(open + 1, close);
  const out = {};
  block.replace(/(--[\w-]+)\s*:\s*([^;]+);/g, (m, name, value) => {
    out[name.trim()] = value.trim();
    return m;
  });
  return out;
}

function hexToRgb(value) {
  let v = String(value).trim();
  const m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) {
    const rgba = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
    if (rgba) {
      return { r: Number(rgba[1]), g: Number(rgba[2]), b: Number(rgba[3]), a: rgba[4] === undefined ? 1 : Number(rgba[4]) };
    }
    return null;
  }
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: 1
  };
}

/* Composite a possibly translucent colour over an opaque backdrop, which is what
 * the eye actually receives when a surface is rgba over a page background. */
function over(fg, bg) {
  const a = fg.a === undefined ? 1 : fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1
  };
}

function luminance(c) {
  const chan = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function tokensFor(selector) {
  const out = {};
  for (const entry of CSS_BY_FILE) {
    const block = tokenBlock(entry.text, selector);
    if (block) Object.assign(out, block);
  }
  return out;
}

const dark = tokensFor(":root");
const light = tokensFor('[data-theme="light"]');
const THEMES = [
  { name: "dark", tokens: dark, page: dark && dark["--bg-gradient-start"] },
  { name: "light", tokens: light, page: light && light["--bg-gradient-end"] }
];

const ROLES = ["--viz-secret", "--viz-public", "--viz-hashed", "--viz-address", "--viz-warn"];
let failures = 0;
let unmeasurable = 0;
const rows = [];

/* The role colour is used twice: as label text on the page surface, and as the
 * stroke of a shape drawn on that same surface. Both are checked. */
for (const theme of THEMES) {
  if (!theme.tokens || !theme.page) {
    unmeasurable += 1;
    console.error("cannot measure: theme tokens not found for " + theme.name);
    continue;
  }
  const pageRgb = hexToRgb(theme.page);
  const surfaceRgb = hexToRgb(theme.tokens["--viz-surface"]);
  if (!pageRgb || !surfaceRgb) {
    unmeasurable += 1;
    console.error("cannot measure: unreadable colour value in theme " + theme.name);
    continue;
  }
  const surface = over(surfaceRgb, pageRgb);
  const text = hexToRgb(theme.tokens["--text"]);
  const textOnSurface = text ? over(text, surface) : surface;

  for (const role of ROLES) {
    const raw = theme.tokens[role];
    const rgb = raw ? hexToRgb(raw) : null;
    if (!rgb) {
      unmeasurable += 1;
      rows.push([theme.name, role, raw || "(missing)", "-", "-", "CANNOT MEASURE"]);
      continue;
    }
    const asText = contrast(over(rgb, surface), surface);   // role colour as label text
    const asShape = contrast(rgb, surface);                 // role colour as a stroke or bar
    const textOk = asText >= TEXT_TARGET;
    const shapeOk = asShape >= SHAPE_TARGET;
    if (!textOk || !shapeOk) failures += 1;
    rows.push([
      theme.name,
      role,
      raw,
      asText.toFixed(2) + (textOk ? "" : " FAIL"),
      asShape.toFixed(2) + (shapeOk ? "" : " FAIL"),
      textOk && shapeOk ? "ok" : "BELOW TARGET"
    ]);
  }

  /* Body text on the surface, so the surface itself is not the silent problem. */
  const body = contrast(textOnSurface, surface);
  if (body < TEXT_TARGET) failures += 1;
  rows.push([theme.name, "--text on surface", theme.tokens["--text"], body.toFixed(2), "-", body >= TEXT_TARGET ? "ok" : "BELOW TARGET"]);
}

const width = [8, 20, 10, 12, 12, 14];
console.log("visual system contrast, read from src/styles.css");
console.log("targets: " + TEXT_TARGET + ":1 text, " + SHAPE_TARGET + ":1 shapes\n");
console.log(["theme", "token", "value", "as text", "as shape", "verdict"].map((h, i) => h.padEnd(width[i])).join(""));
for (const row of rows) {
  console.log(row.map((c, i) => String(c).padEnd(width[i])).join(""));
}

if (unmeasurable) {
  console.log("\nCANNOT MEASURE (rc 2): " + unmeasurable + " value(s) could not be read, so no verdict is given for them.");
  process.exit(2);
}
if (failures) {
  console.log("\nBELOW TARGET (rc 1): " + failures + " pairing(s) fail their target.");
  process.exit(1);
}
console.log("\nOK (rc 0): every pairing measured and above target, in both themes.");
