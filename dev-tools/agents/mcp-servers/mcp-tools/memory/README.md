# ProspectPro Memory MCP Server

ProspectPro's memory MCP server persists knowledge as a lightweight JSONL-backed graph. Entities, relations, and observation snapshots default to the shared session store so worklogs survive restarts without polluting upstream packages.

## Default Context Storage

- Graph file: `dev-tools/agents/context/session_store/memory.jsonl`
- Override path: `MCP_MEMORY_FILE_PATH=/absolute/or/relative/path.jsonl`

Legacy `.json` files in the same directory are migrated automatically the first time the server boots. Snapshots are appended whenever the `read_graph` tool is invoked, capturing entity and relation counts with timestamps.

## Available Tools

| Tool name             | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `create_entities`     | Insert entities with initial observations         |
| `create_relations`    | Link entities together via typed relations        |
| `add_observations`    | Append observations to existing entities          |
| `delete_entities`     | Remove entities and cascade related edges         |
| `delete_observations` | Drop specific observations from entities          |
| `delete_relations`    | Remove targeted relations                         |
| `read_graph`          | Return the full graph and append a usage snapshot |
| `search_nodes`        | Filter entities/relations by string query         |
| `open_nodes`          | Fetch a focused subgraph by entity names          |

All tool responses are JSON payloads suitable for downstream summarisation.

## Build & Run

```bash
# install deps once
npm install

# compile TypeScript output
npm run build

# launch via node (from dev-tools/agents/mcp-servers)
node mcp-tools/memory/dist/index.js
```

Use `npm run watch` for live rebuilds during development.

## Notes

- The server is ESM-first (`NodeNext`) to align with Node 20 runtimes.
- Knowledge graph operations are idempotent; duplicate entities and relations are ignored.
- Snapshot appends keep the JSONL file readable by downstream analytics as each entry occupies a single line.
