# Structure Gap Report

## Workspace Inventory (2025-10-19)

### Catalogued Directories

- supabase
- src
- public
- docs
- tooling
- agent-orchestration
- scripts
- monitoring
- archive
- mcp-servers
- modules
- config
- context
- workflow
- backups
- api
- api-tests
- dist
- reports

### To-Be Repo Blueprint (Reference)

- /app/
  - /discovery/
  - /enrichment/
  - /export/
  - /diagnostics/
  - /frontend/
  - /backend/
- /tooling/
  - /scripts/
  - /ci/
  - /docker/
  - /vercel/
  - /monitoring/
  - /supabase/
  - /test-automation/
  - /agent-orchestration/
  - /integration/

### Stray/Legacy Folders (Require Tagging or Migration)

- archive/
- backups/
- api/
- api-tests/
- modules/
- context/
- workflow/
- dist/
- mcp-servers/

### Unindexed Documentation

- docs/deployment/
- docs/development/
- docs/frontend/
- docs/guides/
- docs/integrations/
- docs/maintenance/
- docs/ops/
- docs/release/
- docs/roadmap/
- docs/setup/

### Next Steps

- Tag legacy folders for migration/archive
- Plan phased move of src, public, supabase/functions into /app/
- Update documentation index after migration

- MCP tools and Supabase logs are the standard for validation and observability. All Thunder/Jaeger references are deprecated.
