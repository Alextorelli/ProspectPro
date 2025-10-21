# Platform Playbooks – Supabase, Vercel, MCP

> **Configuration Guard:** Do not edit `.vscode/` or `.github/` directly. Stage all automation/config proposals in `docs/tooling/settings-staging.md`.

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

- No .vscode edits; stage new tasks/scripts in `settings-staging.md`.

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

- No .vscode edits; stage new tasks/scripts in `settings-staging.md`.

---

## MCP Playbook

### Chatmode Personas (2025-10-21)

| Persona               | Chat Mode                                            | Focus                                                |
| --------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| System Architect      | `.github/chatmodes/System Architect.chatmode.md`     | Architecture reviews, schema validation, ADR updates |
| Production Operations | `.github/chatmodes/Production Ops.chatmode.md`       | Deployments, incident response, rollback execution   |
| Observability         | `.github/chatmodes/Observability.chatmode.md`        | OTEL spans, diagnostics, zero-fake-data monitoring   |
| Development Workflow  | `.github/chatmodes/Development Workflow.chatmode.md` | Feature delivery, testing pipelines, MCP automation  |

Use `npm run mcp:chat:sync` and `npm run mcp:chat:validate` after modifying any persona or prompt. Log changes in `docs/tooling/settings-staging.md` and archive outputs under `reports/context/archive/`.

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
  - Tools: `test_edge_function`, `validate_database_permissions`, `collect_and_summarize_logs`
  - Output: `reports/diagnostics/`

### Diagnostic Workflow

1. Start troubleshooting server: `npm run mcp:start:troubleshooting`
2. Run tools in order:
   - `test_edge_function`
   - `validate_database_permissions`
   - `collect_and_summarize_logs`
3. Review outputs in `reports/diagnostics/`

### Guard Note

- No .vscode edits; stage new tasks/scripts in `settings-staging.md`.

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
- **Context Snapshot:** [`context-snapshot.sh`](../../scripts/automation/context-snapshot.sh)
  - Usage: `./context-snapshot.sh <function-slug> <since-time>`

Each script enforces top-level directory checks and outputs to `reports/`.
