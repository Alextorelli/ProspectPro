# Agent Orchestration Migration Guidance (Option A Alignment)

_Last updated: 2025-10-21_

## Overview

This document outlines how to transition the agent orchestration layer (Copilot chatmodes, CLI tasks, scripted automations) to the new participant taxonomy defined in `docs/tooling/end-state/chat-participants-taxonomy.md`. The focus is on sequencing agents, participants, and MCP clusters without breaking existing workflows.

## Current State Snapshot

- Chatmodes reside under `.github/chatmodes/` with four personas (System Architect, Production Ops, Observability, Development Workflow).
- Agent orchestration diagrams (`docs/tooling/agent-orchestration.mmd`, `context-orchestration.mmd`) use legacy participant handles (e.g., `@api-debug`, `@ops-monitor`).
- Automation scripts (`scripts/automation/`, `scripts/docs/`) reference specific participants for logging and routing.

## Migration Goals

1. Replace legacy participant names in orchestration diagrams and scripts with Option A tags.
2. Ensure each agent mode automatically pairs with the correct participant guidance.
3. Maintain compatibility with existing npm tasks and CI workflows during the transition.

## Update Plan

### 1. Diagram Refresh

- Update `.mmd` sources (agent orchestration, context orchestration, routing sequence) to use `@ux`, `@platform`, `@devops`, `@secops`, `@integrations`.
- Run `npm run docs:patch:diagrams -- --source docs/tooling --target docs/tooling/end-state` to normalize changes.
- Validate with `npx @mermaid-js/mermaid-cli --input <diagram> --output /tmp/diagram.svg` prior to commit.

### 2. Chatmode Alignment

- Edit `.github/chatmodes/*` to reference the new participant tags in their prompts and instructions.
- Update `Custom Agent Chat Modes Summary.md` to include the mapping table (reuse content from `chat-participants-taxonomy.md`).
- Execute `npm run mcp:chat:sync` followed by `npm run mcp:chat:validate`.

### 3. Automation Hooks

- Review scripts calling `@api-debug`, `@integration-mdm`, etc. Replace with the consolidated tags.
- Introduce a helper in `scripts/automation/lib/` (e.g., `participant-routing.sh`) to map tasks to Option A participants.
- Update `.vscode/tasks.json` descriptions if they mention legacy participants; stage proposals in `docs/tooling/settings-staging.md`.

### 4. Documentation Updates

- Revise `docs/tooling/devops-agent-runbook.md` and `docs/tooling/platform-playbooks.md` to match the new participants and MCP clusters.
- Add cross-links between agent orchestration diagrams and the end-state participant taxonomy.

## Validation Checklist

- `npm run docs:prepare`
- `npm run docs:update`
- Manual review of generated diagrams (`docs/tooling/diagrams/` outputs)
- Confirm `reports/context/coverage.md` logs the promotion of Option A taxonomy.

## Risk Considerations

- **Agent Drift:** Keep a backup of legacy prompts until Option A rollout is validated.
- **Script Regression:** Use feature toggles or environment variables to fallback to legacy routing if needed.
- **Communication:** Notify stakeholders via `workspace_status.md` once orchestration updates land.

## Next Steps

1. Draft diagram updates in staging and run the patch script.
2. Prepare chatmode prompt updates with explicit review in `settings-staging.md`.
3. Coordinate with MCP migration tasks (see `mcp-migration-guidance.md`) before enabling automated routing.
