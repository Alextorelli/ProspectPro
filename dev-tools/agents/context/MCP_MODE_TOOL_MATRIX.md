# MCP Mode-to-Tool Matrix (MCP-First, Zero-Fake-Data)

| Agent Mode           | Primary MCP Tools/Scripts                                                                                             | Environment/Notes                                                                                                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature Delivery     | `integration_hub.execute_workflow`, `supabase:test:db`, Edge deploy                                                   | Use for new features, run full validation suite. All CLI helpers/scripts must reference the canonical location: `scripts/operations/ensure-supabase-cli-session.sh` at the repo root. Avoid symlinks; use physical files for all critical scripts. |
| Smart Debug          | `supabase_troubleshooting.correlate_errors`, `test_edge_function`, logs                                               | Incident response, log/trace analysis, RLS checks.                                                                                                                                                                                                 |
| Production Support   | `supabase_cli_healthcheck`, `vercel_status_check`, `generate_incident_timeline`                                       | Uptime, rollback, health checks, incident timeline.                                                                                                                                                                                                |
| API Research         | `integration_hub.check_integration_health`, MCP API tools                                                             | For API integration/validation, circuit breaker audit.                                                                                                                                                                                             |
| Cost Optimization    | `integration_hub`, logs, `campaign-validation.sh`                                                                     | Budget/cost analysis, quota monitoring.                                                                                                                                                                                                            |
| Zero-Fake-Data Audit | `postgresql.execute_query`, `integration_hub.send_notification`                                                       | Enrichment audit, compliance, alert on violations.                                                                                                                                                                                                 |
| Troubleshooting      | `supabase_troubleshooting.correlate_errors`, `dev-tools/agents/scripts/context-snapshot.sh`, `redis-observability.sh` | Use for deep diagnostics, context recovery, and telemetry checks. Reference dry-run flag and environment-loader contract for safe execution.                                                                                                       |

## Environment Switch Guidance

- Use ContextManager to switch between development, production, and troubleshooting environments.
- Export `SUPABASE_SESSION_JWT` for authenticated Edge Function and MCP tool calls.
- Always validate environment with `supabase:link` and `supabase:ensure-session` tasks.
- For production, confirm publishable key and session JWT are current.
- All CLI session scripts must be present as physical files at `scripts/operations/` (repo root). Do not rely on symlinks or duplicate script trees. See repo hygiene notes in `.github/copilot-instructions.md`.
- For troubleshooting, use dry-run flag (`--dry-run`) and ensure environment-loader contract is sourced before agent or MCP tool execution.

## Quick Reference

- **MCP-First**: Prefer MCP tools over custom scripts or manual API clients.
- **Zero-Fake-Data**: Always audit enrichment results for compliance.
- **Escalation**: Follow agent escalation triggers in instructions.md.
- **Collaboration**: Reference agent collaboration patterns in templates/README.md.

_Use this as a quick reference for selecting agent mode, tools, and environment setup. For troubleshooting, always use dry-run and validate environment mapping before running agents or workflows._

**Script Consolidation Note:**
All CLI helper scripts (e.g., `ensure-supabase-cli-session.sh`) should reside in `scripts/operations/` at the repo root. Remove redundant copies/symlinks from `supabase/scripts/operations/` and `dev-tools/scripts/shell/` in future cleanups. All tasks and documentation must reference the canonical path.
For troubleshooting and diagnostics, reference `dev-tools/agents/scripts/context-snapshot.sh`, `redis-observability.sh`, and use the dry-run flag for safe context recovery.
