#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <epic-key>"
  exit 1
fi

EPIC_KEY="$1"
if [[ ! "$EPIC_KEY" =~ ^[a-z0-9-]+$ ]]; then
  echo "Epic key must be kebab-case (lowercase letters, numbers, hyphens)."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
EPIC_FILE="${REPO_ROOT}/docs/roadmap/epics/${EPIC_KEY}.md"

if [[ ! -f "$EPIC_FILE" ]]; then
  echo "Epic file not found at docs/roadmap/epics/${EPIC_KEY}.md"
  echo "Generate the epic first with npm run roadmap:epic ${EPIC_KEY}"
  exit 1
fi

to_pascal_case() {
  local input="$1"
  local output=""
  local part
  IFS='-' read -ra parts <<< "$input"
  for part in "${parts[@]}"; do
    [[ -z "$part" ]] && continue
    local first="${part:0:1}"
    local rest="${part:1}"
    output+="${first^^}${rest,,}"
  done
  echo "$output"
}

PASCAL_NAME="$(to_pascal_case "$EPIC_KEY")"
FEATURE_DIR="${REPO_ROOT}/src/features/${EPIC_KEY}"
COMPONENT_FILE="${FEATURE_DIR}/${PASCAL_NAME}Feature.tsx"
LIB_DIR="${REPO_ROOT}/lib/roadmap/${EPIC_KEY}"
LIB_FILE="${LIB_DIR}/index.ts"
FUNCTION_DIR="${REPO_ROOT}/app/backend/functions/${EPIC_KEY}"
FUNCTION_FILE="${FUNCTION_DIR}/index.ts"

mkdir -p "$FEATURE_DIR" "$LIB_DIR" "$FUNCTION_DIR"

if [[ ! -f "$LIB_FILE" ]]; then
  cat > "$LIB_FILE" <<EOF
export function register${PASCAL_NAME}Feature() {
  throw new Error('register${PASCAL_NAME}Feature not implemented yet');
}
EOF
  echo "Created ${LIB_FILE}"
else
  echo "Skipped existing ${LIB_FILE}"
fi

if [[ ! -f "$COMPONENT_FILE" ]]; then
  cat > "$COMPONENT_FILE" <<EOF
import React from 'react';

export function ${PASCAL_NAME}Feature() {
  return (
    <section data-epic="${EPIC_KEY}">
      <h2>${PASCAL_NAME} Feature</h2>
      <p>Implement feature logic for ${EPIC_KEY}.</p>
    </section>
  );
}
EOF
  echo "Created ${COMPONENT_FILE}"
else
  echo "Skipped existing ${COMPONENT_FILE}"
fi

if [[ ! -f "$FUNCTION_FILE" ]]; then
  cat > "$FUNCTION_FILE" <<'EOF'
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(() => {
  const body = JSON.stringify({
    ok: false,
    message: "Roadmap stub function not yet implemented"
  });
  return new Response(body, {
    headers: { "Content-Type": "application/json" },
    status: 501
  });
});
EOF
  echo "Created ${FUNCTION_FILE}"
else
  echo "Skipped existing ${FUNCTION_FILE}"
fi

cat <<EOF
Scaffolding complete for epic ${EPIC_KEY}.
- Feature stub: ${COMPONENT_FILE}
- Library stub: ${LIB_FILE}
- Edge function stub: ${FUNCTION_FILE}
EOF
