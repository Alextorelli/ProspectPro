#!/bin/bash
# Start Observability Stack: Jaeger, Prometheus, OTel Collector, Grafana
set -euo pipefail
cd "$(dirname "$0")/../observability"
docker-compose -f docker-compose.jaeger.yml up -d
echo "Observability stack started. Jaeger UI: http://localhost:16686, Prometheus: http://localhost:9090, Grafana: http://localhost:3000"