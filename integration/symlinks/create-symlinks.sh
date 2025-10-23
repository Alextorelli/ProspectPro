#!/usr/bin/env bash
# Create all required symlinks for integration-aware wiring
set -euo pipefail

ln -sf app/backend supabase
# Add additional symlinks as needed
