#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
WORKFLOWS_DIR="$REPO_ROOT/dev-tools/agents/workflows"

echo "=== Flattening Agent Workflows ==="

# Discover all persona subdirectories
for persona_dir in "$WORKFLOWS_DIR"/*/ ; do
  persona=$(basename "$persona_dir")
  
  # Skip if not a directory or already flattened
  [[ ! -d "$persona_dir" ]] && continue
  [[ "$persona" == "templates" ]] && continue
  
  echo "Processing: $persona"
  
  # Move files with persona prefix
  [[ -f "$persona_dir/config.json" ]] && \
    mv "$persona_dir/config.json" "$WORKFLOWS_DIR/${persona}.config.json"
  
  [[ -f "$persona_dir/instructions.md" ]] && \
    mv "$persona_dir/instructions.md" "$WORKFLOWS_DIR/${persona}.instructions.md"
  
  [[ -f "$persona_dir/toolset.jsonc" ]] && \
    mv "$persona_dir/toolset.jsonc" "$WORKFLOWS_DIR/${persona}.toolset.jsonc"
  
  # Remove .gitkeep and empty directory
  rm -f "$persona_dir/.gitkeep"
  rmdir "$persona_dir" 2>/dev/null || echo "  Directory not empty, skipping removal"
done

echo "=== Flattening Complete ==="