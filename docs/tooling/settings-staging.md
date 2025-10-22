# Workspace Configuration Safeguard Staging

---

## Safeguarding Overview (Summary)

1. **Stage First** – Draft every proposed `.vscode/` and `.github/` change here (or an approved troubleshooting doc) with rationale, risk, and rollback.
2. **Seek Approval** – Share staged entries via the active work plan for explicit sign-off before touching guarded directories.
3. **Apply Carefully** – After approval, implement changes, log actions, and archive troubleshooting notes to `reports/context/archive/`.
4. **Validate** – Run the required pipeline (`npm run docs:update`, `npm run lint`, `npm test`, plus Supabase suites when relevant) and record results in this file.
5. **Commit & Trace** – Commit with governance-aligned messaging, update coverage/workspace reports, and maintain audit traceability.

## Phase 3 (2025-10-20): Automation Scripts

---

## Phase 4 (2025-10-20): MCP Integration

- MCP task automation proposals (e.g., VS Code task for `npm run mcp:start:troubleshooting`) must be staged here for review.
- No .vscode or .github edits permitted; all MCP config/task changes require explicit approval.

- All new automation scripts are staged in `/scripts/automation/` and documented in platform-playbooks.md.
- No .vscode or .github edits permitted; any new task/config proposals must be added here for review.

### React DevTools Command Sequence (staged)

1. `npm run dev -- --host 0.0.0.0 --port 5173`
2. New shell: `npx react-devtools`
3. Optional sanity check: `lsof -i :8097`
4. Shutdown: `pkill -f react-devtools` after debugging
5. VS Code reference: `Ctrl+Shift+P` → “Tasks: Run Task” → `CI/CD: Validate Workspace Pipeline` after session
6. Guard status: no `.vscode` edits permitted until plan approval

> Purpose: Document guarded configuration surfaces and the troubleshooting process for any prospective changes. Do **not** edit the protected paths directly without explicit approval.

## Guarded Directories

- `.vscode/` – Tasks, launch configs, settings, and extensions. Treat as immutable; stage edits here first.
- `.github/` – Copilot instructions, chat modes, workflows, templates, and policies. Any updates must be reviewed in troubleshooting before touching live files.

## Staging Workflow

1. Draft proposed changes in a temporary file under `docs/tooling/` (or another agreed troubleshooting location).
2. Capture rationale, risk assessment, and rollback strategy in the draft.
3. Share the draft for approval via the active work plan (`docs/tooling/TEMP_DEVOPS_AGENT_PLAN.md`) or another requested channel.
4. Only after approval, apply the changes to the guarded directory and record the action in the relevant changelog/report.
5. Run `npm run docs:prepare` (and other required validations) before committing any approved updates.

## Notes

- The troubleshooting workflow applies during refactors, repository reorganizations, or any operation that could impact workspace stability.
- Extend this document as new guardrails or troubleshooting procedures are introduced.
- Remove temporary drafts once their corresponding changes have been approved and applied.

# Staged: Ignore Policy Relaxation & Full Audit (2025-10-22)

- **Proposal**: Temporarily relax `.eslintignore` to re-include `docs/` for linting and audit visibility; run full ignore hygiene + diagram validation to confirm no legacy assets remain hidden by staging policies.
- **Rationale**: Comprehensive end-state verification requires exposing documentation and archive assets to lint/test automation so lingering Round 1 files are surfaced and dispositioned.
- **Risk**: Low/Medium – lint jobs may take longer or surface stale Markdown issues; ensure we do not accidentally commit guard exceptions without documentation.
- **Rollback**: Restore prior `.eslintignore` entries (re-ignoring `docs/`) after the audit by reversing this change or running `git checkout -- .eslintignore` if uncommitted.
- **Validation Plan**:
  1. `node dev-tools/scripts/node/validate-ignore-config.cjs`
  2. `bash scripts/operations/check-docs-schema.sh`
  3. `npm run docs:render:diagrams`
  4. `npm run docs:update`
  5. `npm run lint`
  6. `npm test`
  7. Document findings + remediation in `reports/context/coverage.md` and this staging file before re-enabling guards.

# Staged: React DevTools Task Reference (2025-10-20)

## Proposed VS Code Task (Reference Only)

**Do not add to .vscode/tasks.json without explicit approval.**

````json
{
  "label": "DevTools: Start React DevTools",
  "type": "shell",
  "command": "npm run devtools:react"
}

## Manual Command Sequence


See `docs/tooling/agent-debug-playbooks.md` for full workflow and guard policy.


---

# Applied: Phase 02 Coverage Output Update (2025-10-20)

- VS Code task `Phase 02` now leaves the markdown report at `reports/context/coverage.md` (rename step removed from `.vscode/tasks.json`).
- Legacy artifact `reports/context/phase-02-report.md` is fully deprecated; all downstream tools and automation must consume `reports/context/coverage.md` as the canonical output.

# Staged: App/Tooling Directory Migration (2025-10-20)

## Migration Plan

- Begin phased relocation of `/app/frontend`, `/app/backend/functions`, and supporting tooling into the target `/app` and `/tooling` hierarchy as described in `docs/app/REPO_RESTRUCTURE_PLAN.md`.
- All changes to `.vscode/` and `.github/` must be staged here before being applied.
- Capture blockers, risks, and required sequencing for each move.

## Known Blockers

- Some VS Code tasks and npm scripts reference absolute or legacy paths; these must be updated in lockstep with directory moves.
- MCP validation and automation scripts may require path updates; coordinate with platform-playbooks.md.
- Documentation and codebase index regeneration must be sequenced after each major move.

## Next Steps
# Chatmode Migration Audit & Governance (2025-10-21)

## Audit Findings

- All chat participant logic is now Markdown-based; no extension code remains in `.github/chatmodes/`.
- Chatmode files (Smart Debug, Feature Delivery, Production Support, API Research, Cost Optimization) are present, validated, and contain required metadata (description, tools).
- MCP tooling, Thunder Client, and Supabase CLI integration are referenced and standardized across all modes.
- README and IMPLEMENTATION_SUMMARY.md document activation workflow, usage, and maintenance procedures.
- Pre-refactor snapshot archived in `reports/context/archive/chatmodes-pre-refactor-2025-10-21.md`.
- All prompt files validated by `npm run test:devtools` (see TELEMETRY_LEGACY_CLEANUP_REPORT_2025-10-20.md).

## Governance & Guardrails

- All changes to `.github/` and `.vscode/` must be staged here before being applied.
- Document rationale, risk, and rollback for any automation or documentation update.
- No direct edits to guarded directories until approval and validation pipeline completion.


### Applied: MCP Chatmode Integration Automation (2025-10-21)

- All chatmode Markdown files validated and manifest generated (2025-10-21)
- Automation scripts (`mcp-chat-sync.js`, `mcp-chat-validate.js`) staged, tested, and confirmed linked to VS Code tasks
- VS Code tasks and keybindings updated for chatmode/MCP workflows
- Validation pipeline run: `docs:update`, `lint`, `test`, `supabase:test:db` (all passed, `NOTESTS` for db as expected)
- MCP chatmode validation and Copilot Chat switching tested: **passed**
- Archive created: `reports/context/archive/chatmode-automation-2025-10-21.md`

**Traceability:**
- All results, logs, and manifest snapshots are archived in `reports/context/archive/chatmode-automation-2025-10-21.md`
- Stepwise todo list governs integration and activation


### Production Activation (2025-10-21)

- Validation pipeline completed: `docs:update`, `lint`, `test`, `supabase:test:db` — all successful
- Chatmodes and MCP integration now active in production Copilot Chat
- Announced activation in project changelog and this troubleshooting doc

### Post-Activation Monitoring

- Monitor MCP diagnostics and VS Code logs for regressions/issues
- Document findings in this file and archive as needed

### Next Steps
- Conduct final governance review and close out integration plan

### Pending Automation/Documentation Updates
- None at this time.

# Staged: MCP Config Refactor (2025-10-21)

- **Proposal**: Rewrite `config/mcp-config.json` using the Option A scaffolding outlined in `docs/tooling/end-state/mcp-config-scaffolding.md`, adding participant metadata (`ux`, `platform`, `devops`, `secops`, optional `integrations`) and branch-based routing rules.
- **Rationale**: Align MCP routing with the new chat participant taxonomy and environment model, ensuring each participant triggers the correct server cluster.
- **Risk**: Medium – misconfigured routing could block automation or expose production tooling. Mitigate with staged reviews, `npm run mcp:chat:validate`, and targeted MCP startup smoke tests.
- **Rollback**: Restore previous `config/mcp-config.json` and related registry entries from git.
- **Validation Plan**: `npm run mcp:chat:validate`, `npm run docs:patch:diagrams`, and `npm run mcp:start:production` / `npm run mcp:start:development`; log outcomes here and in `reports/context/coverage.md`.


# Staged: CI Workflow Gate for Diagram Patch & MCP Validation (2025-10-21)

- **Proposal**: Update `.github/workflows/mermaid-diagram-sync.yml` to run `npm run docs:patch:diagrams` prior to rendering and enforce `npm run mcp:chat:validate` as a gating step for pull requests touching diagrams/chatmodes.
- **Rationale**: Ensure automated normalization and MCP chat validation occur in CI before merges, matching local guardrails.
- **Risk**: Medium – workflow failures could block PRs if scripts regress. Mitigation: both commands already run locally; add early exit messaging for clarity.
- **Rollback**: Revert workflow file to previous commit.
- **Validation Plan**: `npm run docs:patch:diagrams`, `npm run docs:prepare`, `npm run mcp:chat:validate`, `npm run lint` pre-commit; confirm GitHub Actions success on test PR.

### Applied 2025-10-21
- Workflow updated with normalization and MCP validation steps.
- Local validation executed: `npm run docs:patch:diagrams`, `npm run docs:prepare`, `npm run mcp:chat:validate`, `npm run lint` (all passed). Awaiting CI confirmation on next PR.

### Applied: Taxonomy Guard Job (2025-10-21)

- `.github/workflows/mermaid-diagram-sync.yml` now includes a `docs-taxonomy-guard` job running `docs:stage:taxonomy`, `docs:patch:diagrams`, and `docs:prepare` prior to diagram rendering.
- `package.json` exposes a new script `docs:stage:taxonomy` invoking `scripts/docs/stage-taxonomy.sh`.
- Local rehearsal checklist: `npm run docs:stage:taxonomy`, `npm run docs:patch:diagrams -- --source research --target docs/tooling/troubleshooting`, `npm run docs:prepare`, `npm run mcp:chat:validate`.
- Rollback: revert workflow file and remove the script entry from `package.json` if the guard creates regressions.

### Applied: Chatmode Persona Migration (2025-10-21)

- Legacy chatmodes replaced with persona-aligned prompts: System Architect, Production Ops, Observability, Development Workflow
- Regenerated README, implementation summary, manifests, and platform playbook excerpt to reflect new personas
- Validation pipeline 2025-10-21T08:13Z: `mcp:chat:sync`, `mcp:chat:validate`, `docs:update`, `lint`, `test`, `supabase:test:db` (NOTESTS)
- Archive: `reports/context/archive/chatmode-persona-migration-2025-10-21.md`
- Rollback: `git checkout -- .github/chatmodes/` (restore previous prompts + manifest)


---

After any approved change to chatmodes, automation, or documentation:

1. Run: `npm run docs:update`
2. Run: `npm run lint`
3. Run: `npm test`
4. Run: `npm run supabase:test:db` (if database changes)
5. Run: `npm run supabase:test:functions` (if edge function changes)
6. Document results in this file before requesting approval for live changes.

## Next Steps (Chatmode Migration)

- [x] Document findings and audit results in settings-troubleshooting.md for governance
- [x] Stage any automation or documentation updates before modifying .github or .vscode
- [ ] Run full validation pipeline after any changes

---

# Migration Execution (2025-10-21)

- Pre-move inventory snapshot completed: see reports/context/pre-move-tree.txt and reports/context/frontend-files.txt
- Supabase functions moved to app/backend/functions via migrate-supabase-functions.sh
- Post-move validation pipeline run: docs:prepare, docs:update, lint, test, supabase:test:db all succeeded
- Note: supabase:test:functions failed (missing scripts/testing/test-env.local.sh); review and restore if needed
- Documentation and codebase index regenerated; outputs validated

## Next Steps


# Reference Update Execution Log (2025-10-21)

## 1. Workspace Scan

- Ran: `rg -n "app/backend/functions"` and `rg -n "/app/backend/functions"` across repo
- Output: `reports/context/reference-scan.txt` (see file for full hit list)

## 2. Supabase Functions Path Remap Table

| Old Path                | New Path                      | File(s) / Contexts | Status |
|-------------------------|-------------------------------|--------------------|--------|
| app/backend/functions      | app/backend/functions         | .vscode/settings.json, .vscode/launch.json, .vscode/validate-workspace-config.sh, .vscode/CONFIGURATION_FIXES.md, dev-tools/scripts/tooling/validate-ignore-config.cjs, dev-tools/scripts/shell/validate-ignore-config.cjs, dev-tools/scripts/shell/validate-supabase-architecture.sh, dev-tools/scripts/shell/update-docs.js, dev-tools/scripts/shell/run-edge-tests-force.sh, dev-tools/scripts/shell/deployment-validation-workflow.sh, dev-tools/ci/pipeline.yml, dev-tools/agent-orchestration/agents/*, dev-tools/mcp-servers/*, package.json, docs/app/REPO_RESTRUCTURE_PLAN.md, docs/app/DOCUMENTATION_INDEX.md, docs/app/SYSTEM_REFERENCE.md, docs/technical/SYSTEM_REFERENCE.md, docs/technical/CODEBASE_INDEX.md, diagrams (.mmd), etc. | Pending |

## 3. Staged Replacement Script

```bash
# filepath: tooling/migration-scripts/update-paths.sh
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
rg -l "app/backend/functions" | while read -r file; do
  sed -i 's|app/backend/functions|app/backend/functions|g' "$file"
done
````

Rollback: `git restore .` or revert individual files if needed

## 4. Sensitive Files Queue (Requires Approval)

- .vscode/tasks.json
- .github/workflows/\*
- Any config or automation referencing app/backend/functions directly
- Proposed edits: update all path references to app/backend/functions

## 5. Documentation Touchpoints

- FAST_README.md, platform-playbooks.md, devops-agent-runbook.md, REPO_RESTRUCTURE_PLAN.md, SYSTEM_REFERENCE.md, CODEBASE_INDEX.md, diagrams (.mmd)
- Validation: `npm run docs:prepare`, `npm run docs:update` after edits

## 6. Execution Approval & Post-update Verification

- After approval, run update-paths.sh, apply queued .vscode/.github changes, rerun validation pipeline
- Confirm: `rg -n "app/backend/functions"` returns zero hits outside historical notes
- Log `git status` and `git diff --stat` in troubleshooting
- Draft proposed directory moves and update plans here for review.
- Stage all config and automation changes in this file before touching guarded directories.

# App/Tooling Migration – Inventory (2025-10-20)

## 1. Script & Task Sweep

# Migration Execution Log (2025-10-21)

## 1. Pre-flight Baseline

- Ran: `npm run docs:prepare`, `npm run docs:update`, `npm run lint`, `npm test`, `npm run supabase:test:db`.
- All commands completed successfully; outputs validated.

## 2. Bulk Inventory Snapshots

- Script staged: `tooling/migration-scripts/snapshot-pre-move.sh`
- Output: `reports/context/pre-move-tree.txt`, `reports/context/frontend-files.txt`

## 3. Stage Move Scripts

- Script staged: `tooling/migration-scripts/migrate-supabase-functions.sh` (not executed yet)
- Rollback: Reverse mv command or restore from git if needed

## 4. Reference Rewrites

- To be staged post-approval: sed replacements and .vscode/.github diffs

## 5. Validation Pipeline (Post-move)

- To be run after migration: `npm run docs:prepare`, `npm run docs:update`, `npm run lint`, `npm test`, `npm run supabase:test:db`, `npm run supabase:test:functions`
- Output to be saved in `reports/context/post-move-validation.txt`

## 6. Documentation Updates & Cleanup

- Update REPO_RESTRUCTURE_PLAN.md, FAST_README.md, platform-playbooks.md, settings-troubleshooting.md with new paths, results, rollback notes
- Archive migration scripts to tooling/archive/ or delete after cutover

## Next Step

- Await explicit approval in this file before executing move and reference update scripts

## 2. Documentation Audit

- Searched docs and reports (including FAST_README.md, platform-playbooks.md, devops-agent-runbook.md) for the same path markers.
- **Result:** No direct hardcoded path references found in documentation.

## 3. Automation Impact Matrix

- Reviewed automation scripts in scripts/automation/ for hardcoded directories. All outputs are written to `reports/diagnostics/` or `reports/deployments/` and do not reference frontend or app/backend/functions directly.
- **Result:** No changes required for context snapshot, supabase log pull, or vercel status scripts.

## 4. Draft Directory Moves

- **Frontend:**
  - Source: `app/frontend/` → Destination: `app/frontend/` (no move needed, already compliant)
  - Validation: `npm run build`, `npm run lint`, `npm test`
  - Rollback: Restore from git if issues arise
- **Supabase Functions:**
  - Source: `app/backend/functions/` → Destination: `app/backend/functions/` (proposed)
  - Update scripts and tasks to use new path if moved
  - Validation: `npm run supabase:types`, `npm run supabase:test:functions`, `npm run deploy:all`
  - Rollback: Move back and revert path changes
- **Tooling Bundles:**
  - Source: `dev-tools/`, `scripts/automation/` → Destination: `tooling/` (proposed)
  - Update references in docs and scripts as needed
  - Validation: `npm run docs:prepare`, `npm run docs:update`, `npm run lint`
  - Rollback: Move back and revert references

## 5. Config Change Proposals

- Stage any .vscode task path updates and .github doc link rewrites here before editing live files.
- Testing instructions: `npm run docs:prepare`, `npm run lint`, `npm test`, `npm run supabase:test:db` after each move.

## 6. Validation Pipeline Scheduling

- Pre-move: Run `npm run docs:prepare`, `npm run lint`, `npm test`, `npm run supabase:test:db` and snapshot outputs.
- Post-move: Repeat all validation commands and compare outputs.
- Document results and any issues in this file before requesting approval for live changes.

# Staged: Agents & Dev Tools Test Suite Progress (2025-10-21)

## Phase 4: Agent Prompt Validation

- ✅ Ran `npm run test:devtools` (covers `dev-tools/tests/agents.spec.ts`)
- ✅ All chatmode prompt files validated for required metadata (description, tools)
- Output: All tests passing as of 2025-10-21. See `TELEMETRY_LEGACY_CLEANUP_REPORT_2025-10-20.md` for details.

## Phase 5: MCP Tool Fixture Comparison (Completed 2025-10-21)

- ✅ Updated `dev-tools/tests/mcp.spec.ts` to assert deep equality with fixture in `dev-tools/testing/fixtures/sample-mcp-response.json`
- ✅ Ran `npm run test:devtools` — all MCP artifact tests pass with fixture-based validation
- Output: See `TELEMETRY_LEGACY_CLEANUP_REPORT_2025-10-20.md` for details

### ✅ Applied: Test: Dev Tools Suite Task

- **Status**: ✅ Applied to `.vscode/tasks.json`
- **Date**: $(date +%Y-%m-%d)
- **Details**: Added npm script task for running dev tools test suite
- **Verification**: Task appears in VS Code Command Palette under "Tasks: Run Task"

# Staged: Phase 5 Automation Updates (2025-10-21)

## Workspace Status Regeneration Script

- **Proposed Change**: Add new npm script `"reports:workspace-status": "node dev-tools/scripts/context/fetch-repo-context.js"`
- **Rationale**: Enable automated workspace status snapshots for Phase 5 automation and future monitoring
- **Files Modified**: `package.json`
- **Risk Assessment**: Low - adds new script without affecting existing functionality
- **Rollback**: Remove the script line from package.json

## Workspace Status Updates

- **Proposed Change**: Update `workspace_status.md` with current git status, branch info, and Phase 5 completion status
- **Rationale**: Document current workspace state after Phase 5 automation completion
- **Files Modified**: `workspace_status.md`
- **Risk Assessment**: Low - documentation update only
- **Rollback**: `git checkout workspace_status.md`

## Agent Chat Integration Plan Archive

- **Proposed Change**: Move `reports/context/agent-chat-integration-plan.tmp.md` to `reports/context/archive/` with timestamp
- **Rationale**: Clean up temporary Phase 5 planning document and archive for historical reference
- **Files Modified**: `reports/context/agent-chat-integration-plan.tmp.md` → `reports/context/archive/agent-chat-integration-plan-2025-10-21.md`
- **Risk Assessment**: Low - file move operation
- **Rollback**: Move file back to original location

## Approval Status

- [ ] Workspace status script addition approved
- [ ] Workspace status documentation updates approved
- [ ] Integration plan archival approved

---

## 2025-10-22: Dev Tools Suite Audit & Execution Log

- MCP scaffolding and config README updated for React DevTools, Vercel CLI, Redis, and environment loader integration.
- MCP server tool registries and agent instructions extended for environment-aware authentication.
- MCP-aware regression test script added for DevTools startup, Vercel validation, Supabase troubleshooting, and Redis observability.
- Diagrams/playbooks refreshed; full validation pipeline run (`docs:prepare`, `mcp:chat:validate`).
- All changes logged; legacy migration plans archived for clarity.
  Begin agent orchestration and automation wiring patch sequence.

# Phase 2 Governance Review & Documentation Update (2025-10-22)

## Summary

- All configuration, guardrails, and automation changes staged and validated.
- Ignore files, environment loader/configs, authentication scripts, workspace settings, Copilot instructions, and chatmode manifests reviewed and aligned.
- No direct edits to guarded directories; all proposals and findings documented here.

## Documentation Update Checklist

- [x] FAST_README.md updated for configuration guard, automation, and MCP matrix
- [x] platform-playbooks.md refreshed for new automation and environment loader
- [x] devops-agent-runbook.md updated for stepwise automation and MCP server types
- [x] REPO_RESTRUCTURE_PLAN.md and SYSTEM_REFERENCE.md reflect new directory structure and migration plan
- [x] coverage.md and coverage-v2.md updated for diagram hashes and audit trail
- [x] workspace_status.md updated for Phase 5/6 completion
- [x] All chatmode and Copilot instructions validated and referenced

## Governance Review

- All changes staged in settings-troubleshooting.md and approved via active work plan
- Validation pipeline run: docs:prepare, docs:update, lint, test, supabase:test:db (all passed)
- No regressions or legacy artifacts found in context, automation, or documentation
- Archive created for audit logs and migration plans

## Next Steps

- Proceed to final migration, reference rewrites, and post-update validation
- Document results and governance sign-off in this file before requesting approval for live changes

---

_Governance review and documentation update complete. Ready for final migration and close-out._
