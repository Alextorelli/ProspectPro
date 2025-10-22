# MCP Server Migration Guidance (Option A Alignment)

_Last updated: 2025-10-21_

## Overview

This guidance connects the revised chat participant taxonomy (`@ux`, `@platform`, `@devops`, `@secops`, optional `@integrations`) to MCP server groups. The goal is to ensure each participant can route to the correct environment-aware MCP cluster without duplicating tooling. This document is the first step toward updating automation scripts and workflows for the Round 2 integration plan.

## Current Reference Artifacts

- Participant taxonomy: `docs/tooling/end-state/chat-participants-taxonomy.md`
- DevOps environment taxonomy: `docs/tooling/end-state/devops-environment-taxonomy.md`
- MCP registry manifests: `dev-tools/mcp-servers/registry.json`, `config/mcp-config.json`
- Existing playbooks: `docs/tooling/devops-agent-runbook.md`, `docs/tooling/platform-playbooks.md`

## Migration Objectives

1. Re-map MCP server tags to align with the Option A participant tags.
2. Establish environment-specific clusters that respect the hybrid mono-repo layout.
3. Provide a checklist for updating manifests, scripts, and observability hooks before executing automation changes.

## Target Mapping

| Participant Tag | Primary MCP Cluster(s)                                                 | Shared Tools                                               | Notes                                                                   |
| --------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `@ux`           | `chrome-devtools`, `integration-hub` (frontend subset)                 | Accessibility lint, design checklists                      | Limit to non-production endpoints; ensure Vercel preview compatibility. |
| `@platform`     | `supabase-development`, `postgresql`, `integration-hub`                | Database diagnostics, schema diff, API clients             | Enforce zero-fake-data guard by default.                                |
| `@devops`       | `github`, `ci_cd_validation_suite`, `docker`, `infrastructure-as-code` | Pipeline runs, diagram patching, IaC validation            | Gate `.github` and `.vscode` edits via troubleshooting logs.                    |
| `@secops`       | `observability-server`, `supabase-troubleshooting`, `security-scan`    | Incident probes, telemetry snapshots, key rotation scripts | Production scope only; require incident authorization flag.             |
| `@integrations` | `integration-hub`, `stripe` (pending), CRM/MDM connectors              | Vendor heartbeat, contract checks                          | Optional participant; keep behind feature flag until connectors land.   |

## Migration Steps

1. **Inventory Servers**

   - Export current registry via `jq '.servers[] | {slug, tags}' dev-tools/mcp-servers/registry.json`.
   - Compare with Option A tags; note servers lacking participant alignment.

2. **Update Registry Tags**

   - Add `participant` metadata for each server (e.g., `"participants": ["ux"]`).
   - Stage updates in `docs/tooling/settings-troubleshooting.md` before editing JSON manifests.

3. **Refresh Config Bindings**

   - Update `config/mcp-config.json` to reflect new participant-target routing.
   - For each participant, ensure environment clusters map to the correct scripts/tasks.

4. **Adjust Automation Scripts**

   - Review `scripts/automation/` for hard-coded server names; replace with participant lookups.
   - Draft wrapper functions (e.g., `resolve_mcp_cluster_for participant`) in troubleshooting before rollout.

5. **Validation Checklist**
   - `npm run mcp:chat:validate`
   - `npm run docs:patch:diagrams`
   - Manual smoke checks against production incidents (use `docs/tooling/devops-agent-runbook.md`).

## Risks & Mitigations

- **Misrouted Commands:** Use feature flags in `config/mcp-config.json` to restrict new routing until validation completes.
- **Stale Documentation:** Regenerate `docs/technical/CODEBASE_INDEX.md` and update `platform-playbooks.md` post-cutover.
- **Compliance Gaps:** Ensure `@secops` references maintain zero-fake-data logging before enabling production automation.

## Next Steps

1. Prepare JSON patch proposals in `docs/tooling/settings-troubleshooting.md`.
2. Draft CLI helper updates for participant-aware routing.
3. Plan cross-team validation window before enabling new MCP bindings.
