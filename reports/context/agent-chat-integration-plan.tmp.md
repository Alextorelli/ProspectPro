# ProspectPro Agent Integration Action Plan (Temporary)

> Temporary planning artifact for coordinating chat participant integration, diagram refactors, and supporting safeguards. Update progress inline and convert to a permanent record once execution completes.

## Phase 0 – Prerequisites & Safeguards

- [x] Confirm working tree status (`git status`) and note pre-existing changes. _(2025-10-21)_
- [x] Ensure required tasks available: review `.vscode/TASKS_REFERENCE.md` for validation pipeline commands. _(2025-10-21)_
- [x] Snapshot current MCP configuration (`config/mcp-config.json`, `.vscode/mcp_config.json`) and chat mode manifests (`.github/chatmodes/`). _(2025-10-21)_
- [x] Create backup copy of `Dev Tools Taxonomy Diagrams Optimized.md` before splitting diagrams (store under `archive/deployment/`). _(2025-10-21)_
- [ ] Open tracking log in `reports/context/coverage.md` for any anomalies discovered during work.

## Phase 1 – Validate Integration Guide vs Current Workspace

- [ ] Inventory MCP servers from `config/mcp-config.json`, `mcp-servers/registry.json`, and actual scripts.
- [ ] Cross-check chat mode files in `.github/chatmodes/` against guide (Smart Debug, Feature Delivery, Production Support, API Research, Cost Optimization).
- [ ] Document any gaps or naming mismatches in this plan and `reports/context/coverage.md`.
- [ ] Update `MCPClientManager` design notes to include resilience for missing `.vscode/mcp_config.json` (fallback to `config/mcp-config.json`) before coding.
- [ ] Identify all call sites that assume `vscode.workspace.workspaceFolders![0]` and catalogue them for refactor.

## Phase 2 – Diagram Extraction & Documentation

- [x] Create directory `docs/tooling/diagrams/` if missing. _(2025-10-21)_
- [x] Extract each Mermaid block into dedicated files:
  - `system-architecture.mmd`
  - `agent-taxonomy.mmd`
  - `data-flow-context.mmd`
  - `agent-lifecycle.mmd`
  - `entity-relationship.mmd`
  - `implementation-timeline.mmd`
    _(2025-10-21)_
- [ ] Replace sections in source markdown with references/links to the new `.mmd` files.
- [ ] Run `npm run docs:prepare` to regenerate documentation assets; review output for failures.
- [ ] Update `docs/tooling/settings-staging.md` with proposed `.github` / `.vscode` changes if any references shift.

## Phase 3 – Code Integration & Hardening

- [ ] Modify `MCPClientManager` to:
  - [ ] Gracefully handle missing `.vscode/mcp_config.json` (try/catch, fallback, user-facing warning).
  - [ ] Avoid unsafe `workspaceFolders![0]` access (introduce helper to resolve workspace root or throw actionable error).
  - [ ] Add retry/backoff strategy for MCP connections (configurable via settings).
- [ ] Parameterize chat mode loading path via configuration/environment or package contribution settings.
- [ ] Register chat participants and tools within `package.json` under `contributes.chatParticipants` & `contributes.tools`.
- [ ] Wire telemetry hooks through observability MCP (`start_trace`, `record_event`) for key agent actions.
- [ ] Scaffold automated tests for agent handlers (`tests/agents.spec.ts` or new suite) covering:
  - [ ] Authentication diagnostics flow
  - [ ] Feature delivery orchestration
  - [ ] Incident response escalation
  - [ ] Cost optimization recommendations

## Phase 4 – Verification & Validation Pipeline

- [ ] Execute `npm run docs:update`.
- [ ] Execute `npm run lint`.
- [ ] Execute `npm test` (ensure new tests pass).
- [ ] Execute `npm run supabase:test:db`.
- [ ] Capture results and log in `reports/context/coverage.md`.
- [ ] If any command fails, pause execution, record issue in this plan, and resolve before proceeding.

## Phase 5 – Documentation & Staging

- [ ] Summarize changes and residual risks in `workspace_status.md`.
- [ ] Stage updates to `.github` / `.vscode` configs via `docs/tooling/settings-staging.md` per guardrail.
- [ ] Update relevant diagrams/README references to new `.mmd` locations.
- [ ] Notify stakeholders (link to plan and results) once ready for review.

## Risk & Rollback Considerations

- Maintain backups of original diagram file and MCP config snapshots for immediate rollback.
- Feature-flag new agent behaviors using configuration entries to avoid breaking existing workflows.
- Monitor MCP connection logs post-deployment; revert MCP client changes if repeated failures occur.

## Tracking Notes

- Use checkbox status to monitor progress; embed timestamps/initials on completion.
- Upon completion, relocate this plan to permanent documentation or archive it under `reports/context/archive/`.
