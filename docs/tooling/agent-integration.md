# Agent/MCP Integration for Mermaid

> **Acceptance Criteria**
>
> - **Owner:** Dev Tooling Guild → Agent Platform Squad
> - **Success Signals:**
>   - MCP troubleshooting server exposes a `diagram_patch` tool used in automation runs.
>   - VS Code task palette offers `MermaidChart.createDiagram` bound to repo templates.
>   - Every agent-driven diagram update logs provenance in `dev-tools/workspace/context/session_store/coverage.md`.
> - **Dependencies:** `generation-workflow.md`, `diagram-guidelines.md`, MCP server configs.

## MCP Tooling

- Add `diagram_patch` handler to troubleshooting server to normalize snippets, inject config, and call generation script.
- Ensure tool respects `--init-config` flag and returns lint output for agent consumption.

## VS Code Tasks & Shortcuts

- Define tasks in `.vscode/tasks.json` to run `MermaidChart.createDiagram` with domain presets.
- Map keybindings (e.g., `ctrl+alt+m <domain>`) for rapid scaffolding.

## Provenance Logging

- Agents append entries to `coverage.md` including:
  - Diagram path
  - Applied anchors
  - Date / automation ID
- Use consistent format so audits can parse.
