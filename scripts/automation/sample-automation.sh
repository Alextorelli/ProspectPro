#!/usr/bin/env bash
if [[ "$1" == "--dry-run" ]]; then
  echo "DRY RUN: would execute automation logic"
  exit 0
fi
# ...actual automation logic...
