#!/usr/bin/env bash
# Pre-move inventory snapshot for ProspectPro migration
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
tree -L 2 "$repo_root/app" "$repo_root/supabase" "$repo_root/tooling" > "$repo_root/reports/context/pre-move-tree.txt"
find "$repo_root/app/frontend" -maxdepth 1 -type f > "$repo_root/reports/context/frontend-files.txt"
echo "Inventory snapshots saved to reports/context/pre-move-tree.txt and reports/context/frontend-files.txt"