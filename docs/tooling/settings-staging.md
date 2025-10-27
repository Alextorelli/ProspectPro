# settings-staging.md

## MCP Config Update – October 27, 2025

- Replaced `.vscode/mcp_config.json` to remove all legacy/retired gallery servers per integration plan in `dev-tools/workspace/context/session_store/mcp-integration-plan.md`.
- Only supported MCPs remain: Utility, Supabase, GitHub, Playwright, Context7.
- Utility MCP rebuilt to ensure stdio target exists.
- This change resolves MCP scanner parse errors and enables Copilot Chat to discover servers without `[object Object]` failures.

---

**Action:** VS Code window reload recommended to apply MCP config changes.
