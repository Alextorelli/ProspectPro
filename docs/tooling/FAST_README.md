# ProspectPro Tooling FAST_README

- Purpose: Quick reference for MCP, scripts, CI, and dev tools.
- Diagrams:
  - [Workspace Architecture](workspace-architecture.mmd)
  - [Context Orchestration](context-orchestration.mmd)
  - [Agent Orchestration](agent-orchestration.mmd)
  - [MCP Routing Overview](mcp-routing-overview.mmd)
  - [MCP Server Matrix](mcp-server-matrix.mmd)
  - [Repo File Tree (Tooling)](repo-filetree.mmd)
  - [Keybindings Table](keybindings-table.mmd)
  - [Tasks Table](tasks-table.mmd)
- Color Palette: All diagrams use a shared palette for app (`#2563eb`), dev-tools (`#f97316`), docs (`#16a34a`), config (`#64748b`), and reports (`#facc15`).
- Accessibility: All diagrams use Mermaid, previewable in VS Code (Ctrl+Alt+P). No SVGs committed.
- [Detailed docs](./)
- Update this file with every major PR touching dev-tools.

## CLI Helper Scripts & Path Normalization

- **Canonical Location:** All CLI helper scripts (e.g., `ensure-supabase-cli-session.sh`) must reside in `scripts/operations/` at the repo root. Do not use symlinks or duplicate script trees for critical scripts.
- **Validation/Testing:** All validation and test tasks (e.g., `npm run supabase:test:db`) must reference the root-level `scripts/operations/` path for CLI session scripts.
- **Script Consolidation:** Remove redundant copies/symlinks from `supabase/scripts/operations/` and `dev-tools/scripts/shell/` in future cleanups. Reference only the canonical path in all documentation and tasks.
- **Thunder Client:** All Thunder Client references have been removed. Use MCP tools and CLI scripts for all validation and API testing.
- **Telemetry:** Use MCP log-forwarder and Supabase logs for all observability and tracing. Jaeger references are deprecated.
