# Platform Playbooks – Supabase, Vercel, MCP

> **Configuration Guard:** Do not edit `.vscode/` or `.github/` directly. Stage all automation/config proposals in `docs/tooling/settings-troubleshooting.md`.

---

## Supabase Playbook

### Core Operations

- **Log Fetch:**
  - VS Code Task: `Supabase: Fetch Logs`
  - CLI: `cd supabase && npx --yes supabase@latest functions logs <function> --since=24h`
- **Database Tests:**
  - `npm run supabase:test:db`
  - `npm run supabase:test:functions`
- **Edge Function Deploy:**
  - `cd supabase && npx --yes supabase@latest functions deploy <function> --no-verify-jwt`
- **Auth Guard:**
  - Always run `source scripts/operations/ensure-supabase-cli-session.sh` before CLI work.
- **Troubleshooting:**
  - Use MCP tools: `test_edge_function`, `validate_database_permissions`, `collect_and_summarize_logs`

### Guard Note

- No .vscode edits; stage new tasks/scripts in `settings-troubleshooting.md`.

---

## Vercel Playbook

### Deployment

- **Build:** `npm run build`
- **Deploy:** `vercel --prod` (from `/dist`)
- **Validation:**
  - Check publishable key sync in `/public/supabase-app.js`
  - Confirm deployment at https://prospect-fyhedobh1-appsmithery.vercel.app
- **Troubleshooting:**
  - Deployment protection: check Vercel dashboard
  - Blank page: ensure build from `/dist`, not source
  - Publishable key mismatch: run `vercel env pull .env.vercel` before deploy

### Guard Note

- No .vscode edits; stage new tasks/scripts in `settings-troubleshooting.md`.

---

## MCP Playbook

### Chatmode Personas (2025-10-21)

| Persona               | Chat Mode                                            | Focus                                                |
| --------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| System Architect      | `.github/chatmodes/System Architect.chatmode.md`     | Architecture reviews, schema validation, ADR updates |
| Production Operations | `.github/chatmodes/Production Ops.chatmode.md`       | Deployments, incident response, rollback execution   |
| Observability         | `.github/chatmodes/Observability.chatmode.md`        | OTEL spans, diagnostics, zero-fake-data monitoring   |
| Development Workflow  | `.github/chatmodes/Development Workflow.chatmode.md` | Feature delivery, testing pipelines, MCP automation  |

Use `npm run mcp:chat:sync` and `npm run mcp:chat:validate` after modifying any persona or prompt. Log changes in `docs/tooling/settings-troubleshooting.md` and archive outputs under `dev-tools/context/session_store/archive/`.

### MCP Server Types

- **Production Server:**

  - Start: `npm run mcp:start:production`
  - Tools: full diagnostics, edge function analytics, log-forwarder
  - Guard: no direct config edits; all changes staged

- **Development Server:**

  - Start: `npm run mcp:start:development`
  - Tools: agent onboarding, integration tests, context manager

- **Troubleshooting Server:**
  - Start: `npm run mcp:start:troubleshooting`
  - Tools: `test_edge_function`, `validate_database_permissions`, `collect_and_summarize_logs`, `capture_api_trace`, `compare_campaign_costs`, `predict_campaign_roi`
  - Output: `dev-tools/context/session_store/diagnostics/`

### Diagnostic Workflow

1. Start troubleshooting server: `npm run mcp:start:troubleshooting`
2. Run tools in order:

- `test_edge_function`
- `validate_database_permissions`
- `collect_and_summarize_logs`
- `capture_api_trace` (capture OTEL traces for API calls)
- `compare_campaign_costs` (aggregate cost metrics from Supabase logs and OTEL traces)
- `predict_campaign_roi` (predict campaign ROI using cost, enrichment, and validation telemetry)

3. Review outputs in `dev-tools/context/session_store/diagnostics/`

### Guard Note

- No .vscode edits; stage new tasks/scripts in `settings-troubleshooting.md`.

---

_Last updated: 2025-10-21_

---

## Key Diagrams (Phase 5)

- [Agent Orchestration Sequence](agent-orchestration.mmd)
- [Context Orchestration Sequence](context-orchestration.mmd)
- [MCP Routing Sequence](mcp-routing-sequence.mmd)
- [Workspace Architecture](workspace-architecture.mmd)

> Diagrams reflect current MCP, Supabase, Vercel, and automation flows. See `diagram-guidelines.md` for guard and validation details.

---

## Automation Scripts Bundle (Phase 3)

> All scripts: `/scripts/automation/` (see README for guard policy)

- **Supabase Log Pull:** [`supabase-pull-logs.sh`](../../scripts/automation/supabase-pull-logs.sh)
  - Usage: `./supabase-pull-logs.sh <function-slug> <since-time>`
- **Vercel Status Check:** [`vercel-status-check.sh`](../../scripts/automation/vercel-status-check.sh)
  - Usage: `./vercel-status-check.sh`
- **Context Snapshot:** [`context-snapshot.sh`](../../agents/scripts/context-snapshot.sh)
  - Usage: `./context-snapshot.sh <function-slug> <since-time>`
  - For telemetry/cost/ROI analysis, run MCP troubleshooting server and use:
    - `capture_api_trace` to fetch OTEL traces for API endpoints
    - `compare_campaign_costs` to compare campaign costs across logs and traces
    - `predict_campaign_roi` to estimate ROI for campaign parameters

Each script enforces top-level directory checks and outputs to `dev-tools/context/session_store/`.
