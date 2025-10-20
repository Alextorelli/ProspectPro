#!/usr/bin/env bash
set -euo pipefail

# Toggle .gitignore immutability for safe refactoring

if [ ! -f .gitignore ]; then
  echo ".gitignore not found!"
  exit 1
fi

if lsattr .gitignore 2>/dev/null | grep -q '\-i-'; then
  echo "Locking .gitignore (chattr +i)"
  chattr +i .gitignore
else
  echo "Unlocking .gitignore (chattr -i)"
  chattr -i .gitignore
fi
lsattr .gitignore
