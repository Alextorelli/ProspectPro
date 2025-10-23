# ProspectPro Codebase Index

> Primary #codebase reference. Regenerate with `npm run docs:update` before audits or deployments.

_Last generated: 2025-10-23T20:39:39.362Z_

## Supabase Edge Functions

- [app/backend/functions/auth-diagnostics/index.ts](app/backend/functions/auth-diagnostics/index.ts) — Supabase Edge Function module
- [app/backend/functions/business-discovery-background/index.ts](app/backend/functions/business-discovery-background/index.ts) — Primary asynchronous, tier-aware discovery pipeline
- [app/backend/functions/business-discovery-optimized/index.ts](app/backend/functions/business-discovery-optimized/index.ts) — Session-aware synchronous discovery path for validation campaigns
- [app/backend/functions/business-discovery-user-aware/index.ts](app/backend/functions/business-discovery-user-aware/index.ts) — Legacy synchronous discovery retained for backward compatibility
- [app/backend/functions/campaign-export-user-aware/index.ts](app/backend/functions/campaign-export-user-aware/index.ts) — Authenticated campaign export handler
- [app/backend/functions/campaign-export/index.ts](app/backend/functions/campaign-export/index.ts) — Supabase Edge Function module
- [app/backend/functions/enrichment-business-license/index.ts](app/backend/functions/enrichment-business-license/index.ts) — Professional licensing enrichment module
- [app/backend/functions/enrichment-cobalt/index.ts](app/backend/functions/enrichment-cobalt/index.ts) — Supabase Edge Function module
- [app/backend/functions/enrichment-hunter/index.ts](app/backend/functions/enrichment-hunter/index.ts) — Hunter.io email discovery wrapper with caching
- [app/backend/functions/enrichment-neverbounce/index.ts](app/backend/functions/enrichment-neverbounce/index.ts) — NeverBounce verification helper
- [app/backend/functions/enrichment-orchestrator/index.ts](app/backend/functions/enrichment-orchestrator/index.ts) — Central enrichment coordinator calling Hunter, NeverBounce, licensing
- [app/backend/functions/enrichment-pdl/index.ts](app/backend/functions/enrichment-pdl/index.ts) — PDL enrichment logic for enterprise compliance

## Shared Edge Utilities

- [app/backend/functions/_shared/api-usage.ts](app/backend/functions/_shared/api-usage.ts) — Usage logging helper for third-party API consumption
- [app/backend/functions/_shared/cache-manager.ts](app/backend/functions/_shared/cache-manager.ts) — Supabase Edge Function module
- [app/backend/functions/_shared/cobalt-cache.ts](app/backend/functions/_shared/cobalt-cache.ts) — Supabase Edge Function module
- [app/backend/functions/_shared/edge-auth-simplified.ts](app/backend/functions/_shared/edge-auth-simplified.ts) — Supabase Edge Function module
- [app/backend/functions/_shared/edge-auth.ts](app/backend/functions/_shared/edge-auth.ts) — Shared Supabase session validator for edge functions
- [app/backend/functions/_shared/vault-client.ts](app/backend/functions/_shared/vault-client.ts) — Supabase Edge Function module

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
