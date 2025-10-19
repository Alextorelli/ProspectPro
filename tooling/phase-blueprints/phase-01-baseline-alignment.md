# Phase 01 – Baseline Alignment

## Objectives

- Regenerate agent instructions/configs per Optimized Agent Strategy v2.0.
- Deliver parity MCP servers with enhanced tools and circuit breakers.
- Update VS Code/NPM tasks for MCP startup + React DevTools integration.

## Automated Work Items

1. `agents/<role>/templates/regenerate.sh` – Rebuild instruction/config pairs.
2. `scripts/node/generate-mcp-tooling.js` – Scaffold missing MCP tool modules.
3. `npm run devtools:react` + `task: MCP Servers: Start All` – Unified startup.

## Deliverables

- Updated `agent-orchestration/agents/*/{instructions.md,config.json}`.
- Completed `mcp-servers/*/tools/` implementations with tests.
- `.vscode/tasks.json` entries: “MCP: Start Suite”, “DevTools: Start React DevTools”.

## Exit Validation

- Run `npm run validate:baseline` (create in Phase 04, temporary placeholder: `true`).
- All MCP health checks passing in validation harness.
