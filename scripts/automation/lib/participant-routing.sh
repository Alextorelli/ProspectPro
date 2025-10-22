#!/usr/bin/env bash
# Participant Routing Helper (Option A)
# Usage: ./participant-routing.sh <participant-tag>


PARTICIPANTS=("ux" "platform" "devops" "secops" "integrations")

# Only process valid participant tags, ignore flags like --dry-run
for arg in "$@"; do
  case "$arg" in
    --*) continue ;; # skip flags
    "") continue ;;
    *)
      for P in "${PARTICIPANTS[@]}"; do
        if [[ "$arg" == "$P" ]]; then
          echo "reports/context/$arg/"
          exit 0
        fi
      done
      # If not a valid participant, skip
      continue
  esac
done

# If no valid participant found, do nothing
exit 0
