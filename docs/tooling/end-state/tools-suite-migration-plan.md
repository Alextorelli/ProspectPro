## Phase 2/3 Diagram Refactor Log

- Converted `agent-mode-flow.mmd` from flowchart to ER diagram (Option A taxonomy)
- Split `participant-coordination-flow.mmd` into `coordination-overview-flow.mmd` (session/manager/participant routing) and `coordination-activation-flow.mmd` (participant-to-automation mapping)
- Updated documentation references in `devops-environment-taxonomy.md` to point to new diagrams
- Normalized Mermaid init headers for all end-state diagrams
- Updated diagram scripts and coverage to reference new coordination diagrams and ER model
- Added shorthand aliases (`end-state`, `v2`) to diagram patching scripts for targeted normalization
- Regenerated and validated documentation and tests (see coverage.md)
- Promoted revised `agent-mode-flow.mmd` hierarchy into `devops-environment-taxonomy.md`
- Reworked `environment-mcp-cluster.mmd` to depict primary-to-secondary MCP routes per Option A

# End-to-End Tools Suite Migration Plan (Option A Alignment)

_Last updated: 2025-10-21_

## Overview

This document tracks the phased migration of ProspectPro’s MCP, agent orchestration, context management, automation scripts, and documentation to the Option A participant taxonomy and environment-aware routing. It summarizes audit outcomes, recommended actions, and progress checkpoints for each phase.

---

## Audit Outcomes & Alignment Plan

| Scope                                          | Findings                                                                 | Action                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| mcp-config.json, registry.json                 | Legacy server layout lacks Option A participant metadata, branch routing | **Replace** with scaffolded v2.0 config; retag registry entries per mcp-config-scaffolding.md                 |
| dev-tools/agent-orchestration/\*               | Diagrams, JSON payloads reference deprecated participants                | **Refactor** to use `@ux`, `@platform`, `@devops`, `@secops`, `@integrations`; regenerate diagrams            |
| dev-tools/context/_, scripts/context/_         | Context collectors output to legacy folders                              | **Refactor**: add participant flag, route snapshots to `reports/context/<tag>/` per workspace migration guide |
| automation, docs                               | Hard-coded participant names (`api-debug`, etc.)                         | **Refactor** using shared mapping helper (new `scripts/automation/lib/participant-routing.sh`)                |
| .github/chatmodes/_, .github/workflows/_.yml   | Prompts & watchers still point at old taxonomy                           | **Replace** prompts with Option A mapping; update workflow paths to end-state after staging proposal          |
| devops-agent-runbook.md, platform-playbooks.md | Narratives reference legacy personas                                     | **Refactor** copy to align with new participants & environment clusters                                       |
| update-docs.js, coverage.md                    | No awareness of `end-state/` promotions                                  | **Refactor** script to index end-state docs and log promotions automatically                                  |
| reports/context/history/\*                     | Round 1 assets mixed with current                                        | **Remove/Archive** redundant Round 1 outputs into round-1                                                     |

---

## Phased Migration Sequence

1. **MCP & Registry Rewrite**

   - Draft v2.0 `config/mcp-config.json` and retag `dev-tools/mcp-servers/registry.json` per Option A.
   - Stage proposals in `settings-staging.md` and validate with `npm run mcp:chat:validate`.

2. **Agent Orchestration & Context Scripts**

   - Refactor orchestration diagrams and context scripts to use new participant tags.
   - Route context snapshots to `reports/context/<tag>/`.
   - Capture any environment/participant routing revisions in `docs/tooling/end-state/devops-environment-taxonomy.md` before regenerating diagrams with `npm run docs:patch:diagrams` and `npm run docs:prepare`.
   - Validate with `npm run docs:patch:diagrams` and manual review.

3. **Automation & Documentation**

   - Update automation scripts to use participant mapping helper.
   - Refresh documentation and playbooks to match new taxonomy, sourcing diagrams from the taxonomy root (`devops-environment-taxonomy.md`).
   - Regenerate codebase index and coverage logs.

4. **Chatmodes & CI Workflows**

   - Replace chatmode prompts and workflow watchers with Option A mapping.
   - Update workflow paths to reference end-state guidance.
   - Validate with `npm run mcp:chat:sync` and CI pipeline.

5. **Archive & Cleanup**
   - Move Round 1 assets to `docs/tooling/history/round-1/`.
   - Confirm all legacy references are removed from active scripts and docs.

---

## Progress Tracking

- [x] Audit complete; migration plan documented
- [x] MCP config/registry rewrite staged
- [ ] Orchestration/context scripts refactored
- [ ] Automation/docs updated
- [ ] Chatmodes/CI workflows replaced
- [ ] Round 1 assets archived

---

## Validation Pipeline

- Run `npm run docs:patch:diagrams`, `npm run docs:prepare`, `npm run mcp:chat:validate` after each phase
- Log results in `reports/context/coverage.md` and `settings-staging.md`
- Manual review of diagrams, context outputs, and CI status

---

## Next Steps

1. Validate staged MCP config/registry via `npm run mcp:chat:validate` and record outputs in `settings-staging.md` & `reports/context/coverage.md`.
2. Run `scripts/docs/render-diagrams.sh` to normalize end-state and v2 diagrams with the new aliases.
3. Proceed with refactoring orchestration and context scripts.
4. Update automation and documentation to consume the new participant routing helpers.
5. Replace chatmodes and CI workflows.
6. Archive superseded assets once validations pass.

---

## 2025-10-22: End-State Dev Tools Suite Audit & Action Plan

Key gaps remain before the Dev Tools suite is fully aligned with the live application stack. This plan supersedes all previous migration and refactor logs. Archive prior plans and logs to avoid confusion.

### Configuration & Tooling

- Update `docs/tooling/end-state/mcp-config-scaffolding.md` to remove legacy multi-server layout and add React DevTools, Vercel CLI, Redis, and environment loader integration.
- Promote v2 config in `config/mcp-config.json` and template in `config/mcp-config.v2.json`.
- Wire `config/environment-loader.v2.js` into startup scripts and VS Code tasks; document integration steps in `config/README.md` and automation.

### MCP Servers & Agents

- Extend MCP server tool registration for React DevTools, Vercel deploy helpers, and Redis observability hooks.
- Document access scopes and environment-specific authentication in `docs/tooling/end-state/mcp-migration-guidance.md` and agent instructions.
- Add credential requirements per environment and link to the new routing helper.

### Automation, Tests, CI/CD

- Add scripts/tasks for React DevTools startup, Vercel CLI validation, and Redis/observability checks; ensure participant-routing helper is invoked.
- Create MCP-aware regression test suite in `scripts/testing` and update test index for `npm run docs:prepare`.

### Documentation & Diagrams

- Update v2 playbook (`docs/tooling/v2/tools-suite-migration-plan.md`) to reflect remaining work and link to revised diagrams in v2.
- Ensure README sections for MCP tooling highlight direct integration with frontend and Supabase functions.

### Observability & Security

- Surface Redis/trace requirements in `docs/tooling/end-state/agent-orchestration-migration.md` and align with `config/otel-config.yml`.
- Define role-based access for MCP agents and document in `docs/tooling/devops-agent-runbook.md`.

### Next actions

1. Rewrite MCP scaffolding + README sections to reference React DevTools, Vercel CLI, Redis, and environment prompting.
2. Extend MCP server tool registries and agent instruction sets for environment-aware auth.
3. Add automation scripts/tests for React DevTools startup, Vercel deploy validation, and Supabase troubleshooting; regenerate docs.
4. Refresh diagrams/playbooks to cite the new workflow, then run `npm run docs:prepare` and `npm run mcp:chat:validate`.
5. Log changes in `docs/tooling/settings-staging.md` and `reports/context/coverage.md`, archive remaining Round 1 assets, and proceed to CI updates.

This audit keeps the DevOps toolchain aligned with the actual application source and prepares agents for context-aware operations across all environments.

---

## 2025-10-22: MCP Server & Agent Auth Update

- MCP server tool registries extended for React DevTools, Vercel deploy helpers, and Redis observability hooks.
- Agent instructions updated for environment-aware authentication and credential requirements per environment.
- Access scopes documented in `docs/tooling/end-state/mcp-migration-guidance.md` and agent instructions linked to routing helper.
