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
   - Validate with `npm run docs:patch:diagrams` and manual review.

3. **Automation & Documentation**

   - Update automation scripts to use participant mapping helper.
   - Refresh documentation and playbooks to match new taxonomy.
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
2. Begin refactoring orchestration and context scripts
3. Update automation and documentation
4. Replace chatmodes and CI workflows
5. Archive superseded assets
