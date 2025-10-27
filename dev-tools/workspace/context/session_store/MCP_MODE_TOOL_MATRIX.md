# MCP Mode Tool Matrix (Unified Utility MCP)

| Agent                | supabase | github | playwright | context7 | utility |
| -------------------- | -------- | ------ | ---------- | -------- | ------- |
| Development Workflow | ✓        | ✓      | ✓          | ✓        | ✓       |
| Observability        | ✓        |        |            |          | ✓       |
| Production Ops       | ✓        | ✓      |            |          | ✓       |
| System Architect     | ✓        | ✓      | ✓          | ✓        | ✓       |

- ✓ = Agent has access to this MCP server
- Utility MCP provides fetch, filesystem, git, time, memory, and sequentialthinking tools for all agents. See `mece-agent-mcp-integration-plan.md` for full taxonomy and responsibilities.

**2025-10-27 Update:**
- Observability workflow and tool reference updated for Highlight.io and OpenTelemetry instrumentation
- All legacy troubleshooting server references removed
- Utility MCP is now the unified provider for all infrastructure, memory, and chain-of-thought tools
