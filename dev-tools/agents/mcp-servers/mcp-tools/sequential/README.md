# ProspectPro Sequential Thinking MCP Server

ProspectPro's sequential thinking MCP server powers structured reasoning workflows with session-aware logging. The implementation mirrors the upstream MCP schema while defaulting all ledger output to the shared session store so we can review thought history across workspaces.

## Default Context Storage

- Thought log path: `dev-tools/agents/context/session_store/sequential-thoughts.jsonl`
- Disable logging: set `DISABLE_THOUGHT_LOGGING=true`
- Override path: set `SEQUENTIAL_LOG_PATH=/absolute/or/relative/path.jsonl`

When logging is enabled, each thought is appended as a JSONL payload containing timestamps, revisions, and branch metadata. The log file is created on demand.

## Tool Contract

`sequential_thinking` exposes the same arguments as the upstream package (thought narrative, revision flags, branching metadata, etc.). Responses include summarized state (`thoughtNumber`, `totalThoughts`, `nextThoughtNeeded`) plus active branch identifiers so downstream agents can inspect the reasoning tree.

## Build & Run

```bash
# install deps once
npm install

# compile TypeScript output
npm run build

# launch via node (from dev-tools/agents/mcp-servers)
node mcp-tools/sequential/dist/index.js
```

For iterative development use `npm run watch` to emit updated builds automatically.

## Notes

- The server is ESM-first (`NodeNext` resolution) to align with ProspectPro's Node 20 environment.
- Logging uses ASCII box formatting in stderr for quick visual parsing while persisting full JSONL payloads to disk.
- Keep this README in sync with `dev-tools/agents/mcp-servers/tool-reference.md` whenever the tool signature changes.
