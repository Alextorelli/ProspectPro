#!/bin/bash
# Pre-push: Run ignore validator in dev mode and print remediation tips if unwanted files are detected
npm run validate:ignores || {
  echo "\n[WARNING] Ignore hygiene check failed. Please clean up flagged files or update skip lists before pushing." >&2
  exit 1
}
