# ProspectPro Codebase Index

> Primary #codebase reference. Regenerate with `npm run docs:update` before audits or deployments.

_Last generated: 2025-10-29T20:43:19.121Z_

## Supabase Edge Functions

- [app/backend/functions/auth-diagnostics/index.ts](app/backend/functions/auth-diagnostics/index.ts) — Authentication diagnostics and JWT validation helpers
- [app/backend/functions/business-discovery-background/index.ts](app/backend/functions/business-discovery-background/index.ts) — Tier-aware asynchronous discovery pipeline
- [app/backend/functions/business-discovery-optimized/index.ts](app/backend/functions/business-discovery-optimized/index.ts) — Session-aware synchronous discovery workflow
- [app/backend/functions/business-discovery-user-aware/index.ts](app/backend/functions/business-discovery-user-aware/index.ts) — Legacy synchronous discovery maintained for compatibility
- [app/backend/functions/campaign-export/index.ts](app/backend/functions/campaign-export/index.ts) — Internal automation export handler
- [app/backend/functions/campaign-export-user-aware/index.ts](app/backend/functions/campaign-export-user-aware/index.ts) — User-authorised campaign export function
- [app/backend/functions/enrichment-business-license/index.ts](app/backend/functions/enrichment-business-license/index.ts) — Professional licensing enrichment module
- [app/backend/functions/enrichment-cobalt/index.ts](app/backend/functions/enrichment-cobalt/index.ts) — Cobalt SOS enrichment connector
- [app/backend/functions/enrichment-hunter/index.ts](app/backend/functions/enrichment-hunter/index.ts) — Hunter.io discovery and caching wrapper
- [app/backend/functions/enrichment-neverbounce/index.ts](app/backend/functions/enrichment-neverbounce/index.ts) — NeverBounce verification helper
- [app/backend/functions/enrichment-orchestrator/index.ts](app/backend/functions/enrichment-orchestrator/index.ts) — Primary enrichment coordinator orchestrating downstream providers
- [app/backend/functions/enrichment-pdl/index.ts](app/backend/functions/enrichment-pdl/index.ts) — People Data Labs enrichment integration
- [app/backend/functions/example-function/index.ts](app/backend/functions/example-function/index.ts) — Supabase Edge Function module

## Shared Edge Utilities

- [app/backend/functions/_shared/api-usage.ts](app/backend/functions/_shared/api-usage.ts) — Usage logging helper for third-party APIs
- [app/backend/functions/_shared/cache-manager.ts](app/backend/functions/_shared/cache-manager.ts) — Cache utilities for Supabase Edge functions
- [app/backend/functions/_shared/cobalt-cache.ts](app/backend/functions/_shared/cobalt-cache.ts) — Cobalt Intelligence cache controller
- [app/backend/functions/_shared/edge-auth-simplified.ts](app/backend/functions/_shared/edge-auth-simplified.ts) — Simplified session verification helper
- [app/backend/functions/_shared/edge-auth.ts](app/backend/functions/_shared/edge-auth.ts) — Shared Supabase edge authentication
- [app/backend/functions/_shared/highlight-context.ts](app/backend/functions/_shared/highlight-context.ts) — Shared Supabase utility
- [app/backend/functions/_shared/vault-client.ts](app/backend/functions/_shared/vault-client.ts) — Vault client utilities for secret access

## Configuration & Policies

- [docs/technical/CODEBASE_INDEX.md](docs/technical/CODEBASE_INDEX.md) — Auto-generated index consumed by #codebase
- [.github/copilot-instructions.md](.github/copilot-instructions.md) — AI assistant operating instructions
- [.vscode/settings.json](.vscode/settings.json) — Workspace defaults for Supabase and MCP tooling
- [.vscode/prospectpro-supabase.code-workspace](.vscode/prospectpro-supabase.code-workspace) — Task and workspace orchestration
- [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) — Codespace image settings and automation


## Update Procedure

- Run `npm run docs:update` after modifying edge functions, tooling, or security policies.
- Commit the refreshed documentation so chat participants stay aligned.
- Archive prior indexes in `dev-tools/workspace/context/archive/` when performing major restructures.
