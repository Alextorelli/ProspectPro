#!/bin/bash

# ProspectPro v4.3 - Legacy User-Aware Deployment (Retired)

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
				 -H 'Authorization: Bearer <ANON_OR_SERVICE_ROLE_TOKEN>' \
				 -H 'Content-Type: application/json' \
				 -d '{"businessType":"coffee shop","location":"Seattle, WA","maxResults":2,"tierKey":"PROFESSIONAL"}'
	 - Campaign export:
			 curl -X POST \
				 https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/campaign-export-user-aware \
				 -H 'Authorization: Bearer <ANON_OR_SERVICE_ROLE_TOKEN>' \
				 -H 'Content-Type: application/json' \
				 -d '{"campaignId":"<CAMPAIGN_ID>","format":"csv","sessionUserId":"test_session_123"}'

📚 For the latest instructions see: DEPLOYMENT_CHECKLIST.md (or `.github/copilot-instructions.md`).

This script exists only for backwards compatibility.
Remove any automation that still calls it and migrate to the v4.3 workflow.
EOF

exit 0