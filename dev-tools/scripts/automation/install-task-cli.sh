#!/bin/bash
set -e

echo "=== Installing Taskfile CLI ==="

if command -v task &> /dev/null; then
  echo "✓ Task CLI already installed ($(task --version))"
  exit 0
fi

sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

echo "✓ Task CLI installed: $(task --version)"