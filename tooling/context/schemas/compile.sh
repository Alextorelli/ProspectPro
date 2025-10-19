#!/bin/bash
# Validate JSON schema bundle for context manager
SCHEMA_DIR="$(dirname "$0")"
BUNDLE="$SCHEMA_DIR/bundle.json"
if [ ! -f "$BUNDLE" ]; then
  echo "Schema bundle not found: $BUNDLE"
  exit 1
fi
jq empty "$BUNDLE" && echo "Schema bundle valid." || echo "Schema bundle invalid."