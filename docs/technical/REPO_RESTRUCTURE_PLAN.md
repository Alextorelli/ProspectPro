# REPO_RESTRUCTURE_PLAN

## Objective

Converge ProspectPro to a hybrid mono-repo structure optimized for AI agent workflows, separating application source code (/app) from dev tooling (/tooling), while preserving Supabase-first, Thunder, and MCP integrations.

## Target Directory Layout

/app/
/discovery/
/enrichment/
/export/
/diagnostics/
/frontend/
/backend/
/tooling/
/scripts/
/ci/
/docker/
/vercel/
/monitoring/
/supabase/
/test-automation/
/agent-orchestration/
/integration/

## Ownership Rules

- /app: Production application code only (frontend, backend, edge functions, business logic)
- /tooling: Dev tools, CI/CD, agent orchestration, monitoring, test automation, integration scripts
- Legacy folders (archive, backups, modules, context, workflow, dist, mcp-servers) to be tagged and migrated/archived
- Documentation to be indexed and updated post-migration

## Migration Steps

1. Tag and plan migration for legacy folders
2. Move src, public, supabase/functions into /app (phased)
3. Relocate dev tooling into /tooling subtrees
4. Update build scripts, npm scripts, VS Code tasks, Thunder collections
5. Regenerate documentation and codebase index
6. Validate agent readiness and zero-fake-data compliance

## Notes

- Supabase-first architecture and RLS policies must remain intact
- Thunder Client and MCP integrations must be updated to new paths
- All changes staged and verified before cutover
