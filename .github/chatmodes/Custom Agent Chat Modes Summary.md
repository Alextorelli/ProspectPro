# ProspectPro Agent-Aligned Chat Modes

ProspectPro’s chat participants map 1:1 to the revised agent personas. This keeps Codespaces, MCP automation, and documentation synchronized.

## Persona Snapshot

| Persona               | Chat Mode                          | Primary Outcomes                                                                       |
| --------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| System Architect      | `System Architect.chatmode.md`     | Architecture reviews, schema design, integration planning, ADR updates                 |
| Production Operations | `Production Ops.chatmode.md`       | Deployments, incident response, rollback execution, status communications              |
| Observability         | `Observability.chatmode.md`        | Metric & trace correlation, alert tuning, compliance monitoring, diagnostics archiving |
| Development Workflow  | `Development Workflow.chatmode.md` | Feature delivery, testing orchestration, MCP adoption, PR/CI hygiene                   |

## Persona Taxonomy & CI/CD Alignment

| Persona              | Context Inputs               | Primary MCP Tools                                                  | Automation Scripts                    | CI/CD Hook                                   |
| -------------------- | ---------------------------- | ------------------------------------------------------------------ | ------------------------------------- | -------------------------------------------- |
| System Architect     | Workspace, External, History | postgresql.validate_migration,<br>integration-hub.execute_workflow | context-snapshot.sh                   | docs:prepare,<br>ci_cd_validation_suite      |
| Development Workflow | Workspace, PR/CI, MCP        | ci_cd_validation_suite,<br>vercel_status_check                     | vercel-status-check.sh                | build,<br>deploy                             |
| Production Ops       | Incident, Logs, Rollback     | supabase_troubleshooting.generate_incident_timeline                | supabase-pull-logs.sh,<br>rollback.sh | supabase:test:db,<br>supabase:test:functions |
| Observability        | Metrics, Traces, Compliance  | observability.trace_diff                                           | context-snapshot.sh                   | docs:update,<br>lint                         |

## Alignment with Dev-Tools Architecture

- Agents: `dev-tools/agents/workflows/**`
- MCP layer: `dev-tools/agents/mcp`, `dev-tools/agents/mcp-servers/registry.json`
- Automation: `.vscode/tasks.json` tasks `MCP: Sync Chat Participants`, `MCP: Run Chat Validation`
- Governance: `docs/tooling/settings-staging.md`, archives under `dev-tools/context/session_store/archive/`

## Maintenance Workflow

1. Stage rationale/risk/rollback in `docs/tooling/settings-staging.md`.
2. Update agent instruction packs as needed.
3. Refresh chatmodes and manifest:
   ```bash
   npm run mcp:chat:sync
   npm run mcp:chat:validate
   ```
4. Run validation pipeline:
   ```bash
   npm run docs:update && npm run lint && npm test && npm run supabase:test:db
   ```
5. Archive execution summary (e.g., `dev-tools/workspace/context/session_store/archive/chatmode-persona-migration-2025-10-21.md`).

Maintain this alignment to ensure Copilot Chat responds with persona-specific playbooks that match the MCP toolkit and governance guardrails.
