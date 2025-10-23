# ProspectPro Tooling README

> **Configuration Guard:** All changes to `.vscode/` and `.github/` must be staged and approved via `docs/tooling/settings-troubleshooting.md`. Do not edit these directories directly during refactors or automation.

## Telemetry & Troubleshooting Tools

- MCP troubleshooting server exposes:
  - `capture_api_trace` – Capture OTEL traces for API calls
  - `compare_campaign_costs` – Aggregate cost metrics from Supabase logs and OTEL traces
  - `predict_campaign_roi` – Predict campaign ROI using cost, enrichment, and validation telemetry
- Outputs are saved in `dev-tools/context/session_store/diagnostics/` and referenced in context snapshots and coverage reports.

## Diagrams:

- [Workspace Architecture](workspace-architecture.mmd)
- [Agent Orchestration](agent-orchestration.mmd)
- [Agent Coordination Journey](end-state/agent-coordination-flow.mmd)
- [Agent Mode Journey](end-state/agent-mode-flow.mmd)
- [Participant Coordination Journey](end-state/participant-coordination-flow.mmd)
- [Environment MCP Cluster](end-state/environment-mcp-cluster.mmd)
- [Dev Tool Suite ER](end-state/dev-tool-suite-ER.mmd)
