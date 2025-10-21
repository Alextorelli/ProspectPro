# DevOps Agent Runbook – Stepwise Automation

## Automation Scripts Quick Start (Phase 3)

## MCP Diagnostic Workflow (Phase 4)

### MCP Server Types

- Production: `npm run mcp:start:production`
- Development: `npm run mcp:start:development`
- Troubleshooting: `npm run mcp:start:troubleshooting`

### Stepwise Diagnostics

1. Start troubleshooting server: `npm run mcp:start:troubleshooting`
2. Run tools in order:
   - `test_edge_function`
   - `validate_database_permissions`
   - `collect_and_summarize_logs`
3. Outputs: `reports/diagnostics/`

### Automation Integration

- Use `./scripts/automation/context-snapshot.sh <function-slug> <since-time>` to aggregate MCP, Supabase, and Vercel diagnostics.
- Ensure all outputs are referenced in incident/debug notes and staged per guard policy.

- **Supabase Log Pull:** `./scripts/automation/supabase-pull-logs.sh <function-slug> <since-time>`
- **Vercel Status Check:** `./scripts/automation/vercel-status-check.sh`
- **Context Snapshot:** `./scripts/automation/context-snapshot.sh <function-slug> <since-time>`

All scripts output to `reports/` and enforce guardrails. See platform-playbooks.md for details.

## MCP Production Status Snapshot (2025-10-20)

- **Server state**: Production MCP server active via stdio transport (version 4.1.0 Post-Cleanup Enhanced)
- **Tool inventory**: 28 production tools spanning monitoring, diagnostics, analytics, API testing, and filesystem analysis
- **Key categories**:
  - Monitoring (environment health, CI/CD, budget tracking)
  - System diagnostics (logs, configuration, performance)
  - Database analytics (campaign and lead insights)
  - API validation (Google Places, Foursquare, Hunter.io, NeverBounce)
  - Filesystem analysis (project structure, pattern search, zero-fake-data guard)
- **Operational usage**: Launch with `npm run mcp:start:production`; run diagnostics via Start/Stop tasks or CLI scripts in `mcp-servers/`
- **Status logging**: Capture notable findings in `reports/diagnostics/` alongside incident notes

## DevOps Agent Checklist Runbook

## Persona-Aligned Workflow Patterns

| Persona              | Workflow Pattern                                                                |
| -------------------- | ------------------------------------------------------------------------------- |
| System Architect     | @debug → postgresql.validate_migration → integration-hub.execute_workflow       |
| Development Workflow | @deliver → ci_cd_validation_suite → vercel_status_check                         |
| Production Ops       | @support → supabase_troubleshooting.generate_incident_timeline → rollback tasks |
| Observability        | @optimize → observability.trace_diff → context-snapshot.sh                      |

### 1. Pre-flight

- `git status` (clean tree)
- `npm run lint`
- `npm run docs:prepare`

### 2. React Debug Session

- Terminal A: `npm run dev -- --host 0.0.0.0 --port 5173`
- Terminal B: `npx react-devtools`
- Confirm port 8097 availability (`lsof -i :8097`)
- Document findings in incident or debug notes

### 3. Supabase Diagnostics

- `cd supabase && npx --yes supabase@latest functions logs business-discovery-background --since=24h`
- `Supabase: Fetch Logs` VS Code task (guarded reference only)
- Capture anomalies in `reports/diagnostics/`

### 4. MCP Troubleshooting

- `npm run mcp:start:troubleshooting`
- Invoke `test_edge_function`, `validate_database_permissions`, `collect_and_summarize_logs`
- Record outcomes alongside session ID

### 5. Documentation & Close-out

- `npm run docs:update`
- `npm run supabase:test:db`
- `npm run supabase:test:functions`
- Update relevant docs (FAST_README, playbooks) and stage summary in `TEMP_DEVOPS_AGENT_PLAN.md`
- Ensure `.vscode` / `.github` remain untouched; log configuration proposals in `docs/tooling/settings-staging.md`

## Checklist

1. **Supabase Log Fetch**
   - Use VS Code task: `Supabase: Fetch Logs`
   - Reference: `npm run supabase:logs` or CLI helpers
2. **React DevTools Attach**
   - Use browser extension or run `./scripts/devtools/launch-react-devtools.sh`
   - Document findings in agent-debug-playbooks.md
3. **MCP Troubleshooting Sequence**
   - Use MCP CLI tools and scripts in `mcp-servers/` and `scripts/operations/`
   - Reference: `npm run mcp:start`, `npm run mcp:stop`, diagnostics scripts
4. **Docs Update Pipeline**
   - Run `npm run docs:prepare`, `npm run docs:update`, `npm run lint`
   - Validate diagrams and documentation

## Verification

- Capture outputs in `reports/` as needed
- Confirm diagrams and docs updated
- Run validation pipeline before major changes

## Coverage Summary (2025-10-21)

- All legacy Thunder/Jaeger references removed (see `reports/context/coverage.md`)
- All test suites (frontend, dev tools, edge functions) passing
- Directory structure and automation outputs validated
- Canonical coverage output: `reports/context/coverage.md`

![Coverage Status](https://img.shields.io/badge/coverage-100%25-brightgreen)

---

_Last updated: 2025-10-20_
