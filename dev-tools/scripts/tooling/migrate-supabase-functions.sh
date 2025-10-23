#!/usr/bin/env bash
# Migration script: Move Supabase functions to app/backend/functions
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
mv "$repo_root/app/backend/functions" "$repo_root/app/backend/functions"
echo "Supabase functions moved to app/backend/functions"