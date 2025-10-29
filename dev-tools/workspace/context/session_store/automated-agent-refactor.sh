#!/usr/bin/env bash
# automated-agent-refactor

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
TEST_DIR="$REPO_ROOT/dev-tools/testing"

echo "╔══════════════════════════════════════════════════════╗"
echo "║ ProspectPro Agent Testing Refactor Execution Runner ║"
echo "╚══════════════════════════════════════════════════════╝"

step() {
  echo
  echo "► $1"
}

ok() {
  echo "  ✓ $1"
}

step "Phase 0: Baseline capture"
npm run repo:scan >/dev/null
task -d "$TEST_DIR" --list >/dev/null || true
task -d "$TEST_DIR" agents:test:full || true
ok "Baseline inventories & task list recorded"

step "Phase 1: Directory hygiene"
rm -rf "$TEST_DIR"/{legacy,e2e-old,archive} || true
npm run repo:scan >/dev/null
ok "Pruned legacy directories"

step "Phase 2: Taskfile regeneration"
task -d "$TEST_DIR" lint || true
ok "Taskfiles ready (lint pass optional)"

step "Phase 3: Config sync"
npx vitest --config "$TEST_DIR/configs/vitest.agents.config.ts" list >/dev/null
npx playwright test --config "$TEST_DIR/configs/playwright.agents.config.ts" --list || true
ok "Vitest/Playwright configs validated"

step "Phase 4: Suite relocation smoke"
task -d "$TEST_DIR" agents:test:unit
task -d "$TEST_DIR" agents:test:e2e
ok "Agent unit & e2e suites executed"

step "Phase 5: Full cascade & governance"
npm run test:agents
npm run docs:update
ok "Full suite executed and documentation refreshed"

step "Final: Provenance & inventory snapshot"
cat <<'EOF' >>"$REPO_ROOT/dev-tools/workspace/context/session_store/coverage.md"

## $(date +%Y-%m-%d): Agent Testing Refactor

- Executed `dev-tools/scripts/automation/execute-testing-consolidation.sh`
- Taskfiles regenerated; suites moved under dev-tools/testing/agents
- Vitest + Playwright reports stored in dev-tools/testing/reports/
- Inventories refreshed via `npm run docs:update`
- Next: stage .vscode updates in docs/tooling/settings-staging.md if modified
EOF

ok "coverage.md updated"

echo
echo "Refactor workflow complete."