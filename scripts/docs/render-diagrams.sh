#!/bin/bash
# Render all .mmd diagrams in docs/ to SVGs in public/diagrams/
set -euo pipefail

DIAGRAM_SRC_DIR="docs"
DIAGRAM_OUT_DIR="public/diagrams"
MERMAID_CLI="npx --yes @mermaid-js/mermaid-cli"

mkdir -p "$DIAGRAM_OUT_DIR"

find "$DIAGRAM_SRC_DIR" -type f -name '*.mmd' | while read -r mmd_file; do
  base_name=$(basename "$mmd_file" .mmd)
  out_svg="$DIAGRAM_OUT_DIR/$base_name.svg"
  echo "Rendering $mmd_file -> $out_svg"
  $MERMAID_CLI -i "$mmd_file" -o "$out_svg" --scale 1.0 --backgroundColor transparent || {
    echo "Error rendering $mmd_file" >&2
    exit 1
  }
done
