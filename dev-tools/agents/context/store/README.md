# Agent Context Store (Flat Layout)

As of October 2025, agent context files are stored as flat JSON in this directory:

- development-workflow.json
- observability.json
- production-ops.json
- system-architect.json

Environment contexts now live in `shared/environments/`.

Legacy per-agent folders under `agents/` are deprecated and will be removed after migration.
