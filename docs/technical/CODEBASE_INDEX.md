# ProspectPro Codebase Index

> Primary #codebase reference. Regenerate with `npm run docs:update` before audits or deployments.

_Last generated: 2025-10-20T02:36:10.885Z_

## Supabase Edge Functions

- [app/backend/supabase/functions/auth-diagnostics/index.ts](app/backend/supabase/functions/auth-diagnostics/index.ts) — Supabase Edge Function module
- [app/backend/supabase/functions/business-discovery-background/index.ts](app/backend/supabase/functions/business-discovery-background/index.ts) — Primary asynchronous, tier-aware discovery pipeline
- [app/backend/supabase/functions/business-discovery-optimized/index.ts](app/backend/supabase/functions/business-discovery-optimized/index.ts) — Session-aware synchronous discovery path for validation campaigns
- [app/backend/supabase/functions/business-discovery-user-aware/index.ts](app/backend/supabase/functions/business-discovery-user-aware/index.ts) — Legacy synchronous discovery retained for backward compatibility
- [app/backend/supabase/functions/campaign-export-user-aware/index.ts](app/backend/supabase/functions/campaign-export-user-aware/index.ts) — Authenticated campaign export handler
- [app/backend/supabase/functions/campaign-export/index.ts](app/backend/supabase/functions/campaign-export/index.ts) — Supabase Edge Function module
- [app/backend/supabase/functions/enrichment-business-license/index.ts](app/backend/supabase/functions/enrichment-business-license/index.ts) — Professional licensing enrichment module
- [app/backend/supabase/functions/enrichment-cobalt/index.ts](app/backend/supabase/functions/enrichment-cobalt/index.ts) — Supabase Edge Function module
- [app/backend/supabase/functions/enrichment-hunter/index.ts](app/backend/supabase/functions/enrichment-hunter/index.ts) — Hunter.io email discovery wrapper with caching
- [app/backend/supabase/functions/enrichment-neverbounce/index.ts](app/backend/supabase/functions/enrichment-neverbounce/index.ts) — NeverBounce verification helper
- [app/backend/supabase/functions/enrichment-orchestrator/index.ts](app/backend/supabase/functions/enrichment-orchestrator/index.ts) — Central enrichment coordinator calling Hunter, NeverBounce, licensing
- [app/backend/supabase/functions/enrichment-pdl/index.ts](app/backend/supabase/functions/enrichment-pdl/index.ts) — PDL enrichment logic for enterprise compliance
- [app/backend/supabase/functions/test-google-places/index.ts](app/backend/supabase/functions/test-google-places/index.ts) — Standalone Google Places API test harness
- [app/backend/supabase/functions/test-new-auth/index.ts](app/backend/supabase/functions/test-new-auth/index.ts) — Supabase Edge Function module
- [app/backend/supabase/functions/test-user-deduplication/index.ts](app/backend/supabase/functions/test-user-deduplication/index.ts) — Supabase Edge Function module

## Edge Function Configuration

- [app/backend/supabase/functions/auth-diagnostics/function.toml](app/backend/supabase/functions/auth-diagnostics/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/business-discovery-background/function.toml](app/backend/supabase/functions/business-discovery-background/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/business-discovery-optimized/function.toml](app/backend/supabase/functions/business-discovery-optimized/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/business-discovery-user-aware/function.toml](app/backend/supabase/functions/business-discovery-user-aware/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/campaign-export-user-aware/function.toml](app/backend/supabase/functions/campaign-export-user-aware/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/campaign-export/function.toml](app/backend/supabase/functions/campaign-export/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/enrichment-business-license/function.toml](app/backend/supabase/functions/enrichment-business-license/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/enrichment-cobalt/function.toml](app/backend/supabase/functions/enrichment-cobalt/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/enrichment-hunter/function.toml](app/backend/supabase/functions/enrichment-hunter/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/enrichment-neverbounce/function.toml](app/backend/supabase/functions/enrichment-neverbounce/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/enrichment-orchestrator/function.toml](app/backend/supabase/functions/enrichment-orchestrator/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/enrichment-pdl/function.toml](app/backend/supabase/functions/enrichment-pdl/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/test-google-places/function.toml](app/backend/supabase/functions/test-google-places/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/test-new-auth/function.toml](app/backend/supabase/functions/test-new-auth/function.toml) — Supabase function configuration
- [app/backend/supabase/functions/test-user-deduplication/function.toml](app/backend/supabase/functions/test-user-deduplication/function.toml) — Supabase function configuration

## Shared Edge Utilities

- [app/backend/supabase/functions/_shared/api-usage.ts](app/backend/supabase/functions/_shared/api-usage.ts) — Usage logging helper for third-party API consumption
- [app/backend/supabase/functions/_shared/cache-manager.ts](app/backend/supabase/functions/_shared/cache-manager.ts) — Supabase Edge Function module
- [app/backend/supabase/functions/_shared/cobalt-cache.ts](app/backend/supabase/functions/_shared/cobalt-cache.ts) — Supabase Edge Function module
- [app/backend/supabase/functions/_shared/edge-auth-simplified.ts](app/backend/supabase/functions/_shared/edge-auth-simplified.ts) — Supabase Edge Function module
- [app/backend/supabase/functions/_shared/edge-auth.ts](app/backend/supabase/functions/_shared/edge-auth.ts) — Shared Supabase session validator for edge functions
- [app/backend/supabase/functions/_shared/vault-client.ts](app/backend/supabase/functions/_shared/vault-client.ts) — Supabase Edge Function module

## Database & Security Artifacts

- [supabase/schema-sql/001_core_schema.sql](supabase/schema-sql/001_core_schema.sql) — Canonical campaigns/leads/exports tables with RLS and analytics view
- [supabase/schema-sql/002_user_functions.sql](supabase/schema-sql/002_user_functions.sql) — User-aware helper functions and security validators
- [supabase/schema-sql/003_deduplication.sql](supabase/schema-sql/003_deduplication.sql) — Deduplication ledger plus hash/filter routines
- [supabase/schema-sql/004_enrichment_cache.sql](supabase/schema-sql/004_enrichment_cache.sql) — Enrichment cache tables, views, and maintenance helpers

## Configuration & Policies

- [docs/technical/CODEBASE_INDEX.md](docs/technical/CODEBASE_INDEX.md) — Auto-generated index consumed by #codebase command
- [.github/copilot-instructions.md](.github/copilot-instructions.md) — AI assistant operating instructions (keep in sync)
- [.vscode/settings.json](.vscode/settings.json) — Workspace defaults for Supabase + Copilot context
- [.vscode/prospectpro-supabase.code-workspace](.vscode/prospectpro-supabase.code-workspace) — Workspace file bundling tasks and recommendations
- [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) — Codespace image settings + post-create automation

## Update Procedure

1. Run `npm run docs:update` after modifying edge functions, frontend workflow, or security policies.
2. Commit the refreshed `docs/technical/CODEBASE_INDEX.md` alongside your changes so #codebase stays current.
3. Legacy documentation referencing the codebase is archived—treat this file as the single source of truth.
