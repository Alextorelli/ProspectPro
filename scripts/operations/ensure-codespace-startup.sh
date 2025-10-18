#!/bin/bash
# Codespace startup operations — enforce ignore hygiene
node /workspaces/ProspectPro/scripts/tooling/validate-ignore-config.cjs || exit 1
# Add other codespace startup checks below
