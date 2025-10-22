# MCP Server Tools

This directory will contain enhanced tool implementations and tests for each MCP server.

- Add tool modules for each server (production, development, troubleshooting, integration hub, postgres)
- Include circuit breaker instrumentation
- Add unit and integration tests for each tool

## Wiring New Tools

- Register new tool handlers in the corresponding MCP server's `setupTools()` method.
- Update `registry.json` to reflect all capabilities and tool names.
- Ensure environment loader (`config/environment-loader.v2.js`) is sourced at the top of each server entrypoint.

## Circuit Breaker Support

- Add circuit breaker logic to tool handlers to prevent cascading failures.
- Log and surface errors in the MCP server response.

## Dry-Run Mode

- All MCP server scripts support `--dry-run` flag. When enabled, no actions are executed and a dry-run message is printed.
- Automation scripts should also support `--dry-run` for safe preview of planned actions.
