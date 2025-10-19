# Phase 04 – Validation Orchestration

## Objectives

- Replace legacy harness with MCP-aware validation runner.
- Wire CI pipeline to new validation flow.
- Enforce zero fake data constraints across scripts.

## Automated Work Items

1. `scripts/node/validation-runner.js` – Main orchestrator.
2. VS Code task “Validation: Full Stack” invoking runner + React DevTools checks.
3. CI update: `tooling/ci/pipeline.yml` to call new validation stage.

## Deliverables

- `reports/validation/template.md` for automated summaries.
- Updated `scripts/shell/validation-suite.sh` for CLI parity.
- React DevTools + Supabase diagnostics integrated into runner.

## Exit Validation

- CI pipeline success with validation artifacts uploaded.
- Local run `npm run validate:full` passes with zero fake data assertions.
