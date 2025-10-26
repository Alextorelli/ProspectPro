#!/usr/bin/env bash
# Mermaid Diagram Scaffolding Script
#
# Scaffolds missing diagram files and folders per the MECE index and working docs.
# Injects YAML frontmatter with taxonomy fields.
#
# Usage: bash docs/mmd-shared/scripts/scaffold-diagrams.sh

set -euo pipefail

# Config
MECE_INDEX="docs/tooling/end-state/index.md"
DIAGRAM_ROOT="docs/diagrams"

# Function to create a diagram file with YAML frontmatter
create_diagram_file() {
  local path="$1"
  local domain="$2"
  local dtype="$3"
  local name="$4"
  mkdir -p "$(dirname "$path")"
  
  # Write YAML frontmatter header
  cat > "$path" <<EOF
---
accTitle: ${name}
accDescr: TODO - Add description
domain: ${domain}
type: ${dtype}
title: ${name}
index: ../../../../mmd-shared/config/index.md
---

%%{init: { "config": "docs/mmd-shared/config/mermaid.config.json" } }%%
${dtype} TD
  %% TODO: Populate diagram content
EOF
  echo "Scaffolded $path"
}

# Parse MECE index for required diagrams
if [[ -f "$MECE_INDEX" ]]; then
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
fi

echo "Scaffolding complete."
