#!/bin/bash
# Cache Supabase publishable key for authenticated tests
# Usage: ./scripts/cache-publishable-key.sh

set -euo pipefail

CACHE_FILE="$HOME/.cache/prospectpro/api_keys_sriycekxdqnesdsgwiuc.json"
KEY_FILE="/tmp/supabase_publishable_key"

if [[ -f "$CACHE_FILE" ]]; then
  cache_age=$(($(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || echo 0)))
  if [[ $cache_age -lt 86400 ]]; then
    # Extract publishable key from cached JSON
    publishable_key=$(python3 <<'PY'
import json
import os
try:
    with open(os.environ["CACHE_FILE"]) as f:
        data = json.load(f)
    for entry in data:
        if entry.get("type") == "publishable":
            print(entry.get("api_key", ""))
            break
except Exception:
    pass
PY
)
    
    if [[ -n "$publishable_key" ]]; then
      echo "$publishable_key" > "$KEY_FILE"
      echo "✅ Publishable key cached to $KEY_FILE (from cache)"
      exit 0
    fi
  fi
fi

echo "⚠️ No cached publishable key available. Run 'source scripts/setup-edge-auth-env.sh' first."
exit 1
