# Legacy Agent Context Directory

This directory previously contained per-agent subfolders (development-workflow, observability, production-ops, system-architect) each with a single context.json. As of October 2025, these have been flattened to top-level JSON files in /store/ for efficiency and repo hygiene.

- development-workflow/context.json → ../development-workflow.json
- observability/context.json → ../observability.json
- production-ops/context.json → ../production-ops.json
- system-architect/context.json → ../system-architect.json

You may safely remove these subfolders after confirming no other files remain.
