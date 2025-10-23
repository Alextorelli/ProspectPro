#!/bin/bash

set -euo pipefail

if ! REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null); then
  REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
fi

# shellcheck source=/workspaces/ProspectPro/integration/platform/supabase/scripts/operations/ensure-supabase-cli-session.sh
source "$REPO_ROOT/integration/platform/supabase/scripts/operations/ensure-supabase-cli-session.sh"
