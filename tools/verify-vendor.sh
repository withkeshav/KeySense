#!/usr/bin/env bash
# Re-checks the three copied (not built) vendored files against their pinned
# upstream SHA-384 hashes in SECURITY.md.
#
# Check both local bytes and upstream bytes before every release.
# Matching a download alone cannot detect changes to the shipped copy.
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
  local actual upstream
  actual=$(openssl dgst -sha384 -binary "$file" | openssl base64 -A)
  if [ "$actual" != "$expected" ]; then
    echo "LOCAL MISMATCH $file"
    echo "         expected $expected"
    echo "         actual   $actual"
    FAIL=1
    return
  fi
  if ! upstream=$(curl -fsSL --connect-timeout 15 --max-time 60 "$url" | openssl dgst -sha384 -binary | openssl base64 -A); then
    echo "DOWNLOAD FAILED $url"
    FAIL=1
    return
  fi
  if [ "$upstream" != "$expected" ]; then
    echo "UPSTREAM MISMATCH $file"
    echo "         expected $expected"
    echo "         actual   $upstream"
    echo "         upstream $url"
    FAIL=1
    return
  fi
  echo "ok       $file (local and upstream)"
}

check "src/vendor/ethers-5.8.0.umd.min.js" \
  "https://cdn.jsdelivr.net/npm/ethers@5.8.0/dist/ethers.umd.min.js" \
  "KpyAXoFibPIUEi79EsnN1EtEWCCrOQ8MtGsa4IrVxeZo514PYarFXujnjyu0DzgC"

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
