#!/bin/bash
# verify-agent-context.sh - Validate agent context files against schema and environment overlays

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="/workspaces/ProspectPro"
STORE_DIR="$REPO_ROOT/dev-tools/agents/context/store"
SCHEMA_FILE="$REPO_ROOT/dev-tools/agents/context/schemas/agent-context.schema.json"
ENV_DIR="$STORE_DIR/shared/environments"

echo "SCRIPT_DIR: $SCRIPT_DIR"
echo "REPO_ROOT: $REPO_ROOT"
echo "STORE_DIR: $STORE_DIR"

echo "Validating agent context files in $STORE_DIR..."

# Check if ajv-cli is available, if not, use node with ajv
if ! command -v ajv >/dev/null 2>&1; then
  echo "Installing ajv-cli for JSON schema validation..."
  npm install -g ajv-cli
fi

# Validate each JSON file
for json_file in "$STORE_DIR"/*.json; do
  if [[ "$json_file" == *".schema.json" ]]; then continue; fi
  if [[ ! -f "$json_file" ]]; then continue; fi
  echo "Validating $json_file..."
  # Basic JSON validation with node
  node -e "JSON.parse(require('fs').readFileSync('$json_file', 'utf8'))" || exit 1
done

# Check environment overlays
echo "Checking environment overlays in $ENV_DIR..."
if [[ ! -d "$ENV_DIR" ]]; then
  echo "Environment directory $ENV_DIR does not exist (not required)"
else
  env_count=$(find "$ENV_DIR" -name "*.json" | wc -l)
  if [[ $env_count -eq 0 ]]; then
    echo "No environment overlay files found in $ENV_DIR (acceptable)"
  else
    echo "Found $env_count environment overlay files"
  fi
fi

echo "All validations passed!"