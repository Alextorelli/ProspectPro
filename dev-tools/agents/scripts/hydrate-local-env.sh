#!/usr/bin/env bash
# filepath: /workspaces/ProspectPro/dev-tools/agents/scripts/hydrate-local-env.sh
set -euo pipefail

ENV_FILE="dev-tools/agents/.env.agent.local"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

require_cli() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Missing required CLI: $1" >&2
    exit 1
  fi
}

require_cli vercel
if [[ -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  require_cli supabase
fi
if [[ -n "${GCLOUD_PROJECT:-}" && -n "${GCLOUD_SECRET_NAMES:-}" ]]; then
  require_cli gcloud
fi

echo "# ProspectPro Agent Credentials (hydrated)" >"$tmp"
echo "# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ)" >>"$tmp"
echo >>"$tmp"

echo "# Shared settings" >>"$tmp"
vercel env pull --environment=production --yes -t "${VERCEL_TOKEN:?}" "$tmp"

if [[ -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo >>"$tmp"
  echo "# Supabase project secrets" >>"$tmp"
  supabase secrets list --project-ref "${SUPABASE_PROJECT_REF}" --output json |
    jq -r '.[] | select(.name | test("^(AGENT_|VITE_|SUPABASE_|VERCEL_|GITHUB_)")) | "\(.name)=\(.value)"' >>"$tmp"
fi

if [[ -n "${GCLOUD_PROJECT:-}" && -n "${GCLOUD_SECRET_NAMES:-}" ]]; then
  echo >>"$tmp"
  echo "# Google Cloud secrets" >>"$tmp"
  IFS=',' read -ra secrets <<<"${GCLOUD_SECRET_NAMES}"
  for raw in "${secrets[@]}"; do
    secret="$(echo "$raw" | xargs)"
    [[ -z "$secret" ]] && continue
    if value="$(gcloud secrets versions access latest --secret="${secret}" --project="${GCLOUD_PROJECT}" 2>/dev/null)"; then
      printf "%s=%s\n" "${secret}" "${value}" >>"$tmp"
    else
      echo "⚠️  Unable to access secret ${secret}; skipping." >&2
    fi
  done
fi

if [[ -n "${GH_TOKEN:-}" ]]; then
  echo >>"$tmp"
  echo "# GitHub overrides" >>"$tmp"
  echo "GITHUB_PERSONAL_ACCESS_TOKEN=${GH_TOKEN}" >>"$tmp"
fi

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  echo "VERCEL_TOKEN=${VERCEL_TOKEN}" >>"$tmp"
fi

sort -u "$tmp" >"$ENV_FILE"
echo "✅ Secrets refreshed in $ENV_FILE"