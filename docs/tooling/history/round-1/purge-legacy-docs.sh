#!/bin/bash
set -euo pipefail

REPO="/workspaces/ProspectPro"
DOC_ROOT="$REPO/docs"

cd "$REPO"

git fetch origin main
git checkout main
git pull --ff-only origin main

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Uncommitted changes detected; stash or commit before rerunning."
  exit 1
fi

if [[ -d "$DOC_ROOT" ]]; then
  git ls-files 'docs/**' -z | xargs -0 git rm -rf || true
  rm -rf "$DOC_ROOT"
fi

mkdir -p "$DOC_ROOT"
touch "$DOC_ROOT/.gitkeep"

git add "$DOC_ROOT/.gitkeep"
git commit -m "Purge legacy documentation artifacts" || true

git status --short docs
echo "Run: git push origin main"