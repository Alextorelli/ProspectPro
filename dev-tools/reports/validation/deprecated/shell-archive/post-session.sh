#!/bin/bash

# ProspectPro session wrap-up helper.
# Regenerates the codebase index, shows git status, and highlights pending work.

set -euo pipefail

REPO_ROOT="/workspaces/ProspectPro"

if ! current_root=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "❌ Not inside a git repository. Run this script from the ProspectPro repo root." >&2
  exit 1
fi

if [ "$current_root" != "$REPO_ROOT" ]; then
  echo "❌ Please run scripts/post-session.sh from $REPO_ROOT (current: $current_root)" >&2
  exit 1
fi

echo "🔄 Regenerating ProspectPro codebase index..."
npm run --silent codebase:index

echo "📦 Pending changes:"
git status -sb

echo "📊 Summary of modifications:"
git diff --stat

echo "✅ Session wrap-up complete. Review the above output before committing."
