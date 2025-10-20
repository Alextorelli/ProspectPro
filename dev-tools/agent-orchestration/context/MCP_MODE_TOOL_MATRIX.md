# MCP Mode-to-Tool Matrix (MCP-First, Zero-Fake-Data)

| Agent Mode           | Primary MCP Tools/Scripts                                                       | Environment/Notes                                      |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Feature Delivery     | `integration_hub.execute_workflow`, `supabase:test:db`, Edge deploy             | Use for new features, run full validation suite.       |
| Smart Debug          | `supabase_troubleshooting.correlate_errors`, `test_edge_function`, logs         | Incident response, log/trace analysis, RLS checks.     |
| Production Support   | `supabase_cli_healthcheck`, `vercel_status_check`, `generate_incident_timeline` | Uptime, rollback, health checks, incident timeline.    |
| API Research         | `integration_hub.check_integration_health`, MCP API tools                       | For API integration/validation, circuit breaker audit. |
| Cost Optimization    | `integration_hub`, logs, `campaign-validation.sh`                               | Budget/cost analysis, quota monitoring.                |
| Zero-Fake-Data Audit | `postgresql.execute_query`, `integration_hub.send_notification`                 | Enrichment audit, compliance, alert on violations.     |

## Environment Switch Guidance

- Use ContextManager to switch between local, staging, and production environments.
- Export `SUPABASE_SESSION_JWT` for authenticated Edge Function and MCP tool calls.
- Always validate environment with `supabase:link` and `supabase:ensure-session` tasks.
- For production, confirm publishable key and session JWT are current.

## Quick Reference

- **MCP-First**: Prefer MCP tools over custom scripts or Thunder Client.
- **Zero-Fake-Data**: Always audit enrichment results for compliance.
- **Escalation**: Follow agent escalation triggers in instructions.md.
- **Collaboration**: Reference agent collaboration patterns in templates/README.md.

_Use this as a quick reference for selecting agent mode, tools, and environment setup._
