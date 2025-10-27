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
