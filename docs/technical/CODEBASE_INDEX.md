# ProspectPro Codebase Index

> Primary #codebase reference. Regenerate with `npm run codebase:index` before audits or deployments.

_Last generated: 2025-10-17T22:32:40.822Z_

## Supabase Edge Functions

- [supabase/functions/auth-diagnostics/index.ts](supabase/functions/auth-diagnostics/index.ts) — Supabase Edge Function module
- [supabase/functions/business-discovery-background/index.ts](supabase/functions/business-discovery-background/index.ts) — Primary asynchronous, tier-aware discovery pipeline
- [supabase/functions/business-discovery-optimized/index.ts](supabase/functions/business-discovery-optimized/index.ts) — Session-aware synchronous discovery path for validation campaigns
- [supabase/functions/business-discovery-user-aware/index.ts](supabase/functions/business-discovery-user-aware/index.ts) — Legacy synchronous discovery retained for backward compatibility
- [supabase/functions/campaign-export-user-aware/index.ts](supabase/functions/campaign-export-user-aware/index.ts) — Authenticated campaign export handler
- [supabase/functions/campaign-export/index.ts](supabase/functions/campaign-export/index.ts) — Supabase Edge Function module
- [supabase/functions/enrichment-business-license/index.ts](supabase/functions/enrichment-business-license/index.ts) — Professional licensing enrichment module
- [supabase/functions/enrichment-cobalt/index.ts](supabase/functions/enrichment-cobalt/index.ts) — Supabase Edge Function module
- [supabase/functions/enrichment-hunter/index.ts](supabase/functions/enrichment-hunter/index.ts) — Hunter.io email discovery wrapper with caching
- [supabase/functions/enrichment-neverbounce/index.ts](supabase/functions/enrichment-neverbounce/index.ts) — NeverBounce verification helper
- [supabase/functions/enrichment-orchestrator/index.ts](supabase/functions/enrichment-orchestrator/index.ts) — Central enrichment coordinator calling Hunter, NeverBounce, licensing
- [supabase/functions/enrichment-pdl/index.ts](supabase/functions/enrichment-pdl/index.ts) — PDL enrichment logic for enterprise compliance
- [supabase/functions/test-google-places/index.ts](supabase/functions/test-google-places/index.ts) — Standalone Google Places API test harness
- [supabase/functions/test-new-auth/index.ts](supabase/functions/test-new-auth/index.ts) — Supabase Edge Function module
- [supabase/functions/test-user-deduplication/index.ts](supabase/functions/test-user-deduplication/index.ts) — Supabase Edge Function module

## Edge Function Configuration

- [supabase/functions/auth-diagnostics/function.toml](supabase/functions/auth-diagnostics/function.toml) — Supabase function configuration
- [supabase/functions/business-discovery-background/function.toml](supabase/functions/business-discovery-background/function.toml) — Supabase function configuration
- [supabase/functions/business-discovery-optimized/function.toml](supabase/functions/business-discovery-optimized/function.toml) — Supabase function configuration
- [supabase/functions/business-discovery-user-aware/function.toml](supabase/functions/business-discovery-user-aware/function.toml) — Supabase function configuration
- [supabase/functions/campaign-export-user-aware/function.toml](supabase/functions/campaign-export-user-aware/function.toml) — Supabase function configuration
- [supabase/functions/campaign-export/function.toml](supabase/functions/campaign-export/function.toml) — Supabase function configuration
- [supabase/functions/enrichment-business-license/function.toml](supabase/functions/enrichment-business-license/function.toml) — Supabase function configuration
- [supabase/functions/enrichment-cobalt/function.toml](supabase/functions/enrichment-cobalt/function.toml) — Supabase function configuration
- [supabase/functions/enrichment-hunter/function.toml](supabase/functions/enrichment-hunter/function.toml) — Supabase function configuration
- [supabase/functions/enrichment-neverbounce/function.toml](supabase/functions/enrichment-neverbounce/function.toml) — Supabase function configuration
- [supabase/functions/enrichment-orchestrator/function.toml](supabase/functions/enrichment-orchestrator/function.toml) — Supabase function configuration
- [supabase/functions/enrichment-pdl/function.toml](supabase/functions/enrichment-pdl/function.toml) — Supabase function configuration
- [supabase/functions/test-google-places/function.toml](supabase/functions/test-google-places/function.toml) — Supabase function configuration
- [supabase/functions/test-new-auth/function.toml](supabase/functions/test-new-auth/function.toml) — Supabase function configuration
- [supabase/functions/test-user-deduplication/function.toml](supabase/functions/test-user-deduplication/function.toml) — Supabase function configuration

## Shared Edge Utilities

- [supabase/functions/_shared/api-usage.ts](supabase/functions/_shared/api-usage.ts) — Usage logging helper for third-party API consumption
- [supabase/functions/_shared/cache-manager.ts](supabase/functions/_shared/cache-manager.ts) — Supabase Edge Function module
- [supabase/functions/_shared/cobalt-cache.ts](supabase/functions/_shared/cobalt-cache.ts) — Supabase Edge Function module
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

- [supabase/schema-sql/001_core_schema.sql](supabase/schema-sql/001_core_schema.sql) — Canonical campaigns/leads/exports tables with RLS and analytics view
- [supabase/schema-sql/002_user_functions.sql](supabase/schema-sql/002_user_functions.sql) — User-aware helper functions and security validators
- [supabase/schema-sql/003_deduplication.sql](supabase/schema-sql/003_deduplication.sql) — Deduplication ledger plus hash/filter routines
- [supabase/schema-sql/004_enrichment_cache.sql](supabase/schema-sql/004_enrichment_cache.sql) — Enrichment cache tables, views, and maintenance helpers

## Automation & Scripts

- [scripts/generate-codebase-index.js](scripts/generate-codebase-index.js) — Project maintenance script
- [scripts/campaign-validation.sh](scripts/campaign-validation.sh) — Project maintenance script
- [scripts/deploy-background-tasks.sh](scripts/deploy-background-tasks.sh) — Project maintenance script
- [scripts/start-mcp.sh](scripts/start-mcp.sh) — Project maintenance script
- [scripts/post-session.sh](scripts/post-session.sh) — Project maintenance script
- [scripts/ensure-supabase-cli-session.sh](scripts/ensure-supabase-cli-session.sh) — Project maintenance script
- [scripts/setup-edge-auth-env.sh](scripts/setup-edge-auth-env.sh) — Project maintenance script
- [scripts/stop-mcp.sh](scripts/stop-mcp.sh) — Project maintenance script

## Configuration & Policies

- [docs/technical/CODEBASE_INDEX.md](docs/technical/CODEBASE_INDEX.md) — Auto-generated index consumed by #codebase command
- [.github/copilot-instructions.md](.github/copilot-instructions.md) — AI assistant operating instructions (keep in sync)
- [.vscode/settings.json](.vscode/settings.json) — Workspace defaults for Supabase + Copilot context
- [.vscode/prospectpro-supabase.code-workspace](.vscode/prospectpro-supabase.code-workspace) — Workspace file bundling tasks and recommendations
- [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) — Codespace image settings + post-create automation
- [.vscode/mcp-config.json](.vscode/mcp-config.json) — VS Code MCP wiring

## Update Procedure

1. Run `npm run codebase:index` after modifying edge functions, frontend workflow, or security policies.
2. Commit the refreshed `docs/technical/CODEBASE_INDEX.md` alongside your changes so #codebase stays current.
3. Legacy documentation referencing the codebase is archived—treat this file as the single source of truth.
