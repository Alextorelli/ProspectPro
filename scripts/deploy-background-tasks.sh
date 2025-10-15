#!/bin/bash
# ProspectPro v4.3 – Background Discovery Deployment Helper

set -euo pipefail

require_repo_root() {
  local expected_root="${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}"
  local repo_root

  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "❌ Unable to determine git root. Run this script from inside the ProspectPro repository." >&2
    exit 1
  fi

  local current_dir
  current_dir=$(pwd -P)

  if [ "$current_dir" != "$repo_root" ]; then
    echo "❌ Run this script from the repository root ($repo_root). Current directory: $current_dir" >&2
    exit 1
  fi

  if [ "$repo_root" != "$expected_root" ]; then
    echo "❌ Repository root mismatch. Expected $expected_root but detected $repo_root." >&2
    echo "   Set EXPECTED_REPO_ROOT to override if you're working from a different checkout." >&2
    exit 1
  fi
}

require_repo_root

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=/workspaces/ProspectPro/scripts/lib/supabase_cli_helpers.sh
source "$SCRIPT_DIR/lib/supabase_cli_helpers.sh"

PROJECT_REF=${SUPABASE_PROJECT_REF:-sriycekxdqnesdsgwiuc}
FUNCTIONS=(
  business-discovery-background
  business-discovery-optimized
  business-discovery-user-aware
  enrichment-orchestrator
  enrichment-hunter
  enrichment-neverbounce
  campaign-export-user-aware
)

echo "🚀 ProspectPro Background Discovery Release"
echo "Supabase project: $PROJECT_REF"
echo "---------------------------------------------"

pp_require_npx
supabase_setup || exit 1

if ! prospectpro_supabase_cli status >/dev/null 2>&1; then
  echo "⚠️ Unable to confirm Supabase project status via CLI." >&2
fi

echo "📡 Deploying Edge Functions"
for fn in "${FUNCTIONS[@]}"; do
  echo "   • $fn"
  if [[ "$fn" == "business-discovery-background" ]]; then
    prospectpro_supabase_cli functions deploy "$fn" --no-verify-jwt
  else
    prospectpro_supabase_cli functions deploy "$fn"
  fi
done

echo "✅ Edge function deploys complete"
echo

if [ -n "${SUPABASE_SESSION_JWT:-}" ]; then
  echo "🧪 Running smoke test against business-discovery-background"
  RESPONSE=$(curl -sS \
    -H "Authorization: Bearer $SUPABASE_SESSION_JWT" \
    -H "Content-Type: application/json" \
    -d '{"businessType":"coffee shop","location":"Seattle, WA","maxResults":1,"tierKey":"PROFESSIONAL","sessionUserId":"deploy_script_smoke"}' \
    "https://${PROJECT_REF}.supabase.co/functions/v1/business-discovery-background" || true)

  if echo "$RESPONSE" | jq -e .jobId >/dev/null 2>&1; then
    JOB_ID=$(echo "$RESPONSE" | jq -r .jobId)
    echo "   ✅ Campaign queued (jobId: $JOB_ID)"
    echo "   � Inspect progress in Supabase → Tables → discovery_jobs"
  else
    echo "   ⚠️ Smoke test did not return jobId. Inspect response below and review supabase logs:"
    echo ""
    echo "$RESPONSE"
  fi
else
  echo "ℹ️ Set SUPABASE_SESSION_JWT to run an authenticated smoke test automatically."
fi

echo
echo "Next steps:"
echo "  1. npm run build"
echo "  2. cd dist && vercel --prod"
echo "  3. Review Supabase dashboard → Edge Functions → business-discovery-background logs"
echo
echo "Done."
