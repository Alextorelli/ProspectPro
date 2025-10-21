# Workspace Configuration Safeguard Staging

---

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

- Begin phased relocation of `/app/frontend`, `/supabase/functions`, and supporting tooling into the target `/app` and `/tooling` hierarchy as described in `docs/app/REPO_RESTRUCTURE_PLAN.md`.
- All changes to `.vscode/` and `.github/` must be staged here before being applied.
- Capture blockers, risks, and required sequencing for each move.

## Known Blockers

- Some VS Code tasks and npm scripts reference absolute or legacy paths; these must be updated in lockstep with directory moves.
- MCP validation and automation scripts may require path updates; coordinate with platform-playbooks.md.
- Documentation and codebase index regeneration must be sequenced after each major move.

## Next Steps


# Migration Execution (2025-10-21)

- Pre-move inventory snapshot completed: see reports/context/pre-move-tree.txt and reports/context/frontend-files.txt
- Supabase functions moved to app/backend/functions via migrate-supabase-functions.sh
- Post-move validation pipeline run: docs:prepare, docs:update, lint, test, supabase:test:db all succeeded
- Note: supabase:test:functions failed (missing scripts/testing/test-env.local.sh); review and restore if needed
- Documentation and codebase index regenerated; outputs validated

## Next Steps


# Reference Update Execution Log (2025-10-21)

## 1. Workspace Scan

- Ran: `rg -n "supabase/functions"` and `rg -n "/app/backend/functions"` across repo
- Output: `reports/context/reference-scan.txt` (see file for full hit list)

## 2. Supabase Functions Path Remap Table

| Old Path                | New Path                      | File(s) / Contexts | Status |
|-------------------------|-------------------------------|--------------------|--------|
| supabase/functions      | app/backend/functions         | .vscode/settings.json, .vscode/launch.json, .vscode/validate-workspace-config.sh, .vscode/CONFIGURATION_FIXES.md, dev-tools/scripts/tooling/validate-ignore-config.cjs, dev-tools/scripts/shell/validate-ignore-config.cjs, dev-tools/scripts/shell/validate-supabase-architecture.sh, dev-tools/scripts/shell/update-docs.js, dev-tools/scripts/shell/run-edge-tests-force.sh, dev-tools/scripts/shell/deployment-validation-workflow.sh, dev-tools/ci/pipeline.yml, dev-tools/agent-orchestration/agents/*, dev-tools/mcp-servers/*, package.json, docs/app/REPO_RESTRUCTURE_PLAN.md, docs/app/DOCUMENTATION_INDEX.md, docs/app/SYSTEM_REFERENCE.md, docs/technical/SYSTEM_REFERENCE.md, docs/technical/CODEBASE_INDEX.md, diagrams (.mmd), etc. | Pending |

## 3. Staged Replacement Script

```bash
# filepath: tooling/migration-scripts/update-paths.sh
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
rg -l "supabase/functions" | while read -r file; do
  sed -i 's|supabase/functions|app/backend/functions|g' "$file"
done
````

Rollback: `git restore .` or revert individual files if needed

## 4. Sensitive Files Queue (Requires Approval)

- .vscode/tasks.json
- .github/workflows/\*
- Any config or automation referencing supabase/functions directly
- Proposed edits: update all path references to app/backend/functions

## 5. Documentation Touchpoints

- FAST_README.md, platform-playbooks.md, devops-agent-runbook.md, REPO_RESTRUCTURE_PLAN.md, SYSTEM_REFERENCE.md, CODEBASE_INDEX.md, diagrams (.mmd)
- Validation: `npm run docs:prepare`, `npm run docs:update` after edits

## 6. Execution Approval & Post-update Verification

- After approval, run update-paths.sh, apply queued .vscode/.github changes, rerun validation pipeline
- Confirm: `rg -n "supabase/functions"` returns zero hits outside historical notes
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

- Reviewed automation scripts in scripts/automation/ for hardcoded directories. All outputs are written to `reports/diagnostics/` or `reports/deployments/` and do not reference frontend or supabase/functions directly.
- **Result:** No changes required for context snapshot, supabase log pull, or vercel status scripts.

## 4. Draft Directory Moves

- **Frontend:**
  - Source: `app/frontend/` → Destination: `app/frontend/` (no move needed, already compliant)
  - Validation: `npm run build`, `npm run lint`, `npm test`
  - Rollback: Restore from git if issues arise
- **Supabase Functions:**
  - Source: `supabase/functions/` → Destination: `app/backend/functions/` (proposed)
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

```

```
