#!/usr/bin/env bash
# Publish the wiki/ pages in this repository to the GitHub wiki.
#
# The GitHub wiki lives in its own git repository: <owner>/<repo>.wiki.git.
# GitHub creates that repository only when the first page is created through
# the web interface. Until then it does not exist and no push or API call can
# create it. This script says so plainly and exits 2 instead of reporting a
# success it did not achieve.
#
# Exit codes:
#   0  pages published and the remote head verified to match
#   1  publish failed (push rejected, or remote head does not match after push)
#   2  could not publish: the wiki repository does not exist yet, or git is missing
#
# Usage:
#   bash tools/publish-wiki.sh            # publish
#   bash tools/publish-wiki.sh --dry-run  # show what would change, publish nothing

set -uo pipefail

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WIKI_SRC="$REPO_ROOT/wiki"

if [[ ! -d "$WIKI_SRC" ]]; then
  echo "cannot publish: $WIKI_SRC does not exist"
  exit 2
fi

if ! command -v git >/dev/null 2>&1; then
  echo "cannot publish: git is not installed"
  exit 2
fi

REMOTE_URL="$(git -C "$REPO_ROOT" remote get-url origin 2>/dev/null)"
if [[ -z "$REMOTE_URL" ]]; then
  echo "cannot publish: no git remote named origin in $REPO_ROOT"
  exit 2
fi

# https://github.com/owner/repo.git  ->  https://github.com/owner/repo.wiki.git
WIKI_URL="${REMOTE_URL%.git}.wiki.git"

WORKDIR="$(mktemp -d)"
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

echo "wiki source : $WIKI_SRC"
echo "wiki remote : $WIKI_URL"

if ! git clone --quiet "$WIKI_URL" "$WORKDIR/wiki" 2>"$WORKDIR/clone.err"; then
  if grep -qi "not found\|does not exist\|repository not found" "$WORKDIR/clone.err"; then
    cat <<'MSG'
cannot publish: the wiki repository does not exist yet.

GitHub creates <owner>/<repo>.wiki.git only when the first wiki page is
created through the web interface. There is no CLI or API call that creates
it, so this has to be done once by hand:

  1. Open https://github.com/withkeshav/KeySense/wiki
  2. Choose "Create the first page" (any title, the content is replaced here)
  3. Save the page

Then run this script again. It pushes every page in wiki/ in one commit, and
verifies the remote head afterwards.
MSG
    exit 2
  fi
  echo "cannot publish: git clone failed"
  sed 's/^/  /' "$WORKDIR/clone.err"
  exit 1
fi

# Copy every published page. Files starting with a dot are not part of the wiki.
shopt -s nullglob
pages=("$WIKI_SRC"/*.md)
if [[ ${#pages[@]} -eq 0 ]]; then
  echo "cannot publish: no .md pages in $WIKI_SRC"
  exit 2
fi

# Remove pages that were deleted from the repository, keep the rest.
for existing in "$WORKDIR"/wiki/*.md; do
  base="$(basename "$existing")"
  [[ -f "$WIKI_SRC/$base" ]] || rm -f "$existing"
done

for page in "${pages[@]}"; do
  cp "$page" "$WORKDIR/wiki/$(basename "$page")"
done

echo "pages       : ${#pages[@]}"
for page in "${pages[@]}"; do
  echo "  $(basename "$page")"
done

cd "$WORKDIR/wiki"
git add -A
if git diff --cached --quiet; then
  echo "already up to date: nothing to publish"
  exit 0
fi

echo
echo "changes to publish:"
git diff --cached --stat | sed 's/^/  /'

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo
  echo "dry run: nothing was pushed"
  exit 0
fi

git -c user.name="KeySense" -c user.email="noreply@github.com" \
  commit --quiet -m "Publish wiki pages from the repository"

if ! git push --quiet origin HEAD 2>"$WORKDIR/push.err"; then
  echo "publish failed: push rejected"
  sed 's/^/  /' "$WORKDIR/push.err"
  exit 1
fi

LOCAL_HEAD="$(git rev-parse HEAD)"
REMOTE_HEAD="$(git ls-remote origin HEAD 2>/dev/null | awk '{print $1}')"

echo
echo "local head : $LOCAL_HEAD"
echo "remote head: ${REMOTE_HEAD:-<unreadable>}"

if [[ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]]; then
  echo "publish failed: remote head does not match local head, so this is not verified"
  exit 1
fi

echo "published and verified: ${#pages[@]} pages live at https://github.com/withkeshav/KeySense/wiki"
