# MECE Diagram Hierarchy & Migration Index

## Overview

This index maps the end-state diagram structure for ProspectPro, supporting the migration and automation plan in [REPO_RESTRUCTURE_PLAN.md](../app/REPO_RESTRUCTURE_PLAN.md).

## Diagram Buckets

- `docs/app/diagrams/`
  - `user-flows/`
  - `state-machines/`
  - `api-flows/`
- `docs/dev-tools/diagrams/`
  - `architecture/`
  - `ci-cd/`
  - `agent-flows/`
  - `erd/`
- `docs/integration/diagrams/`
  - `deployment/`
  - `data-flow/`
  - `security/`
- `docs/shared/mermaid/`
  - `config/`
  - `templates/`
  - `guidelines/`

## Cross-References

- Migration plan: [docs/app/REPO_RESTRUCTURE_PLAN.md](../app/REPO_RESTRUCTURE_PLAN.md)
- Staging/guardrails: [docs/tooling/settings-staging.md](settings-staging.md)
- Diagram standards: [docs/tooling/diagram-guidelines.md](diagram-guidelines.md)

## Inventory & Audit Commands

Run these to generate inventories for migration and validation:

```bash
./scripts/automation/context-snapshot.sh diagrams latest
find docs -name '*.mmd' -print | sort > dev-tools/context/session_store/diagrams-current.txt
git ls-files '*scripts/**' '*docs/**' '*config/**' > dev-tools/context/session_store/live-tooling-list.txt
```

Log outputs in `dev-tools/context/session_store/coverage.md` for provenance and audit trail.
