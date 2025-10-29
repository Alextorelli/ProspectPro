## 2025-10-29: Context, Launch, and MCP Alignment (Staged)

**Planned .vscode/.github config changes:**

- Update `.vscode/launch.json` to replace deprecated `integration/environments/*.env` references with generated `.env.<env>` files under `dev-tools/agents`.
- Update `.vscode/tasks.json` to use context-manager environment switch commands instead of `generate-configs.mjs --env`, preserving all required task inputs (e.g., sessionJWT, functionName).
- Ensure `.vscode/mcp_config.json` memory path points to `dev-tools/workspace/context/session_store/memory.jsonl` and matches the Utility MCP config.
- Document all MCP config changes and memory path updates here before applying to live config.
- All changes staged here before live edits; after validation, merge and run `npm run docs:update` to refresh inventories.

**Action:**

- After staging, proceed with environment regeneration, agent context switching, MCP rebuild, and suite restart as described in the alignment plan.

## 2025-10-28: Observability Standardization

**Jaeger deprecation:**

- All Jaeger exporter configs, endpoints, and env keys have been removed from the codebase and environment configs.
- Highlight.io (OTLP + log drain) is now the sole observability backend for all environments.
- Staging and production inherit Highlight credentials from Vercel environment groups.
- See patch log in dev-tools/workspace/context/session_store/Optimized Environment Config Patch Plan.md for details.

# settings-staging.md

## MCP Config Update – October 27, 2025

- Replaced `.vscode/mcp_config.json` to remove all legacy/retired gallery servers per integration plan in `dev-tools/workspace/context/session_store/mcp-integration-plan.md`.
- Only supported MCPs remain: Utility, Supabase, GitHub, Playwright, Context7.
- Utility MCP rebuilt to ensure stdio target exists.
- This change resolves MCP scanner parse errors and enables Copilot Chat to discover servers without `[object Object]` failures.

---

**Action:** VS Code window reload recommended to apply MCP config changes.

## MCP Config Alignment – October 27, 2025

- Removed `mcp.servers` block from `.vscode/settings.json` (was using an unsupported schema).
- Added `"mcp.configFile": "${workspaceFolder}/.vscode/mcp_config.json"` to `.vscode/settings.json`.
- `.vscode/mcp_config.json` is now the single source of truth for MCP servers, using the correct schema for the MCP scanner.
- This resolves parse errors and ensures only supported MCPs are loaded.

**Action:** Reload VS Code to apply changes.

## 2025-10-28: Vercel/Agent Workflow Optimization

- Pinned Node to v20 for Vercel parity; recommend `npx vercel@48.6.0` for all CLI usage (no global install).
- Added baseline npm scripts: `env:pull`, `deploy:preview`, `deploy:prod` (runs lint/test/playwright before prod deploy).
- Standardized `npm run mcp:troubleshoot` and `npm run docs:update` as required tools for all devs/agents.
- Documented staging as a Vercel Preview alias (not a paid target); recommend `vercel alias set <deploy> staging.prospectpro.appsmithery.co` for persistent QA.
- Updated workflow docs: local bootstrap via `npm run dev`, integration check with `vercel dev`, feature testing with `npm run lint`, `npm test`, `npx playwright test`, `npm run validate:contexts`.
- Added automation task: Deploy Summary watcher (Observability MCP).
- Build config: Use repo-specific minimal `vercel.json` for React/Vite; secrets managed via dashboard only.
- Testing: Noted existing CI workflows (`docs-automation.yml`, `playwright.yml`, `mcp-agent-validation.yml`); recommend Vercel check suite after Playwright CI is stable.
- Maintenance: Monthly run of `dev-tools/scripts/automation/remove-legacy-paths.sh`, log results in `dev-tools/reports/`.
- Refreshed inventories with `npm run docs:update`.

**Action:** Review and merge these changes, then run `npm run docs:update` to update all inventories and documentation references.

## 2025-10-28: Staging Subdomain Alias

- Added npm script: `deploy:staging:alias` to automate Vercel preview → staging subdomain aliasing.
- Staging hostname `staging.prospectpro.appsmithery.co` now documented in runtime and E2E docs.
- Alias creation and usage logged for agent/QA workflows.

## 2025-10-28: Chatmode & Workflow Sync

- Flattened workflow references in all chatmode files
- Added staging deployment instructions to chatmodes
- Enhanced CI workflows with automated artifact collection
- All logs now route to `dev-tools/reports/ci/`

## 2025-10-28: Staging Environment Alignment

**Updated `integration/environments/staging.json`**:

- Environment name: "troubleshooting" → "staging"
- Deployment URL: `https://prospectpro-troubleshoot.vercel.app` → `https://prospect-5i7mc1o2c-appsmithery.vercel.app`
- Feature flags aligned with production (async discovery, realtime campaigns enabled)
- Permissions updated for automated deployment workflows

**Validation**: `npm run validate:contexts` succeeds (deployment URL validation deferred).

## 2025-10-28: Staging Environment Alignment

**Updated `integration/environments/staging.json`**:

- Environment name: "troubleshooting" → "staging"
- Deployment URL: `https://prospectpro-troubleshoot.vercel.app` → `https://prospect-5i7mc1o2c-appsmithery.vercel.app`
- Feature flags aligned with production (async discovery, realtime campaigns enabled)
- Permissions updated for automated deployment workflows
- prometheus deprecated in favor of OTEL/highlight implementation

**Validation**: `npm run validate:contexts` succeeds (deployment URL validation deferred).

# Staged: Client Service Layer Rename Completion (2025-10-29)

- **Change**: Completed propagation of `mcp-service-layer` → `client-service-layer` rename
- **Actions**:
  - Renamed deployment script: `deploy-mcp-service-layer.sh` → `deploy-client-service-layer.sh`
  - Updated all internal references: SERVICE_NAME, SERVICE_DIR, systemd unit names
  - Updated package name to `@prospectpro/client-service-layer`
  - Source code reorganized under `src/` subdirectory
  - Package-lock.json regenerated with new namespace
- **Validation**:
  - Run: `cd dev-tools/agents/client-service-layer && npm install && npm run build && npm test`
  - Verify: `npm run lint` passes
  - Check: Deployment script can locate dist/ outputs
- **Rollback**: Restore from git history at commit prior to rename
- **Notes**:
  - MCP config remains at `.vscode/mcp_config.json` (primary) and `config/mcp-config.json` (fallback)
  - Archive/log references left unchanged for historical context
  - Next: Update MCP server cleanup and automation alignment

## 2025-10-29: MCP Server Cleanup & Inventory Refresh

- Backed up and cleaned dev-tools/agents/mcp-servers/ per audit plan
- Removed deprecated artifacts and redundant lockfiles
- Consolidated environments and utility server
- Ran npm run docs:update and repo:scan to refresh all inventories
- All changes staged and validated
