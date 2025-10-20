# DevOps Agent Runbook – Stepwise Automation

## DevOps Agent Checklist Runbook

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

---

_Last updated: 2025-10-20_
