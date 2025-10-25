# Settings Staging Log

> Record rationale, risk, and rollback for any `.vscode/` or `.github/` updates before merging.

## 2025-10-25 — Mermaid & MCP Alignments

- **Change:** Pointed Mermaid snippets to `docs/shared/mermaid/config/mermaid.json`; updated MCP server paths in `.vscode/settings.json`, `.vscode/launch.json`, `.vscode/tasks.json`, and `.vscode/mcp_config.json` to the consolidated `dev-tools/agents/servers` location; refreshed watcher/search exclusions.
- **Rationale:** Prevent drift after diagram tooling consolidation and reflect current MCP server tree.
- **Risk:** Low — VS Code may require reload to pick up updated server paths.
- **Rollback:** Revert `.vscode/settings.json` and restore previous snippet/args values if new paths cause issues.

### Follow-up Adjustment

- **Change:** Updated `.vscode/mcp_config.json` entries to reference `dev-tools/agents/mcp-servers` for all local MCP node servers to mirror the finalized directory name.
- **Rationale:** Align VS Code MCP hooks with the new `dev-tools/agents/mcp-servers/` tree.
- **Risk:** Low — local MCP tasks may fail until the folder rename completes on disk.
- **Rollback:** Restore prior `dev-tools/agents/servers` references if the new directory is unavailable.
