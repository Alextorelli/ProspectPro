# Workspace Configuration Safeguard Staging

---

## Safeguarding Overview (Summary)

1. **Stage First** – Draft every proposed `.vscode/` and `.github/` change here (or an approved staging doc) with rationale, risk, and rollback.
2. **Seek Approval** – Share staged entries via the active work plan for explicit sign-off before touching guarded directories.
3. **Apply Carefully** – After approval, implement changes, log actions, and archive staging notes to `reports/context/archive/`.
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

> Purpose: Document guarded configuration surfaces and the staging process for any prospective changes. Do **not** edit the protected paths directly without explicit approval.

## Guarded Directories

- `.vscode/` – Tasks, launch configs, settings, and extensions. Treat as immutable; stage edits here first.
- `.github/` – Copilot instructions, chat modes, workflows, templates, and policies. Any updates must be reviewed in staging before touching live files.

## Staging Workflow

1. Draft proposed changes in a temporary file under `docs/tooling/` (or another agreed staging location).
2. Capture rationale, risk assessment, and rollback strategy in the draft.
3. Share the draft for approval via the active work plan (`docs/tooling/TEMP_DEVOPS_AGENT_PLAN.md`) or another requested channel.
4. Only after approval, apply the changes to the guarded directory and record the action in the relevant changelog/report.
5. Run `npm run docs:prepare` (and other required validations) before committing any approved updates.

## Notes

- The staging workflow applies during refactors, repository reorganizations, or any operation that could impact workspace stability.
- Extend this document as new guardrails or staging procedures are introduced.
- Remove temporary drafts once their corresponding changes have been approved and applied.

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

**Next:** Proceed to production activation and post-activation monitoring

### Pending Automation/Documentation Updates

- None at this time.

---

After any approved change to chatmodes, automation, or documentation:

1. Run: `npm run docs:update`
2. Run: `npm run lint`
3. Run: `npm test`
4. Run: `npm run supabase:test:db` (if database changes)
5. Run: `npm run supabase:test:functions` (if edge function changes)
6. Document results in this file before requesting approval for live changes.

## Next Steps (Chatmode Migration)

- [x] Document findings and audit results in settings-staging.md for governance
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
- Log `git status` and `git diff --stat` in staging
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

- Update REPO_RESTRUCTURE_PLAN.md, FAST_README.md, platform-playbooks.md, settings-staging.md with new paths, results, rollback notes
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
