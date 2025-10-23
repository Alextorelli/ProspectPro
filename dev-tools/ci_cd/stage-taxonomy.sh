#!/bin/bash
# ProspectPro Taxonomy Staging Helper
# Syncs research docs into the troubleshooting mirror and validates Mermaid diagrams.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RESEARCH_DIR="$ROOT_DIR/docs/tooling/research"
STAGING_DIR="$ROOT_DIR/docs/tooling/troubleshooting"
PATCH_SCRIPT="$ROOT_DIR/scripts/docs/patch-diagrams.sh"

if [[ ! -d "$RESEARCH_DIR" ]]; then
  echo "[ERROR] Research directory not found: $RESEARCH_DIR" >&2
  exit 1
fi

mkdir -p "$STAGING_DIR"

# Sync latest research content into troubleshooting mirror.
rsync -a --delete "$RESEARCH_DIR/" "$STAGING_DIR/"

echo "[INFO] Research content mirrored into docs/tooling/troubleshooting." 

# Restore git sentinels for ignored troubleshooting artifacts.
cat > "$STAGING_DIR/.gitignore" <<'EOF'
*
!.gitkeep
EOF
touch "$STAGING_DIR/.gitkeep"

# Normalize troubleshooting diagrams to ensure consistent config + spacing.
"$PATCH_SCRIPT" --source troubleshooting

echo "[INFO] Mermaid sources normalized for troubleshooting artifacts."

# Validate Mermaid syntax using mermaid-cli. Any failure aborts the run.
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

find "$STAGING_DIR" -type f -name '*.mmd' | while read -r diagram; do
  relative_path=$(realpath --relative-to="$ROOT_DIR" "$diagram")
  echo "[INFO] Validating $relative_path"
  output_svg="$TEMP_DIR/$(basename "$diagram" .mmd).svg"
  npx --yes @mermaid-js/mermaid-cli@11.12.0 -i "$diagram" -o "$output_svg" >/dev/null 2>&1
  rm -f "$output_svg"
done

echo "[INFO] Taxonomy troubleshooting complete. Review docs/tooling/troubleshooting for promotion candidates."
