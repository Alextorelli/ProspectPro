#!/bin/bash
# Simplified Edge Auth Bootstrap (v4.3.1)
# Fetches Supabase keys once and caches them for 24 hours
# Usage: source scripts/setup-edge-auth-simple.sh

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-sriycekxdqnesdsgwiuc}"
CACHE_DIR="$HOME/.cache/prospectpro"
CACHE_FILE="$CACHE_DIR/api_keys_${PROJECT_REF}.json"
SUPABASE_URL="${SUPABASE_URL:-https://sriycekxdqnesdsgwiuc.supabase.co}"

# Check cache freshness (24h TTL)
if [[ -f "$CACHE_FILE" ]]; then
  cache_age=$(($(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || echo 0)))
  if [[ $cache_age -lt 86400 ]]; then
    echo "✅ Using cached API keys (age: ${cache_age}s)"
    cached_data=$(<"$CACHE_FILE")
  else
    echo "⏰ Cache expired, fetching fresh keys..."
    cached_data=""
  fi
else
  echo "📋 No cache found, fetching API keys..."
  cached_data=""
fi

# Fetch fresh keys if cache missing or expired
if [[ -z "$cached_data" ]]; then
  mkdir -p "$CACHE_DIR"
  cd /workspaces/ProspectPro/supabase
  
  # Direct CLI invocation without helpers to avoid recursion
  if ! cached_data=$(npx --yes supabase@latest projects api-keys \
    --project-ref "$PROJECT_REF" \
    --output json 2>/dev/null); then
    echo "❌ Failed to fetch API keys. Ensure 'npm run supabase:auth' has run successfully."
    return 1
  fi
  
  echo "$cached_data" > "$CACHE_FILE"
  echo "💾 API keys cached to $CACHE_FILE"
fi

# Extract keys using Python
eval "$(python3 <<'PY'
import json
import sys
import os

try:
    data = json.loads(os.environ.get("cached_data", "[]"))
except json.JSONDecodeError:
    data = []

publishable_key = ""
service_key = ""

for entry in data:
    entry_type = entry.get("type", "")
    entry_name = entry.get("name", "")
    api_key = entry.get("api_key", "")
    
    if entry_type == "publishable" and api_key:
        publishable_key = api_key
    
    if not service_key:
        if entry_type == "secret" or (entry_type == "legacy" and entry_name == "service_role"):
            if api_key:
                service_key = api_key

if publishable_key:
    print(f'export SUPABASE_PUBLISHABLE_KEY="{publishable_key}"')
    print(f'export SUPABASE_ANON_KEY="{publishable_key}"')
    print(f'echo "🔐 Publishable key: {publishable_key[:24]}…" >&2')

if service_key:
    print(f'export SUPABASE_SERVICE_ROLE_KEY="{service_key}"')
    print(f'echo "🔑 Service role key loaded" >&2')
else:
    print('echo "⚠️ Service role key not found" >&2')

if not publishable_key:
    print('echo "❌ Publishable key not found in API keys response" >&2')
    print('return 1 2>/dev/null || exit 1')
PY
)"

export SUPABASE_URL="$SUPABASE_URL"
export SUPABASE_PROJECT_REF="$PROJECT_REF"

# Resolve SESSION_USER_ID from JWT if available
if [[ -n "${SUPABASE_SESSION_JWT:-}" ]]; then
  SESSION_USER_ID=$(python3 <<'PY'
import base64
import json
import os

session = os.environ.get("SUPABASE_SESSION_JWT", "")
if session:
    try:
        payload = session.split(".")[1]
        padding = "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload + padding)
        data = json.loads(decoded)
        user_id = data.get("sub", "")
        if user_id:
            print(user_id)
    except Exception:
        pass
PY
)
  
  if [[ -n "$SESSION_USER_ID" ]]; then
    export SESSION_USER_ID
    echo "👤 SESSION_USER_ID: $SESSION_USER_ID"
  fi
else
  echo "ℹ️ SUPABASE_SESSION_JWT not set; SESSION_USER_ID unavailable"
fi

echo "✅ Edge auth environment ready"
