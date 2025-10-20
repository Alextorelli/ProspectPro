#!/bin/bash
# Verify Observability Stack Health
set -euo pipefail

JAEGER_URL="http://localhost:16686"
PROM_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3000"

function check_url() {
  local url="$1"
  local name="$2"
  if curl -s --head "$url" | grep "200 OK" > /dev/null; then
    echo "$name reachable: $url"
  else
    echo "$name NOT reachable: $url"; exit 1
  fi
}

check_url "$JAEGER_URL" "Jaeger UI"
check_url "$PROM_URL" "Prometheus"
check_url "$GRAFANA_URL" "Grafana"
echo "Observability stack health verified."
