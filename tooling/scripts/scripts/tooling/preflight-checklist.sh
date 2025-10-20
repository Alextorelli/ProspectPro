#!/usr/bin/env bash
set -euo pipefail

# Preflight checklist for major repo overhauls

echo "[Preflight] Checking git status..."
git status -sb

echo "[Preflight] Checking .gitignore immutability..."
if lsattr .gitignore 2>/dev/null | grep -q '\-i-'; then
  echo "  .gitignore is NOT immutable."
else
  echo "  .gitignore is immutable (chattr +i)."
fi

echo "[Preflight] Checking hygiene hook permissions..."
if [ -x scripts/git-hooks/pre-push-ignore-check.sh ]; then
  echo "  pre-push-ignore-check.sh is executable."
else
  echo "  pre-push-ignore-check.sh is NOT executable!"
fi

echo "[Preflight] Checking MCP agent configs..."
if [ -d dev-tools-suite/agents ]; then
  echo "  MCP agent directory exists."
else
  echo "  MCP agent directory missing!"
fi

echo "[Preflight] Checklist complete."
