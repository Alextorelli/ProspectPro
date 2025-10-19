# Phase 02 – Context & Workflow Engine

## Objectives

- Finish Redis-backed context manager and schema enforcement.
- Implement event bus + workflow engine for agent coordination.
- Provide integration tests and fixtures.

## Automated Work Items

1. `context/schemas/compile.sh` – Validate JSON schema bundle.
2. `context/event-bus.ts` + `workflow/engine.ts` – Implement orchestration modules.
3. `scripts/node/context-integration-test.js` – Run end-to-end coordination tests.

## Deliverables

- `agent-orchestration/context/context-manager.ts` finalized with Redis hooks.
- `agent-orchestration/context/store/redis-adapter.ts` + unit tests.
- `tooling/test-automation/context/` test suite with dataset fixtures.

## Exit Validation

- VS Code task “Context: Integration Tests” succeeds.
- Generated coverage report stored in `reports/context/phase-02-report.md`.
