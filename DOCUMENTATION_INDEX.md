# ProspectPro v4.3 Documentation Index

**🚀 Tier-Aware Background Discovery & Verification Platform**

---

## 📋 Documentation Overview

ProspectPro v4.3 introduces the tier-aware background discovery pipeline with zero-fake-data enforcement. This index points to the live references that back the production system.

---

## 🏗️ Core Architecture

- **[Copilot Instructions](.github/copilot-instructions.md)** – Authoritative production guide (deployment, troubleshooting, SLAs)
- **[README](README.md)** – Platform overview and quickstart
- **[ARCHITECTURE_DECISION_BACKGROUND_TASKS.md](ARCHITECTURE_DECISION_BACKGROUND_TASKS.md)** – Rationale for asynchronous discovery orchestration
- **[BACKGROUND_TASKS_IMPLEMENTATION.md](BACKGROUND_TASKS_IMPLEMENTATION.md)** – Implementation notes for `business-discovery-background`

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

### Active Production Functions (v4.3)

- **Discovery**
  1. `business-discovery-background` – Asynchronous discovery with tier controls _(primary path)_
  2. `business-discovery-optimized` – Session-aware synchronous path for premium campaign validation
  3. `business-discovery-user-aware` – Legacy synchronous endpoint maintained for historical clients
- **Enrichment + Coordination** 4. `enrichment-hunter` – Hunter.io discovery with confidence scoring & caching 5. `enrichment-neverbounce` – NeverBounce verification (95% deliverability floor) 6. `enrichment-orchestrator` – Multi-service enrichment coordination & budgeting 7. `enrichment-business-license` / `enrichment-pdl` – Licensing + PDL enrichment modules (Enterprise/Compliance)
- **Export** 8. `campaign-export-user-aware` – User-authorized CSV export with RLS isolation 9. `campaign-export` – Service-role export handler for internal automation
- **Diagnostics** 10. `test-new-auth` – Supabase session diagnostics for the shared helper 11. `test-official-auth` – Mirrors Supabase reference implementation end-to-end 12. `test-business-discovery` – Session-scoped discovery smoke test 13. `test-google-places` – API verification harness

> ℹ️ Session JWTs are mandatory for every authenticated Edge Function call. Refer to `EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md` and `scripts/test-auth-patterns.sh` for validation workflows.

### Key Sources

- Edge function implementations: `/supabase/functions/`
- Shared auth utilities: `/supabase/functions/_shared/`
- Deployment command: `supabase functions deploy <function-name>`

---

## 🗄️ Database & Security

- **Schema Files:** `/database/`
  - `supabase-first-schema.sql` – Canonical schema
  - `rls-setup.sql` – Row Level Security enforcement
  - `user-campaign-production-update.sql` – Authenticated ownership columns
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
  - `scripts/test-background-tasks.sh`
- **Manual curl probes:** see `.github/copilot-instructions.md` → “Debugging Commands”

---

## 🚀 Deployment Workflow

1. Install dependencies: `npm install`
2. Build frontend: `npm run build`
3. Deploy static assets: from `/dist` run `vercel --prod`
4. Deploy edge functions: `supabase functions deploy <name>`
5. Verify using curl or the Supabase dashboard logs

Supporting scripts:

- `scripts/deploy-background-tasks.sh` – Batch deploy of background discovery stack
- `scripts/test-background-tasks.sh` – Validates discovery + export loop
- `scripts/repository-cleanup.sh` – Ensures Supabase-first project hygiene

---

## 🌐 Production Environment Snapshot

- **Frontend:** https://prospect-fyhedobh1-appsmithery.vercel.app (Vercel static hosting)
- **Supabase Project:** `sriycekxdqnesdsgwiuc`
- **Edge Function URL Base:** `https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/`
- **Publishable Key Management:** Supabase dashboard → Settings → API (sync with `/src/lib/supabase.ts`)
- **Session Tokens:** Frontend/services must forward `Authorization: Bearer <SUPABASE_SESSION_JWT>`
- **Session Tokens:** Frontend + services must forward Supabase session JWTs (`Authorization: Bearer <token>`) per `EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md`

---

## 📈 Business Intelligence Features

- MECE taxonomy (`src/constants/businessTaxonomy.ts`) with 16 categories / 300+ business types
- Verified contact enrichment via Hunter.io + NeverBounce + licensing data
- Tier-aware budgets & scoring: see `supabase/functions/enrichment-orchestrator/`
- Export metadata retained in `leads.enrichment_data` JSONB field

---

## 🛠️ Troubleshooting Quicklinks

- **Publishable key or session mismatch:** See `NEED_ANON_KEY.md` (legacy) and `EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md`
- **Blank screen after campaign results:** Deploy the v4.3.1 build so the null-safe campaign store is active, then confirm the browser console is free of React 185 stacks.
- **Edge function auth issues:** `EDGE_FUNCTION_AUTH_UPDATE_GUIDE.md`
- **Deployment checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Environment sync:** `populate-secrets.sh`, `pull-env-from-secrets.js`
- **MCP troubleshooting server:** `mcp-servers/` directory (see `README` inside)

---

## 🎯 Quick Command Reference

```bash
# Background discovery smoke test (session JWT required)
curl -X POST \
  'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background' \
  -H 'Authorization: Bearer <SUPABASE_SESSION_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"businessType":"coffee shop","location":"Seattle, WA","maxResults":2,"tierKey":"PROFESSIONAL","sessionUserId":"test_session_123"}'

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

- **v4.1** – Verification-first enrichment pipeline
- **v4.2** – Authenticated user-aware discovery (deprecated backend retained only for exports)
- **v4.3** – Tier-aware background discovery, lint tooling alignment, legacy asset removal

For historical artifacts see `/archive/`.

### Key URLs

- **Production App:** https://prospect-fyhedobh1-appsmithery.vercel.app
- **Supabase Dashboard:** https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc
- **GitHub Repository:** https://github.com/Alextorelli/ProspectPro

---

**ProspectPro v4.3** – Tier-Aware Background Discovery & Session-Enforced Edge Functions  
_Documentation updated October 9, 2025_ 🚀
