#!/bin/bash
# Verify Observability Stack Health
set -euo pipefail

PROMETHEUS_URL="http://localhost:9090"
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

check_url "$PROMETHEUS_URL" "Prometheus UI"
check_url "$GRAFANA_URL" "Grafana UI"
echo "Observability stack health verified."
