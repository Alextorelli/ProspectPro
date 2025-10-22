# ProspectPro ER diagram source-of-truth: docs/tooling/end-state/dev-tool-suite-ER.mmd and docs/tooling/v2/dev-tool-suite-ER.mmd
# Both end-state/ and v2/ diagrams are processed for normalization and doc generation.
#!/bin/bash
# ProspectPro Diagram Patch Automation
# Normalizes Mermaid sources prior to documentation regeneration.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<EOF
Usage: scripts/docs/patch-diagrams.sh [--source <path|research|staging>] [--target <path>]

Options:
  --source   Process diagrams from a specific directory instead of git changes.
             Keywords: "research" (docs/tooling/research) or "staging" (docs/tooling/staging).
             Paths may be absolute or relative to the repository root.
  --target   Copy normalized diagrams into this directory (mirroring source structure).
             Paths may be absolute or relative to the repository root.
EOF
}

SOURCE_MODE="auto"
TARGET_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)
      [[ $# -ge 2 ]] || { echo "[ERROR] Missing value for --source" >&2; exit 1; }
      SOURCE_MODE="$2"
      shift 2
      ;;
    --target)
      [[ $# -ge 2 ]] || { echo "[ERROR] Missing value for --target" >&2; exit 1; }
      TARGET_DIR="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if git status --porcelain .vscode .github 2>/dev/null | grep -qE '^\s*[MADRCU]'; then
  echo "[ERROR] Guarded directories (.vscode/.github) have unstaged changes. Stage proposals in docs/tooling/settings-staging.md before running diagram patches." >&2
  exit 1
fi

SOURCE_DIR=""
SOURCE_LABEL="git"

resolve_dir() {
  local input="$1"
  if [[ "$input" == "research" ]]; then
    echo "$ROOT_DIR/docs/tooling/research"
    return 0
  fi
  if [[ "$input" == "staging" ]]; then
    echo "$ROOT_DIR/docs/tooling/staging"
    return 0
  fi
  if [[ "$input" == "end-state" ]]; then
    echo "$ROOT_DIR/docs/tooling/end-state"
    return 0
  fi
  if [[ "$input" == "v2" ]]; then
    echo "$ROOT_DIR/docs/tooling/v2"
    return 0
  fi
  if [[ "$input" == /* ]]; then
    echo "$input"
  else
    echo "$ROOT_DIR/$input"
  fi
}

if [[ "$SOURCE_MODE" != "auto" ]]; then
  SOURCE_DIR="$(resolve_dir "$SOURCE_MODE")"
  if [[ ! -d "$SOURCE_DIR" ]]; then
    echo "[ERROR] Source directory not found: $SOURCE_DIR" >&2
    exit 1
  fi
  SOURCE_LABEL="$(realpath --relative-to="$ROOT_DIR" "$SOURCE_DIR")"
fi

TARGET_ABS=""
if [[ -n "$TARGET_DIR" ]]; then
  TARGET_ABS="$(resolve_dir "$TARGET_DIR")"
  mkdir -p "$TARGET_ABS"
fi

SOURCE_RELATIVE=""
if [[ -n "$SOURCE_DIR" ]]; then
  SOURCE_RELATIVE="$(realpath --relative-to="$ROOT_DIR" "$SOURCE_DIR")"
fi

mapfile -t diagram_list < <(
  if [[ -n "$SOURCE_DIR" ]]; then
    find "$SOURCE_DIR" -type f -name '*.mmd' -print0 |
      xargs -0 -I {} realpath --relative-to="$ROOT_DIR" {} |
      sort -u
  else
    {
      git diff --name-only HEAD -- '*.mmd' 2>/dev/null || true
      git ls-files --others --exclude-standard -- '*.mmd' 2>/dev/null || true
    } | sed '/^$/d' | sort -u
  fi
)

if [[ ${#diagram_list[@]} -eq 0 ]]; then
  echo "[INFO] No Mermaid diagram changes detected; skipping normalization."
  exit 0
fi

normalize_config() {
  local file_path="$1"
  # Always ensure first line is '%%{init: {'theme': 'dark'}}%%'
  local temp_file
    temp_file="$(mktemp)"
    awk "NR==1 {print \"%%{init: {\\'theme\\': \\'dark\\'}}%%\"} NR>1 {print}" "$file_path" > "$temp_file"
  mv "$temp_file" "$file_path"
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

if [[ -n "$TARGET_ABS" && -n "$SOURCE_RELATIVE" ]]; then
  for rel_path in "${diagram_list[@]}"; do
    file="$ROOT_DIR/$rel_path"
    if [[ ! -f "$file" ]]; then
      continue
    fi
    rel_from_source="${rel_path#${SOURCE_RELATIVE}/}"
    dest="$TARGET_ABS/$rel_from_source"
    mkdir -p "$(dirname "$dest")"
    cp "$file" "$dest"
    echo "[INFO] Copied normalized diagram to ${dest#$ROOT_DIR/}"
  done
fi

echo "[INFO] Diagram normalization complete."
