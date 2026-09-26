/* Terminal test runner. Zero dependencies: Node loads the same vendored
 * libraries the browser does and evaluates the same src/*.js files in a vm
 * context, so this exercises the shipped code rather than a reimplementation.
 *
 *   npm test
 */
"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

/* Files the page loads, minus main.js and ui.js, which are the only two that
 * touch the DOM. Keep this in the same order as index.html. */
const APP_FILES = [
  "src/vendor/keysense-hashes.js",
  "src/bip39-wordlists.js",
  "src/constants.js",
  "src/secure-random.js",
  "src/crypto-utils.js",
  "src/html-escape.js",
  "src/slip10-ed25519.js",
  "src/hd-paths.js",
  "src/vanity-service.js",
  "src/address-service.js",
  "src/brain-wallet-service.js",
  "src/bip39-helper.js",
  "src/entropy-generator.js",
  "src/entropy-compare.js",
  "src/learn-live.js",
  "src/path-recovery.js",
  "src/tree-inspector.js"
];

/* Files that legitimately differ between index.html and the self-test page. */
const EXPECTED_DIFF = new Set(["src/main.js", "src/ui.js", "src/paper-wallet.js"]);

function scriptSrcList(html) {
  const out = [];
  const re = /<script[^>]+src="([^"]+)"/g;
  let m;
  /* The ?v=<hash> stamp is a caching detail, not a different asset, so it is
   * stripped before comparison. */
  while ((m = re.exec(html))) out.push(m[1].replace(/\?v=[0-9a-f]+$/, "").replace(/^\.\//, ""));
  return out;
}

function styleSrcList(html) {
  const out = [];
  const re = /<link[^>]+href="([^"]+\.css)/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1].replace(/\?v=[0-9a-f]+$/, "").replace(/^\.\//, ""));
  return out;
}

/* Guard against the self-test page drifting away from what the app loads.
 * Without this, someone adds a script tag to index.html in six months and the
 * suite silently stops covering it. Stylesheets are checked for the same
 * reason: the visual system tokens live in their own file, and a page that
 * links the drawings without the tokens renders black on black. */
function checkDrift() {
  let selfTest;
  try { selfTest = read("test/self-test.html"); }
  catch (e) { return { skipped: true, reason: "test/self-test.html not present" }; }

  const app = scriptSrcList(read("index.html")).filter((s) => !EXPECTED_DIFF.has(s));
  const test = scriptSrcList(selfTest)
    .filter((s) => !s.startsWith("test/") && !s.startsWith("vectors") && !s.startsWith("run-vectors") && !s.startsWith("report"))
    .map((s) => s.replace(/^\.\.\//, ""))
    .filter((s) => !EXPECTED_DIFF.has(s));

  const missing = app.filter((s) => test.indexOf(s) === -1);
  const extra = test.filter((s) => app.indexOf(s) === -1);

  const appCss = styleSrcList(read("index.html"));
  const testCss = styleSrcList(selfTest).map((s) => s.replace(/^\.\.\//, ""));
  const cssMissing = appCss.filter((s) => testCss.indexOf(s) === -1);
  const cssExtra = testCss.filter((s) => appCss.indexOf(s) === -1);

  return {
    skipped: false, missing, extra,
    cssMissing, cssExtra,
    ok: missing.length === 0 && extra.length === 0 && cssMissing.length === 0 && cssExtra.length === 0
  };
}

/* Wrap the context's Math so calls to Math.random are counted. The whole
 * point of the RNG guards below is that key material never comes from
 * Math.random, so a call anywhere in a loaded module during the run is a
 * failure. Object.create(Math) keeps every other Math method working; only
 * random is overridden. */
function makeCountingMath() {
  const realRandom = Math.random;
  let calls = 0;
  const math = Object.create(Math);
  math.random = function () { calls++; return realRandom.apply(this, arguments); };
  return { math, calls: () => calls };
}

/* Build a fresh vm context. overrides lets a sub-test replace any global the
 * app sees, most importantly crypto: pass { crypto: undefined } to simulate a
 * browser without Web Crypto, or { crypto: { getRandomValues: stub } } to
 * simulate a broken or substituted implementation. Fresh context per sub-case
 * matters because secureRandomCanaryCheck caches its result. */
function buildContext(overrides) {
  overrides = overrides || {};
  const ethersMod = require(path.join(root, "src/vendor/ethers-5.7.2.umd.min.js"));
  const nacl = require(path.join(root, "src/vendor/tweetnacl-1.0.3-nacl-fast.min.js"));
  const counter = makeCountingMath();

  const base = {
    ethers: ethersMod.ethers || ethersMod,
    nacl,
    console, crypto, TextEncoder, TextDecoder,
    Promise, BigInt, Uint8Array, Uint32Array, ArrayBuffer, DataView,
    Array, String, Number, Boolean, Object, JSON, Math: counter.math, Date, Error, RegExp, Symbol,
    parseInt, parseFloat, isNaN, isFinite, setTimeout, clearTimeout,
    require, module: undefined
  };
  for (const k in overrides) if (Object.prototype.hasOwnProperty.call(overrides, k)) base[k] = overrides[k];

  const ctx = vm.createContext(base);
  ctx.globalThis = ctx;
  ctx.window = undefined;

  const loaded = [];
  for (const f of APP_FILES) {
    let src;
    try { src = read(f); }
    catch (e) { continue; }          /* not created yet, later phases add these */
    vm.runInContext(src, ctx, { filename: f });
    loaded.push(f);
  }
  vm.runInContext(read("test/vectors.js"), ctx, { filename: "test/vectors.js" });
  vm.runInContext(read("test/run-vectors.js"), ctx, { filename: "test/run-vectors.js" });
  return { ctx, loaded, mathRandomCalls: counter.calls };
}

function loadContext() {
  return buildContext({});
}

/* ---- RNG fail-closed suite ----
 *
 * The Coldcard case study (.progress/SECURITY-AUDIT.md) is about a CSPRNG
 * silently being replaced by something weaker and nobody noticing for years.
 * secure-random.js is written to fail closed, but that is only a claim until a
 * test forces every failure mode and watches it refuse to produce output.
 *
 * Each sub-case runs the real shipped modules in a fresh context with crypto
 * present, absent, or stubbed to misbehave, and checks that the failure
 * happens loudly instead of quietly handing back key material. */

const RNG_D50 = "12345612345612345612345612345612345612345612345612";

const RNG_GOOD_BODY = `
var out = [];
var ok = secureRandomAvailable();
out.push(["available", true, ok]);
var byteOk = false;
try { var b = secureRandomByte(); byteOk = Number.isInteger(b) && b >= 0 && b <= 255; } catch (e) { byteOk = false; }
out.push(["byte-is-integer-0-255", true, byteOk]);
var canary = secureRandomCanaryCheck();
out.push(["canary-ok", true, canary.ok]);
var mixed = null, mixedThrew = false;
try { mixed = entropyToMnemonic(RNG_D50, "", 12, "en", {}); } catch (e) { mixedThrew = true; }
out.push(["mixed-mode-works", true, !mixedThrew && !!mixed && !!mixed.phrase]);
if (mixed) {
  out.push(["mixed-phrase-12-words", 12, mixed.phrase.split(" ").length]);
  out.push(["mixed-salt-64-hex", true, /^[0-9a-f]{64}$/.test(String(mixed.saltHex || ""))]);
}
out;
`;

/* Runs in a context where crypto.getRandomValues is missing or absent. The
 * key assertions: the tool reports unavailability instead of guessing, mixed
 * mode refuses to run, and deterministic mode (the documented escape hatch)
 * still works because it never touches the CSPRNG. */
const RNG_UNAVAILABLE_BODY = `
var out = [];
out.push(["available", false, secureRandomAvailable()]);
var byteThrew = false;
try { secureRandomByte(); } catch (e) { byteThrew = /getRandomValues/.test(String((e && e.message) || e)); }
out.push(["byte-throws-getRandomValues", true, byteThrew]);
var canary = secureRandomCanaryCheck();
out.push(["canary-not-ok", false, canary.ok]);
out.push(["canary-reason", true, canary.ok === false && typeof canary.reason === "string" && /not available|crypto\\.getRandomValues/.test(canary.reason)]);
var mixedThrew = false;
try { entropyToMnemonic(RNG_D50, "", 12, "en", {}); } catch (e) { mixedThrew = true; }
out.push(["mixed-mode-throws-without-crypto", true, mixedThrew]);
var det = null, detThrew = false;
try { det = entropyToMnemonic(RNG_D50, "", 12, "en", { deterministic: true }); } catch (e) { detThrew = true; }
out.push(["deterministic-escape-hatch-works", true, !detThrew && !!det && !!det.phrase]);
if (!detThrew && det) {
  out.push(["deterministic-phrase-12-words", 12, det.phrase.split(" ").length]);
  out.push(["deterministic-no-salt", null, det.saltHex]);
}
out;
`;

/* Every degenerate RNG stub must trip the canary. The canary distinguishes
 * identical calls, an all-zero buffer, and a single repeated byte; each branch
 * is exercised with a stub designed to hit exactly that branch. CANARY_REASON
 * is injected as a context global holding the regex source that must match
 * the canary's failure reason. */
const RNG_CANARY_BODY = `
var out = [];
var canary = secureRandomCanaryCheck();
out.push(["canary-not-ok", false, canary.ok]);
out.push(["reason-pattern", true, new RegExp(CANARY_REASON).test(canary.reason || "")]);
out;
`;

function rngSubCase(name, cryptoOverride, body, canaryReason) {
  const rows = [];
  let built;
  try {
    built = buildContext({ crypto: cryptoOverride, RNG_D50, CANARY_REASON: canaryReason || "" });
  } catch (e) {
    rows.push({ group: "rng", id: name + ":load", expected: "modules load", actual: "threw: " + (e && e.message || e), pass: false });
    return rows;
  }
  let out;
  try {
    out = vm.runInContext(body, built.ctx, { filename: "rng-" + name + ".js" });
  } catch (e) {
    rows.push({ group: "rng", id: name + ":runner", expected: "ran", actual: "threw: " + (e && e.message || e), pass: false });
    return rows;
  }
  out.forEach((r) => {
    rows.push({ group: "rng", id: name + ":" + r[0], expected: r[1], actual: r[2], pass: String(r[1]) === String(r[2]) });
  });
  return rows;
}

function runRngFailClosed() {
  const rows = [];

  /* 1. Healthy platform: everything is available and produces output. */
  rows.push.apply(rows, rngSubCase("crypto-present", crypto, RNG_GOOD_BODY));

  /* 2. No crypto at all (typeof crypto === "undefined"). */
  rows.push.apply(rows, rngSubCase("crypto-absent", undefined, RNG_UNAVAILABLE_BODY));

  /* 3. crypto exists but getRandomValues does not. Same failure shape. */
  rows.push.apply(rows, rngSubCase("crypto-missing-grv", {}, RNG_UNAVAILABLE_BODY));

  /* 4. getRandomValues returns all zeros. The canary checks "identical" before
   * "all-zero", so to hit the all-zero branch specifically the two draws must
   * differ: first buffer zeroed, second non-zero. */
  let z = 0;
  const zeroStub = { getRandomValues: (b) => { b.fill((z++ % 2 === 0) ? 0 : 0x42); return b; } };
  rows.push.apply(rows, rngSubCase("grv-all-zeros", zeroStub, RNG_CANARY_BODY, "all-zero"));

  /* 5. getRandomValues returns the same bytes on every call. */
  const fill = new Uint8Array(32);
  fill.fill(0xAB);
  const identicalStub = { getRandomValues: (b) => { b.set(fill); return b; } };
  rows.push.apply(rows, rngSubCase("grv-identical-calls", identicalStub, RNG_CANARY_BODY, "identical"));

  /* 6. getRandomValues returns a constant byte that changes per call: each
   * buffer is a single repeated byte, so the two draws differ but are still
   * degenerate. This hits the canary's "repeated byte" branch. */
  let n = 0;
  const repeatedStub = { getRandomValues: (b) => { b.fill((n++ % 2 === 0) ? 0x42 : 0x43); return b; } };
  rows.push.apply(rows, rngSubCase("grv-repeated-byte", repeatedStub, RNG_CANARY_BODY, "repeated byte"));

  return rows;
}

/* ---- Vendor pin drift guard ----
 *
 * keysense-hashes.js is a build artifact. tools/build-crypto.sh --check proves
 * it reproduces from its pinned inputs, but that needs npm and network, so it
 * does not belong in every npm test. This static guard reads the committed
 * file's banner and checks it still names the exact @noble/hashes and esbuild
 * versions that the build script pins, so a hand-edit or a rebuild against a
 * different version cannot slip in silently. The actual hash OUTPUT is already
 * pinned by the Sui (blake2b) and Aptos (sha3_256) address vectors. */
function checkVendorPins() {
  const rows = [];
  let buildScript, header;
  try {
    buildScript = read("tools/build-crypto.sh");
    header = read("src/vendor/keysense-hashes.js").split("\n").slice(0, 3).join("\n");
  } catch (e) {
    rows.push({ group: "vendor", id: "pins", expected: "build script + hashes present", actual: "missing: " + (e && e.message || e), pass: false });
    return rows;
  }
  const noble = (buildScript.match(/NOBLE_VERSION="([0-9.]+)"/) || [])[1];
  const esbuild = (buildScript.match(/ESBUILD_VERSION="([0-9.]+)"/) || [])[1];
  const bannerNoble = (header.match(/@noble\/hashes@(\d+\.\d+\.\d+)/) || [])[1];
  const bannerEsbuild = (header.match(/esbuild@(\d+\.\d+\.\d+)/) || [])[1];

  rows.push({ group: "vendor", id: "banner-noble-version", expected: noble, actual: bannerNoble, pass: noble !== undefined && noble === bannerNoble });
  rows.push({ group: "vendor", id: "banner-esbuild-version", expected: esbuild, actual: bannerEsbuild, pass: esbuild !== undefined && esbuild === bannerEsbuild });
  rows.push({ group: "vendor", id: "header-intact", expected: true, actual: /Do not edit by hand/.test(header), pass: /Do not edit by hand/.test(header) });
  return rows;
}


/* ---------------------------------------------------------------- visuals --
 * The visual system primitives are DOM builders, so they get a stubbed DOM and
 * structural assertions rather than a browser: what each primitive actually
 * emits is what the diagrams depend on. The last check is the one that matters
 * most, because it is the rule the design rests on: loading the module must
 * build nothing, so nothing can animate on first paint.
 */
function checkVisuals() {
  const rows = [];
  const added = [];
  let reduced = false;

  function makeEl(tag) {
    return {
      tagName: tag,
      children: [],
      attrs: {},
      textContent: "",
      style: {},
      open: false,
      setAttribute(k, v) { this.attrs[k] = String(v); },
      removeAttribute(k) { delete this.attrs[k]; },
      appendChild(c) { added.push(c); this.children.push(c); return c; },
      get offsetWidth() { return 1; },
      getTotalLength() { return 100; },
      getBoundingClientRect() { return { width: 1 }; }
    };
  }

  const stubWindow = {
    matchMedia() { return { matches: reduced }; },
    setTimeout(fn) { return 0; }
  };
  const stubDocument = { createElementNS: (ns, tag) => makeEl(tag) };

  const before = added.length;
  const priorWindow = global.window;
  const priorDocument = global.document;
  let V = null;
  try {
    global.window = stubWindow;
    global.document = stubDocument;
    const file = path.join(root, "src", "learn-visuals.js");
    delete require.cache[require.resolve(file)];
    require(file);
    V = stubWindow.KeySenseVisuals;
  } catch (e) {
    rows.push({ group: "visuals", id: "module-loads", expected: "loads with a stubbed DOM", actual: String(e && e.message || e), pass: false });
    global.window = priorWindow;
    global.document = priorDocument;
    return rows;
  }

  const builtOnLoad = added.length - before;
  rows.push({ group: "visuals", id: "declares-nothing-on-load", expected: "0 elements built at load time", actual: builtOnLoad + " elements built", pass: builtOnLoad === 0 });

  const api = ["box", "arrow", "branch", "group", "legend", "chart", "diagram", "fadeValue", "drawTrace", "pulseOnce", "reducedMotion", "role"];
  const missing = api.filter((n) => !V || typeof V[n] !== "function");
  rows.push({ group: "visuals", id: "exposes-every-primitive", expected: api.join(", "), actual: missing.length ? "missing " + missing.join(", ") : "all present", pass: missing.length === 0 });

  const roles = V ? Object.keys(V.ROLES) : [];
  rows.push({ group: "visuals", id: "five-roles", expected: 5, actual: roles.length, pass: roles.length === 5 });

  /* Every role needs a shape rule, or colour becomes the only channel and the
   * drawing stops working in greyscale, for a colour blind reader, and in a
   * black and white print. */
  const shapeLess = roles.filter((r) => {
    const cfg = V.ROLES[r];
    return !(cfg.radius !== undefined || cfg.dash || cfg.double || cfg.hatch);
  });
  rows.push({ group: "visuals", id: "every-role-has-a-second-channel", expected: "a shape rule per role", actual: shapeLess.length ? "naked: " + shapeLess.join(", ") : "all five carry one", pass: shapeLess.length === 0 });

  const grammar = V ? Object.keys(V.MOTION).sort().join(",") : "";
  rows.push({ group: "visuals", id: "motion-grammar-is-fixed", expected: "micro,trace,value = 120,240,600", actual: grammar + " = " + (V ? Object.values(V.MOTION).join(",") : ""), pass: V && grammar === "micro,trace,value" && V.MOTION.micro === 120 && V.MOTION.value === 240 && V.MOTION.trace === 600 });

  /* Shape channels, checked on the output rather than the table. */
  const secret = V.box({ x: 0, y: 0, w: 10, h: 10, label: "s", role: "secret" });
  const secretRect = secret.children[0];
  const publicBox = V.box({ x: 0, y: 0, w: 10, h: 10, label: "p", role: "public" });
  const addressBox = V.box({ x: 0, y: 0, w: 10, h: 10, label: "a", role: "address" });
  const hashedBox = V.box({ x: 0, y: 0, w: 10, h: 10, label: "h", role: "hashed" });
  rows.push({ group: "visuals", id: "square-vs-rounded-corners", expected: "secret rx 0, public rx 6", actual: "secret " + secretRect.attrs.rx + ", public " + publicBox.children[0].attrs.rx, pass: secretRect.attrs.rx === "0" && publicBox.children[0].attrs.rx === "6" });
  rows.push({ group: "visuals", id: "address-double-border", expected: "2 rects", actual: addressBox.children.filter((c) => c.tagName === "rect").length + " rects", pass: addressBox.children.filter((c) => c.tagName === "rect").length === 2 });
  rows.push({ group: "visuals", id: "hashed-dashed", expected: "a dash pattern applied as CSS", actual: hashedBox.children[0].style.strokeDasharray || "(none)", pass: !!hashedBox.children[0].style.strokeDasharray });
  rows.push({ group: "visuals", id: "role-colour-comes-from-the-token", expected: "var(--viz-secret)", actual: secretRect.style.stroke, pass: secretRect.style.stroke === "var(--viz-secret)" });

  const arrow = V.arrow({ from: [0, 0], to: [10, 10], role: "public" });
  const arrowPath = arrow.children[0];
  rows.push({ group: "visuals", id: "arrow-carries-its-marker", expected: "marker-end on the public marker", actual: arrowPath.attrs["marker-end"], pass: arrowPath.attrs["marker-end"] === "url(#vizArrow-public)" });

  const chartRows = [
    { label: "weak", value: 30, display: "2^30" },
    { label: "mine", value: 128, display: "2^128", mine: true }
  ];
  const chart = V.chart({ rows: chartRows, log10: true, width: 400 });
  const bars = chart.children.filter((c) => c.tagName === "rect" && c.attrs.height === "14");
  const marked = chart.children.filter((c) => c.tagName === "rect" && c.style.stroke === "var(--text)");
  rows.push({ group: "visuals", id: "chart-draws-one-bar-per-row", expected: 2, actual: bars.length, pass: bars.length === 2 });
  rows.push({ group: "visuals", id: "chart-marks-the-readers-own-value", expected: "1 outlined row plus a label", actual: marked.length + " outlined", pass: marked.length === 1 && chart.children.some((c) => c.textContent === "yours") });

  const dia = V.diagram({ width: 100, height: 50, ariaLabel: "test", children: [] });
  const defs = dia.children[0];
  const markers = defs.children.filter((c) => c.tagName === "marker").length;
  const hatches = defs.children.filter((c) => c.tagName === "pattern").length;
  rows.push({ group: "visuals", id: "defs-cover-every-role", expected: "5 markers and 5 patterns", actual: markers + " markers, " + hatches + " patterns", pass: markers === 5 && hatches === 5 });
  rows.push({ group: "visuals", id: "diagram-is-labelled-for-screen-readers", expected: "role img with the given label", actual: dia.attrs.role + " / " + dia.attrs["aria-label"], pass: dia.attrs.role === "img" && dia.attrs["aria-label"] === "test" });

  /* Legend text is generated from the same table, so it cannot drift from the
   * drawings. If someone renames a role and forgets the legend, this fails. */
  const legend = V.legend(["secret"]);
  rows.push({ group: "visuals", id: "legend-text-comes-from-the-role-table", expected: V.ROLES.secret.label, actual: legend.children[1].textContent, pass: legend.children[1].textContent === V.ROLES.secret.label });

  /* The bug this exists for, found by looking at rendered pixels rather than at
   * the code: var() is not valid in an SVG presentation attribute, so
   * stroke="var(--viz-secret)" paints nothing and every diagram came out as
   * unstyled black shapes while all the structural assertions above passed.
   * Paintable properties must go through CSS, so anything left in an attribute
   * that mentions var( is a regression. In a real browser the painted values do
   * live in an attribute named "style", so a browser-side version of this check
   * has to exclude that one attribute; here the stub keeps style off attrs
   * entirely, which is the same thing. */
  const painted = [V.diagram({ width: 200, height: 100, ariaLabel: "walk", children: [
    V.group({ x: 0, y: 0, w: 190, h: 90, title: "g", children: [
      V.box({ x: 6, y: 20, w: 60, h: 30, label: "secret", role: "secret" }),
      V.box({ x: 76, y: 20, w: 60, h: 30, label: "address", role: "address" }),
      V.box({ x: 6, y: 56, w: 60, h: 30, label: "warn", role: "warn" }),
      V.arrow({ from: [66, 35], to: [76, 35], role: "public", label: "to" }),
      V.legend(["secret", "public"])
    ] })
  ] }), V.chart({ rows: [{ label: "a", value: 1 }, { label: "b", value: 9, mine: true }], width: 200 })];
  const offences = [];
  const walk = (node, path) => {
    if (!node || !node.tagName) return;
    Object.keys(node.attrs || {}).forEach((k) => {
      if (String(node.attrs[k]).indexOf("var(") !== -1) offences.push(path + "/" + node.tagName + "@" + k);
    });
    if (node.tagName === "text" && !node.style.fill) offences.push(path + "/text without a fill");
    (node.children || []).forEach((c, i) => walk(c, path + "/" + node.tagName + "[" + i + "]"));
  };
  painted.forEach((tree, i) => walk(tree, "tree" + i));
  rows.push({ group: "visuals", id: "no-var-in-presentation-attributes", expected: "every colour applied as CSS", actual: offences.length ? offences.slice(0, 3).join(", ") : "clean across " + painted.length + " diagrams", pass: offences.length === 0 });

  /* The warn role is the one role whose whole job is to look wrong, so it keeps
   * the hatch fill as its second channel. */
  const warnBox = V.box({ x: 0, y: 0, w: 40, h: 20, label: "w", role: "warn" });
  rows.push({ group: "visuals", id: "warn-role-keeps-its-hatch", expected: "the hatch pattern is used as fill", actual: warnBox.children[0].style.fill, pass: /url\(#vizHatch-warn\)/.test(warnBox.children[0].style.fill || "") });

  /* Reduced motion: every primitive must become an instant state change. */
  reduced = true;
  const tracePath = makeEl("path");
  V.drawTrace(tracePath);
  const faded = makeEl("div");
  V.fadeValue(faded);
  rows.push({ group: "visuals", id: "reduced-motion-is-instant", expected: "no dash offset animation, opacity set at once", actual: "dasharray " + JSON.stringify(tracePath.style.strokeDasharray) + ", opacity " + faded.style.opacity, pass: tracePath.style.strokeDasharray === "" && faded.style.opacity === "1" });
  rows.push({ group: "visuals", id: "reduced-motion-is-detected", expected: true, actual: V.reducedMotion(), pass: V.reducedMotion() === true });
  reduced = false;

  /* Hand the real globals back only now: the primitives resolve document and
   * window at call time, so restoring them earlier would break the assertions
   * above rather than the module. */
  global.window = priorWindow;
  global.document = priorDocument;
  return rows;
}

/* The stamps are what stop a cached old asset being reachable, so a forgotten
 * re-stamp is a shipping hazard, not a style nit. This runs the same checker the
 * deploy uses, in check mode. */
function checkAssetStamps() {
  const { execFileSync } = require("child_process");
  try {
    execFileSync(process.execPath, [path.join(root, "tools", "stamp-assets.js"), "--check"], { stdio: "pipe" });
    return [{ group: "assets", id: "stamps-current", expected: "every asset stamp matches its file", actual: "all current", pass: true }];
  } catch (e) {
    const out = String((e.stdout || "") + (e.stderr || "")).trim().split("\n").slice(0, 3).join(" / ");
    return [{ group: "assets", id: "stamps-current", expected: "every asset stamp matches its file", actual: out || "checker failed", pass: false }];
  }
}

function main() {
  const drift = checkDrift();
  const { ctx, loaded, mathRandomCalls } = loadContext();

  const skipped = APP_FILES.filter((f) => loaded.indexOf(f) === -1);
  if (skipped.length) {
    console.log("# not yet created, skipped: " + skipped.join(", "));
  }

  Promise.resolve(vm.runInContext("runAllVectors()", ctx)).then((results) => {
    let failed = 0, unfrozen = 0, pending = 0;
    let group = "";

    /* Math.random tripwire. The whole point of secure-random.js is that key
     * material never comes from Math.random, so any call made by a loaded
     * module during the run is a regression. Measured 0 on the full suite. */
    results.push({
      group: "rng", id: "no-math-random-calls", expected: 0,
      actual: mathRandomCalls(), pass: mathRandomCalls() === 0
    });
    results = results.concat(runRngFailClosed()).concat(checkVendorPins()).concat(checkVisuals()).concat(checkAssetStamps());

    for (const r of results) {
      if (r.group !== group) { group = r.group; console.log("\n# " + group); }
      if (r.pass) {
        console.log("ok     " + r.id);
      } else {
        if (r.unfrozen) { unfrozen++; console.log("FREEZE " + r.id + "\n         record: " + r.actual); continue; }
        if (r.pending) { pending++; console.log("pend   " + r.id + "  (" + r.error + ")"); continue; }
        failed++;
        console.log("NOT OK " + r.id);
        console.log("         expected " + r.expected);
        console.log("         actual   " + r.actual);
        if (r.error) console.log("         error    " + r.error);
      }
    }

    console.log("\n# asset drift guard");
    if (drift.skipped) console.log("skip   " + drift.reason);
    else if (drift.ok) console.log("ok     self-test.html loads the same scripts and stylesheets as index.html");
    else {
      failed++;
      console.log("NOT OK self-test.html has drifted from index.html");
      if (drift.missing.length) console.log("         missing from self-test: " + drift.missing.join(", "));
      if (drift.extra.length) console.log("         extra in self-test:     " + drift.extra.join(", "));
      if (drift.cssMissing.length) console.log("         stylesheets missing from self-test: " + drift.cssMissing.join(", "));
      if (drift.cssExtra.length) console.log("         stylesheets extra in self-test:     " + drift.cssExtra.join(", "));
    }

    const passed = results.filter((r) => r.pass).length;
    console.log("\n" + passed + " passed, " + failed + " failed" +
      (unfrozen ? ", " + unfrozen + " awaiting freeze" : "") +
      (pending ? ", " + pending + " pending implementation" : ""));
    process.exit(failed ? 1 : 0);
  }).catch((e) => {
    console.error("harness error: " + (e && e.stack ? e.stack : e));
    process.exit(1);
  });
}

main();
