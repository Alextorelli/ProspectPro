#!/bin/bash
# Diagram SVG rendering is disabled. Use .mmd files and Mermaid Chart extension for previews.
# Normalize diagrams prior to doc generation.

PATCH_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/patch-diagrams.sh"
if [[ -x "$PATCH_SCRIPT" ]]; then
	bash "$PATCH_SCRIPT" --source docs/tooling/end-state
	bash "$PATCH_SCRIPT" --source docs/tooling/v2
else
	echo "[WARN] Diagram patch script missing or not executable: $PATCH_SCRIPT" >&2
fi

echo "[INFO] Skipping SVG rendering. .mmd files are the source of truth. Use Mermaid Chart in VS Code for preview."
exit 0
