#!/bin/bash
# ProspectPro v4.3 – Background Discovery Deployment Helper

set -euo pipefail

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

if ! command -v supabase >/dev/null 2>&1; then
  echo "❌ Supabase CLI not found. Install via 'brew install supabase/tap/supabase' or https://supabase.com/docs." >&2
  exit 1
fi

if ! supabase status >/dev/null 2>&1; then
  echo "⚠️ Supabase project not linked in this repo. Run: supabase link --project-ref $PROJECT_REF" >&2
  exit 1
fi

echo "📡 Deploying Edge Functions"
for fn in "${FUNCTIONS[@]}"; do
  echo "   • $fn"
  supabase functions deploy "$fn" --project-ref "$PROJECT_REF"
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
echo "  3. supabase logs functions --project-ref $PROJECT_REF --slug business-discovery-background --tail"
echo
echo "Done."
