#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="dev-tools/agents/.env.agent.local"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

echo "# ProspectPro Agent Credentials (hydrated)" >"$tmp"
echo "# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ)" >>"$tmp"
echo >>"$tmp"

echo "# Shared settings" >>"$tmp"
vercel env pull --environment=production --yes -t "${VERCEL_TOKEN:?}" "$tmp"

supabase secrets list --project-ref "${SUPABASE_PROJECT_REF:?}" --json | \
  jq -r '.[] | select(.name|test("^AGENT_|^VERCEL_|^GITHUB_")) | "\(.name)=\(.value)"' >>"$tmp"

gh secret list --env AGENTS --visibility all --json name,value | \
  jq -r '.[] | "\(.name)=\(.value)"' >>"$tmp"

sort -u "$tmp" >"$ENV_FILE"
echo "Secrets refreshed in $ENV_FILE"