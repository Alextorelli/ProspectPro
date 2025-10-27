# Agent Context Directory Migration

This directory previously contained per-agent subfolders (development-workflow, observability, production-ops, system-architect) each with a single context.json. As of October 2025, these have been flattened to top-level JSON files in /store/ for efficiency and repo hygiene.

- development-workflow/context.json → /store/development-workflow.json
- observability/context.json → /store/observability.json
- production-ops/context.json → /store/production-ops.json
- system-architect/context.json → /store/system-architect.json

You may safely remove these subfolders after confirming no other files remain.
