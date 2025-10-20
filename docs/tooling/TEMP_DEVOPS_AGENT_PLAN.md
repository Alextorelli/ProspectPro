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

- [x] **Guardrail Documentation**

  - [x] Confirm/update `docs/tooling/settings-staging.md` with explicit `.vscode`/`.github` freeze instructions.
  - [x] Ensure FAST_README/diagram guidelines reference the configuration guard.

- [x] **React Debugging Integration**

  - [x] Draft React DevTools usage section (browser extension + `npx react-devtools`) in `docs/tooling/agent-debug-playbooks.md` (or new doc).
  - [x] Create supporting notes for launching `react-devtools-core` via CLI/MCP while avoiding `.vscode` edits.

- [x] **Agent Workflow Consolidation**

  - [x] Expand documentation to map end-to-end agent handoffs (discovery → telemetry → debugging).
  - [x] Verify diagrams align with current telemetry targets; re-run Mermaid validation.

- [x] **Automation Enhancements**

  - [x] Author a checklist/runbook summarizing scripted workflows (`supabase logs`, MCP diagnostics, React DevTools attach, docs update pipeline).
  - [x] Identify existing scripts/tasks leveraged in each step to avoid duplication.

- [x] **Verification & Reporting**
  - [x] Execute documented commands/tests; capture outputs where necessary.
  - [x] Update this checklist as tasks complete and prepare final report for merge.

## Notes

- Do not modify `.vscode/` or other guarded configuration files in this phase.
- Leverage `npm run docs:prepare`, `npm run docs:update`, and existing Supabase/MCP scripts for validation.
- Remove or archive this file once the plan is executed and summarized in permanent documentation.

---

## Completion & Guard Status (2025-10-20)

- [x] Configuration guard notes added to FAST_README.md and diagram-guidelines.md
- [x] React DevTools usage section drafted in agent-debug-playbooks.md
- [x] Command sequence and VS Code task reference staged in settings-staging.md (no .vscode edits)
- [x] DevOps agent automation checklist composed in devops-agent-runbook.md
- [x] This plan summarized and changelog notes to be added to FAST_README.md

---

## Phase 2 Progress (2025-10-20)

- [x] Platform playbooks created: [docs/tooling/platform-playbooks.md](platform-playbooks.md)
  - Supabase: logs, CLI, auth guard, edge deploy, troubleshooting
  - Vercel: build, deploy, validation, troubleshooting
  - MCP: diagnostics, troubleshooting, reports
- [x] FAST_README.md cross-linked to platform playbooks and Phase 2 expansion noted
- [x] Guardrails reiterated: all config/task proposals staged in settings-staging.md

---

## Progress Checkpoint (2025-10-20)

- Platform playbooks for Supabase, Vercel, and MCP are now documented and cross-linked from FAST_README.md.
- All configuration/task proposals remain staged in `docs/tooling/settings-staging.md` per guard policy.
- Documentation and manifest updates validated (`npm run docs:prepare`, `npm run docs:update`).
- Ready to proceed to Phase 3 (automation scripts bundle) or address further requests.

**Phase 2 complete. Ready for Phase 3 (automation scripts bundle).**

**All steps complete. Guardrails enforced.**

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

| Area                                   | Status                                                                                             | Noted Gaps                                                                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Application Source (app, supabase)** | Supabase-first architecture intact; edge-function/tests scripts untouched.                         | Lacks automated React state inspection; React DevTools not integrated/documented.                                                             |
| **Dev-Tools (dev-tools, scripts)**     | ContextManager orchestration diagrams, log-forwarder references, CLI guards, MCP tooling in place. | Need composed workflows for agent-onboarding (React debugging, Vercel, Supabase) and staging docs for future settings/tasks.                  |
| **Docs**                               | Diagram guidelines, cleanup report, FAST_README changelog updated.                                 | Missing “Telemetry Targets & Legacy Cleanup” guard details? (Check final doc). Need React DevTools setup guidance + agent workflow playbooks. |
| **Automation**                         | npm/CLI tasks validated (`docs:prepare`, `docs:update`, lint).                                     | React/front-end debugging still manual; no task to launch devtools-core; React DevTools usage not standardized.                               |
| **Configuration Guard**                | .vscode freeze noted; guard text present.                                                          | Need staging doc (`docs/tooling/settings-staging.md`) for future settings changes (if not already created).                                   |

### Task 2 – Streamlined Strategy (guard-aware)

1. **Guard & Context Prep**

   - Document the .vscode freeze explicitly in `docs/tooling/settings-staging.md` (no live edits).
   - Update `diagram-guidelines.md` / `FAST_README.md` with guard note if missing.

2. **React Debugging Integration**

   - Author “React DevTools Usage” section in `docs/tooling/agent-debug-playbooks.md` (new or existing) referencing browser extension + `react-devtools-core` CLI (`npx react-devtools`).
   - Add VS Code task _references only_ (document command sequence) without touching .vscode.
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

---

# Temporary Refactoring Guide – DevOps Agent Automation (Guarded)

### Phase 0 – Guard & Snapshot

- Record intent + guard reminder in TEMP_DEVOPS_AGENT_PLAN.md.
- Stage any future .vscode / .github edits in settings-staging.md.
- Run `npm run codebase:index`, `npm run docs:prepare`, `npm run docs:update`, `npm run lint` for baseline.

### Phase 1 – React Debugging Automation

- Extend agent-debug-playbooks.md with a “React DevTools Automation” runbook referencing browser extension, `npx react-devtools`, and guardrails.
- Implement `scripts/devtools/start-react-dev-session.sh` to launch `npm run dev` + `npx react-devtools` (reuse existing shell helpers).
- Add optional validation script `scripts/devtools/check-react-devtools-port.sh` to confirm port 8097 availability.
- Document command sequence (no VS Code task edits) in settings-staging.md.

### Phase 2 – Platform Playbooks & Context

- Expand agent playbooks with Supabase, Vercel, MCP runbooks (existing scripts + commands).
- Update README.md and FAST_README.md to cross-link new playbooks and note configuration guard.
- Capture any future tool/task proposals in settings-staging.md.

### Phase 3 – Automation Scripts Bundle

- Add scripts under devtools or operations:
  - `supabase-pull-logs.sh` (wrap existing CLI).
  - `vercel-status-check.sh` (call Vercel CLI/API).
  - `context-snapshot.sh` (collect MCP/context artifacts).
- Ensure scripts honour environment guards (`set -euo pipefail`, top-level directory checks).
- Add documentation pointers in playbooks.

### Phase 4 – MCP Integration

- Create/extend MCP manifests linking new scripts + context stores (`mcp-servers/*`).
- Update agent-orchestration.mmd, context-orchestration.mmd, mcp-routing-sequence.mmd with new nodes and validation checkpoints via snippet library.
- Validate diagrams in Mermaid preview.

### Phase 5 – Docs & Diagram Refresh

- Add end-to-end orchestration diagram (React debugging → telemetry → Supabase logs) using architecture-beta + sequence templates.
- Update diagram-guidelines.md with “Telemetry Targets & Legacy Cleanup” plus React DevTools checkpoints.
- Ensure workspace-architecture.mmd, system-reference.mmd reflect new agents/flows.

### Phase 6 – Validation & Reporting

- Run `npm run docs:prepare`, `npm run docs:update`, `npm run lint`, `npm test`, `npm run supabase:test:db`.
- Execute new automation scripts once to verify output (capture logs in reports/).
- Summarize completion + guard status in TEMP_DEVOPS_AGENT_PLAN.md; add changelog notes to FAST_README.md.
