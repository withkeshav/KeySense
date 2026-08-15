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
  const re = /<script[^>]*\ssrc="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1].replace(/^\.\//, ""));
  return out;
}

/* Guard against the self-test page drifting away from what the app loads.
 * Without this, someone adds a script tag to index.html in six months and the
 * suite silently stops covering it. */
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
  return { skipped: false, missing, extra, ok: missing.length === 0 && extra.length === 0 };
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
    results = results.concat(runRngFailClosed()).concat(checkVendorPins());

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

    console.log("\n# script drift guard");
    if (drift.skipped) console.log("skip   " + drift.reason);
    else if (drift.ok) console.log("ok     self-test.html loads the same scripts as index.html");
    else {
      failed++;
      console.log("NOT OK self-test.html has drifted from index.html");
      if (drift.missing.length) console.log("         missing from self-test: " + drift.missing.join(", "));
      if (drift.extra.length) console.log("         extra in self-test:     " + drift.extra.join(", "));
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
