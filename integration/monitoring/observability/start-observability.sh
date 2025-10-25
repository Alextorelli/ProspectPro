#!/bin/bash
# Start Observability Stack: MCP log-forwarder, Prometheus, OTel Collector, Grafana
set -euo pipefail
cd "$(dirname "$0")/../observability"
docker-compose -f ../prometheus.yml up -d
echo "Observability stack started. Prometheus: http://localhost:9090, Grafana: http://localhost:3000"