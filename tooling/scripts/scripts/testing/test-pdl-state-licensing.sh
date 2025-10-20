#!/bin/bash
# Test PDL & State Licensing Edge Functions with real API calls
# Usage: ./scripts/test-pdl-state-licensing.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to pretty-print JSON responses." >&2
  echo "Install jq or remove the jq pipes before rerunning this script." >&2
  exit 1
fi

if [ ! -f "${SCRIPT_DIR}/ensure-supabase-cli-session.sh" ]; then
  echo "Unable to locate scripts/ensure-supabase-cli-session.sh" >&2
  exit 1
fi

# Ensure Supabase CLI session (required for local serve commands)
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/ensure-supabase-cli-session.sh"

if [ -z "${SUPABASE_SESSION_JWT:-}" ]; then
  echo "SUPABASE_SESSION_JWT environment variable is required" >&2
  echo "Generate a session token via the ProspectPro frontend or Supabase auth helpers." >&2
  exit 1
fi

EDGE_BASE_URL="http://localhost:54321/functions/v1"

log_section() {
  echo ""
  echo "=============================================="
  echo "${1}"
  echo "=============================================="
}

echo "🔍 ProspectPro PDL & State Licensing Integration Tests"

echo "Repository root: ${REPO_ROOT}"

echo "Open a new terminal and run: npm run edge:serve"
echo "Then rerun this script once the local edge server is ready."

echo ""
read -r -p "Has the local edge functions server been started? (y/N) " CONFIRM
if [[ ! "${CONFIRM}" =~ ^[Yy]$ ]]; then
  echo "Aborting tests. Start the server and rerun." >&2
  exit 1
fi

log_section "1) People Data Labs - Company + Person Enrichment"

curl -sSf -X POST "${EDGE_BASE_URL}/enrichment-pdl" \
  -H "Authorization: Bearer ${SUPABASE_SESSION_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "lookupType": "company_and_person",
    "businessName": "Starbucks Coffee Company",
    "domain": "starbucks.com",
    "website": "https://www.starbucks.com",
    "state": "WA",
    "search": {
      "company": "Starbucks Coffee Company",
      "titleKeywords": ["Chief Executive Officer", "Founder", "Owner"],
      "minimumLikelihood": 0.8
    }
  }' | jq '.'

log_section "2) People Data Labs - Executive Search Only"

curl -sSf -X POST "${EDGE_BASE_URL}/enrichment-pdl" \
  -H "Authorization: Bearer ${SUPABASE_SESSION_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "lookupType": "person",
    "businessName": "Costco Wholesale Corporation",
    "domain": "costco.com",
    "website": "https://www.costco.com",
    "state": "WA",
    "search": {
      "company": "Costco Wholesale Corporation",
      "titleKeywords": ["Chief Executive Officer", "Owner"],
      "minimumLikelihood": 0.78
    }
  }' | jq '.'

log_section "3) State Licensing - Washington (Cobalt)"

curl -sSf -X POST "${EDGE_BASE_URL}/enrichment-business-license" \
  -H "Authorization: Bearer ${SUPABASE_SESSION_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Starbucks Coffee Company",
    "state": "WA",
    "includeUccData": true,
    "includeLiveData": true
  }' | jq '.'

log_section "4) State Licensing - New York Socrata Dataset"

curl -sSf -X POST "${EDGE_BASE_URL}/enrichment-business-license" \
  -H "Authorization: Bearer ${SUPABASE_SESSION_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "JP Morgan Securities LLC",
    "state": "NY",
    "includeInactive": false
  }' | jq '.'

log_section "5) State Licensing - Missing State (Error Handling)"

curl -sSf -X POST "${EDGE_BASE_URL}/enrichment-business-license" \
  -H "Authorization: Bearer ${SUPABASE_SESSION_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Example Consulting LLC"
  }' | jq '.'

echo ""
echo "✅ Tests executed. Review the JSON output above for verification details."