# REPO_RESTRUCTURE_PLAN

## Objective

Deliver the ProspectPro hybrid mono-repo realignment with a diagram-first, automation-aware workflow. Separate production application code under `/app` from dev tooling under `/tooling`, enforce centralized Mermaid standards, and keep Supabase-first architecture plus MCP integrations fully operational.

## Target Directory Layout

```
/app/
  /discovery/
  /enrichment/
  /export/
  /diagnostics/
  /frontend/
  /backend/
/tooling/
  /scripts/
  /ci/
  /docker/
  /vercel/
  /monitoring/
  /supabase/
  /test-automation/
  /agent-orchestration/
  /integration/
/docs/
/config/
/reports/
```

## Governance & Ownership

- `/app`: Production surfaces only (frontend, backend, edge functions, business logic). Keep Supabase RLS, auth, and discovery/enrichment/export flows intact.
- `/tooling`: Dev tooling, automation, MCP assets, CI/CD, diagnostics, and agent orchestration. Guarded directories (`.vscode/`, `.github/`) require staging in `docs/tooling/settings-staging.md` prior to edits.
- `archive/loose-root-assets/`: Temporary quarantine for legacy files pending migration or deletion.
- Root hygiene: Only canonical top-level folders and repo metadata remain at the project root (README, package manifests, ignore files, .github/, .vscode/, .devcontainer/, etc.).

## End-to-End Migration Plan

### Phase 1 – Baseline & Safeguards

1. **Branching**: `git checkout restructure-recovery && git pull --ff-only` then `git checkout -b diagram-automation-restructure`.
2. **Record Intent**: Add a "Diagram Automation Revamp" entry to `docs/tooling/settings-staging.md` with rationale, risk, and rollback.
3. **Workspace Snapshot**: `npm run reports:workspace-status` (already executed).
4. **Context Capture**: Run `./scripts/automation/context-snapshot.sh full all` (or provide `<function-slug> <since-time>` when targeted). Archive the output path inside `reports/context/coverage.md`.
5. **Critical Config Backups**: Compress `.devcontainer/`, `.vscode/`, `.github/`, `config/` into `archive/loose-root-assets/codespace-config-backup-$(date +%F).tar.gz`.

### Phase 2 – Target Index & Inventory

1. Update or create `docs/tooling/end-state/index.md` to map the MECE diagram hierarchy (`docs/app/diagrams`, `docs/dev-tools/diagrams`, `docs/integration/diagrams`, `docs/shared/mermaid/`).
2. Cross-link this plan and the index so both reference each other.
3. Generate fresh asset listings:

```bash
./scripts/automation/context-snapshot.sh diagrams latest
find docs -name '*.mmd' -print | sort > reports/context/diagrams-current.txt
git ls-files '*scripts/**' '*docs/**' '*config/**' > reports/context/live-tooling-list.txt
```

4. Log the inventories in `reports/context/coverage.md` to establish the pre-migration baseline.

### Phase 3 – Centralized Mermaid Standards

1. Add `docs/tooling/mermaid.config.json` with shared dark/light palettes, typography, and common padding.
2. Refresh `docs/tooling/diagram-guidelines.md` and `docs/technical/DOCUMENTATION_STANDARDS.md` to reference the shared config, compliance anchors (ZeroFakeData, schema/auth checkpoints), and snippet usage.
3. Stage any `.vscode/` or `.github/` proposals in `docs/tooling/settings-staging.md` before applying.

### Phase 4 – Diagram Directory Migration

1. Create target folders: `docs/app/diagrams/{user-flows,state-machines,api-flows}`, `docs/dev-tools/diagrams/{architecture,ci-cd,agent-flows,erd}`, `docs/integration/diagrams/{deployment,data-flow,security}`, `docs/shared/mermaid/{config,templates,guidelines}`.
2. Copy latest `.mmd` sources into the new structure (preserve timestamps for audit):

```bash
rsync -av --include='*.mmd' --exclude='*' docs/app/ docs/app/diagrams/
rsync -av --include='*.mmd' --exclude='*' docs/tooling/ docs/dev-tools/diagrams/
rsync -av --include='*.mmd' --exclude='*' docs/technical/ docs/integration/diagrams/
```

3. Move shared snippets/config to `docs/shared/mermaid/` and document the relocation in `reports/context/coverage.md`.
4. Update diagram references inside FAST READMEs (`docs/app/FAST_README.md`, `docs/tooling/FAST_README.md`) and other documentation callouts.

### Phase 5 – Automation Overhaul

1. Replace `scripts/docs/patch-diagrams.sh` with `scripts/docs/generate-diagram-bundle.sh` that supports `--init-config`, taxonomy tagging, JSON config injection, and optional SVG export mode.
2. Update or add `scripts/docs/render-diagrams.sh` to invoke the bundle script and respect staging safeguards.
3. Extend `package.json` scripts: new `docs:validate`, `docs:preview`, `docs:audit`, `docs:render:svg`; revise `docs:prepare` to invoke the bundle, taxonomy audit, and VS Code preview (`code --command MermaidChart.openPreview`).
4. Update `dev-tools/scripts/docs/generate-diagrams.mjs` (or equivalent) to read the shared manifest, honor the new directories, and emit taxonomy compliance warnings.

### Phase 6 – Taxonomy Audit & Provenance

1. Create `scripts/docs/audit-diagram-taxonomy.js` to surface missing domain/tags and compliance anchors.
2. Wire the audit into `npm run docs:audit` and into the `docs:prepare` pipeline for hard failures when metadata is missing.
3. Append provenance logging to `reports/context/coverage.md` each run (diagram counts by domain, missing anchors, last script SHA).

### Phase 7 – MCP & VS Code Integration

1. Register a `diagram_patch` MCP tool in the troubleshooting server configuration (`mcp-servers/*/config.json`) so agents can enforce normalization.
2. Stage VS Code task proposals in `docs/tooling/settings-staging.md` for commands like `MermaidChart.createDiagram`, the new audit scripts, and render flows; apply after approval.
3. Update `.github/workflows/mermaid-diagram-sync.yml` to call `scripts/docs/generate-diagram-bundle.sh` and `npm run docs:audit`; document the workflow changes in the staging file prior to committing.

### Phase 8 – Cleanup & Archive

1. After verifying copies, remove superseded diagram directories; retain rollback tarball `archive/loose-root-assets/diagram-pre-migration-$(date +%F).tar.gz`.
2. Update `reports/context/coverage.md` and `workspace_status.md` with removal notes, new canonical paths, and rollback instructions.
3. Quarantine any legacy automation or documentation that no longer maps to the MECE structure.

### Phase 9 – Validation & Hand-off

1. Execute the validation suite:

```bash
npm run docs:prepare
npm run docs:update
npm run docs:audit
RENDER_STATIC=1 npm run docs:render:svg   # Opt-in via env flag
npm run lint
npm test
npm run supabase:test:db
```

2. Record command outputs and hashes in `reports/context/coverage.md` and `workspace_status.md`.
3. Open a PR from `diagram-automation-restructure` with:

- Summary of directory moves, automation upgrades, and MCP integrations.
- Validation logs and provenance snapshots.
- Backup archive paths for rollback.

## Remaining Alignment Tasks

- Phase the relocation of `/app/frontend`, `/app/backend/functions`, and supporting tooling into the target layout while keeping Supabase auth + RLS intact.
- Update VS Code tasks, npm scripts, and MCP tooling to match new paths after the diagram automation branch merges.
- Document ZeroFakeData checks, context snapshots, and diagnostics alignment in `reports/context/coverage.md` for Phase 5/6 sign-offs.

This plan supersedes prior guidance; follow the phased approach above for all restructuring and diagram automation work.

# REPO_RESTRUCTURE_PLAN

## Objective

Converge ProspectPro to a hybrid mono-repo structure optimized for AI agent workflows, separating application source code (/app) from dev tooling (/tooling), while preserving Supabase-first architecture and MCP integrations.

## Target Directory Layout

/app/
/discovery/
/enrichment/
/export/
/diagnostics/
/frontend/
/backend/
/tooling/
/scripts/
/ci/
/docker/
/vercel/
/monitoring/
/supabase/
/test-automation/
/agent-orchestration/
/integration/

## Ownership Rules

- /app: Production application code only (frontend, backend, edge functions, business logic)
- /tooling: Dev tools, CI/CD, agent orchestration, monitoring, test automation, integration scripts
- Legacy folders (archive, backups, modules, context, workflow, dist, mcp-servers) to be tagged and migrated/archived
- Documentation to be indexed and updated post-migration

## Migration Steps

1. Tag and plan migration for legacy folders
2. Move src, public, app/backend/functions into /app (phased)
3. Relocate dev tooling into /tooling subtrees
4. Integrate MCP troubleshooting server telemetry tools (`capture_api_trace`, `compare_campaign_costs`, `predict_campaign_roi`) into diagnostics and automation scripts. Update build scripts, npm scripts, VS Code tasks, and MCP validation collections. All Thunder/Jaeger references are deprecated; use MCP tools and Supabase logs for observability.
5. Regenerate documentation, diagrams, and codebase index to reflect new telemetry flows and validation checkpoints.
6. Validate agent readiness, ZeroFakeData compliance, and operational coverage. Ensure context snapshots and diagnostics outputs are aligned with new folder structure and coverage standards.

## Notes

- Supabase-first architecture and RLS policies must remain intact
- MCP integrations must be updated to new paths
- All changes staged and verified before cutover

## Progress Update (2025-10-20)

- Thunder/Jaeger telemetry footprint eliminated; MCP log-forwarder + Supabase logs are the sole observability pipeline (see `reports/context/coverage.md`).
- Automation scripts consolidated under `/scripts/automation/` with guardrails; VS Code Phase 02 task now emits coverage to `reports/context/coverage.md` without legacy rename.
- MCP production status snapshot migrated into `docs/tooling/devops-agent-runbook.md`, removing the standalone status file.
- Legacy audit artifacts (`docs-audit.txt`, `structure-gap.md`, `CODEBASE_SIZES_BEFORE.txt`) retired after dependency unwind. Coverage output is now standardized at `reports/context/coverage.md`.
- Copilot instructions refreshed to point at live runbooks and troubleshooting guardrails.

## Next Actions

1. Re-run workspace inventory and capture a full context snapshot using `./scripts/automation/context-snapshot.sh <function-slug> <since-time>`. Document the current directory state and operational coverage in `reports/context/coverage.md` before deprecating the 2025-10-20 report.
2. Plan phased relocation of `/app/frontend`, `/app/backend/functions`, and supporting tooling into the target `/app` and `/tooling` hierarchy (capture blockers in `settings-troubleshooting.md`).
3. Align automation outputs (coverage, diagnostics, context snapshots) and MCP telemetry tool usage with the future folder layout to avoid path churn during migration.
4. Update VS Code tasks, npm scripts, and documentation to reference new telemetry tools and troubleshooting flows. Stage proposals in `docs/tooling/settings-troubleshooting.md` prior to editing guarded configs.

## Ignore File Policy

- All ignore files (.gitignore, .eslintignore, .vercelignore) are maintained at the repository root for clarity and single-source-of-truth enforcement.
- No per-folder ignore files are permitted unless required by CI/CD or build tooling; any such exceptions must be documented here.
- .gitignore: VCS scope, excludes build outputs, logs, environment files, node_modules, and all non-MECE root files. No per-folder .gitignore files allowed.
- .eslintignore: Linting scope, excludes build outputs, logs, Supabase functions, and automation scripts under tooling/. No per-folder .eslintignore files allowed.
- .vercelignore: Frontend build scope, excludes everything except static frontend assets and required configs. No per-folder .vercelignore files allowed.
- Any exception (e.g., for CI/CD or build tooling) must be documented here and justified.

## Root Directory Hygiene

- Only the following root folders and files are permitted:
  - app/
  - tooling/
  - docs/
  - config/
  - reports/
  - .gitignore, .eslintignore, .vercelignore
  - README.md, LICENSE, package.json, package-lock.json, yarn.lock, CHANGELOG.md
  - .github/, .vscode/, .devcontainer/, .husky/, .nvmrc, .npmrc
- All other files/folders must be moved into the appropriate namespace or archived before deletion.
- The folder archive/loose-root-assets/ is used as a temporary quarantine for legacy or loose files pending review or deletion.

### Config Folder Layout

- `config/README.md` records MECE ownership for configuration artifacts.
- `tailwind.config.js`, `postcss.config.js`, `tsconfig*.json`, and `vercel.json` belong to the **app** surface and should only reference files under `app/frontend`.
- `environment-loader.js`, `package-supabase.json`, `supabase.js`, `supabase-ca-2021.crt`, and `otel-config.yml` are **shared** resources consumed by both frontend and Supabase functions.
- `mcp-config.json` and `ignore-validator.allowlists.json` are **tooling** assets used by MCP servers and hygiene scripts.
