# MCP Server Tools

This directory contains tool implementations and tests for each MCP server (production, development, troubleshooting).

## Supabase MCP Feature Groups (per https://github.com/supabase-community/supabase-mcp)

- **database**: Query, schema, RLS, migrations
- **functions**: Edge Functions, logs, test harness
- **storage**: Buckets, objects, signed URLs
- **account**: Auth, users, roles
- **docs**: Project docs, OpenAPI, reference
- **debugging**: Logs, error diagnostics, health checks
- **development**: Local dev, CI/CD, test runners
- **branching**: Branch management, migrations, preview

## Tool Wiring

- Register new tool handlers in the corresponding MCP server's `setupTools()` method.
- Update `active-registry.json` to reflect all feature groups and tool names.
- Ensure `config/environment-loader.v2.js` is sourced at the top of each server entrypoint.
- For troubleshooting and diagnostics, use automation scripts with the `--dry-run` flag (e.g., `dev-tools/agents/scripts/context-snapshot.sh --dry-run`).

## Circuit Breaker Support

- All automation scripts support the `--dry-run` flag for safe diagnostics and context recovery.
- Add circuit breaker logic to tool handlers to prevent cascading failures.
- Log and surface errors in the MCP server response.
