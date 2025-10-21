# DEPRECATED: This report is superseded by `reports/context/coverage.md` as of 2025-10-20. Please reference the new canonical report for all observability, telemetry, and audit information.

# Telemetry & Legacy Reference Cleanup Report

**Date:** 2025-10-20
**Branch:** restructure-recovery

## Summary

All Thunder/Jaeger references have been removed from the codebase. Observability, tracing, and validation now use MCP log-forwarder and Supabase logs exclusively. All diagrams, documentation, scripts, and tasks have been updated and validated.

---

## Key Changes

### Diagrams

- `/docs/tooling/mcp-routing-sequence.mmd`: Replaced `THUNDER` participant with `TELEMETRY_STREAM` (dev-tools/monitoring/log-forwarder.ts) and updated all related edges.
- All `.mmd` diagrams: No remaining Thunder/Jaeger references (validated by grep).

### Documentation

- `/docs/tooling/FAST_README.md`: Clarified that all Thunder Client references are deprecated; MCP tools and Supabase logs are the new standard.
- `/docs/app/REPO_RESTRUCTURE_PLAN.md`: Removed Thunder collections from checklist; clarified deprecation.
- Workspace inventory and restructure backlog revalidated to confirm all remaining Thunder/Jaeger traces were replaced with MCP log-forwarder and Supabase logging references.
- `/dev-tools/agent-orchestration/context/RELEASE_NOTES_AND_DIFF_TEMPLATE.md`: Updated test/validation to MCP tools and Supabase logs.
- `/dev-tools/agent-orchestration/agents/observability/instructions.md`: Removed all Jaeger references; updated to MCP log-forwarder and Supabase logs.
- `/dev-tools/agent-orchestration/agents/templates/README.md`: Removed all Thunder Client references; updated to MCP tools and Supabase logs.
- `/dev-tools/agent-orchestration/agents/production-ops/instructions.md`: Removed Jaeger references; updated monitoring dashboards.
- `/dev-tools/agent-orchestration/context/TEST_RUN_EXPECTATIONS.md`: Updated test expectations to MCP tools and Supabase logs.
- `/dev-tools/README.md`: Removed Jaeger references; updated monitoring section.

### Scripts & Tasks

- `/dev-tools/scripts/shell/start-observability.sh`, `stop-observability.sh`, `verify-observability.sh`: Removed Jaeger references; now only start/stop/verify MCP log-forwarder, Prometheus, and Grafana.
- `.vscode/tasks.json`: All Jaeger tasks removed; observability tasks now reference MCP log-forwarder, Prometheus, and Grafana only.

### Package Files

- `/package.json`: Removed all Thunder Client scripts and references.
- `/dev-tools/mcp-servers/package.json`: Removed Jaeger exporter dependency.

---

## Validation

- All `.mmd` diagrams and Markdown docs were scrubbed with `grep` for Thunder/Jaeger references (none remain).
- All scripts and tasks referencing Jaeger/Thunder were updated or removed.
- All changes are documented in this report for audit and compliance.

---

## Next Steps

- Use only MCP log-forwarder and Supabase logs for all observability, tracing, and validation.
- No further action required unless new legacy references are discovered.

---

# Agents & Dev Tools Test Suite Progress

## Implementation Plan

1. **Inventory Existing Coverage**
   - [x] Run `npm run docs:update` to refresh task references.
   - [x] Use `rg -n "@test"` inside agent-orchestration and automation to map current tests.
   - [x] Log gaps in settings-staging.md under “Agents & Dev Tools Test Plan”.
2. **Define Targets & Fixtures**
   - [ ] Categorize tests: agent prompts, MCP server helpers, automation scripts, VS Code tasks.
   - [ ] Stage required fixtures (sample MCP responses, Supabase logs, Vercel status JSON) in `dev-tools/testing/fixtures/`.
   - [ ] Document dependencies (Supabase CLI session, mock MCP endpoints).
3. **Scaffold Test Harnesses**
   - [ ] For Node-based tooling, add Vitest suites under `dev-tools/tests/` with shared setup in `dev-tools/tests/utils/setup.ts`.
   - [ ] For shell automation, create bats or zx harnesses in `scripts/tests/`.
   - [ ] Stage environment loader updates (no direct .vscode edits).
4. **Implement Agent Prompt Tests**
   - [ ] Add snapshot/assertion tests for chatmodes prompts ensuring required guardrails and hyperlinks.
   - [ ] Validate generated instructions via `dev-tools/tests/agents.spec.ts`.
5. **Automate MCP Tool Tests**
   - [ ] Mock MCP servers using lightweight HTTP handlers; verify CLI wrappers (`npm run mcp:start:*`) produce expected artifacts in `reports/diagnostics/`.
   - [ ] Capture outputs and compare with fixtures.
6. **Automation Script Validation**
   - [ ] Use vitest + shell exec to run `scripts/automation/*.sh` in dry-run mode; assert log files created.
   - [ ] Add regression tests for path rewrites during migrations.
7. **CI Integration**
   - [ ] Stage new `npm run test:devtools` script in package.json.
   - [ ] Add VS Code task proposal in `settings-staging.md`; update `.github/workflows/ci.yml` only after approval.
8. **Telemetry & Coverage**
   - [ ] Aggregate results into coverage.md via updated Phase 02 task.
   - [ ] Include coverage badges or summary in devops-agent-runbook.md.
9. **Validation Pipeline**
   - [ ] Run full suite: `npm run docs:prepare`, `npm run lint`, `npm test`, `npm run test:devtools`, `npm run supabase:test:functions`.
   - [ ] Log outputs and diffs in `settings-staging.md` before merge.

---

## Phase 1: Inventory Existing Coverage

- Ran `npm run docs:update` — task references refreshed.
- Ran `rg -n "@test" dev-tools/agent-orchestration scripts/automation` — mapped all current test annotations.
- Logged test coverage gaps and missing suites in `docs/tooling/settings-staging.md` under “Agents & Dev Tools Test Plan”.
- Next: Begin Phase 2 (Define Targets & Fixtures).

---

**Prepared by:** GitHub Copilot
**Date:** 2025-10-20
