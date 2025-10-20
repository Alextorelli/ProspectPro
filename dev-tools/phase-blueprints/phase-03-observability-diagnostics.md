# Phase 03 – Observability & Diagnostics

## Objectives

- Operationalize OpenTelemetry pipelines feeding Jaeger + Prometheus.
- Add start/stop automation and health diagnostics.
- Document runbooks for agent and MCP observability.

## Automated Work Items

1. `observability/docker-compose.jaeger.yml` – Expand to include Prometheus exporters.
2. Scripts: `scripts/shell/start-observability.sh`, `stop-observability.sh`, `verify-observability.sh`.
3. `monitoring/otel/collector-config.yaml` – Collector routing.

## Deliverables

- Working docker-compose stack launched via VS Code tasks.
- `monitoring/devtools/observability-dashboard.json` Grafana template.
- Runbook `docs/ops/observability-playbook.md`.

## Exit Validation

- Task “Observability: Verify Stack” passes all probes.
- OTel trace sampled through MCP validation harness.
