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
  local dtype="$2"
  local name="$3"
  local relpath="${path#./}"
  local tag="${TAXONOMY_TAG_PREFIX}${domain} %%"
  local reciprocal="[Back to MECE Index](../../tooling/end-state/index.md)"
  mkdir -p "$(dirname "$path")"
  # Remove all existing %% header lines at the top of the file (if any)
  if [[ -f "$path" ]]; then
    awk 'BEGIN{inheader=1} /^%%/{if(inheader) next} !/^%%/{inheader=0; print $0}' "$path" > "$path.tmp" && mv "$path.tmp" "$path"
  fi
  # Write canonical header block and append any remaining content
  {
    echo "${tag}"
    echo "${ANCHOR_TAG}"
    echo "%% type:${dtype} %%"
    echo
    echo "%% title: ${name} %%"
    echo
    echo "%% reciprocal: ${reciprocal} %%"
    echo
    echo "%% TODO: Populate diagram content. %%"
    # Append any non-header content from the original file
    if [[ -f "$path" ]]; then
      awk 'BEGIN{inheader=1} /^%%/{if(inheader) next} !/^%%/{inheader=0; print $0}' "$path"
    fi
  } > "$path.tmp"
  mv "$path.tmp" "$path"
  echo "Scaffolded $path"
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
