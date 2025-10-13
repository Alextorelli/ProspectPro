# ProspectPro Codebase Index

> Primary #codebase reference. Regenerate with `npm run codebase:index` before audits or deployments.

_Last generated: 2025-10-13T03:59:29.084Z_

## Supabase Edge Functions

- [supabase/functions/business-discovery-background/index.ts](supabase/functions/business-discovery-background/index.ts) — Primary asynchronous, tier-aware discovery pipeline
- [supabase/functions/business-discovery-optimized/index.ts](supabase/functions/business-discovery-optimized/index.ts) — Session-aware synchronous discovery path for validation campaigns
- [supabase/functions/business-discovery-user-aware/index.ts](supabase/functions/business-discovery-user-aware/index.ts) — Legacy synchronous discovery retained for backward compatibility
- [supabase/functions/campaign-export-user-aware/index.ts](supabase/functions/campaign-export-user-aware/index.ts) — Authenticated campaign export handler
- [supabase/functions/enrichment-hunter/index.ts](supabase/functions/enrichment-hunter/index.ts) — Hunter.io email discovery wrapper with caching
- [supabase/functions/enrichment-neverbounce/index.ts](supabase/functions/enrichment-neverbounce/index.ts) — NeverBounce verification helper
- [supabase/functions/enrichment-orchestrator/index.ts](supabase/functions/enrichment-orchestrator/index.ts) — Central enrichment coordinator calling Hunter, NeverBounce, licensing
- [supabase/functions/test-business-discovery/index.ts](supabase/functions/test-business-discovery/index.ts) — Smoke test harness for discovery endpoints
- [supabase/functions/test-google-places/index.ts](supabase/functions/test-google-places/index.ts) — Standalone Google Places API test harness
- [supabase/functions/test-new-auth/index.ts](supabase/functions/test-new-auth/index.ts) — Auth diagnostics using shared helper
- [supabase/functions/test-official-auth/index.ts](supabase/functions/test-official-auth/index.ts) — Supabase reference auth implementation mirror

## Shared Edge Utilities

- [supabase/functions/_shared/api-usage.ts](supabase/functions/_shared/api-usage.ts) — Usage logging helper for third-party API consumption
- [supabase/functions/_shared/edge-auth-simplified.ts](supabase/functions/_shared/edge-auth-simplified.ts) — Supabase Edge Function module
- [supabase/functions/_shared/edge-auth.ts](supabase/functions/_shared/edge-auth.ts) — Shared Supabase session validator for edge functions
- [supabase/functions/_shared/vault-client.ts](supabase/functions/_shared/vault-client.ts) — Supabase Edge Function module

## Frontend Core

- [src/App.tsx](src/App.tsx) — React frontend module
- [src/main.tsx](src/main.tsx) — React frontend module
- [src/hooks/useBusinessDiscovery.ts](src/hooks/useBusinessDiscovery.ts) — Primary frontend hook orchestrating discovery workflow
- [src/hooks/useJobProgress.tsx](src/hooks/useJobProgress.tsx) — Hook tracking asynchronous discovery job progress
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) — React context handling Supabase auth state transitions
- [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) — Dashboard page retrieving campaigns and showing status
- [src/pages/BusinessDiscovery.tsx](src/pages/BusinessDiscovery.tsx) — Campaign launch UI orchestrating discovery workflow
- [src/lib/supabase.ts](src/lib/supabase.ts) — Frontend Supabase client + authenticated function invocation helper
- [src/components/GeographicSelector.tsx](src/components/GeographicSelector.tsx) — Location selector used in campaign creation
- [src/stores/campaignStore.ts](src/stores/campaignStore.ts) — React frontend module

## Static Entry Points

- [index.html](index.html) — Project file

## Database & Security Artifacts

- [database/production/001_core_schema.sql](database/production/001_core_schema.sql) — Canonical campaigns/leads/exports tables with RLS and analytics view
- [database/production/002_user_functions.sql](database/production/002_user_functions.sql) — User-aware helper functions and security validators
- [database/production/003_deduplication.sql](database/production/003_deduplication.sql) — Deduplication ledger plus hash/filter routines
- [database/production/004_enrichment_cache.sql](database/production/004_enrichment_cache.sql) — Enrichment cache tables, views, and maintenance helpers
- [database/rls-setup.sql](database/rls-setup.sql) — Row Level Security policies enforcing user/session isolation
- [database/remove-security-definer.sql](database/remove-security-definer.sql) — Utility script to strip SECURITY DEFINER functions

## Automation & Scripts

- [scripts/generate-codebase-index.js](scripts/generate-codebase-index.js) — Project maintenance script
- [scripts/campaign-validation.sh](scripts/campaign-validation.sh) — Project maintenance script
- [scripts/deploy-background-tasks.sh](scripts/deploy-background-tasks.sh) — Project maintenance script
- [scripts/start-mcp.sh](scripts/start-mcp.sh) — Project maintenance script
- [scripts/post-session.sh](scripts/post-session.sh) — Project maintenance script

## Configuration & Policies

- [CODEBASE_INDEX.md](CODEBASE_INDEX.md) — Auto-generated index consumed by #codebase command
- [.github/copilot-instructions.md](.github/copilot-instructions.md) — AI assistant operating instructions (keep in sync)
- [.vscode/settings.json](.vscode/settings.json) — Workspace defaults for Supabase + Copilot context
- [.vscode/prospectpro-supabase.code-workspace](.vscode/prospectpro-supabase.code-workspace) — Workspace file bundling tasks and recommendations
- [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) — Codespace image settings + post-create automation
- [mcp-config.json](mcp-config.json) — Global MCP server configuration
- [.vscode/mcp-config.json](.vscode/mcp-config.json) — VS Code MCP wiring

## Update Procedure

1. Run `npm run codebase:index` after modifying edge functions, frontend workflow, or security policies.
2. Commit the refreshed `CODEBASE_INDEX.md` alongside your changes so #codebase stays current.
3. Legacy documentation referencing the codebase is archived—treat this file as the single source of truth.
