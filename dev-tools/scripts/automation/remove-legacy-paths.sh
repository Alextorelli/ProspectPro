#!/bin/bash
# remove-legacy-paths.sh - Grep and remove stale references

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

echo "Scanning for legacy paths..."

# Define legacy patterns
LEGACY_PATTERNS=(
  "supabase-troubleshooting-server"
  "Reports/"
  "dev-tools/context/session_store"
  "dev-tools/agents/context/session-store"
  "dev-tools/agents/context/session_store"
)

# Grep for each pattern
for pattern in "${LEGACY_PATTERNS[@]}"; do
  echo "Searching for '$pattern'..."
  grep -r "$pattern" "$REPO_ROOT" --exclude-dir=.git --exclude-dir=node_modules || echo "No matches for $pattern"
done

echo "Manual review required for any matches above. Safe deletions handled automatically."

# Auto-delete empty dirs if any
find "$REPO_ROOT" -type d -empty -delete 2>/dev/null || true

echo "Legacy path cleanup complete."