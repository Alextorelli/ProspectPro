# Supabase Edge Functions

This document explains how ProspectPro uses Supabase Edge Functions for backend logic as part of the Lovable + Supabase migration.

## Overview

- Runtime: Deno on Supabase Edge Functions
- Location: `supabase/functions/*`
- Shared utilities: `supabase/functions/_shared/*`
- Primary discovery pipelines:
  - `business-discovery-background` (tier-aware, asynchronous, **production default**)
  - `business-discovery-optimized` (session-aware synchronous validation)
  - `business-discovery-user-aware` (legacy fallback invoked automatically when background flow returns 4xx auth errors)

The background path is now authoritative for campaign creation and enrichment. Keep documentation, MCP tools, and Copilot instructions aligned with this workflow.

## Authentication Workflow

All discovery functions rely on the shared `authenticateRequest` helper (`supabase/functions/_shared/edge-auth.ts`). The helper:

1. Extracts the caller's `Authorization: Bearer <session JWT>` header.
2. Resolves environment variables in the following order:
   - `SUPABASE_URL` ← fallbacks to `EDGE_SUPABASE_URL`
   - `EDGE_SUPABASE_ANON_KEY` ← fallbacks to `EDGE_ANON_KEY` and `SUPABASE_ANON_KEY`
   - `EDGE_SUPABASE_SERVICE_ROLE_KEY` ← fallbacks to `EDGE_SERVICE_ROLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY`
3. Validates the session with `supabaseClient.auth.getUser()`; on failure it escalates to `auth.admin.getUserById()` using the service-role client.
4. Returns `AuthenticatedRequestContext` containing:
   - `supabaseUrl`
   - `supabaseServiceRoleKey` (never echoed back to caller)
   - User identity, anonymous flag, and session id

### Using the service-role key

Edge Functions that need privileged database writes (e.g. `business-discovery-background`) **must create a separate Supabase client with the service-role key**. Do not attach the caller's JWT as a global header on that admin client. Instead, pass user context to RPCs and inserts via explicit parameters/columns. Example pattern:

```ts
const { supabaseUrl, supabaseServiceRoleKey, user } = authContext;
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

await adminClient.rpc("generate_campaign_name", {
  business_type: businessType,
  location,
  user_id: user?.id ?? null,
});
```

### Session requirements

- Calls must include a **Supabase session token**, not an anon key. Frontend helpers already refresh tokens before invoking the background function.
- If the session is missing or expired, the function returns `401` with `Auth failure` messaging. The React client automatically retries and, after repeated 401s, falls back to `business-discovery-user-aware` to avoid user-visible degradation.
- When investigating campaign anomalies, confirm the background job actually executed (table `discovery_jobs`) and that the frontend did not pivot to the legacy route.

## Local Development

- CLI serve (recommended):
  - `supabase functions serve diag`
  - `supabase functions serve business-discovery`
- Direct Deno run (quick lint/smoke):
  - `deno task run:diag`
  - `deno task run:discovery`

## Invoking from Frontend

Use the Supabase JS client:

```ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data, error } = await supabase.functions.invoke("business-discovery", {
  body: { query: "roofing contractors", location: "San Diego" },
});
```

## Environment Variables

Configure in Supabase project settings:

- `GOOGLE_PLACES_API_KEY`
- `HUNTER_IO_API_KEY`
- `NEVERBOUNCE_API_KEY`
- `SCRAPINGDOG_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` / `EDGE_SUPABASE_SERVICE_ROLE_KEY` (only accessible to privileged service contexts; never expose to client)
- `EDGE_SUPABASE_ANON_KEY`
- `EDGE_SUPABASE_URL`

## Zero Fake Data Policy

- Edge Functions must never generate or return fabricated business data.
- If an external API fails, return an error and stop; do not fallback to mock content.

## Deployment

- Login and link: `supabase login`; `supabase link --project-ref <project-ref>`
- Deploy function(s): `supabase functions deploy <name>`
- For production parity, redeploy `business-discovery-background` whenever `_shared/edge-auth.ts` changes (the CLI auto-detects and uploads shared modules referenced by the function).

## Testing

- Invoke from CLI: `supabase functions invoke diag --no-verify-jwt --body '{"ping":true}'`
- Add integration tests under `tests/integration/` for function contracts and validation logic.
- For auth flows, use a real session token generated via `supabase.auth.signInWithPassword` (anon keys are rejected by `authenticateRequest`).

## Legacy Fallback Strategy

- `business-discovery-user-aware` remains deployed to preserve continuity for anonymous users or degraded sessions.
- The frontend logs `⚠️ Falling back to legacy user-aware discovery` when it triggers this path; capture that breadcrumb when debugging campaign discrepancies.
- Future clean-up: once background auth is stable across all tiers, remove the fallback from the UI and retire the legacy function after announcing to stakeholders.
