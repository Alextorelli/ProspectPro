# Temporary Work Plan – DevOps Agent Automation

> Created: 2025-10-20 (temporary tracking file)
> Branch: restructure-recovery

## Objective

Document the immediate plan for consolidating DevOps AI agent workflows, including React debugging integration, without modifying guarded configuration files (e.g., `.vscode`).

## High-Level Goals

1. Preserve configuration guardrails while expanding tooling documentation.
2. Integrate React DevTools usage into the agent debugging toolkit.
3. Consolidate agent workflows and observability processes around MCP log-forwarder + Supabase logs.
4. Provide automation runbooks and validation steps using existing tasks/scripts.

## Task Breakdown & Status

- [ ] **Guardrail Documentation**

  - [x] Confirm/update `docs/tooling/settings-staging.md` with explicit `.vscode`/`.github` freeze instructions.
  - [ ] Ensure FAST_README/diagram guidelines reference the configuration guard.

- [ ] **React Debugging Integration**

  - [ ] Draft React DevTools usage section (browser extension + `npx react-devtools`) in `docs/tooling/agent-debug-playbooks.md` (or new doc).
  - [ ] Create supporting notes for launching `react-devtools-core` via CLI/MCP while avoiding `.vscode` edits.

- [ ] **Agent Workflow Consolidation**

  - [ ] Expand documentation to map end-to-end agent handoffs (discovery → telemetry → debugging).
  - [ ] Verify diagrams align with current telemetry targets; re-run Mermaid validation.

- [ ] **Automation Enhancements**

  - [ ] Author a checklist/runbook summarizing scripted workflows (`supabase logs`, MCP diagnostics, React DevTools attach, docs update pipeline).
  - [ ] Identify existing scripts/tasks leveraged in each step to avoid duplication.

- [ ] **Verification & Reporting**
  - [ ] Execute documented commands/tests; capture outputs where necessary.
  - [ ] Update this checklist as tasks complete and prepare final report for merge.

## Notes

- Do not modify `.vscode/` or other guarded configuration files in this phase.
- Leverage `npm run docs:prepare`, `npm run docs:update`, and existing Supabase/MCP scripts for validation.
- Remove or archive this file once the plan is executed and summarized in permanent documentation.
