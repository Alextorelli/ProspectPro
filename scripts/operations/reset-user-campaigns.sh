#!/bin/bash
# ProspectPro - Reset User Campaign History for Testing
# Clears historical delivery records without modifying deduplication logic

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

USER_ID="${1:-8b6849c9-8ccf-49cc-a84e-1a583709c0c4}"

# Source auth environment if available
if [[ -f "$REPO_ROOT/scripts/setup-edge-auth-env.sh" ]]; then
  # shellcheck source=/workspaces/ProspectPro/scripts/setup-edge-auth-env.sh
  source "$REPO_ROOT/scripts/setup-edge-auth-env.sh" 2>/dev/null || true
fi

# Resolve DATABASE_URL
if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -n "${SUPABASE_URL:-}" ]]; then
    # Try to construct from Supabase URL (won't work without password)
    echo "⚠️  DATABASE_URL not set. Unable to connect to database." >&2
    echo "💡 Set DATABASE_URL in your environment or use Supabase SQL Editor:" >&2
    echo "" >&2
    cat >&2 <<SQL
-- Run this in Supabase SQL Editor to reset user campaign history

-- Clear delivery history for user: $USER_ID
DELETE FROM user_business_delivery WHERE user_id = '$USER_ID';

-- Archive old campaigns (keeps data, marks as archived)
UPDATE campaigns 
SET status = 'archived', 
    updated_at = NOW()
WHERE user_id = '$USER_ID' 
  AND status IN ('completed', 'failed')
  AND created_at < NOW() - INTERVAL '1 day';

-- Show remaining active campaigns
SELECT 
  id, 
  business_type, 
  location, 
  status, 
  results_count,
  created_at
FROM campaigns 
WHERE user_id = '$USER_ID'
  AND status NOT IN ('archived')
ORDER BY created_at DESC
LIMIT 10;

-- Show delivery history summary
SELECT 
  'Total Businesses Cleared' as summary,
  COUNT(*) as count
FROM user_business_delivery
WHERE user_id = '$USER_ID';
SQL
    exit 1
  fi
fi

echo "🧹 Resetting campaign history for user: $USER_ID"
echo ""

# Execute reset queries
psql "$DATABASE_URL" <<SQL
-- Show current state
SELECT 
  'Current Delivery History' as summary,
  COUNT(*) as count
FROM user_business_delivery
WHERE user_id = '$USER_ID';

-- Clear delivery history
DELETE FROM user_business_delivery WHERE user_id = '$USER_ID';

-- Archive old campaigns (keeps data for reference)
UPDATE campaigns 
SET status = 'archived', 
    updated_at = NOW()
WHERE user_id = '$USER_ID' 
  AND status IN ('completed', 'failed')
  AND created_at < NOW() - INTERVAL '1 day'
RETURNING id, business_type, location, status;

-- Show summary
SELECT 
  'Active Campaigns' as status,
  COUNT(*) as count
FROM campaigns 
WHERE user_id = '$USER_ID'
  AND status NOT IN ('archived', 'deleted')
UNION ALL
SELECT 
  'Archived Campaigns' as status,
  COUNT(*) as count
FROM campaigns 
WHERE user_id = '$USER_ID'
  AND status = 'archived';

-- Show recent campaigns
SELECT 
  id, 
  business_type, 
  location, 
  status, 
  results_count,
  created_at
FROM campaigns 
WHERE user_id = '$USER_ID'
ORDER BY created_at DESC
LIMIT 5;
SQL

echo ""
echo "✅ Campaign history reset complete"
echo ""
echo "💡 Next steps:"
echo "   1. Run a new discovery campaign via the UI"
echo "   2. Businesses should no longer be filtered by history"
echo "   3. Check job metrics: user_dedup_filtered should be 0"
echo ""
echo "📊 Or run: ./scripts/test-discovery-pipeline.sh"
