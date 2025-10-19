#!/bin/bash
# Regenerate agent instructions/configs per Optimized Agent Strategy v2.0
set -e
AGENTS_DIR="$(dirname "$0")/.."
for agent in "$AGENTS_DIR"/*; do
  if [ -d "$agent" ]; then
    echo "Regenerating for $agent..."
    cp "$AGENTS_DIR/templates/instructions.md" "$agent/instructions.md"
    cp "$AGENTS_DIR/templates/config.json" "$agent/config.json"
  fi
done
echo "Agent instructions/configs regenerated."
