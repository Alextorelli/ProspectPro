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

### Tooling & Diagnostics

- **Start Troubleshooting Server:** `npm run mcp:start:troubleshooting`
- **Diagnostics Sequence:**
  1. `test_edge_function`
  2. `validate_database_permissions`
  3. `collect_and_summarize_logs`
- **Reports:**
  - Outputs in `reports/diagnostics/`
- **Reference:** See `mcp-servers/` and `scripts/operations/`

### Guard Note

- No .vscode edits; stage new tasks/scripts in `settings-staging.md`.

---

_Last updated: 2025-10-20_
