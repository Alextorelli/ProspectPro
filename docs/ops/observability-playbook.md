# ProspectPro Observability Playbook

## Overview

This runbook describes how to operate, monitor, and troubleshoot the observability stack (Jaeger, Prometheus, OTel Collector, Grafana) for ProspectPro MCP and agent orchestration.

## Start/Stop Stack

- **Start:**
  ```bash
  ./tooling/scripts/shell/start-observability.sh
  ```
- **Stop:**
  ```bash
  ./tooling/scripts/shell/stop-observability.sh
  ```
- **Verify Health:**
  ```bash
  ./tooling/scripts/shell/verify-observability.sh
  ```

## Access Dashboards

- **Jaeger UI:** http://localhost:16686
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3000 (admin/admin)

## Diagnostics

- Use `verify-observability.sh` to confirm all services are reachable.
- Check OTel trace ingestion in Jaeger and metrics in Prometheus.
- Use the Grafana dashboard template at `monitoring/devtools/observability-dashboard.json`.

## Troubleshooting

- If a service is unreachable, run `docker-compose -f tooling/observability/docker-compose.jaeger.yml ps` to check container status.
- Inspect logs with `docker-compose -f tooling/observability/docker-compose.jaeger.yml logs <service>`.
- For OTel Collector config issues, review `monitoring/otel/collector-config.yaml`.

## Exit Validation

- Run `verify-observability.sh` and confirm all probes pass.
- Validate OTel trace sampled through MCP validation harness.
