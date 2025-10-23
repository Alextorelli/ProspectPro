#!/usr/bin/env bats

@test "automation scripts dry-run" {
  run bash ../automation/sample-automation.sh --dry-run
  [ "$status" -eq 0 ]
  [[ "$output" == *"DRY RUN"* ]]
}
