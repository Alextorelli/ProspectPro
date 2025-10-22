#!/usr/bin/env bash
# Participant Routing Helper (Option A)
# Usage: ./participant-routing.sh <participant-tag>

PARTICIPANTS=("ux" "platform" "devops" "secops" "integrations")

TAG="$1"

if [[ -z "$TAG" ]]; then
  echo "Usage: $0 <participant-tag>" >&2
  exit 1
fi

for P in "${PARTICIPANTS[@]}"; do
  if [[ "$TAG" == "$P" ]]; then
    echo "reports/context/$TAG/"
    exit 0
  fi
done

echo "[ERROR] Unknown participant tag: $TAG" >&2
exit 2
