#!/bin/bash
# ProspectPro Diagram Patch Automation
# Normalizes Mermaid sources prior to documentation regeneration.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if git status --porcelain .vscode .github 2>/dev/null | grep -qE '^\s*[MADRCU]'; then
  echo "[ERROR] Guarded directories (.vscode/.github) have unstaged changes. Stage proposals in docs/tooling/settings-staging.md before running diagram patches." >&2
  exit 1
fi

mapfile -t diagram_list < <(
  {
    git diff --name-only HEAD -- '*.mmd' 2>/dev/null || true
    git ls-files --others --exclude-standard -- '*.mmd' 2>/dev/null || true
  } | sed '/^$/d' | sort -u
)

if [[ ${#diagram_list[@]} -eq 0 ]]; then
  echo "[INFO] No Mermaid diagram changes detected; skipping normalization."
  exit 0
fi

normalize_config() {
  local file_path="$1"
  if grep -q '^%% config:' "$file_path"; then
    return 0
  fi
  local temp_file
  temp_file="$(mktemp)"

  if grep -q '^---$' "$file_path"; then
    awk '
      BEGIN {in_frontmatter=0; inserted=0}
      /^---$/ {
        print;
        if (in_frontmatter == 0) {
          in_frontmatter=1;
        } else if (in_frontmatter == 1 && inserted == 0) {
          print "%% config: theme: dark";
          inserted=1;
        }
        next;
      }
      {
        if (in_frontmatter == 1 && inserted == 0 && $0 !~ /^---$/) {
          # still inside frontmatter
        }
        print;
      }
      END {
        if (inserted == 0) {
          # Fallback if closing delimiter missing or config absent
          print "%% config: theme: dark";
        }
      }
    ' "$file_path" > "$temp_file"
    mv "$temp_file" "$file_path"
  else
    if ! grep -q '^%% config:' "$file_path"; then
      printf '%% config: theme: dark\n' | cat - "$file_path" > "$temp_file"
      mv "$temp_file" "$file_path"
    fi
  fi
}

for rel_path in "${diagram_list[@]}"; do
  file="$ROOT_DIR/$rel_path"
  if [[ ! -f "$file" ]]; then
    continue
  fi

  echo "[INFO] Normalizing $rel_path"

  # Ensure config header present
  normalize_config "$file"

  # Replace tabs with four spaces for consistency
  sed -i 's/\t/    /g' "$file"

  # Ensure ZeroFakeData reference exists for compliance diagrams
  if [[ "$rel_path" == *"zero"* ]]; then
    :
  elif ! grep -qi 'ZeroFakeData' "$file"; then
    echo "[WARN] $rel_path does not reference ZeroFakeData; review compliance expectations." >&2
  fi

done

echo "[INFO] Diagram normalization complete."
