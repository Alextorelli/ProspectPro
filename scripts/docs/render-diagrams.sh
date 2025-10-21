#!/bin/bash
# Diagram SVG rendering is disabled. Use .mmd files and Mermaid Chart extension for previews.
# TODO(automation): When scripts/docs/patch-diagrams.sh lands, invoke it here before exiting to
# normalize configs, enforce guardrails, and regenerate validation checkpoints for all changed
# Mermaid sources. See docs/tooling/diagram-guidelines.md (Automated Diagram Patch Plan).
echo "[INFO] Skipping SVG rendering. .mmd files are the source of truth. Use Mermaid Chart in VS Code for preview."
exit 0
