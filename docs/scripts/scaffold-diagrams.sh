#!/usr/bin/env bash
# Mermaid Diagram Scaffolding Script
#
# Scaffolds missing diagram files and folders per the MECE index and working docs.
# Injects taxonomy tags, compliance anchors, and reciprocal links.
#
# Usage: bash docs/scripts/scaffold-diagrams.sh

set -euo pipefail

# Config
MECE_INDEX="docs/tooling/end-state/index.md"
DIAGRAM_ROOT="docs/diagrams"
ANCHOR_TAG="%% compliance:ZeroFakeData %%"
TAXONOMY_TAG_PREFIX="%% domain:"

# Function to create a diagram file with taxonomy and compliance anchors
create_diagram_file() {
  local path="$1"
  local domain="$2"
  local dtype="$3"
  local name="$4"
  local relpath="${path#./}"
  local tag="${TAXONOMY_TAG_PREFIX}${domain} %%"
  local reciprocal="[Back to MECE Index](../../tooling/end-state/index.md)"
  mkdir -p "$(dirname "$path")"
  if [[ ! -f "$path" ]]; then
    cat > "$path" <<EOF
${tag}
${ANCHOR_TAG}
%% type:${dtype} %%

%% title: ${name} %%

%% reciprocal: ${reciprocal} %%

%% TODO: Populate diagram content. %%
EOF
    echo "Created $path"
  else
    echo "Exists: $path"
  fi
}

# Parse MECE index for required diagrams
awk '/^\|/ && !/^\| *-/' "$MECE_INDEX" | tail -n +3 | while IFS='|' read -r _ domain dtype name relpath _; do
  domain="$(echo "$domain" | xargs)"
  dtype="$(echo "$dtype" | xargs)"
  name="$(echo "$name" | xargs)"
  relpath="$(echo "$relpath" | xargs)"
  # Only process if relpath looks like a .mmd file
  if [[ "$relpath" == *.mmd ]]; then
    create_diagram_file "$relpath" "$domain" "$dtype" "$name"
  fi
  done

echo "Scaffolding complete."
