# Workspace Configuration Safeguard Staging

---

## Phase 3 (2025-10-20): Automation Scripts

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

```json
{
  "label": "DevTools: Start React DevTools",
  "type": "shell",
  "command": "npm run devtools:react"
}
```

## Manual Command Sequence

1. Start the React app: `npm run dev`
2. In a new terminal, launch React DevTools: `npx react-devtools`
3. (Optional) Use browser extension for React state inspection

See `docs/tooling/agent-debug-playbooks.md` for full workflow and guard policy.
