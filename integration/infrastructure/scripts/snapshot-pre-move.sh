#!/usr/bin/env bash
# Pre-move inventory snapshot for ProspectPro migration
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
tree -L 2 "$repo_root/app" "$repo_root/supabase" "$repo_root/tooling" > "$repo_root/dev-tools/context/session_store/pre-move-tree.txt"
find "$repo_root/app/frontend" -maxdepth 1 -type f > "$repo_root/dev-tools/context/session_store/frontend-files.txt"
echo "Inventory snapshots saved to dev-tools/context/session_store/pre-move-tree.txt and dev-tools/context/session_store/frontend-files.txt"