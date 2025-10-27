#!/bin/bash
# update-chatmodes.sh - Inject observability/testing snippets into chatmode files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="/workspaces/ProspectPro"
TEMPLATE_FILE="$REPO_ROOT/dev-tools/agents/workflows/templates/observability-testing-snippet.md"
CHATMODES_DIR="$REPO_ROOT/.github/chatmodes"

echo "Updating chatmode files with observability/testing snippets..."

# Read the template content
if [[ ! -f "$TEMPLATE_FILE" ]]; then
  echo "ERROR: Template file $TEMPLATE_FILE not found"
  exit 1
fi

SNIPPET=$(cat "$TEMPLATE_FILE" | sed 's/[[\.*^$()+?{|]/\\&/g')  # Escape special regex chars

# Update each .chatmode.md file
for chatmode_file in "$CHATMODES_DIR"/*.chatmode.md; do
  echo "Updating $chatmode_file..."
  # Replace the marker with the snippet using awk
  awk -v snippet="$SNIPPET" '
    /<!-- OBSERVABILITY_TESTING_SNIPPET -->/ {
      print snippet
      next
    }
    { print }
  ' "$chatmode_file" > "${chatmode_file}.tmp" && mv "${chatmode_file}.tmp" "$chatmode_file"
done

echo "Chatmode updates complete."