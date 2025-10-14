# Edge Auth Testing v4 (Updated)

The commands below mirror the successful CLI tests from 2025-10-14. They avoid hard-coding publishable keys and only include `sessionUserId` when it matches the authenticated user.

> **Prerequisites**
>
> - `jq` is required for JSON payload assembly: `sudo apt-get update && sudo apt-get install jq`
> - Supabase CLI is already available via `npx supabase@latest`

### Supabase CLI Authentication (Global)

Always ensure the Supabase CLI session is authenticated before running any tests:

```bash
source scripts/ensure-supabase-cli-session.sh
```

If the script triggers a login prompt, share the displayed device code + URL with Alex for browser approval, then rerun the script to confirm the session before continuing.

## Environment Preparation

> Shortcut: `source scripts/setup-edge-auth-env.sh` performs the steps below (after you set `SUPABASE_SESSION_JWT`).

```bash
# Required Supabase context
export SUPABASE_URL="https://sriycekxdqnesdsgwiuc.supabase.co"
export SUPABASE_SESSION_JWT='eyJhbGciOiJFUzI1NiIsImtpZCI6IjQxMDczNzM5LWFlMDktNDhmZi1iM2VkLWMzZjk3OGQxZDNiMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NyaXljZWt4ZHFuZXNkc2d3aXVjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI4YjY4NDljOS04Y2NmLTQ5Y2MtYTg0ZS0xYTU4MzcwOWMwYzQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwNDc1NzQyLCJpYXQiOjE3NjA0NzIxNDIsImVtYWlsIjoiYWxleHRvcmVsbGkyOEBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJdkkycmtGTjg1OERTMXd0aDNtaVVrTVo3NGxsTF9nNHo0SGExX3NYSV9JTFhNbGgtQj1zOTYtYyIsImVtYWlsIjoiYWxleHRvcmVsbGkyOEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiQWxleCBUb3JlbGxpIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IkFsZXggVG9yZWxsaSIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0l2STJya0ZOODU4RFMxd3RoM21pVWtNWjc0bGxMX2c0ejRIYTFfc1hJX0lMWE1saC1CPXM5Ni1jIiwicHJvdmlkZXJfaWQiOiIxMDYxNDQ0ODI5NTA5OTk4Mjc1OTkiLCJzdWIiOiIxMDYxNDQ0ODI5NTA5OTk4Mjc1OTkifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTc2MDQ3MjE0Mn1dLCJzZXNzaW9uX2lkIjoiYTBiMjNjM2MtNDlmMi00Y2YxLThmNTEtYTc5NmVmZmRiOGQxIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.RjpRTbdkI7e6lakD7_0ON5hrpqglwgLs471WFZD9pJ6VR_9sAlIRgGuJhe_FF-Dj3UpostQEEijoEp8loxXPGA'
export SUPABASE_PROJECT_REF="sriycekxdqnesdsgwiuc"

# Resolve the current publishable key using Supabase's recommended projects API
# Ref: supabase projects api-keys — https://supabase.com/docs/reference/cli/supabase-projects
export SUPABASE_PUBLISHABLE_KEY="$(
  npx --yes supabase@latest projects api-keys \
    --project-ref "$SUPABASE_PROJECT_REF" \
    --output json \
  | jq -r '.[] | select(.type == "publishable") | .api_key'
)"

if [ -z "$SUPABASE_PUBLISHABLE_KEY" ]; then
  echo "❌ Unable to retrieve publishable key via supabase projects api-keys" >&2
  exit 1
fi

echo "🔐 Publishable key loaded: ${SUPABASE_PUBLISHABLE_KEY:0:24}…"

# Optional sanity check: ensure required Edge Functions are deployed
npx --yes supabase@latest functions list \
  --project-ref "$SUPABASE_PROJECT_REF" \
  --output json | jq '.[] | {slug: .slug, status: .status}'

# Optional: derive the authenticated user ID (needed only when you want to pass sessionUserId)
export SESSION_USER_ID="$(
  python <<'PY'
import base64
import json
import os

token = os.environ.get("SUPABASE_SESSION_JWT", "")
if not token:
    raise SystemExit(0)
try:
    payload = token.split(".")[1]
    padding = "=" * (-len(payload) % 4)
    decoded = base64.urlsafe_b64decode(payload + padding)
    data = json.loads(decoded)
    print(data.get("sub", ""))
except Exception:
    pass
PY
)"

if [ -n "$SESSION_USER_ID" ]; then
  echo "🔑 SESSION_USER_ID resolved: $SESSION_USER_ID"
else
  echo "(SESSION_USER_ID not set; commands will omit sessionUserId)"
fi
```

Set a campaign identifier variable after the background run succeeds (replace with the job result value when you have it):

```bash
export CAMPAIGN_ID="COFF_SEAT_20251014_203316929963_09C0C4_A_MGR0RHQL_7FE9C98E"
export CAMPAIGN_DOMAIN="northwilliamsburgchiropractic.com"
```

## 1. Core Discovery Flow

### Background (async, tier-aware)

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/business-discovery-background" \
  -H "Authorization: Bearer $SUPABASE_SESSION_JWT" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$(
    jq -n \
      --arg bt "Chiropractor" \
      --arg loc "Brooklyn, NY, USA" \
      --arg radius "5 miles" \
      --arg tier "PROFESSIONAL" \
      --arg session "$SESSION_USER_ID" \
      --argjson max 3 \
      --argjson budget 2.5 \
      --argjson minScore 70 \
      '{
         businessType: $bt,
         location: $loc,
         keywords: ["family"],
         searchRadius: $radius,
         maxResults: $max,
         budgetLimit: $budget,
         minConfidenceScore: $minScore,
         tierKey: $tier,
         options: {
           tradeAssociation: true,
           professionalLicense: true,
           chamberVerification: true
         }
       } + (if $session == "" then {} else {sessionUserId: $session} end)'
  )"
```

### Synchronous (optimized validator)

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/business-discovery-optimized" \
  -H "Authorization: Bearer $SUPABASE_SESSION_JWT" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$(
    jq -n \
      --arg bt "Chiropractor" \
      --arg loc "Brooklyn, NY, USA" \
      --arg session "$SESSION_USER_ID" \
      --argjson max 3 \
      --argjson budget 1.35 \
      --argjson minScore 70 \
      '{
         businessType: $bt,
         location: $loc,
         maxResults: $max,
         budgetLimit: $budget,
         minConfidenceScore: $minScore
       } + (if $session == "" then {} else {sessionUserId: $session} end)'
  )"
```

### Legacy user-aware (UI fallback)

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/business-discovery-user-aware" \
  -H "Authorization: Bearer $SUPABASE_SESSION_JWT" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$(
    jq -n \
      --arg bt "Chiropractor" \
      --arg loc "Brooklyn, NY, USA" \
      --arg session "$SESSION_USER_ID" \
      --argjson max 3 \
      --argjson budget 1.35 \
      --argjson minScore 70 \
      '{
         businessType: $bt,
         location: $loc,
         maxResults: $max,
         budgetLimit: $budget,
         minConfidenceScore: $minScore
       } + (if $session == "" then {} else {sessionUserId: $session} end)'
  )"
```

## 2. Enrichment & Export

### Hunter enrichment (single domain)

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/enrichment-hunter" \
  -H "Authorization: Bearer $SUPABASE_SESSION_JWT" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$(
    jq -n \
      --arg domain "$CAMPAIGN_DOMAIN" \
      --arg campaign "$CAMPAIGN_ID" \
      --arg session "$SESSION_USER_ID" \
      '({
          domain: $domain,
          campaignId: $campaign,
          source: "cli-test"
        } + (if $session == "" then {} else {sessionUserId: $session} end))'
  )"
```

### NeverBounce verification

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/enrichment-neverbounce" \
  -H "Authorization: Bearer $SUPABASE_SESSION_JWT" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$(
    jq -n \
      --arg email "contact@$CAMPAIGN_DOMAIN" \
      --arg campaign "$CAMPAIGN_ID" \
      --arg session "$SESSION_USER_ID" \
      '({
          email: $email,
          campaignId: $campaign,
          source: "cli-test"
        } + (if $session == "" then {} else {sessionUserId: $session} end))'
  )"
```

### Campaign export (user-aware)

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/campaign-export-user-aware" \
  -H "Authorization: Bearer $SUPABASE_SESSION_JWT" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$(
    jq -n \
      --arg campaign "$CAMPAIGN_ID" \
      --arg session "$SESSION_USER_ID" \
      '({
          campaignId: $campaign,
          format: "json"
        } + (if $session == "" then {} else {sessionUserId: $session} end))'
  )"
```

## 3. Diagnostics & Logging

### Tail background discovery logs

```bash
npx supabase@latest functions logs \
  --project-ref "$SUPABASE_PROJECT_REF" \
  --slug business-discovery-background \
  --tail
```

### Auth diagnostics helper

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/auth-diagnostics" \
  -H "Authorization: Bearer $SUPABASE_SESSION_JWT" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"echo": true}'
```

These scripts now:

- Load the publishable key straight from Supabase secrets every time
- Keep `sessionUserId` aligned with the authenticated subject (or omit it)
- Match the request structure that produced successful `202` responses during testing
