# DevOps Agent Runbook – Stepwise Automation

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
