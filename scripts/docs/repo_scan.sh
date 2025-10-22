#!/usr/bin/env bash
set -euo pipefail

# repo_scan.sh
# Generates ASCII file-tree summaries to support diagram refresh planning.
# Outputs:
#   reports/context/repo-tree-summary.txt          # Top-level overview (depth 1)
#   reports/context/app-filetree.txt               # Full tree for /app (dirs + files)
#   reports/context/dev-tools-filetree.txt         # Full tree for /dev-tools (dirs + files)
#   reports/context/integration-filetree.txt       # Full tree for /integration (dirs + files)

ROOT_DIR="${ROOT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
OUT_DIR="${OUT_DIR:-"$ROOT_DIR/reports/context"}"
SUMMARY_DEPTH="${SUMMARY_DEPTH:-1}"

mkdir -p "$OUT_DIR"

SUMMARY_FILE="$OUT_DIR/repo-tree-summary.txt"
APP_FILE="$OUT_DIR/app-filetree.txt"
DEVTOOLS_FILE="$OUT_DIR/dev-tools-filetree.txt"
INTEGRATION_FILE="$OUT_DIR/integration-filetree.txt"

PYTHON_SCRIPT=$(cat <<'PY'
import os
from pathlib import Path

TARGET = Path(os.environ["TARGET"]).resolve()
OUTFILE = Path(os.environ["OUTFILE"]).resolve()
MAX_DEPTH = int(os.environ.get("MAX_DEPTH", "-1"))
INCLUDE_FILES = os.environ.get("INCLUDE_FILES", "false").lower() == "true"
EXCLUDES = {name for name in os.environ.get("EXCLUDES", "").split(":") if name}

if not TARGET.exists():
    OUTFILE.write_text(f"[missing] {TARGET}\n")
    raise SystemExit(0)

# Sort directories before files, then alphabetically (case-insensitive)
def sort_key(path: Path):
    return (path.is_file(), path.name.lower())


def should_include(entry: Path) -> bool:
    if entry.name in EXCLUDES:
        return False
    if entry.is_dir():
        return True
    return INCLUDE_FILES


def walk(directory: Path, depth: int, last_stack, lines):
    if MAX_DEPTH >= 0 and depth > MAX_DEPTH:
        return
    try:
        entries = sorted([e for e in directory.iterdir() if should_include(e)], key=sort_key)
    except PermissionError:
        lines.append("".join("    " if last else "|   " for last in last_stack) + "[permission-denied]")
        return
    for index, entry in enumerate(entries):
        is_last = index == len(entries) - 1
        prefix = "".join("    " if last else "|   " for last in last_stack)
        connector = "`-- " if is_last else "|-- "
        name = entry.name + ("/" if entry.is_dir() else "")
        lines.append(f"{prefix}{connector}{name}")
        if entry.is_dir():
            walk(entry, depth + 1, last_stack + [is_last], lines)

lines = [TARGET.name + "/"]
walk(TARGET, 0, [], lines)
OUTFILE.write_text("\n".join(lines) + "\n")
PY
)

run_tree() {
  local target="$1"
  local outfile="$2"
  local max_depth="$3"
  local include_files="${4:-false}"

  EXCLUDES=".git:.github:.vscode:.idea:node_modules:.docs-cache:dist:.vercel:coverage:.husky:.cache" \
    TARGET="$target" \
    OUTFILE="$outfile" \
    MAX_DEPTH="$max_depth" \
    INCLUDE_FILES="$include_files" \
    python3 - "$PYTHON_SCRIPT"
}

# Summary across repo (directories only, depth limited)
run_tree "$ROOT_DIR" "$SUMMARY_FILE" "$SUMMARY_DEPTH" false

# Detailed domain trees (include files, no depth limit)
run_tree "$ROOT_DIR/app" "$APP_FILE" -1 true
run_tree "$ROOT_DIR/dev-tools" "$DEVTOOLS_FILE" -1 true
run_tree "$ROOT_DIR/integration" "$INTEGRATION_FILE" -1 true

echo "Repo scan complete:"
echo " - $SUMMARY_FILE"
echo " - $APP_FILE"
echo " - $DEVTOOLS_FILE"
echo " - $INTEGRATION_FILE"
