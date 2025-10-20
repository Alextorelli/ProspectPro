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

---

**Snapshot Complete:**

- Timestamp: 2025-10-20
- Codebase index, docs, diagrams, and lint validated
- Automated tests run (core logic + DB)
- Critical configs backed up to `archive/config-backup/`
- Ready for next phase

---

## Current Agent & Debug Tooling

- MCP suite: production/dev/troubleshooting servers active; scripts under operations + mcp-servers provide CLI-driven diagnostics.
- Docs/diagram system: `.mmd` sources with front-matter, snippet library (mermaid.json), guidelines, and CLI rendering disabled by guard.
- Telemetry cleanup done; routing diagrams now target `log-forwarder`.
- React debugging: no integrated React DevTools yet; workflow still browser-extension based (Chrome/Firefox). Adoption will require documenting install steps, not .vscode edits.

### Task 1 – Audit (progress vs gaps)

| Area | Status | Noted Gaps |
| --- | --- | --- |
| **Application Source (app, supabase)** | Supabase-first architecture intact; edge-function/tests scripts untouched. | Lacks automated React state inspection; React DevTools not integrated/documented. |
| **Dev-Tools (dev-tools, scripts)** | ContextManager orchestration diagrams, log-forwarder references, CLI guards, MCP tooling in place. | Need composed workflows for agent-onboarding (React debugging, Vercel, Supabase) and staging docs for future settings/tasks. |
| **Docs** | Diagram guidelines, cleanup report, FAST_README changelog updated. | Missing “Telemetry Targets & Legacy Cleanup” guard details? (Check final doc). Need React DevTools setup guidance + agent workflow playbooks. |
| **Automation** | npm/CLI tasks validated (`docs:prepare`, `docs:update`, lint). | React/front-end debugging still manual; no task to launch devtools-core; React DevTools usage not standardized. |
| **Configuration Guard** | .vscode freeze noted; guard text present. | Need staging doc (`docs/tooling/settings-staging.md`) for future settings changes (if not already created). |

### Task 2 – Streamlined Strategy (guard-aware)

1. **Guard & Context Prep**
   - Document the .vscode freeze explicitly in `docs/tooling/settings-staging.md` (no live edits).
   - Update `diagram-guidelines.md` / `FAST_README.md` with guard note if missing.

2. **React Debugging Integration**
   - Author “React DevTools Usage” section in `docs/tooling/agent-debug-playbooks.md` (new or existing) referencing browser extension + `react-devtools-core` CLI (`npx react-devtools`).
   - Add VS Code task *references only* (document command sequence) without touching .vscode.
   - Provide MCP script or shell helper in `scripts/devtools/launch-react-devtools.sh` (optional future step, staged via doc).

3. **Agent Workflow Consolidation**
  - Expand diagram-guidelines.md / new doc to map agent handoffs (discovery → telemetry → debugging).
  - Ensure each `.mmd` cites live scripts; re-validate via Mermaid preview.

4. **Automation Enhancements**
   - Compose a checklist runbook (`docs/tooling/devops-agent-runbook.md`):
     1. Supabase log fetch (existing tasks)
     2. React DevTools attach
     3. MCP troubleshooting sequence
     4. Docs update pipeline (`npm run docs:prepare`, `npm run docs:update`, `npm run lint`).
   - Use existing shell scripts/VS Code tasks (no new .vscode edits).

5. **Verification**
   - Execute audit commands documented in checklist (no automation change).
   - Capture outputs in `reports/` if needed.
   - Confirm diagrams + docs updated; run validation pipeline.
