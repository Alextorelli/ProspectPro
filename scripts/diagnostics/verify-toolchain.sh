#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Verifying CLI toolchain"

check() {
  local label="$1"
  local cmd="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "✅ ${label}: $($cmd --version 2>&1 | head -n1)"
  else
    echo "⚠️  ${label} not found on PATH"
  fi
}

check "node" node
check "npm" npm

# Supabase CLI via npx
printf "✅ supabase (npx): "
if ! npx --yes supabase@latest --version; then
  echo "⚠️ failed to execute supabase via npx"
fi

# GitHub CLI
check "gh" gh
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    echo "   ↳ GitHub auth: OK"
  else
    echo "   ↳ GitHub auth: NOT AUTHENTICATED"
  fi
fi

# Deno for supabase function tests
check "deno" deno

# Vercel via npx
printf "✅ vercel (npx): "
if ! npx --yes vercel@latest --version; then
  echo "⚠️ failed to execute vercel via npx"
fi

# Optional helpers
check "jq" jq || true

echo "✅ Toolchain verification complete" 
