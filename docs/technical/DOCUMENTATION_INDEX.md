# ProspectPro v4.4 Documentation Index

**🚀 Tier-Aware Background Discovery & Verification Platform**

---

## 📋 Documentation Overview

ProspectPro v4.4 adds user-aware campaign deduplication and billing-ready analytics while maintaining the tier-aware background discovery pipeline. This index points to the live references backing the production system.

---

## 🏗️ Core Architecture

- **[Copilot Instructions](../.github/copilot-instructions.md)** – Authoritative production guide (deployment, troubleshooting, SLAs)
- **[README](../README.md)** – Platform overview and quickstart
- **[ARCHITECTURE_DECISION_BACKGROUND_TASKS.md](archived/ARCHITECTURE_DECISION_BACKGROUND_TASKS.md)** – Rationale for asynchronous discovery orchestration
- **[BACKGROUND_TASKS_IMPLEMENTATION.md](../development/archived/BACKGROUND_TASKS_IMPLEMENTATION.md)** – Implementation notes for `business-discovery-background`
- **[PRODUCTION_READY_V4.4.md](../deployment/PRODUCTION_READY_V4.4.md)** – Release summary for the user-aware deduplication launch

---

## 🖥️ Frontend Implementation

- **Entry Point:** `index.html`
- **Application Code:** `src/` (React + Vite)
  - `src/pages/BusinessDiscovery.tsx` – Campaign creation & monitoring
  - `src/pages/Dashboard.tsx` – Lead review with verified enrichment metadata
  - `src/hooks/useLeadEnrichment.ts` – Tier-aware enrichment hooks
- **Build Command:** `npm run build` (outputs to `/dist` for Vercel deploy)

---

## ☁️ Supabase Edge Functions

### Active Production Functions (v4.4)

- Discovery: `business-discovery-background` (primary), `business-discovery-optimized`, `business-discovery-user-aware`.
- Enrichment: `enrichment-hunter`, `enrichment-neverbounce`, `enrichment-orchestrator`, `enrichment-business-license`, `enrichment-pdl`.
- Export: `campaign-export-user-aware`, `campaign-export` (service-role only).
- Diagnostics: `test-new-auth`, `test-official-auth`, `test-business-discovery`, `test-google-places`, `test-user-deduplication`.

> ℹ️ Session JWTs are mandatory for every authenticated Edge Function call. Use [`EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md`](../setup/archived/EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md) plus `scripts/test-auth-patterns.sh` to validate flows.

### Key Sources

- Edge function implementations: `/supabase/functions/`
- Shared auth utilities: `/supabase/functions/_shared/`
- Deployment command: `supabase functions deploy <function-name>`

---

## 🗄️ Database & Security

- **Schema Files:** `/database/`
  - `production/001_core_schema.sql` – Canonical schema with RLS + analytics view
  - `production/002_user_functions.sql` – User-aware helper functions and security validators
  - `production/003_deduplication.sql` – Dedup ledger, hash helpers, usage analytics
  - `production/004_enrichment_cache.sql` – Enrichment cache storage + reporting
  - `rls-setup.sql` – Legacy RLS helper (kept for historical reference)
- **Core Tables:** `campaigns`, `leads`, `dashboard_exports`
- **Security Model:** JWT-authenticated access with user_id + session_user_id; anonymous fallback removed from production

---

## 🔐 Authentication & Session Handling

- Supabase Auth with JWT tokens (
  - Frontend enforces sign-in before campaign creation
  - Session context passed through background discovery payloads
- Shared auth utilities: `/supabase/functions/_shared/edge-auth.ts`
- Refer to `AUTHENTICATION_COMPLETE.md` for the end-to-end auth hardening log

---

## 🧪 Testing & Validation

- **Unit / Integration:** `npm run test`
- **ESLint:** `npm run lint` (configured via `.eslintrc.cjs` & `.eslintignore`)
- **Edge Function Smoke Tests:**
  - `supabase functions serve business-discovery-background`
  - `supabase functions serve test-user-deduplication`
  - `scripts/test-background-tasks.sh`
- **Manual curl probes:** see `.github/copilot-instructions.md` → “Debugging Commands”

---

## 🚀 Deployment Workflow

- Install dependencies: `npm install`.
- Confirm repo context: `git rev-parse --show-toplevel` must resolve to `/workspaces/ProspectPro` before running any deploy commands.
- Sync environment variables locally: `vercel env pull .env.vercel` to refresh `sb_publishable_*` keys for scripts.
- Deploy functions: `supabase functions deploy <name>` for every active slug listed above.
- Build frontend: `npm run build` (outputs `/dist`).
- Ship frontend: from `/dist` run `vercel --prod`.
- Verify: curl the production URL, tail Supabase logs, confirm campaigns + leads populate in Supabase tables.

---

## 🌐 Production Environment Snapshot

- **Frontend:** https://prospect-fyhedobh1-appsmithery.vercel.app (Vercel static hosting)
- **Supabase Project:** `sriycekxdqnesdsgwiuc`
- **Edge Function URL Base:** `https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/`
- **Publishable Key Management:** Supabase dashboard → Settings → API (sync with `/src/lib/supabase.ts`)
- **Session Tokens:** Frontend/services must forward Supabase session JWTs (`Authorization: Bearer <token>`) per `EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md`

---

## 📈 Business Intelligence Features

- MECE taxonomy (`src/constants/businessTaxonomy.ts`) with 16 categories / 300+ business types
- Verified contact enrichment via Hunter.io + NeverBounce + licensing data
- Tier-aware budgets & scoring: see `supabase/functions/enrichment-orchestrator/`
- Export metadata retained in `leads.enrichment_data` JSONB field

---

## 🛠️ Troubleshooting Quicklinks

- Publishable key or session mismatch: [`EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md`](../setup/archived/EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md), [`NEED_ANON_KEY.md`](../setup/archived/NEED_ANON_KEY.md) (historical reference only).
- Blank screen after campaign results: redeploy the v4.3.1 build, confirm React console warnings are cleared.
- Edge function auth issues: `EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md`, review Supabase dashboard → Edge Functions → `<name>` → Logs.
- Dedup validation or ledger anomalies: [`PRODUCTION_READY_V4.4.md`](../deployment/PRODUCTION_READY_V4.4.md) (deployment + validation checklist).
- Deployment checklist: [`DEPLOYMENT_CHECKLIST.md`](../deployment/archived/DEPLOYMENT_CHECKLIST.md).
- Environment sync: `vercel env pull .env.vercel`, `scripts/populate-secrets.sh`, `scripts/pull-env-from-secrets.js`.
- MCP troubleshooting server: `mcp-servers/` (see local README).

---

## 🎯 Quick Command Reference

```bash
# Background discovery smoke test (session JWT required)
curl -X POST \
  'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background' \
  -H 'Authorization: Bearer <SUPABASE_SESSION_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"businessType":"coffee shop","location":"Seattle, WA","maxResults":2,"tierKey":"PROFESSIONAL","sessionUserId":"test_session_123"}'

# Deduplication ledger validation
curl -X POST \
  'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-user-deduplication' \
  -H 'Authorization: Bearer <SUPABASE_SESSION_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"action":"test_deduplication","sessionUserId":"cli-smoke","businesses":[{"name":"Coffee Collective","address":"123 Brew St, Seattle, WA"}]}'

# Export campaign results
curl -X POST \
  'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/campaign-export-user-aware' \
  -H 'Authorization: Bearer <SUPABASE_SESSION_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"campaignId":"<CAMPAIGN_ID>","format":"csv","sessionUserId":"test_session_123"}'

# Auth diagnostics (compare helper vs official pattern)
./scripts/test-auth-patterns.sh <SUPABASE_SESSION_JWT>

# Lint & build guard rails
npm run lint
npm run build
```

---

## 🗓️ Release Timeline

- **v4.4** – User-aware deduplication, campaign hashing, billing-ready analytics
- **v4.3** – Tier-aware background discovery, lint tooling alignment, legacy asset removal (current baseline)
- **v4.2** – Authenticated user-aware discovery with session JWT enforcement
- **v4.1** – Verification-first enrichment pipeline

For historical artifacts see `docs/archive/` and subdirectory archives.

### Key URLs

- **Production App:** https://prospect-fyhedobh1-appsmithery.vercel.app
- **Supabase Dashboard:** https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc
- **GitHub Repository:** https://github.com/Alextorelli/ProspectPro

---

**ProspectPro v4.4** – User-Aware Deduplication & Billing Analytics  
_Documentation updated October 13, 2025_ 🚀
