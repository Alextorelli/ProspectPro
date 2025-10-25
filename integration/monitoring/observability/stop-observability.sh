#!/bin/bash
# Stop Observability Stack: MCP log-forwarder, Prometheus, OTel Collector, Grafana
set -euo pipefail
cd "$(dirname "$0")/../observability"
docker-compose -f ../prometheus.yml down
echo "Observability stack stopped."
