# Tools Suite Migration Plan (v2)

## Overview

This plan tracks the migration to the consolidated MCP server matrix (production, development, troubleshooting) and config-driven environment selection.

## Key Steps

- Created v2 config scaffolds: `environment-loader.v2.js`, `environment.v2.json`, `mcp-config.v2.json`
- Updated ER/state diagrams: `dev-tool-suite-ER.mmd`, `agent-environment-map-state.mmd`, `environment-mcp-cluster.mmd` (v2)
- All diagrams and configs moved to `docs/tooling/v2/` for clarity
- Next: Refactor MCP server scripts and registry to match v2 matrix
- Next: Update coverage and validate with `npm run docs:prepare` and tests
