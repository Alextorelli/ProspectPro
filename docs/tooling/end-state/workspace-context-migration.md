# Workspace & Context Management Migration Guidance (Option A Alignment)

_Last updated: 2025-10-21_

## Overview

This guidance defines how to adapt workspace context management (VS Code tasks, Copilot context injectors, documentation generators) to the consolidated participant taxonomy. It ensures that the hybrid mono-repo structure continues to surface the correct files and telemetry when agents invoke the new participants.

## Source References

- Participant taxonomy: `docs/tooling/end-state/chat-participants-taxonomy.md`
- DevOps taxonomy: `docs/tooling/end-state/devops-environment-taxonomy.md`
- Context scripts: `scripts/context/`, `scripts/docs/`
- Coverage reporting: `reports/context/coverage.md`
- Workspace status automation: `workspace_status.md`, `package.json` scripts

## Migration Goals

1. Align context collectors (CLI scripts, MCP connectors, VS Code tasks) with the Option A participants.
2. Reorganize context snapshots to match the future `/app` vs `/tooling` directory boundaries.
3. Keep documentation generators (e.g., `dev-tools/scripts/node/update-docs.js`) aware of promoted artefacts in `docs/tooling/end-state/`.

## Action Plan

### 1. Context Snapshot Scripts

- Update `scripts/context/` helpers to accept a `participant` flag instead of legacy handles.
- Ensure snapshots store outputs under `reports/context/<participant>/` folders.
- Document the new paths in `docs/tooling/devops-agent-runbook.md`.

### 2. VS Code Task Adjustments

- Stage updates to `.vscode/tasks.json` that reference participants, mapping them to Option A tags.
- Use `docs/tooling/settings-staging.md` to log proposed task changes before editing guarded files.
- Regenerate `.vscode/TASKS_REFERENCE.md` via `npm run docs:update` after approval.

### 3. Coverage & Reporting

- Extend `dev-tools/scripts/node/update-docs.js` to detect artifacts under `docs/tooling/end-state/` (in addition to staging).
- Append a note in `reports/context/coverage.md` when end-state documents are promoted.
- Archive the `Round 1` context structures under `docs/tooling/history/round-1/` as they are superseded.

### 4. Workspace Narrative

- Update `workspace_status.md` to summarize Option A adoption milestones once completed.
- Cross-link new guidance documents from `docs/tooling/FAST_README.md` for quick onboarding.

## Validation Checklist

- Run `npm run docs:prepare` to confirm diagrams and context tables stay in sync.
- Execute context snapshot scripts for each participant and verify outputs.
- `npm run docs:update` to reflect coverage and task references.
- Manual review of `reports/context/coverage.md` for new annotations.

## Risks & Mitigation

- **Context Drift:** Ensure fallback links to legacy context directories remain until migrations finalize.
- **Guardrail Bypass:** Preserve `.github`/`.vscode` guard messaging in scripts to avoid accidental direct edits.
- **Documentation Lag:** Schedule docs regeneration as part of the final rollout pipeline.

## Next Steps

1. Draft script updates with feature flags for participant-aware context capture.
2. Prepare VS Code task proposals and obtain approvals via `settings-staging.md`.
3. Coordinate with the upcoming task/workflow migration plan (see forthcoming strategy document).
