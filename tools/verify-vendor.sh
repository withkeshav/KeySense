#!/usr/bin/env bash
# Re-checks the three copied (not built) vendored files against their pinned
# upstream SHA-384 hashes in SECURITY.md.
#
# Why this exists: a hash published once in a doc is only proof at the moment
# it was written. Nothing before this script re-ran that check on a schedule,
# which is the same gap that let a real firmware bug sit in open-source code
# for five years before anyone noticed (see the Coldcard case study in
# .progress/SECURITY-AUDIT.md). Visibility is not verification; only running
# the check is. Run this before each release, not just once during an audit.
#
# src/vendor/keysense-hashes.js is not covered here, it is BUILT, not copied;
# use tools/build-crypto.sh --check for that one instead.
#
# Usage: bash tools/verify-vendor.sh

set -euo pipefail

cd "$(dirname "$0")/.."

FAIL=0

check() {
  local file="$1" url="$2" expected="$3"
  if [ ! -f "$file" ]; then
    echo "MISSING  $file"
    FAIL=1
    return
  fi
  local actual
  actual=$(curl -fsSL "$url" | openssl dgst -sha384 -binary | openssl base64 -A)
  if [ "$actual" = "$expected" ]; then
    echo "ok       $file"
  else
    echo "MISMATCH $file"
    echo "         expected $expected"
    echo "         actual   $actual"
    echo "         upstream $url"
    FAIL=1
  fi
}

check "src/vendor/ethers-5.7.2.umd.min.js" \
  "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js" \
  "Htz1SE4Sl5aitpvFgr2j0sfsGUIuSXI6t8hEyrlQ93zflEF3a29bH2AvkUROUw7J"

check "src/vendor/qrcode-1.5.1.min.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js" \
  "kgapoJ184YmO0XnbSIH1J6dSp5rSYForqfjCgDat5yiSr8gjCnuTdRRCJXcVZ+pi"

check "src/vendor/tweetnacl-1.0.3-nacl-fast.min.js" \
  "https://cdn.jsdelivr.net/npm/tweetnacl@1.0.3/nacl-fast.min.js" \
  "05+sicyRJQ56XpL4U9HJ8YbtSzFDvAg7apPKOGV6A0JsAJKFM68jp5oLnUjG5mEp"

if [ "$FAIL" -ne 0 ]; then
  echo
  echo "One or more vendored files no longer match their pinned upstream hash."
  echo "Do not ship until this is understood: either upstream rotated the file"
  echo "at the same URL (rare, and worth asking why) or the local copy changed."
  exit 1
fi

echo
echo "All copied vendor files match their pinned upstream hash."
