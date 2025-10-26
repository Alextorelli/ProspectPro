# MCP Integration Worklog — Sequential Thinking & Memory Servers

_Date: 2025-10-26_

## Phase 1 — Baseline Audit

- Capture current registry (`dev-tools/agents/mcp-servers/active-registry.json`) and cross-check against `mcp.json` inputs
- Inspect existing sequential and memory MCP tool directories for drift vs upstream packages
- Inventory outstanding workspace scratch artifacts and clean session store

## Phase 2 — Package Realignment

- Rehydrate package manifests (`package.json`, `tsconfig.json`) and ensure build/test scripts match ProspectPro Node 20 target
- Restore canonical source files (`index.ts`, `lib.ts`, `README.md`) for both packages with ProspectPro-specific defaults
- Introduce context path environment toggles for session persistence

## Phase 3 — Context Management Strategy

- Default memory JSONL storage to `dev-tools/agents/context/session_store/memory.jsonl`
- Default sequential thought ledger to `dev-tools/agents/context/session_store/sequential-thoughts.jsonl`
- Document overrides via `MCP_MEMORY_FILE_PATH` and `SEQUENTIAL_LOG_PATH`

## Phase 4 — Validation & Registry Sync

- Compile TypeScript outputs (`npm run build`) for both packages
- Update `active-registry.json` and `tool-reference.md` if tool signatures change
- Smoke test sequential + memory servers locally using `npx` invocation with session store paths

## Phase 5 — Documentation & Handoff

- Refresh `dev-tools/agents/mcp-servers/README.md` and package-level READMEs with new defaults
- Note plan completion in `coverage.md` once merged
