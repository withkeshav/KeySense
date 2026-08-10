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

function loadContext() {
  const ethersMod = require(path.join(root, "src/vendor/ethers-5.7.2.umd.min.js"));
  const nacl = require(path.join(root, "src/vendor/tweetnacl-1.0.3-nacl-fast.min.js"));

  const ctx = vm.createContext({
    ethers: ethersMod.ethers || ethersMod,
    nacl,
    console, crypto, TextEncoder, TextDecoder,
    Promise, BigInt, Uint8Array, Uint32Array, ArrayBuffer, DataView,
    Array, String, Number, Boolean, Object, JSON, Math, Date, Error, RegExp, Symbol,
    parseInt, parseFloat, isNaN, isFinite, setTimeout, clearTimeout,
    require, module: undefined
  });
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
  return { ctx, loaded };
}

function main() {
  const drift = checkDrift();
  const { ctx, loaded } = loadContext();

  const skipped = APP_FILES.filter((f) => loaded.indexOf(f) === -1);
  if (skipped.length) {
    console.log("# not yet created, skipped: " + skipped.join(", "));
  }

  Promise.resolve(vm.runInContext("runAllVectors()", ctx)).then((results) => {
    let failed = 0, unfrozen = 0, pending = 0;
    let group = "";
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
