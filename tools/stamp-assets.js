#!/usr/bin/env node
/* ============================================================================
 * Stamp every local script and stylesheet with a short content hash.
 * ============================================================================
 * Why: this app has no build step and its asset names never change, so a cached
 * copy of src/main.js is indistinguishable from the current one. Measured
 * failure: the edge served a HIT of an older src/learn-visuals.js (13,889 bytes
 * against 14,818 local) next to a fresh index.html, and the page ran the
 * previous version while every file on disk was correct.
 *
 * The fix is to make the URL change when the content changes. Each reference
 * gets ?v=<first 8 hex of the file's sha256>, so a browser or an edge that is
 * holding an old copy is holding it under a different URL and cannot be
 * reached at all. That removes the need to purge a cache after a deploy, and it
 * works with nginx's "no-cache" on the app's own files and "immutable" on the
 * vendored ones.
 *
 *   node tools/stamp-assets.js          rewrite the stamps in place
 *   node tools/stamp-assets.js --check  report only, exit 1 if any are stale
 *
 * Exit codes: 0 ok, 1 stale or missing stamps, 2 could not measure.
 * ========================================================================== */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const PAGES = ["index.html", "test/self-test.html"];
/* Local references only: an optional ./ or ../ prefix, then src/, then a js or
 * css file, with an optional existing stamp. Remote URLs are not matched. */
const REF = /(src|href)="((?:\.\.?\/)?src\/[^"?]+\.(?:js|css))(\?v=[0-9a-f]{1,16})?"/g;

function hashOf(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  return crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex").slice(0, 8);
}

function resolveRef(ref) {
  return ref.replace(/^\.\.?\//, "");
}

const check = process.argv.includes("--check");
let changed = 0;
let stale = 0;
let unresolved = 0;
const problems = [];

for (const page of PAGES) {
  const abs = path.join(ROOT, page);
  if (!fs.existsSync(abs)) { unresolved++; continue; }
  const before = fs.readFileSync(abs, "utf8");
  const after = before.replace(REF, (whole, attr, ref, existing) => {
    const file = resolveRef(ref);
    const hash = hashOf(file);
    if (!hash) { unresolved++; problems.push(page + ": " + ref + " does not exist"); return whole; }
    const wanted = "?v=" + hash;
    if (existing === wanted) return whole;
    if (existing) stale++;
    else stale++;
    problems.push(page + ": " + ref + " " + (existing ? existing : "(no stamp)") + " to " + wanted);
    return attr + '="' + ref + wanted + '"';
  });
  if (after !== before) {
    changed++;
    if (!check) fs.writeFileSync(abs, after);
  }
}

if (unresolved) {
  console.error("CANNOT MEASURE (rc 2): " + unresolved + " reference(s) could not be resolved.");
  for (const p of problems) console.error("  " + p);
  process.exit(2);
}
if (stale) {
  console.error((check ? "STALE" : "RESTAMPED") + " (rc " + (check ? "1" : "0") + "): " + stale +
    " asset reference(s) did not match their file's content hash.");
  for (const p of problems) console.error("  " + p);
  if (check) {
    console.error("\nRun: node tools/stamp-assets.js");
    process.exit(1);
  }
}
console.log((check ? "OK (rc 0): every asset stamp matches its file." :
  "OK (rc 0): " + changed + " page(s) updated, every asset stamp matches its file."));
