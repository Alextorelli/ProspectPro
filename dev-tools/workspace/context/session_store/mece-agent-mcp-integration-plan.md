# MCP/Agent Rewiring Audit & Refactoring Plan

## Audit Summary

- Legacy MCP shims remain: `dev-tools/agents/mcp-servers/mcp-tools/*.js` (development, production, troubleshooting, integration-hub, postgresql). They are obsolete once Utility MCP handles fetch/fs/git/memory/sequential; mark for deletion.
- Context schemas already accept the shared Utility MCP (no server-specific enums), but mece-agent-mcp-integration-plan.md, MCP_MODE_TOOL_MATRIX.md, and workflow toolsets still reference removed MCP names.
- Agent configs (agents-manifest.json, workflow `config.json`/`toolset.jsonc`) point to Supabase/GitHub/Playwright but must add `"utility"` for every agent needing memory/sequential, and ensure required secrets come from .env.agent.local canonical keys (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.).

## Refactoring Plan

1. **Inventory Cleanup**

   - Delete all files under mcp-tools.
   - Prune mentions of `memory`/`sequentialthinking` MCPs in `tool-reference.md`, MCP_MODE_TOOL_MATRIX.md, mece-agent-mcp-integration-plan.md, and `mcp-integration-plan.md`.

2. **Registry & Package Alignment**

   - Ensure active-registry.json and `MCP-package.json` list only supabase, `github/github-mcp-server`, `microsoft/playwright-mcp`, `context7`, and `utility`.
   - Run `npm install && npm run build --prefix dev-tools/agents/mcp-servers/utility` to refresh dist and lockfiles.

3. **Agent Manifest & Workflow Wiring**

   - In agents-manifest.json, add `"utility"` to each `mcpServers` array (where absent) and unify secret names around `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   - Update every workflow `config.json` / `toolset.jsonc` (development-workflow, observability, production-ops, system-architect) to rely on the Utility MCP for memory/sequential tools.
   - Adjust `instructions.md` files to reference Utility MCP endpoints for memory/chain-of-thought actions.

4. **Environment Variable Flow**

   - Document in .env.agent.example that agents consume canonical `SUPABASE_*` values plus `AGENT_*` overrides when needed.
   - Add a note in README.md and CONTEXTMANAGER_QUICKREF.md about Utility MCP providing memory/sequential features and pulling secrets from `.env.agent.local`.

5. **Schema & Context Validation**

   - Confirm schemas already cover Utility MCP; if any enums mention legacy servers, update them.
   - Run `bash dev-tools/agents/scripts/validate-agents.sh` to ensure secrets resolve and Utility MCP smoke tests pass; append results to `phase-5-validation-log.md` and `coverage.md`.

6. **Documentation & CI Follow-up**

   - Update phase-5-validation-log.md with the new validation outcome.
   - Refresh MCP_MODE_TOOL_MATRIX.md to reflect the consolidated toolset (Utility MCP as unified provider for fetch, fs, git, time, memory, sequentialthinking).
   - CI wiring: Added `.github/workflows/mcp-agent-validation.yml` to run `dev-tools/agents/scripts/validate-agents.sh` on agent/context changes and upload validation logs/coverage. See MCP_MODE_TOOL_MATRIX.md for updated agent/server mapping.
   - Next: Monitor CI runs and update integration plan as new MCP features are added or agent requirements change.

7. **Final Verification**
   - Run targeted workflow dry runs using `dotenv -e .env.agent.local -- <workflow command>`.
   - Capture final state in `coverage.md` and prepare a PR checklist referencing the removal of legacy MCP tooling.
