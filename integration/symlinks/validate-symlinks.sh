#!/usr/bin/env bash
# Validate required symlinks for integration-aware wiring
set -euo pipefail

required_symlinks=("supabase")
for link in "${required_symlinks[@]}"; do
  if [[ ! -L "$link" ]]; then
    echo "Missing symlink: $link" >&2
    exit 1
  fi
  target=$(readlink "$link")
  if [[ ! -e "$target" ]]; then
    echo "Symlink $link points to missing target: $target" >&2
    exit 1
  fi
  echo "Symlink $link -> $target [OK]"
done
