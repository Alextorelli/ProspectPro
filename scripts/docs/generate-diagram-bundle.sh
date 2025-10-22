#!/usr/bin/env bash
set -euo pipefail

# Phase 5: Differential diagram patching and config normalization
# Usage: scripts/docs/generate-diagram-bundle.sh [--init-config] [--svg]

CONFIG="docs/shared/mermaid/config/mermaid.config.json"
DIAGRAM_DIRS=("docs/app/diagrams" "docs/dev-tools/diagrams" "docs/integration/diagrams" "docs/shared/mermaid/templates")

function inject_config {
  local file="$1"
  if ! grep -q "%%{init:" "$file"; then
    # Build Mermaid init block from config JSON
    local theme=$(jq -r '.theme' "$CONFIG")
    local themeVars=$(jq -c '.themeVariables' "$CONFIG")
    local logLevel=$(jq -r '.init.logLevel' "$CONFIG")
    local initBlock="%%{init: { 'theme': '$theme', 'themeVariables': $themeVars, 'logLevel': '$logLevel' }}%%"
    sed -i "1s/^/$initBlock\n/" "$file"
    echo "Injected config into $file"
  fi
}

for dir in "${DIAGRAM_DIRS[@]}"; do
  find "$dir" -type f \( -name '*.mmd' -o -name '*.mermaid' \) | while read -r file; do
    inject_config "$file"
    # Optionally render SVG if --svg is passed
    if [[ "${1:-}" == "--svg" ]]; then
      npx --yes mmdc -i "$file" -o "${file%.mmd}.svg"
      echo "Rendered SVG for $file"
    fi
  done
done

echo "Diagram bundle complete."
