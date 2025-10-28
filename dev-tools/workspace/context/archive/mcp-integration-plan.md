
# MCP Integration Plan: Utility MCP Consolidation (Phase 5)

## Summary

As of 2025-10-27, the ProspectPro MCP registry and package scripts have been fully realigned to the MECE taxonomy. The only supported MCPs are:

- supabase
- github/github-mcp-server
- microsoft/playwright-mcp
- context7
- utility (unified: fetch, fs, git, time, memory, sequential)

All legacy MCPs (production, development, troubleshooting, postgresql, integration-hub, stripe, postman, apify, memory, sequentialthinking) have been removed from `active-registry.json` and `MCP-package.json`.

The Utility MCP now provides:
- HTTP fetch, HTML conversion
- Filesystem read/write
- Git status
- Timezone conversion
- Long-term memory (session store)
- Session recall, conversation indexing
- Scenario analysis, chain-of-thought, decision logging

All agents reference the Utility MCP for infrastructure tasks. Memory and sequentialthinking MCPs are now internal modules of Utility MCP.

Validation scripts (`validate-agents.sh`) confirm all canonical secrets and MCPs are present and functional. See `phase-5-validation-log.md` and `coverage.md` for results.

## Next Steps

1. Update `MCP_MODE_TOOL_MATRIX.md` to reflect the unified Utility MCP and canonical agent/server mapping.
2. Wire CI health checks to validate MCP startup and agent secret presence on every push.
3. Monitor Utility MCP performance and error rates in subsequent Phase 5 runs.
4. Document any further registry or toolset changes in this file and in `coverage.md`.

---
2025-10-27: Utility MCP consolidation and validation complete. Ready for CI wiring and documentation sync.
