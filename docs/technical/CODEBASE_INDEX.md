# ProspectPro Codebase Index

> Primary #codebase reference. Regenerate with `npm run docs:update` before audits or deployments.

_Last generated: 2025-10-21T10:22:16.583Z_

## Edge Function Configuration

- [app/backend/supabase/functions/auth-diagnostics/function.toml](app/backend/supabase/functions/auth-diagnostics/function.toml) — Project file
- [app/backend/supabase/functions/business-discovery-background/function.toml](app/backend/supabase/functions/business-discovery-background/function.toml) — Project file
- [app/backend/supabase/functions/business-discovery-optimized/function.toml](app/backend/supabase/functions/business-discovery-optimized/function.toml) — Project file
- [app/backend/supabase/functions/business-discovery-user-aware/function.toml](app/backend/supabase/functions/business-discovery-user-aware/function.toml) — Project file
- [app/backend/supabase/functions/campaign-export-user-aware/function.toml](app/backend/supabase/functions/campaign-export-user-aware/function.toml) — Project file
- [app/backend/supabase/functions/campaign-export/function.toml](app/backend/supabase/functions/campaign-export/function.toml) — Project file
- [app/backend/supabase/functions/enrichment-business-license/function.toml](app/backend/supabase/functions/enrichment-business-license/function.toml) — Project file
- [app/backend/supabase/functions/enrichment-cobalt/function.toml](app/backend/supabase/functions/enrichment-cobalt/function.toml) — Project file
- [app/backend/supabase/functions/enrichment-hunter/function.toml](app/backend/supabase/functions/enrichment-hunter/function.toml) — Project file
- [app/backend/supabase/functions/enrichment-neverbounce/function.toml](app/backend/supabase/functions/enrichment-neverbounce/function.toml) — Project file
- [app/backend/supabase/functions/enrichment-orchestrator/function.toml](app/backend/supabase/functions/enrichment-orchestrator/function.toml) — Project file
- [app/backend/supabase/functions/enrichment-pdl/function.toml](app/backend/supabase/functions/enrichment-pdl/function.toml) — Project file
- [app/backend/supabase/functions/test-google-places/function.toml](app/backend/supabase/functions/test-google-places/function.toml) — Project file
- [app/backend/supabase/functions/test-new-auth/function.toml](app/backend/supabase/functions/test-new-auth/function.toml) — Project file
- [app/backend/supabase/functions/test-user-deduplication/function.toml](app/backend/supabase/functions/test-user-deduplication/function.toml) — Project file

## Shared Edge Utilities

- [app/backend/supabase/functions/_shared/api-usage.ts](app/backend/supabase/functions/_shared/api-usage.ts) — Project file
- [app/backend/supabase/functions/_shared/cache-manager.ts](app/backend/supabase/functions/_shared/cache-manager.ts) — Project file
- [app/backend/supabase/functions/_shared/cobalt-cache.ts](app/backend/supabase/functions/_shared/cobalt-cache.ts) — Project file
- [app/backend/supabase/functions/_shared/edge-auth-simplified.ts](app/backend/supabase/functions/_shared/edge-auth-simplified.ts) — Project file
- [app/backend/supabase/functions/_shared/edge-auth.ts](app/backend/supabase/functions/_shared/edge-auth.ts) — Project file
- [app/backend/supabase/functions/_shared/vault-client.ts](app/backend/supabase/functions/_shared/vault-client.ts) — Project file

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
