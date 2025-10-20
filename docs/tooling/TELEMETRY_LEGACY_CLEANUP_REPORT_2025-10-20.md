# Telemetry & Legacy Reference Cleanup Report

**Date:** 2025-10-20
**Branch:** restructure-recovery

## Summary

All Thunder/Jaeger references have been removed from the codebase. Observability, tracing, and validation now use MCP log-forwarder and Supabase logs exclusively. All diagrams, documentation, scripts, and tasks have been updated and validated.

---

## Key Changes

### Diagrams

- `/docs/tooling/mcp-routing-sequence.mmd`: Replaced `THUNDER` participant with `TELEMETRY_STREAM` (dev-tools/monitoring/log-forwarder.ts) and updated all related edges.
- All `.mmd` diagrams: No remaining Thunder/Jaeger references (validated by grep).

### Documentation

- `/docs/tooling/FAST_README.md`: Clarified that all Thunder Client references are deprecated; MCP tools and Supabase logs are the new standard.
- `/docs/app/REPO_RESTRUCTURE_PLAN.md`: Removed Thunder collections from checklist; clarified deprecation.
- Workspace inventory and restructure backlog revalidated to confirm all remaining Thunder/Jaeger traces were replaced with MCP log-forwarder and Supabase logging references.
- `/dev-tools/agent-orchestration/context/RELEASE_NOTES_AND_DIFF_TEMPLATE.md`: Updated test/validation to MCP tools and Supabase logs.
- `/dev-tools/agent-orchestration/agents/observability/instructions.md`: Removed all Jaeger references; updated to MCP log-forwarder and Supabase logs.
- `/dev-tools/agent-orchestration/agents/templates/README.md`: Removed all Thunder Client references; updated to MCP tools and Supabase logs.
- `/dev-tools/agent-orchestration/agents/production-ops/instructions.md`: Removed Jaeger references; updated monitoring dashboards.
- `/dev-tools/agent-orchestration/context/TEST_RUN_EXPECTATIONS.md`: Updated test expectations to MCP tools and Supabase logs.
- `/dev-tools/README.md`: Removed Jaeger references; updated monitoring section.

### Scripts & Tasks

- `/dev-tools/scripts/shell/start-observability.sh`, `stop-observability.sh`, `verify-observability.sh`: Removed Jaeger references; now only start/stop/verify MCP log-forwarder, Prometheus, and Grafana.
- `.vscode/tasks.json`: All Jaeger tasks removed; observability tasks now reference MCP log-forwarder, Prometheus, and Grafana only.

### Package Files

- `/package.json`: Removed all Thunder Client scripts and references.
- `/dev-tools/mcp-servers/package.json`: Removed Jaeger exporter dependency.

---

## Validation

- All `.mmd` diagrams and Markdown docs were scrubbed with `grep` for Thunder/Jaeger references (none remain).
- All scripts and tasks referencing Jaeger/Thunder were updated or removed.
- All changes are documented in this report for audit and compliance.

---

## Next Steps

- Use only MCP log-forwarder and Supabase logs for all observability, tracing, and validation.
- No further action required unless new legacy references are discovered.

---

**Prepared by:** GitHub Copilot
**Date:** 2025-10-20
