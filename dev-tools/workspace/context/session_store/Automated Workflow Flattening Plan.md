# Automated Workflow Flattening & Refactor Plan

## Overview

Flatten `dev-tools/agents/workflows/*/` subdirectories into a single-level structure with persona-prefixed files, matching the flat `context/store/*.json` layout. Remove `.gitkeep` files and update all references.

---

## Step 1: Create Automation Script

```bash
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
```

---

## Step 2: Update References in Chat Modes

```bash
#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
CHATMODES_DIR="$REPO_ROOT/.github/chatmodes"

echo "=== Updating Chat Mode Workflow References ==="

for chatmode in "$CHATMODES_DIR"/*.chatmode.md; do
  echo "Updating: $(basename "$chatmode")"

  # Replace old nested paths with flat paths
  sed -i 's|dev-tools/agents/workflows/development-workflow/instructions\.md|dev-tools/agents/workflows/development-workflow.instructions.md|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/development-workflow/toolset\.jsonc|dev-tools/agents/workflows/development-workflow.toolset.jsonc|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/production-ops/instructions\.md|dev-tools/agents/workflows/production-ops.instructions.md|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/production-ops/toolset\.jsonc|dev-tools/agents/workflows/production-ops.toolset.jsonc|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/system-architect/instructions\.md|dev-tools/agents/workflows/system-architect.instructions.md|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/system-architect/toolset\.jsonc|dev-tools/agents/workflows/system-architect.toolset.jsonc|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/observability/instructions\.md|dev-tools/agents/workflows/observability.instructions.md|g' "$chatmode"
  sed -i 's|dev-tools/agents/workflows/observability/toolset\.jsonc|dev-tools/agents/workflows/observability.toolset.jsonc|g' "$chatmode"
done

echo "=== Chat Mode Updates Complete ==="
```

---

## Step 3: Update Documentation References

```bash
#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"

echo "=== Updating Documentation Workflow References ==="

# Update all markdown files in docs/
find "$REPO_ROOT/docs" -name "*.md" -type f -exec sed -i \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/instructions\.md|dev-tools/agents/workflows/\1.instructions.md|g' \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/toolset\.jsonc|dev-tools/agents/workflows/\1.toolset.jsonc|g' \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/config\.json|dev-tools/agents/workflows/\1.config.json|g' \
  {} \;

# Update copilot instructions
sed -i \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/instructions\.md|dev-tools/agents/workflows/\1.instructions.md|g' \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/toolset\.jsonc|dev-tools/agents/workflows/\1.toolset.jsonc|g' \
  "$REPO_ROOT/.github/copilot-instructions.md"

echo "=== Documentation Updates Complete ==="
```

---

## Step 4: Update Automation Script References

```bash
#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"

echo "=== Updating Automation Script Workflow References ==="

# Update all scripts in dev-tools/scripts/
find "$REPO_ROOT/dev-tools/scripts" -name "*.sh" -type f -exec sed -i \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/instructions\.md|dev-tools/agents/workflows/\1.instructions.md|g' \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/toolset\.jsonc|dev-tools/agents/workflows/\1.toolset.jsonc|g' \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/config\.json|dev-tools/agents/workflows/\1.config.json|g' \
  {} \;

echo "=== Automation Script Updates Complete ==="
```

---

## Step 5: Update Context Store References

```bash
#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
CONTEXT_STORE="$REPO_ROOT/dev-tools/agents/context/store"

echo "=== Updating Context Store Workflow References ==="

# Update all JSON files in context store
find "$CONTEXT_STORE" -name "*.json" -type f -exec sed -i \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/instructions\.md|dev-tools/agents/workflows/\1.instructions.md|g' \
  -e 's|dev-tools/agents/workflows/\([^/]*\)/toolset\.jsonc|dev-tools/agents/workflows/\1.toolset.jsonc|g' \
  {} \;

echo "=== Context Store Updates Complete ==="
```

---

## Step 6: Refresh Inventories and Log Changes

```bash
#!/bin/bash
set -e

REPO_ROOT="/workspaces/ProspectPro"
COVERAGE_FILE="$REPO_ROOT/dev-tools/workspace/context/session_store/coverage.md"

echo "=== Finalizing Workflow Flattening ==="

# Refresh inventories
cd "$REPO_ROOT"
npm run docs:update

# Log the changes
cat >> "$COVERAGE_FILE" << EOF

## $(date +%Y-%m-%d): Agent Workflow Flattening

**Change**: Flattened \`dev-tools/agents/workflows/*/\` subdirectories into single-level persona-prefixed files.

**Actions**:
- Moved \`config.json\`, \`instructions.md\`, \`toolset.jsonc\` from nested directories to flat files.
- Removed all \`.gitkeep\` files.
- Updated references in:
  - Chat modes (\`.github/chatmodes/*.chatmode.md\`)
  - Documentation (\`docs/**/*.md\`, \`.github/copilot-instructions.md\`)
  - Automation scripts (\`dev-tools/scripts/**/*.sh\`)
  - Context store (\`dev-tools/agents/context/store/*.json\`)

**Result**: Improved agent discovery, consistent with flat context store layout, single directory scan for all personas.

**Inventories Updated**: \`dev-tools-filetree.txt\`

EOF

echo "=== Workflow Flattening Complete ==="
echo "Review coverage.md and commit changes."
```

---

## Execution Sequence

Run these scripts in order:

```bash
# Make scripts executable
chmod +x dev-tools/scripts/automation/flatten-agent-workflows.sh
chmod +x dev-tools/scripts/automation/update-chatmode-workflow-refs.sh
chmod +x dev-tools/scripts/automation/update-docs-workflow-refs.sh
chmod +x dev-tools/scripts/automation/update-automation-workflow-refs.sh
chmod +x dev-tools/scripts/automation/update-context-workflow-refs.sh
chmod +x dev-tools/scripts/automation/finalize-workflow-flatten.sh

# Execute flattening
./dev-tools/scripts/automation/flatten-agent-workflows.sh
./dev-tools/scripts/automation/update-chatmode-workflow-refs.sh
./dev-tools/scripts/automation/update-docs-workflow-refs.sh
./dev-tools/scripts/automation/update-automation-workflow-refs.sh
./dev-tools/scripts/automation/update-context-workflow-refs.sh
./dev-tools/scripts/automation/finalize-workflow-flatten.sh

# Validate
npm run lint
npm test
npm run validate:contexts

# Stage and commit
git add .
git commit -m "refactor: flatten agent workflows to single-level persona-prefixed files"
```

---

## Validation Checklist

- [ ] All persona files moved to `dev-tools/agents/workflows/<persona>.<type>`
- [ ] No `.gitkeep` files remain
- [ ] No empty subdirectories in workflows/
- [ ] Chat modes reference flat paths
- [ ] Documentation references flat paths
- [ ] Automation scripts reference flat paths
- [ ] Context store references flat paths
- [ ] Inventories refreshed (`dev-tools-filetree.txt`)
- [ ] Coverage log updated
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run validate:contexts` passes
