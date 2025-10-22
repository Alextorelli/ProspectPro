# Chat Participant Taxonomy – Option A (Application Layers)

_Source: Round 2 Integration Plan refinement (2025-10-21). Draft stored in troubleshooting pending promotion to end-state guidance._

## Overview

This troubleshooting draft consolidates chat participants into layer-focused domain experts. Each participant tag maps the existing agent modes (\`@debug\`, \`@deliver\`, \`@support\`, \`@optimize\`, \`@security\`) to the precise workspace surfaces they should emphasize during automation and guidance workflows.

Alignment objectives:

- Reduce the participant roster to a minimal, composable set.
- Anchor each participant to ProspectPro's revised hybrid mono-repo layers.
- Preserve forward links to MCP tooling and CI guardrails for integration plan execution.

## Participant Matrix

| Participant Tag            | Layers Covered                                                 | Key Activities                                                                    | Agent Pairings                    | MCP / Automation Hooks                                                           |
| -------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `@ux`                      | Frontend experience & design                                   | React UI audits, accessibility, component hygiene, DevTools telemetry             | `@deliver`, `@debug`              | `react-devtools`, design checklist                                               |
| `@platform`                | API services, database, integrations, enrichment quality       | Endpoint diagnostics, schema/migration review, enrichment data QA, reporting KPIs | `@debug`, `@deliver`, `@support`  | `supabase-dev`, `integration-hub`, Postgres validators, `ci_cd_validation_suite` |
| `@devops`                  | CI/CD, infrastructure, container orchestration                 | Pipeline tuning, Docker/IaC updates, environment routing, diagram guardrails      | `@deliver`, `@optimize`           | `docs:patch:diagrams`, Docker tasks, GitHub workflow guard                       |
| `@secops`                  | Security posture, compliance, observability, incident response | Risk triage, alert tuning, production telemetry, rollback playbooks               | `@support`, `@debug`, `@optimize` | `security-scan`, observability MCP, `context-snapshot.sh`, rollback scripts      |
| `@integrations` (optional) | External partner APIs, payments, webhook orchestration         | Contract validation, vendor health checks, future Stripe workflows                | `@deliver`, `@research`           | Integration MCP cluster, Stripe hooks (planned), CRM connectors                  |

## Implementation Notes

- Promotion path: `docs/tooling/troubleshooting/chat-participants-taxonomy.md` → `docs/tooling/end-state/chat-participants-taxonomy.md` once approved.
- Integration plan reference: see `reports/context/archive/agent-chat-integration-plan-2025-10-21.md` for Phase 5 baseline. Update the active guidance after review.
- CI alignment: ensure `.github/workflows/mermaid-diagram-sync.yml` and related tasks reference the new end-state directory during promotion.

## Next Steps

1. Validate participant mapping with MCP server registry updates.
2. Update `.github/chatmodes/README.md` and related manifest summaries after promotion.
3. Coordinate with DevOps taxonomy refinements to reflect the same layer/participant mapping.
