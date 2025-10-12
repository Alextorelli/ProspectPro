#!/bin/bash

# ProspectPro v4.3 - Legacy User-Aware Deployment (Retired)

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

cat <<'EOF'
⚠️  The user-aware deployment workflow has been retired in v4.3.
		All backend discovery now runs through the background Edge Function
		`business-discovery-background` with asynchronous campaign orchestration.

👉 Updated deployment steps:
	 1. Run npm install if dependencies changed.
	 2. Build the React/Vite frontend with: npm run build
	 3. Deploy the static assets from /dist to Vercel.
	 4. Deploy Edge Functions via: supabase functions deploy <function-name>

🧪 Testing shortcuts:
 	 - Background discovery:
		 curl -X POST \
			 https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background \
			 -H 'Authorization: Bearer <SUPABASE_SESSION_JWT>' \
			 -H 'Content-Type: application/json' \
			 -d '{"businessType":"coffee shop","location":"Seattle, WA","maxResults":2,"tierKey":"PROFESSIONAL","sessionUserId":"test_session_123"}'
 	 - Campaign export:
		 curl -X POST \
			 https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/campaign-export-user-aware \
			 -H 'Authorization: Bearer <SUPABASE_SESSION_JWT>' \
			 -H 'Content-Type: application/json' \
			 -d '{"campaignId":"<CAMPAIGN_ID>","format":"csv","sessionUserId":"test_session_123"}'

📚 For the latest instructions see: DEPLOYMENT_CHECKLIST.md (or `.github/copilot-instructions.md`).

This script exists only for backwards compatibility.
Remove any automation that still calls it and migrate to the v4.3 workflow.
EOF

exit 0