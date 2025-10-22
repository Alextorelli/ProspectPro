# Tools Suite Migration Plan (v2)

## Overview

This plan documents the migration to a v2 folder structure, consolidating MCP servers into three environments—production, development, troubleshooting—with shared observability tooling. Environment selection is now config/prompt-driven (see `environment-loader.v2.js`).

## Progress & Revised Approach

- Created `docs/tooling/v2/` and `dev-tools/mcp-servers/v2` for all v2 diagrams, configs, and migration plans
- Scaffolded: `environment-loader.v2.js`, `environment.v2.json`, `mcp-config.v2.json` (config/prompt-driven environment selection)
- Updated ER/state diagrams: `dev-tool-suite-ER.mmd`, `agent-environment-map-state.mmd`, `environment-mcp-cluster.mmd` (all v2)
- Refactored `environment-mcp-cluster.mmd` to highlight primary MCP entry points and secondary service chains
- Added `end-state`/`v2` aliases to `scripts/docs/patch-diagrams.sh` for targeted normalization in runbooks
- Approach: Three-mode MCP matrix (production, development, troubleshooting), with observability and integration helpers consolidated per environment
- Postgres tooling will be folded into Supabase; integration helpers move to dev; observability merges into troubleshooting
- All legacy branch-based routing replaced by config/prompt selection

## Next Steps

1. Registry and server scripts refactored: see `dev-tools/mcp-servers/v2/registry.v2.json`
2. Use `scripts/docs/render-diagrams.sh` to normalize both end-state and v2 diagrams (aliases baked in)
3. Validate with `npm run docs:prepare` and tests
4. Promote v2 diagrams and configs after validation
