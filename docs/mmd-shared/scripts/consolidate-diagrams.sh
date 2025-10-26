#!/usr/bin/env bash
# Consolidate legacy diagrams from docs/diagrams/ to proper domain folders
# This script moves unique diagrams and removes duplicates

set -uo pipefail  # Removed 'e' to continue on errors

echo "=== ProspectPro Diagram Consolidation ==="
echo ""

# Track changes
MOVED=0
REMOVED=0
CREATED_DIRS=0

# Function to move or remove
process_file() {
  local legacy_file="$1"
  local target_file="$2"
  local target_dir=$(dirname "$target_file")
  
  # Create target directory if needed
  if [ ! -d "$target_dir" ]; then
    echo "  📁 Creating directory: $target_dir"
    mkdir -p "$target_dir"
    ((CREATED_DIRS++))
  fi
  
  # Check if target exists
  if [ -f "$target_file" ]; then
    # Compare files
    if diff -q "$legacy_file" "$target_file" >/dev/null 2>&1; then
      echo "  🗑️  Removing duplicate: $legacy_file"
      rm "$legacy_file"
      ((REMOVED++))
    else
      echo "  ⚠️  Files differ - manual review needed:"
      echo "     Legacy: $legacy_file"
      echo "     Target: $target_file"
    fi
  else
    echo "  📦 Moving: $legacy_file -> $target_file"
    mv "$legacy_file" "$target_file"
    ((MOVED++))
  fi
}

echo "Processing dev-tools diagrams..."
echo "================================"

# Architecture diagrams (confirmed duplicates)
for file in docs/diagrams/dev-tools/architecture/*.mmd; do
  [ -f "$file" ] || continue
  basename=$(basename "$file")
  target="docs/dev-tools/diagrams/architecture/$basename"
  echo "Processing: $basename"
  process_file "$file" "$target"
done

# Sequence diagrams
for file in docs/diagrams/dev-tools/sequence/*.mmd; do
  [ -f "$file" ] || continue
  basename=$(basename "$file")
  target="docs/dev-tools/diagrams/sequence/$basename"
  echo "Processing: $basename"
  process_file "$file" "$target"
done

# Automation diagrams
for file in docs/diagrams/dev-tools/automation/*.mmd; do
  [ -f "$file" ] || continue
  basename=$(basename "$file")
  target="docs/dev-tools/diagrams/automation/$basename"
  echo "Processing: $basename"
  process_file "$file" "$target"
done

# Observability diagrams
for file in docs/diagrams/dev-tools/observability/*.mmd; do
  [ -f "$file" ] || continue
  basename=$(basename "$file")
  target="docs/dev-tools/diagrams/observability/$basename"
  echo "Processing: $basename"
  process_file "$file" "$target"
done

# Navigation diagrams
for file in docs/diagrams/dev-tools/navigation/*.mmd; do
  [ -f "$file" ] || continue
  basename=$(basename "$file")
  target="docs/dev-tools/diagrams/navigation/$basename"
  echo "Processing: $basename"
  process_file "$file" "$target"
done

echo ""
echo "Processing integration diagrams..."
echo "=================================="

# Integration architecture
for file in docs/diagrams/integration/architecture/*.mmd; do
  [ -f "$file" ] || continue
  basename=$(basename "$file")
  target="docs/integration/diagrams/architecture/$basename"
  echo "Processing: $basename"
  process_file "$file" "$target"
done

# Integration sequence
for file in docs/diagrams/integration/sequence/*.mmd; do
  [ -f "$file" ] || continue
  basename=$(basename "$file")
  target="docs/integration/diagrams/sequence/$basename"
  echo "Processing: $basename"
  process_file "$file" "$target"
done

# Integration pipelines
for file in docs/diagrams/integration/pipelines/*.mmd; do
  [ -f "$file" ] || continue
  basename=$(basename "$file")
  target="docs/integration/diagrams/pipelines/$basename"
  echo "Processing: $basename"
  process_file "$file" "$target"
done

# Integration monitoring
for file in docs/diagrams/integration/monitoring/*.mmd; do
  [ -f "$file" ] || continue
  basename=$(basename "$file")
  target="docs/integration/diagrams/monitoring/$basename"
  echo "Processing: $basename"
  process_file "$file" "$target"
done

# Integration security
for file in docs/diagrams/integration/security/*.mmd; do
  [ -f "$file" ] || continue
  basename=$(basename "$file")
  target="docs/integration/diagrams/security/$basename"
  echo "Processing: $basename"
  process_file "$file" "$target"
done

echo ""
echo "=== Consolidation Summary ==="
echo "Directories created: $CREATED_DIRS"
echo "Files moved: $MOVED"
echo "Duplicates removed: $REMOVED"
echo ""

# Check if legacy folder is empty
if [ -d "docs/diagrams" ]; then
  remaining=$(find docs/diagrams -name "*.mmd" -type f | wc -l)
  if [ "$remaining" -eq 0 ]; then
    echo "✓ All diagrams consolidated. Ready to remove docs/diagrams/ folder."
    echo ""
    echo "Run the following to complete cleanup:"
    echo "  rm -rf docs/diagrams/"
    echo "  python3 docs/mmd-shared/scripts/generate-index.py"
    echo "  npm run docs:validate"
  else
    echo "⚠ $remaining diagram(s) remain in docs/diagrams/ - manual review needed"
    find docs/diagrams -name "*.mmd" -type f
  fi
fi

echo ""
echo "Next steps:"
echo "1. Review changes with: git status"
echo "2. Regenerate index: python3 docs/mmd-shared/scripts/generate-index.py"
echo "3. Validate: npm run docs:validate"
echo "4. Commit changes"
