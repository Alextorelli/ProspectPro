# Workspace Configuration Safeguard Staging

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

---

## [2025-10-21] MCP Config v2.0 Proposal (Option A)

- Revised MCP config in `archive/config-backup/mcp-config-v2.0-proposal.json` to capture React DevTools (app/frontend/main.tsx) and Vercel CLI (`npm run frontend:deploy`) integration for Option A.
- Re-aligned clusters, participants, and routing against the Option A taxonomy with environment-aware server mappings.
- Updated MCP registry in `dev-tools/mcp-servers/registry.json` (platform-development, devops-vercel-cli, platform-production, platform-postgresql, integrations-hub).
- Pending review and validation (`npm run mcp:chat:validate`) plus React/Vercel smoke test via `npm run devtools:react` and `curl -I https://prospect-fyhedobh1-appsmithery.vercel.app`.
