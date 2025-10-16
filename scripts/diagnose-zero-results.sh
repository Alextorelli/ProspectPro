#!/bin/bash
# ProspectPro - Diagnose Zero Results Campaigns
# Analyzes why a campaign returned zero results

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}

require_repo_root() {
  local repo_root
  if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "❌ Run this script inside the ProspectPro repository." >&2
    exit 1
  fi
  if [[ "$repo_root" != "$EXPECTED_REPO_ROOT" ]]; then
    echo "❌ Repository root mismatch. Expected $EXPECTED_REPO_ROOT but found $repo_root." >&2
    exit 1
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Missing required command: $1" >&2
    exit 1
  fi
}

require_repo_root
require_command psql

# Source auth environment if available
if [[ -f "$REPO_ROOT/scripts/setup-edge-auth-env.sh" ]]; then
  # shellcheck source=/workspaces/ProspectPro/scripts/setup-edge-auth-env.sh
  source "$REPO_ROOT/scripts/setup-edge-auth-env.sh" 2>/dev/null || true
fi

# Get campaign ID from args or find most recent
if [[ -n "${1:-}" ]]; then
  CAMPAIGN_ID="$1"
else
  # Resolve DATABASE_URL
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "❌ DATABASE_URL not set. Unable to auto-detect campaign." >&2
    echo "💡 Usage: $0 <CAMPAIGN_ID>" >&2
    exit 1
  fi
  
  CAMPAIGN_ID=$(psql "$DATABASE_URL" -t -c "
    SELECT id 
    FROM campaigns 
    WHERE user_id = '8b6849c9-8ccf-49cc-a84e-1a583709c0c4' 
    ORDER BY created_at DESC 
    LIMIT 1" 2>/dev/null | xargs || echo "")
  
  if [[ -z "$CAMPAIGN_ID" ]]; then
    echo "❌ No campaigns found. Run a campaign first or specify CAMPAIGN_ID." >&2
    exit 1
  fi
fi

echo "🔍 Diagnosing campaign: $CAMPAIGN_ID"
echo ""

# Resolve DATABASE_URL
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "⚠️  DATABASE_URL not set. Use Supabase SQL Editor with this query:" >&2
  echo "" >&2
  cat >&2 <<SQL
-- Campaign Diagnostics for: $CAMPAIGN_ID

-- 1. Campaign Overview
SELECT 
  c.id,
  c.business_type,
  c.location,
  c.status,
  c.results_count,
  c.total_cost,
  dj.metrics->>'businesses_found' as found,
  dj.metrics->>'user_dedup_filtered' as filtered_by_history,
  dj.metrics->>'previously_delivered_filtered' as duplicate_filtered,
  dj.metrics->>'qualified_leads' as final_qualified,
  dj.status as job_status,
  dj.current_stage as job_stage
FROM campaigns c
LEFT JOIN discovery_jobs dj ON dj.campaign_id = c.id
WHERE c.id = '$CAMPAIGN_ID';

-- 2. Deduplication Analysis
SELECT 
  'Total Businesses Found' as metric,
  (dj.metrics->>'businesses_found')::int as value
FROM discovery_jobs dj 
WHERE dj.campaign_id = '$CAMPAIGN_ID'
UNION ALL
SELECT 
  'Filtered by User History' as metric,
  (dj.metrics->>'user_dedup_filtered')::int as value
FROM discovery_jobs dj 
WHERE dj.campaign_id = '$CAMPAIGN_ID'
UNION ALL
SELECT 
  'Filtered as Duplicates' as metric,
  (dj.metrics->>'previously_delivered_filtered')::int as value
FROM discovery_jobs dj 
WHERE dj.campaign_id = '$CAMPAIGN_ID'
UNION ALL
SELECT 
  'Final Qualified' as metric,
  (dj.metrics->>'qualified_leads')::int as value
FROM discovery_jobs dj 
WHERE dj.campaign_id = '$CAMPAIGN_ID';

-- 3. User Delivery History
SELECT 
  COUNT(*) as total_delivered_businesses,
  COUNT(DISTINCT campaign_id) as campaigns_with_deliveries
FROM user_business_delivery
WHERE user_id = (SELECT user_id FROM campaigns WHERE id = '$CAMPAIGN_ID');

-- 4. Recent Leads from This Campaign
SELECT 
  l.business_name,
  l.address,
  l.confidence_score,
  l.created_at
FROM leads l
WHERE l.campaign_id = '$CAMPAIGN_ID'
ORDER BY l.confidence_score DESC
LIMIT 5;
SQL
  exit 0
fi

# Execute diagnostic queries
psql "$DATABASE_URL" <<SQL
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '1. CAMPAIGN OVERVIEW'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  c.id,
  c.business_type,
  c.location,
  c.status as campaign_status,
  c.results_count,
  c.total_cost,
  dj.status as job_status,
  dj.current_stage as job_stage
FROM campaigns c
LEFT JOIN discovery_jobs dj ON dj.campaign_id = c.id
WHERE c.id = '$CAMPAIGN_ID';

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '2. DEDUPLICATION METRICS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  'Businesses Found' as metric,
  COALESCE((dj.metrics->>'businesses_found')::text, '0') as value
FROM discovery_jobs dj 
WHERE dj.campaign_id = '$CAMPAIGN_ID'
UNION ALL
SELECT 
  'Filtered by User History' as metric,
  COALESCE((dj.metrics->>'user_dedup_filtered')::text, '0') as value
FROM discovery_jobs dj 
WHERE dj.campaign_id = '$CAMPAIGN_ID'
UNION ALL
SELECT 
  'Filtered as Duplicates' as metric,
  COALESCE((dj.metrics->>'previously_delivered_filtered')::text, '0') as value
FROM discovery_jobs dj 
WHERE dj.campaign_id = '$CAMPAIGN_ID'
UNION ALL
SELECT 
  'Final Qualified' as metric,
  COALESCE((dj.metrics->>'qualified_leads')::text, '0') as value
FROM discovery_jobs dj 
WHERE dj.campaign_id = '$CAMPAIGN_ID';

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '3. USER DELIVERY HISTORY'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  COUNT(*) as total_delivered_businesses,
  COUNT(DISTINCT campaign_id) as campaigns_with_deliveries,
  MIN(delivered_at) as first_delivery,
  MAX(delivered_at) as most_recent_delivery
FROM user_business_delivery
WHERE user_id = (SELECT user_id FROM campaigns WHERE id = '$CAMPAIGN_ID');

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '4. LEADS FROM THIS CAMPAIGN'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  COUNT(*) as lead_count
FROM leads l
WHERE l.campaign_id = '$CAMPAIGN_ID';

SELECT 
  l.business_name,
  l.address,
  l.confidence_score,
  l.created_at
FROM leads l
WHERE l.campaign_id = '$CAMPAIGN_ID'
ORDER BY l.confidence_score DESC
LIMIT 5;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '5. STAGE HISTORY'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  jsonb_array_elements(stage_history) as stage_entry
FROM discovery_jobs
WHERE campaign_id = '$CAMPAIGN_ID'
LIMIT 10;
SQL

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DIAGNOSIS SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Common Zero-Result Causes:"
echo ""
echo "1. ALL businesses filtered by user history:"
echo "   → 'Filtered by User History' = 'Businesses Found'"
echo "   → Solution: Run ./scripts/reset-user-campaigns.sh"
echo ""
echo "2. Budget exhausted before qualifying leads:"
echo "   → Check total_cost vs budget_limit in campaign"
echo "   → Solution: Increase budget or lower confidence threshold"
echo ""
echo "3. No businesses found in location:"
echo "   → 'Businesses Found' = 0"
echo "   → Solution: Adjust search radius or try different location"
echo ""
echo "4. High confidence threshold:"
echo "   → All found businesses scored below threshold"
echo "   → Solution: Lower min_confidence_score"
echo ""
echo "📊 Campaign ID: $CAMPAIGN_ID"
