set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
rg -l "app/backend/functions" | while read -r file; do
  sed -i 's|app/backend/functions|app/backend/functions|g' "$file"
done
