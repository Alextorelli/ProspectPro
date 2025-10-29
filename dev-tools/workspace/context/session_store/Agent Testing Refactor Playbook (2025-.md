# Agent Testing Refactor Playbook (2025-10-29)

## Objective

Deliver a portable, automation-first testing stack where every canonical agent taskfile triggers lint, Vitest, Playwright, and Deno flows while refreshing inventories and provenance.

---

## Phase 0 · Baseline Validation

| Step | Action                                                                | Outputs                               |
| ---- | --------------------------------------------------------------------- | ------------------------------------- | ----- | ------------------------------------------- |
| 0.1  | `npm run repo:scan`                                                   | `repo-tree-summary.txt`, domain trees |
| 0.2  | Snapshot current Task CLI targets: `task -d dev-tools/testing --list` | Baseline task inventory               |
| 0.3  | Run smoke: `task -d dev-tools/testing agents:test:full                |                                       | true` | Capture existing Vitest/Playwright failures |
| 0.4  | Log baseline in `coverage.md` (summary + current failures)            | Provenance seed                       |

**Agent prompt (Development Workflow)**

> “Capture current testing output, note failing suites, and append a baseline entry to coverage.md before refactor steps.”

---

## Phase 1 · Directory Hygiene

1. Use inventories (`repo-tree-summary.txt`, `dev-tools-filetree.txt`) to confirm only canonical folders exist under `dev-tools/testing`.
2. Purge stray fixtures/tests with:  
   `rm -rf dev-tools/testing/{legacy,e2e-old}/`
3. Regenerate inventories: `npm run repo:scan`.
4. Update `coverage.md` with removed paths and verification.

**Agent prompt (System Architect)**

> “Verify directory pruning aligns with REPO_RESTRUCTURE_PLAN.md and log results in coverage.md.”

---

## Phase 2 · Taskfile Unification

1. Replace per-agent Taskfiles to expose: `lint`, `unit`, `integration`, `e2e`, `full`, `debug:*`.
2. Root Taskfile (`dev-tools/testing/Taskfile.yml`) should aggregate agents and provide cross-cutting goals (`agents:test:{unit,integration,e2e,full}`, `reports:clean`).
3. Ensure `.vscode/tasks.json` references only `task …` shims (no bespoke scripting).
4. Stage intended editor updates in `docs/tooling/settings-staging.md`.

**Agent prompt (Production Ops)**

> “Confirm VS Code tasks wrap Task CLI targets only; document planned editor diffs in settings-staging.md.”

---

## Phase 3 · Config & Fixture Alignment

1. Overwrite Vitest config with multi-project support, shared setup, and report paths under `dev-tools/testing/reports/coverage`.
2. Align Playwright config to respect `PLAYWRIGHT_BASE_URL` and emit JSON/HTML reports in `dev-tools/testing/reports/playwright/`.
3. Expand `utils/setup.ts` with Supabase stubs, fixture loaders, and optional Highlight initialization.
4. Centralise fixtures in `utils/fixtures/`; reference via path aliases.
5. Update agent toolsets to include new testing commands if absent.

---

## Phase 4 · Test Suite Relocation

1. Move existing agent specs into `dev-tools/testing/agents/<agent>/{unit,integration,e2e}`.
2. Keep `tests/` for cross-app smoke packs and add `tests/README.md` clarifying scope.
3. Ensure Deno/Supabase edge tests stay in `app/backend/functions/tests/`; reference via Taskfile targets.

---

## Phase 5 · Automation & Telemetry

1. Update `package.json` scripts:
   - `"test:agents"` → `task -d dev-tools/testing agents:test:full`
   - Add unit/e2e/watch shims.
2. Confirm Highlight node helper (`dev-tools/observability/highlight-node/`) is initialised conditionally in setup.
3. Ensure Task targets call `npm run docs:update` and `npm run repo:scan` when `agents:test:full` succeeds.
4. Store artifacts in `dev-tools/testing/reports/` and reference them in `coverage.md`.

---

## Phase 6 · Governance & Documentation

1. Append execution notes to `coverage.md` (phases, validation commands, artifact locations).
2. Update `docs/tooling/settings-staging.md` with any editor/CI adjustments.
3. Refresh inventories post-migration: `npm run docs:update`.
4. Capture final snapshot via `node dev-tools/scripts/context/fetch-repo-context.js`.

---

## Validation Matrix

| Validation       | Command                                      | Expected Result                          |
| ---------------- | -------------------------------------------- | ---------------------------------------- |
| Task CLI list    | `task -d dev-tools/testing --list`           | New targets visible                      |
| Unit tests       | `task -d dev-tools/testing agents:test:unit` | Vitest green                             |
| E2E tests        | `task -d dev-tools/testing agents:test:e2e`  | Playwright green                         |
| Full suite       | `npm run test:agents`                        | All pipelines pass, reports generated    |
| Docs/inventories | `npm run docs:update`                        | Inventories refreshed without diff noise |

---

## Post-Execution Checklist

- [ ] All Taskfiles linted and committed
- [ ] Vitest/Playwright reports stored under `dev-tools/testing/reports/`
- [ ] `.vscode` shims documented in `settings-staging.md`
- [ ] Provenance logged in `coverage.md`
- [ ] Session-store inventories refreshed
- [ ] CI matrix updated if needed (Playwright/Vitest workflows)
