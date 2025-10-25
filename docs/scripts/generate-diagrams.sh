#!/usr/bin/env bash
# Mermaid Diagram Generation Pipeline
#
# Consolidates patch and generation scripts, injects config, lints, and optionally renders SVGs.
#
# Usage:
#   bash docs/scripts/generate-diagrams.sh [--init-config] [--svg]
#
# Options:
#   --init-config   Copy mermaid.config.json to all diagram folders if missing
#   --svg           Render SVGs for all diagrams (set RENDER_STATIC=true)

set -euo pipefail

CONFIG="docs/shared/mermaid/config/mermaid.config.json"
TAXONOMY="docs/tooling/diagram-taxonomy.md"
DIAGRAM_ROOT="docs/diagrams"
RENDER_STATIC="${RENDER_STATIC:-false}"

# Optionally initialize config in all diagram folders
if [[ "${1:-}" == "--init-config" ]]; then
  for d in "$DIAGRAM_ROOT"/*; do
    if [[ -d "$d" && ! -f "$d/mermaid.config.json" ]]; then
      cp "$CONFIG" "$d/mermaid.config.json"
      echo "Injected config into $d"
    fi
  done
fi

# Lint all .mmd files using mermaid-cli
find "$DIAGRAM_ROOT" -name '*.mmd' | while read -r mmd; do
  npx -y @mermaid-js/mermaid-cli -p "$mmd" || {
    echo "Lint failed for $mmd"; exit 1;
  }
  echo "Linted $mmd"
  # Optionally render SVG
  if [[ "$RENDER_STATIC" == "true" || "${1:-}" == "--svg" ]]; then
    svg="${mmd%.mmd}.svg"
    npx -y @mermaid-js/mermaid-cli -i "$mmd" -o "$svg" -c "$CONFIG"
    echo "Rendered $svg"
  fi
  # Check taxonomy tag
  if ! grep -q '%% domain:' "$mmd"; then
    echo "Missing taxonomy tag in $mmd"; exit 2;
  fi
  # Check compliance anchor
  if ! grep -q '%% compliance:ZeroFakeData %%' "$mmd"; then
    echo "Missing compliance anchor in $mmd"; exit 2;
  fi
  # Check reciprocal link
  if ! grep -q 'reciprocal:' "$mmd"; then
    echo "Missing reciprocal link in $mmd"; exit 2;
  fi
  # Check type tag
  if ! grep -q '%% type:' "$mmd"; then
    echo "Missing type tag in $mmd"; exit 2;
  fi
  # Check title tag
  if ! grep -q '%% title:' "$mmd"; then
    echo "Missing title tag in $mmd"; exit 2;
  fi

done

echo "Diagram generation pipeline complete."
