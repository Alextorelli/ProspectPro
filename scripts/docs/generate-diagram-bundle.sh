#!/usr/bin/env bash
set -euo pipefail

# Phase 5: Differential diagram patching and config normalization
# Usage: scripts/docs/generate-diagram-bundle.sh [--init-config] [--svg]

CONFIG="docs/tooling/mermaid.config.json"
DIAGRAM_DIRS=("docs/app/diagrams" "docs/dev-tools/diagrams" "docs/integration/diagrams" "docs/shared/mermaid/templates")

function inject_config {
  local file="$1"
  if ! grep -q "%%{init:" "$file"; then
    cat "$CONFIG" | jq -r '.init' > ".tmp_init"
    sed -i "1s/^/%%{init: $(cat .tmp_init)}%%\n/" "$file"
    rm .tmp_init
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
