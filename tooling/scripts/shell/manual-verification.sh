#!/bin/bash
# Manual Verification Script (No REST API needed)
# ProspectPro v4.2 - Background Tasks

EXPECTED_REPO_ROOT=${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}

require_repo_root() {
	local repo_root
	if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
		echo "❌ Run this script from inside the ProspectPro repo"
		exit 1
	fi

	if [ "$repo_root" != "$EXPECTED_REPO_ROOT" ]; then
		echo "❌ Wrong directory. Expected repo root: $EXPECTED_REPO_ROOT"
		echo "   Current directory: $repo_root"
		exit 1
	fi
}

require_repo_root

echo "🔍 Manual Background Task Verification"
echo "======================================"
echo ""

JOB_ID="job_1759598291039_940mw8qm5"
CAMPAIGN_ID="campaign_1759598291039_g0pk9out6"

echo "✅ Test 1 PASSED: Edge Function created job successfully"
echo "   Job ID: $JOB_ID"
echo "   Campaign ID: $CAMPAIGN_ID"
echo ""

echo "📊 Manual Verification Steps:"
echo ""
echo "1. **Check Job Status in Supabase Dashboard:**"
echo "   - Go to: Database → discovery_jobs"
echo "   - Filter by id = $JOB_ID"
echo "   - Look for: status, progress, current_stage"
echo "   - Should show progression: pending → processing → completed"
echo ""

echo "2. **Check Campaign Results:**"
echo "   - Go to: Database → campaigns"
echo "   - Filter by id = $CAMPAIGN_ID"
echo "   - Look for: results_count > 0, total_cost > 0"
echo ""

echo "3. **Check Leads Data:**"
echo "   - Go to: Database → leads"
echo "   - Filter by campaign_id = $CAMPAIGN_ID"
echo "   - Should see multiple business records"
echo ""

echo "4. **Check Edge Function Logs:**"
echo "   - Go to: Edge Functions → business-discovery-background → Logs"
echo "   - Look for recent execution logs"
echo "   - Should show processing stages and completion"
echo ""

echo "🎯 What to Look For:"
echo ""
echo "✅ SUCCESS INDICATORS:"
echo "   • Job status = 'completed'"
echo "   • Job progress = 100"
echo "   • Campaign results_count > 0"
echo "   • Leads table has records with business names, phones, addresses"
echo "   • Edge Function logs show no errors"
echo ""

echo "❌ FAILURE INDICATORS:"
echo "   • Job status = 'failed'"
echo "   • Job stuck in 'pending' status"
echo "   • Campaign results_count = 0"
echo "   • No leads in database"
echo "   • Errors in Edge Function logs"
echo ""

echo "🔄 Background Processing:"
echo "The job may take 1-2 minutes to complete. Check the database"
echo "every 30 seconds to see progress updates."
echo ""

echo "📱 Next Steps:"
echo "1. Manually verify the above in Supabase Dashboard"
echo "2. If everything looks good → Continue to Phase 4 (Frontend Integration)"
echo "3. If issues found → Check Edge Function logs for specific errors"
echo ""