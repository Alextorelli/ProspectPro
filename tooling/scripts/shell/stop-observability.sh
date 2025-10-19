#!/bin/bash
# Stop Observability Stack: Jaeger, Prometheus, OTel Collector, Grafana
set -euo pipefail
cd "$(dirname "$0")/../observability"
docker-compose -f docker-compose.jaeger.yml down
echo "Observability stack stopped."
