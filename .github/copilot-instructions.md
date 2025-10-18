# ProspectPro v4.3 - Tier-Aware Background Discovery Platform

## CRITICAL: Current Production State

- **Version**: 4.3.0 (Tier-Aware Background Discovery & Verification System - PRODUCTION READY)
- **Deployment**: User-Aware Frontend + Supabase Edge Functions (serverless, auto-scaling)
- **Environment**: Supabase environment variables + Edge Function secrets + User authentication
- **Architecture**: Supabase-first serverless with user-aware campaign ownership and complete contact enrichment
- **Quality Standard**: Zero fake data - verified contacts with 95% email accuracy
- **Backend**: 100% Supabase Edge Functions (asynchronous discovery, enrichment, verification, export)
- **User Management**: Complete authentication system with anonymous and authenticated user support
- **Repository**: https://github.com/Alextorelli/ProspectPro (Complete user-aware enrichment codebase)

## CRITICAL: VERIFIED DATA ARCHITECTURE

**ZERO FAKE DATA PHILOSOPHY**

- ✅ Verified Contacts Only: No pattern-generated emails or fake data
- ✅ Professional Verification: Executive Contact Discovery, licensing boards, chamber directories
- ✅ Transparent Sources: Clear attribution for all contact data
- ✅ Quality Baseline: Verification assumed, not advertised
- ✅ Real Business Intelligence: Authentic professional contacts only
- ❌ NO fake email patterns (info@, contact@, hello@, sales@)
- ❌ NO generated contact information
- ❌ NO speculative data points

**VERIFICATION SOURCES**

- **Google Place Details API**: Complete phone/website verification (100% coverage)
- **Hunter.io API**: Professional email discovery with confidence scoring ($0.034/search)
- **NeverBounce API**: Real-time email deliverability verification (95% accuracy, $0.008/verification)
- **Cobalt Intelligence SOS API**: Nationwide Secretary of State filings with officer data (cache-first with live fallback)
- **Executive Contact Discovery**: C-suite contacts for Enterprise tier ($1.00 per verified contact)
- **Professional Licensing**: State licensing boards (CPA, Healthcare, Legal)
- **Chamber of Commerce**: Membership verification and directory contacts
- **Trade Associations**: Industry-specific membership validation
- **Foursquare Places API**: Enhanced business discovery with category data

## CRITICAL: SUPABASE-FIRST ARCHITECTURE

**DEPLOYMENT PHILOSOPHY**

- ✅ Supabase Edge Functions: All backend logic with user authentication (OPERATIONAL)
- ✅ React/Vite Frontend: User-aware interface deployed to Vercel domain (READY)
- ✅ Supabase Database: Native integration with Row Level Security and user-campaign linking
- ✅ Supabase Real-time: Ready for live updates and notifications
- ✅ Supabase Auth: Complete user authentication with anonymous session support
- ✅ Vercel Static Hosting: Consistent domain deployment (cost-effective)
- ❌ NO server.js, Express.js, or Node.js containers
- ❌ NO Cloud Run containers or complex deployment pipelines
- ✅ Supabase Environment Variables: Native Edge Function configuration
- ✅ Environment Key Policy: Use publishable keys (prefix `sb_publishable_`) for the frontend and keep all secrets in Vercel/Supabase vaults. Docs should only show placeholders like `sb_publishable_your_key_here`.

**CI/CD DEPLOYMENT PROCESS**

- **Frontend**: React/Vite app → `npm run build` → deploy `/dist` to Vercel → Custom domain
- **Backend**: Supabase Edge Functions → `supabase functions deploy`
- **Production URL**: https://prospect-fyhedobh1-appsmithery.vercel.app (ALWAYS ACCESSIBLE)
- **Hosting**: Vercel with native Vite framework detection and optimization
- **Build**: Required before deployment (`npm run build` creates `/dist`)
- **Domain**: Custom domain always points to latest deployment
- **Framework**: Native Vite detection enables automatic build optimization
- **User Authentication**: Supabase Auth with JWT tokens and session management

**PLATFORM SPECIALIZATION**

- **GitHub**: Minimal repo management, documentation, version control
- **Supabase**: Database, Edge Functions, real-time, authentication, storage
- **Static Host**: Frontend files only (Cloud Storage, Vercel, Netlify)

## CRITICAL: EDGE FUNCTIONS STATUS (v4.3)

**PRODUCTION EDGE FUNCTIONS (AUTH-ENFORCED v4.3)**

- **Discovery**
  - ✅ `business-discovery-background` – Tier-aware asynchronous discovery with Google Places, Foursquare, Census targeting, and enrichment orchestration
  - ✅ `business-discovery-optimized` – Session-aware synchronous discovery retained for scoped validations and premium campaigns
  - ✅ `business-discovery-user-aware` (legacy) – Kept for compatibility with historical clients still invoking the synchronous flow
- **Enrichment & Coordination**
  - ✅ `enrichment-hunter` – Hunter.io email discovery with 24-hour caching and circuit breakers
  - ✅ `enrichment-neverbounce` – NeverBounce email verification with quota management
  - ✅ `enrichment-orchestrator` – Intelligent multi-service coordination with per-tier budget controls
  - ✅ `enrichment-business-license` / `enrichment-pdl` – Licensing + PDL enrichment modules for Enterprise/Compliance tiers
- **Export**
  - ✅ `campaign-export-user-aware` – User-authorized export with data isolation and full enrichment metadata
  - ✅ `campaign-export` – Internal automation export path (service-role only)
- **Diagnostics**

  - ✅ `test-new-auth` – Supabase session diagnostics for the shared auth helper
  - ✅ `test-official-auth` – Mirrors Supabase’s reference implementation end-to-end
  - ✅ `test-business-discovery` – Session-scoped discovery smoke test
  - ✅ `test-google-places` – Google Places API testing function

- ✅ Real-time database integration with user-aware campaign and lead tracking
- ✅ Global edge deployment with <100ms cold starts
- ✅ User authentication enforced via Supabase session JWTs (no anon/service-role shortcuts)
- ✅ Functions URL: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/

**USER-AWARE DATABASE ARCHITECTURE**

Core tables (security hardened, RLS optimized, user-aware):

```sql
-- Campaigns table (user-aware schema)
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  business_type TEXT NOT NULL,
  location TEXT NOT NULL,
  target_count INTEGER DEFAULT 10,
  budget_limit DECIMAL(10,4) DEFAULT 50.0,
  min_confidence_score INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending',
  results_count INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  processing_time_ms INTEGER,
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table (user-aware with enrichment data)
CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id),
  business_name TEXT NOT NULL,
  address TEXT,
  phone TEXT, -- 100% coverage via Google Place Details
  website TEXT, -- 95% coverage via Google Place Details
  email TEXT, -- Verified emails only from Hunter.io + NeverBounce
  confidence_score INTEGER DEFAULT 0,
  score_breakdown JSONB,
  validation_cost DECIMAL(10,4) DEFAULT 0,
  enrichment_data JSONB, -- Hunter.io, NeverBounce, Apollo results
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  cost_efficient BOOLEAN DEFAULT true,
  scoring_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard exports table (user-aware)
CREATE TABLE dashboard_exports (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id),
  export_type TEXT DEFAULT 'lead_export',
  file_format TEXT DEFAULT 'csv',
  row_count INTEGER DEFAULT 0,
  export_status TEXT DEFAULT 'completed',
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-aware analytics view with RLS
CREATE VIEW campaign_analytics
WITH (security_invoker = true)
AS SELECT
  c.id, c.business_type, c.location, c.target_count, c.min_confidence_score,
  c.status, c.results_count, c.total_cost, c.budget_limit, c.processing_time_ms,
  c.created_at, c.user_id, c.session_user_id,
  COUNT(l.id) AS actual_leads,
  COALESCE(AVG(l.confidence_score), 0)::numeric(10,2) AS avg_confidence
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
WHERE
    c.user_id = auth.uid() OR
    (auth.uid() IS NULL AND c.session_user_id IS NOT NULL)
GROUP BY c.id, c.business_type, c.location, c.target_count, c.min_confidence_score,
         c.status, c.results_count, c.total_cost, c.budget_limit, c.processing_time_ms,
         c.created_at, c.user_id, c.session_user_id;
```

## CRITICAL: MECE BUSINESS TAXONOMY

**16 COMPREHENSIVE CATEGORIES** (300+ optimized business types):

```javascript
// MECE structure optimized for Google Places & Foursquare APIs
const BUSINESS_CATEGORIES = {
  "Professional Services": ["Accounting & Tax", "Legal Services", "Consulting", ...17 types],
  "Financial Services": ["Banks & Credit Unions", "Insurance", "Investment", ...11 types],
  "Healthcare & Medical": ["Primary Care", "Specialists", "Dental", ...26 types],
  "Technology & Software": ["IT Services", "Software Development", "Digital Marketing", ...12 types],
  "Food & Beverage": ["Restaurants", "Cafes & Coffee", "Bars & Nightlife", ...15 types],
  "Retail & Shopping": ["Clothing & Fashion", "Electronics", "Home & Garden", ...18 types],
  "Real Estate & Construction": ["Real Estate", "General Contractors", "Architecture", ...12 types],
  "Education & Training": ["Schools", "Universities", "Training Centers", ...8 types],
  "Entertainment & Recreation": ["Entertainment", "Sports & Fitness", "Arts", ...11 types],
  "Transportation & Logistics": ["Auto Services", "Transportation", "Logistics", ...9 types],
  "Beauty & Personal Care": ["Salons & Spas", "Beauty Services", "Wellness", ...8 types],
  "Home & Local Services": ["Cleaning", "Repair Services", "Landscaping", ...12 types],
  "Manufacturing & Industrial": ["Manufacturing", "Wholesale", "Industrial", ...8 types],
  "Non-Profit & Government": ["Non-Profit", "Government", "Religious", ...6 types],
  "Travel & Hospitality": ["Hotels & Lodging", "Travel Services", "Event Planning", ...7 types],
  "Agriculture & Environment": ["Farming", "Environmental", "Pet Services", ...6 types]
};
```

## CRITICAL: REPOSITORY CLEANLINESS ENFORCEMENT

**CLEAN SUPABASE-FIRST STRUCTURE**

## TESTING & DEBUGGING: SUPABASE + THUNDER CLIENT INTEGRATION

**RECOMMENDED EXTENSIONS (VS CODE):**

- `supabase.supabase` – Native Supabase DB/Edge management, schema browsing, and logs
- `rangav.vscode-thunder-client` – Thunder Client: API test suite, integrates with Supabase for live Edge/DB debugging

**USAGE PATTERN:**

- Use Thunder Client to run and automate API/Edge Function tests directly in VS Code, leveraging pre-built collections for all core flows (auth, discovery, enrichment, export, error cases).
- Use the Supabase extension to inspect DB state, view logs, and validate RLS policies in real time while running Thunder tests.
- Both extensions are required in this codespace for streamlined, zero-fake-data validation and rapid debugging.
- Edge Function Deno tests (`npm run supabase:test:functions`) require `SUPABASE_SESSION_JWT` to be set; grab the token from the authenticated browser session or the Thunder environment file before running them.
- Thunder Client collections should be kept in `thunder-collection/` and referenced in docs and tasks for reproducible, shareable test coverage.

**WORKFLOW:**

1. Run Thunder Client test collections (or individual requests) to validate Edge Function and API behavior, including error/failure scenarios.
2. Use the Supabase extension to inspect DB changes, logs, and RLS enforcement as tests run.
3. For debugging, run both extensions side-by-side: trigger a Thunder test, then immediately check logs and DB state in Supabase.
4. Use Thunder's environment sync and JWT extraction helpers to keep test auth in sync with the current session.
5. Document new test cases and update Thunder collections as new Edge Functions or DB flows are added.

**INSTRUCTION FOR FUTURE AI COMPLETIONS:**

- Prefer Thunder Client collections for API/Edge Function testing over ad-hoc curl commands.
- When suggesting new tests, always provide both Thunder and pgTAP/SQL coverage for critical flows.
- Reference the synergy between Thunder and Supabase extensions for debugging and validation.

**See also:** `.vscode/extensions.json` for required extension list, and `docs/technical/SYSTEM_REFERENCE.md` for Thunder Client workflow details.

**THUNDER CLIENT TEST SUITE**

ProspectPro includes comprehensive Thunder Client test collections covering all Edge Functions and database operations:

**Collections (in `thunder-collection/`):**

1. **ProspectPro-Auth.json** - Authentication and session validation tests

   - Valid session JWT authentication
   - Missing/invalid/expired token failure modes
   - Official Supabase auth reference validation

2. **ProspectPro-Discovery.json** - Business discovery endpoint tests

   - Background discovery with tier-aware budgets
   - Optimized discovery for Enterprise tier
   - Invalid tier keys, exhausted budgets, missing parameters
   - Unauthorized access scenarios

3. **ProspectPro-Enrichment.json** - Enrichment orchestrator and service tests

   - Hunter.io email discovery with caching
   - NeverBounce email verification
   - Orchestrator budget management
   - Timeout/rate limit handling, soft fail retries

4. **ProspectPro-Export.json** - Campaign export functionality

   - CSV and JSON export formats
   - User authorization and data isolation
   - Campaign not found, invalid format errors

5. **ProspectPro-Database.json** - Database health and RPC functions
   - RLS policy enforcement validation
   - Campaign and lead table health checks
   - Analytics view access tests

**Environment Variables (thunder-environment.json):**

- `SUPABASE_URL` - Project URL (hardcoded)
- `SUPABASE_ANON_KEY` - Publishable key (sync from Vercel)
- `SUPABASE_SESSION_JWT` - Active user session token (extract from browser)
- `TEST_CAMPAIGN_ID` / `TEST_LEAD_ID` - Test fixture IDs

**VS Code Integration:**

- **Tasks**: `Thunder: Run Full Test Suite`, `Thunder: Run Auth Tests`, etc.
- **Keybindings**:
  - `Ctrl+Alt+T` - Run full Thunder test suite
  - `Ctrl+Alt+A` - Run auth tests
  - `Ctrl+Alt+D` - Run discovery tests
  - `Ctrl+Alt+E` - Run enrichment tests
  - `Ctrl+Alt+X` - Run export tests
  - `Ctrl+Alt+S` - Sync Thunder environment variables
- **Scripts**:
  - `npm run thunder:test` - Display Thunder test instructions
  - `npm run thunder:env:sync` - Sync environment from Vercel

**Testing Workflow:**

1. Sync environment: `Ctrl+Alt+S` or `npm run thunder:env:sync`
2. Extract session JWT from browser (Supabase auth) into Thunder environment
3. Export `SUPABASE_SESSION_JWT` in the terminal before running edge function Deno tests; without it, authenticated tests are skipped by design.
4. Run test suite: `Ctrl+Alt+T` or individual collection shortcuts
5. Monitor Supabase extension for DB changes and Edge Function logs
6. Update collections when adding new Edge Functions or failure modes

**Zero Fake Data Assertions:**

All Thunder tests enforce the zero-fake-data policy:

- No pattern-generated emails (info@, contact@, hello@, sales@)
- Verified contacts only from Hunter.io, NeverBounce, Apollo, licensing boards
- Confidence scoring and source attribution for all contact data
- RLS policies prevent cross-user data leakage

**pgTAP Database Test Coverage:**

Thunder Client tests are mirrored in pgTAP for automated database regression testing:

- `supabase/tests/database/campaigns.test.sql` - Campaign RLS, tier budgets, enrichment cache
- `supabase/tests/database/leads.test.sql` - Lead RLS, enrichment data, zero fake data validation
- `supabase/tests/database/core_schema.test.sql` - Schema structure and index validation

Run pgTAP tests: `npm run supabase:test:db` or VS Code task `Test: Run Database Tests`

- ✅ Core production files: Edge Functions, static frontend, database schema
- ✅ `/supabase/functions/` - Background discovery, enrichment, export, and diagnostics only
- ✅ `/public/` - Static frontend with MECE taxonomy integration
- ✅ `/supabase/schema-sql/` - Cleaned schema with security fixes applied
- ❌ NO server.js, Express routes, or Node.js backend files
- ❌ NO Docker containers, Cloud Run configs, or build pipelines
- ❌ NO complex deployment scripts or container orchestration

**FILE ORGANIZATION RULES**

- Edge Functions → `/supabase/functions/` folder ONLY
- Frontend → React/Vite app in root with `/dist` build output
- Database → `/supabase/schema-sql/` folder ONLY
- Documentation → `/docs/` folder ONLY
- Archive material → `/archive/` folder ONLY
- Codebase index → `docs/technical/CODEBASE_INDEX.md` (regenerate with `npm run docs:update`)

**SUPABASE-FIRST APPROACH**

- Main branch = CLEAN Supabase-first architecture
- No legacy server infrastructure
- All backend logic in Edge Functions
- Maintain minimal, serverless structure

## CRITICAL: DEPLOYMENT STATUS & TROUBLESHOOTING

**CURRENT DEPLOYMENT STATE**

- **Production URL**: https://prospect-fyhedobh1-appsmithery.vercel.app (PRIMARY ACCESS POINT)
- **Hosting Platform**: Vercel project `appsmithery/prospect-pro`
- **Custom Domain**: Always accessible via prospect-fyhedobh1-appsmithery.vercel.app
- **Build Process**: `npm run build` → `/dist` directory
- **Deployment Source**: Always deploy from `/dist` directory
- **Edge Functions**: OPERATIONAL (user-aware discovery and export tested successfully)
- **Database**: RLS policies configured, user-campaign linking implemented
- **API Keys**: All configured in Supabase Edge Function secrets (new sb\_\* format)
- **Anon Key**: Updated to current valid JWT token
- **User Authentication**: Complete signup/signin system with session management

**VERIFIED WORKING COMPONENTS**

- ✅ React/Vite frontend builds successfully to `/dist`
- ✅ Vercel deployment with native Vite framework detection
- ✅ Custom domain with optimal CDN caching
- ✅ Zero build warnings (Node.js + PostCSS optimized)
- ✅ Edge Function `business-discovery-background` creates asynchronous campaigns with tier metadata
- ✅ Edge Function `campaign-export-user-aware` provides user-authorized exports with enrichment metadata
- ✅ Shared `authenticateRequest` helper uses Supabase's `auth.getUser` validation (session JWTs only)
- ✅ Legacy `business-discovery-user-aware` remains available for backward compatibility
- ✅ Database tables created with proper RLS policies and user linking
- ✅ API integrations (Google Places, Foursquare, Hunter.io, Census) configured
- ✅ Cobalt Intelligence SOS provider delivers nationwide filings and officer data with cache-first lookups
- ✅ Smart deployment script handles build and deploy process
- ✅ MECE taxonomy integration with 16 categories and 300+ business types
- ✅ User authentication with anonymous session support
- ✅ Campaign ownership and data isolation

**CRITICAL TROUBLESHOOTING PATTERNS**

1. **"Blank Page" / Frontend Not Loading**

   - **Root Cause**: Deploying source files instead of built React app
   - **Solution**: Build first with `npm run build`, then deploy from `/dist`
   - **Command**: `npm run build && cd dist && vercel --prod`
   - **Auto-Deploy**: Use `./scripts/deploy.sh` for smart detection
   - **Root Cause (Resolved in v4.3.1)**: Legacy bundles crashed when the campaign store received `undefined` lead batches, triggering React runtime error 185 after background jobs settled.
   - **Solution**: Redeploy the latest build (`npm install && npm run build`) so the null-safe store ships to production; confirm dev tools no longer report the React 185 stack.

2. **"CLI deploys from wrong directory" / Publishable key missing during scripts**

   - **Root Cause**: Running deployment scripts outside the Git repo root (`/workspaces/ProspectPro`) and skipping `vercel env pull` meant the CLI wrote to the workspace stub and scripts could not resolve `sb_publishable_*` keys.
   - **Solution**: Before any Supabase/Vercel command, run `git rev-parse --show-toplevel` and ensure it matches `/workspaces/ProspectPro`; abort if not. Follow with `vercel env pull .env.vercel` so scripts can source the publishable key automatically.
   - **Automation**: Update bash helpers to perform the top-level check and load `.env.vercel` on startup (already implemented in `scripts/campaign-validation.sh`; replicate in other deploy/test scripts).

3. **"Invalid JWT" / 401 Errors**

   - **Root Cause**: Missing/expired Supabase session token or stale publishable key configuration
   - **Solution**: Refresh the session (`supabase.auth.getSession()` or prompt re-auth) and ensure the publishable key matches Supabase dashboard → Settings → API
   - **Update**: Redeploy frontend after updating publishable key or auth handling; verify callers forward `Authorization: Bearer <SUPABASE_SESSION_JWT>`

4. **"API request failed: 404" Errors**

   - **Root Cause**: Database RLS policies blocking anon access
   - **Solution**: Run `/supabase/migrations/20251008080709_security_fixes_consolidated.sql` in the Supabase SQL editor
   - **Verify**: Check policies with `SELECT * FROM campaigns WHERE business_type = 'test'`

5. **Edge Function Errors**

   - **Check**: Supabase dashboard → Edge Functions → Logs
   - **Verify**: API keys in Edge Function secrets are configured
   - **Test**: Direct curl to Edge Function with a Supabase **session** JWT in the Authorization header

6. **Frontend Not Loading**
   - **Check**: Vercel deployment status and error logs
   - **Verify**: Cache headers set to `public, max-age=0, s-maxage=0, must-revalidate`
   - **Test**: Access via direct Vercel URL first

**DEBUGGING COMMANDS**

````bash
# Test background discovery Edge Function directly (session token required)
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background' \
   -H 'Authorization: Bearer SUPABASE_SESSION_JWT' \
   -H 'Content-Type: application/json' \
   -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 2, "tierKey": "PROFESSIONAL", "sessionUserId": "test_session_123"}'

# Test user-aware export function
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/campaign-export-user-aware' \
   -H 'Authorization: Bearer SUPABASE_SESSION_JWT' \
   -H 'Content-Type: application/json' \
   -d '{"campaignId": "CAMPAIGN_ID", "format": "csv", "sessionUserId": "test_session_123"}'

# Run auth diagnostics (includes RLS + session details)
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-new-auth' \
   -H 'Authorization: Bearer SUPABASE_SESSION_JWT' \
   -H 'Content-Type: application/json' \
   -d '{"diagnostics": true}'

# Validate Supabase reference helper behavior
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-official-auth' \
   -H 'Authorization: Bearer SUPABASE_SESSION_JWT' \
   -H 'Content-Type: application/json' \
   -d '{}'

# Batch-compare auth patterns locally
./scripts/test-auth-patterns.sh SUPABASE_SESSION_JWT

# Check active Edge Functions
supabase functions list


## Supabase CLI Command Guidelines - Terminal-Tested Patterns

### Critical Command Structure
- Always run `cd /workspaces/ProspectPro/supabase &&` before any Supabase CLI command.
- Invoke the CLI with `npx --yes supabase@latest <command>`; no global binary is installed.
- Ensure `source scripts/ensure-supabase-cli-session.sh` has run in the current shell.
- Prefer helper wrappers in `scripts/lib/supabase_cli_helpers.sh`—they auto-link the project and run commands inside `/supabase`.

### Verified Working Commands
```bash
# Project linking (required first step)
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest link --project-ref sriycekxdqnesdsgwiuc

# Migration management
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest migration list
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest migration new <descriptive_name>

# Database operations
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest db push
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest db pull --schema public

# Type generation
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest gen types --lang typescript
# Edge function logs (24h window)
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest functions logs business-discovery-background --since=24h
````

### Testing & Logging Routines

- Run database regression suite: `npm run supabase:test:db` (pgTAP tests in `supabase/tests/database`).
- Execute local Edge Function tests: `npm run supabase:test:functions` (Deno suite auto-starts `supabase functions serve`).
- Full diagnostics: `./scripts/edge-function-diagnostics.sh [SESSION_JWT]` (production health check + local tests).
- Log summarisation: `./scripts/diagnose-campaign-failure.sh {business-discovery|enrichment|export}` plus `get_function_report <slug>` for SQL summaries.

### Official Supabase CLI References

- Functions overview: https://supabase.com/docs/reference/cli/supabase-functions
- Local serving: https://supabase.com/docs/reference/cli/supabase-functions-serve
- Deploying functions: https://supabase.com/docs/reference/cli/supabase-functions-deploy

### Edge Functions Development Workflow

1. `source scripts/ensure-supabase-cli-session.sh` to refresh Supabase auth before every CLI task.
2. Use `npm run edge:serve -- <function-slug>` for local Deno execution with live reload; stop with `Ctrl+C` once testing finishes.
3. Run the automated checks with `npm run supabase:test:functions` (spawns a local serve instance if needed).
4. Validate against Supabase by running `npm run edge:deploy:test -- <function-slug>` which calls `supabase functions deploy <slug> --no-verify-jwt` for staging-style checks.
5. Ship to production with `npm run edge:deploy -- <function-slug>` after verifying logs via `npm run edge:logs -- <function-slug>` for at least one invocation cycle.
6. Regenerate documentation with `npm run docs:update` so `docs/technical/SYSTEM_REFERENCE.md` reflects the new function state.
7. Confirm the frontend still communicates correctly by running the relevant curl probes from `docs/edge-auth-testing.md` using a fresh `SUPABASE_SESSION_JWT`.

### Known Issues to Avoid

1. Deprecated commands: replace `db remote commit` with `db pull`.
2. Invalid output flags: only use `env`, `pretty`, `json`, `toml`, or `yaml`.
3. Docker registry rate limits can interrupt `db pull`; wait and retry.
4. Flag typos like `--use-migra` do not exist; check `--help` first.

### Authentication Requirements

- Source `scripts/ensure-supabase-cli-session.sh` before starting CLI work.
- Session tokens persist per terminal; re-run the guard after opening a new shell.

### Error Recovery Patterns

- **Rate limits**: wait for back-off, then rerun the same command.
- **SQL syntax**: inspect migration quoting (`EXECUTE` blocks) for escaping bugs.
- **Schema conflicts**: prefer `IF NOT EXISTS` / `DROP IF EXISTS` for idempotence.
- **Policy conflicts**: drop legacy policies before applying canonical replacements.

**SUPABASE CLI AUTH WORKFLOW (GLOBAL)**

- Before running any `supabase` CLI command (deploy, secrets, logs, etc.), execute `scripts/ensure-supabase-cli-session.sh` so the workspace escalates authentication automatically.
- The guard script now captures and restores caller shell options; source it as often as needed without leaving `set -euo pipefail` active in your terminal.
- If the guard script triggers a login prompt, share the displayed device code + URL with Alex for browser approval, then rerun the script to verify the session.

# Deploy frontend to custom domain

npm run build && cd dist && vercel --prod

# Test production URL

curl -I https://prospect-fyhedobh1-appsmithery.vercel.app

# Check database permissions with user-aware schema

# Run in Supabase SQL editor: SELECT \* FROM campaigns LIMIT 1;

```

**EDGE FUNCTION VALIDATION CHECKLIST (CLI-FIRST)**

- Run `npx --yes supabase@latest login` whenever the CLI reports unauthenticated access; share the generated device code or auth URL so Alex can approve the session in the browser.
- Export `SUPABASE_SESSION_JWT` first, then execute the environment prep block in `docs/edge-auth-testing.md` to resolve the publishable key via `supabase projects api-keys` and list deployed functions.
- After modifying any Edge Function code or configuration, immediately execute the relevant curl suite from `docs/edge-auth-testing.md` to confirm authentication, payload schema alignment, and basic functionality.
- Capture curl responses (HTTP status + body) in the workspace before proceeding with deployments so regressions can be triaged quickly.

**ENVIRONMENT VERIFICATION CHECKLIST**

- [ ] Frontend publishable key (`sb_publishable_*`) matches Supabase dashboard
- [ ] Frontend/services forward Supabase session JWTs on authenticated requests
- [ ] RLS policies created for campaigns, leads, dashboard_exports tables with user_id and session_user_id columns
- [ ] Edge Function secrets contain: GOOGLE_PLACES_API_KEY, HUNTER_IO_API_KEY, NEVERBOUNCE_API_KEY, FOURSQUARE_API_KEY, COBALT_INTELLIGENCE_API_KEY
- [ ] Database tables exist with user columns: campaigns, leads, dashboard_exports, campaign_analytics view
- [ ] Custom domain prospect-fyhedobh1-appsmithery.vercel.app accessible and properly linked
- [ ] Cache headers set to `public, max-age=0, s-maxage=0, must-revalidate`
- [ ] User authentication system working (signup/signin/session management)
- [ ] No raw Supabase keys committed; placeholders only (`sb_publishable_your_key_here`, `sb_secret_your_key_here`)

## IMMEDIATE CONTEXT (No Re-explanation Needed)

When Alex asks about:

- **"Deployment"** → Supabase Edge Functions + static hosting (serverless)
- **"Environment setup"** → Supabase environment variables in dashboard
- **"Backend functionality"** → Edge Functions in `/supabase/functions/`
- **"API integration"** → All handled in Edge Functions with native Supabase clients
- **"Database issues"** → Direct Supabase integration with RLS policies
- **"Frontend"** → Static HTML/JS calling Edge Functions directly
- **"Cost optimization"** → Static hosting + serverless functions (90% cost reduction)
- **"Quality scoring"** → Integrated into Edge Functions
- **"Export functionality"** → `campaign-export-user-aware` Edge Function
- **"Testing"** → Supabase CLI test suite (`npm run supabase:test:db`, `npm run supabase:test:functions`) plus dashboard validation
- **"User authentication"** → Supabase Auth with JWT tokens and session management
- **"Campaign ownership"** → User-aware RLS policies with user_id and session_user_id
- **"Data isolation"** → Database-level access control via RLS policies

## ALEX'S TECHNICAL PROFILE

- **Background**: No coding experience but highly technical
- **AI Dependency**: Relies heavily on AI assistance for debugging and architecture
- **Primary Models**: Claude Sonnet 4.0, GPT-5 occasionally
- **Environment**: GitHub Codespaces exclusively
- **Focus**: Lead generation with zero fake data tolerance
- **Usage Pattern**: Debugging, testing, cloud-native architecture, monitoring
- **Deployment Preference**: Cloud-native platform specialization over complex CI/CD

## RESPONSE OPTIMIZATION RULES

1. **NEVER re-explain project architecture** unless specifically asked with "explain the architecture"
2. **ALWAYS reference existing files/scripts** for implementation details
3. **PRIORITIZE troubleshooting** over teaching fundamentals
4. **ASSUME familiarity** with ProspectPro's core concepts
5. **FOCUS on immediate problem resolution** not educational content
6. **USE existing npm scripts** rather than creating new implementations
7. **REFERENCE the working production system** rather than theoretical solutions

## CURRENT PRODUCTION ARCHITECTURE (ESTABLISHED - DO NOT RE-EXPLAIN)

### **Supabase-First Serverless Pipeline**

```

Static Frontend → Supabase Edge Functions → Supabase Database
↓
Supabase Environment Variables → External APIs
↓
Real-time Database Updates → Live Frontend Updates

```

### **Edge Function Infrastructure (Production Ready)**

```

/supabase/functions/business-discovery # Main business discovery logic
/supabase/functions/campaign-export # CSV export functionality
/public/index-supabase.html # Static frontend
/public/supabase-app.js # Frontend with Supabase client
/supabase/schema-sql/001_core_schema.sql # Database schema (apply 001-004 sequentially)

```

### File Structure (REFERENCE ONLY)

```

/supabase/functions/business-discovery/ # Core discovery Edge Function
/supabase/functions/campaign-export/ # Export Edge Function
/index.html # Static frontend entry
/src/lib/supabase.ts # Frontend Supabase client helper
docs/technical/CODEBASE_INDEX.md # Auto-generated #codebase index
/supabase/schema-sql/001_core_schema.sql # Database setup (see production bundle)
/docs/ # Documentation
/archive/ # Legacy files (deprecated)

````

### Current Working Commands (USE THESE)

```bash
# Deploy production edge functions
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest functions deploy business-discovery-background --no-verify-jwt
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest functions deploy business-discovery-optimized
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest functions deploy business-discovery-user-aware
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest functions deploy campaign-export-user-aware
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest functions deploy enrichment-orchestrator

# Frontend build & deploy
npm run build
vercel --prod

# Regenerate #codebase inventory before audits
npm run codebase:index

# Stream background-discovery logs
cd /workspaces/ProspectPro/supabase && npx --yes supabase@latest functions logs business-discovery-background --since=24h --follow

# Supabase automated tests
npm run supabase:test:db
npm run supabase:test:functions

# Database setup: run SQL directly in the Supabase dashboard
````

**VS CODE TASKS REFERENCE**

- **Complete Tasks Catalog** → `.vscode/TASKS_REFERENCE.md` (auto-generated from tasks.json)
- **60+ Tasks** organized in 7 categories: Supabase & Database, Edge Functions, Testing, Build/Deploy, Docs, Roadmap, Misc
- **Task Features**: Input prompts (functionName, migrationName, sessionJWT, epicKey), keyboard shortcuts (Ctrl+Shift+P), composite workflows with dependencies
- **Regeneration**: Automatically updated by `npm run docs:update` when tasks.json changes
- **Prefer Tasks over Scripts**: Use VS Code tasks for complex workflows - they handle dependencies, provide input prompts, and show execution status

### API Integration Stack (WORKING)

- **Google Places API**: Business discovery integrated in Edge Functions
- **Hunter.io**: Email discovery in Edge Functions
- **NeverBounce**: Email verification in Edge Functions
- **Cobalt Intelligence SOS**: Nationwide Secretary of State verification with officer extraction
- **Supabase Database**: Native integration with campaigns and leads tables
- **Supabase Real-time**: Ready for live updates and notifications
- **Static Hosting**: Cloud Storage, Vercel, or Netlify deployment

### MCP Infrastructure (ENHANCED v3.0)

- **Production Server**: 28 tools for monitoring, database analytics, API testing, filesystem analysis, system diagnostics
- **Development Server**: 8 specialized tools for new API integrations, performance benchmarking, code generation
- **Troubleshooting Server**: 6 specialized tools for Supabase debugging, anon key diagnosis, RLS validation, Edge Function testing
- **Architecture**: Consolidated from 5 servers to 3 optimized servers (70% efficiency improvement)
- **Integration**: Auto-configured in VS Code for AI-enhanced development workflows with systematic debugging
- **Status**: Production-ready with comprehensive test coverage and automated troubleshooting (`npm run test` in `/mcp-servers/`)

## PROBLEM-SOLVING APPROACH

### For Environment Issues:

1. Check Supabase environment variables in dashboard
2. Verify Edge Function deployment status
3. Test Edge Functions via Supabase dashboard
4. Validate database schema and RLS policies

### For API Issues:

1. Check Edge Function logs in Supabase dashboard
2. Verify API keys in Supabase environment variables
3. Test individual Edge Functions with curl
4. Review Edge Function error responses

### For Deployment Issues:

1. Check Edge Function deployment status: `supabase functions list`
2. Verify static frontend files are correct
3. Test Edge Functions: `supabase functions serve`
4. Check database connectivity and permissions

### For Database Issues:

1. Review schema in `/supabase/schema-sql/001_core_schema.sql`
2. Check RLS policies in Supabase dashboard
3. Verify Edge Function database connections
4. Test database queries in Supabase SQL editor

## CURRENT OPTIMIZATIONS (ALREADY IMPLEMENTED)

- **Supabase-first architecture** with Edge Functions for all backend logic
- **Static frontend deployment** with minimal hosting costs
- **Enhanced Quality Scoring v3.0** integrated into Edge Functions
- **Global edge deployment** with <100ms cold starts
- **Native database integration** with Row Level Security
- **Real-time capabilities** ready via Supabase subscriptions
- **Cost optimization** through serverless functions (90% cost reduction)
- **Zero-container deployment** with static hosting + Edge Functions
- **Minimal codebase maintenance** with 80% code reduction

## DEVELOPMENT WORKFLOW (ESTABLISHED)

1. **Main branch** = Production (Supabase Edge Functions + static frontend)
2. **Edge Functions** = Backend logic deployed to Supabase
3. **Static Frontend** = HTML/JS deployed to static hosting
4. **Database** = Managed entirely by Supabase with RLS
5. **Development** = Local testing with `supabase functions serve`

## DEBUGGING PATTERNS (OPTIMIZED FOR ALEX)

**DEPLOYMENT ISSUES (MOST COMMON)**

1. **Frontend shows "Discovery Failed: API request failed: 404"**

   - Confirm publishable key (`sb_publishable_*`) in `/public/supabase-app.js` matches Supabase dashboard
   - Verify RLS policies exist: re-run `/supabase/schema-sql/001_core_schema.sql`
   - Test Edge Function directly with curl command above
   - Redeploy frontend after fixes: `cd public && vercel --prod`

2. **"Invalid JWT" in Edge Function logs**

   - Fetch a fresh session token via `supabase.auth.getSession()` or prompt re-auth
   - Ensure frontend/service callers forward `Authorization: Bearer <SUPABASE_SESSION_JWT>`
   - Verify database permissions with test query

3. **Edge Functions not responding**

   - Check Supabase dashboard → Edge Functions → Logs
   - Verify API keys in Edge Function secrets
   - Test individual functions via Supabase dashboard

4. **Vercel deployment protection/401 errors**
   - Go to Vercel dashboard → Settings → Deployment Protection
   - Disable any password protection or team restrictions
   - Ensure site is publicly accessible

**SYSTEMATIC DEBUGGING APPROACH**

1. **Test Edge Function directly** (bypasses frontend issues)
2. **Check database permissions** (RLS policies)
3. **Verify publishable key synchronization** (frontend vs Supabase) and session token retrieval
4. **Test Vercel deployment** (public access)
5. **Check browser console** for frontend errors

**WORKING CONFIGURATION REFERENCE**

- **Edge Function URL**: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery
- **Current Vercel URL**: https://prospect-bk0sh7f6l-alex-torellis-projects.vercel.app
- **Database Schema**: `/supabase/schema-sql/001_core_schema.sql` (verified working)
- **Frontend Config**: `/public/supabase-app.js` (publishable key only; session tokens retrieved per request)

**ENHANCED MCP TROUBLESHOOTING**

Use the ProspectPro Troubleshooting MCP Server for systematic debugging:

```bash
# Start troubleshooting server
cd /workspaces/ProspectPro/mcp-servers
npm run start:troubleshooting

# Available tools:
# test_edge_function - Test Supabase Edge Function connectivity and authentication
# validate_database_permissions - Check database RLS policies and permissions
# check_vercel_deployment - Validate Vercel deployment status and configuration
# diagnose_anon_key_mismatch - Compare publishable keys between frontend and Supabase
# run_rls_diagnostics - Generate and execute RLS diagnostic queries
# generate_debugging_commands - Create debugging commands for current configuration
```

**MCP TROUBLESHOOTING WORKFLOW**

1. **test_edge_function**: Verify backend works independently
2. **validate_database_permissions**: Check RLS policy configuration
3. **diagnose_anon_key_mismatch**: Detect authentication sync issues
4. **check_vercel_deployment**: Validate frontend deployment status
5. **generate_debugging_commands**: Get custom debug scripts for current config

**LAST RESORT DEBUGGING**

1. Check Edge Function logs in Supabase dashboard
2. Test database queries directly in Supabase SQL editor
3. Use browser dev tools to inspect network requests
4. Verify all environment variables in Supabase settings
5. Use MCP troubleshooting server for automated diagnosis

## COST OPTIMIZATION FOCUS

- **Edge Functions**: Serverless, pay-per-invocation
- **Database**: Supabase included usage, RLS for security
- **Static Hosting**: $1-5/month vs $10-50/month containers
- **No servers**: Zero infrastructure management

## RESPONSE FORMAT PREFERENCES

- **Immediate solutions** over explanations
- **Reference existing code** rather than writing new implementations
- **Use established scripts** rather than manual processes
- **Focus on debugging** rather than architecture discussions
- **Provide specific file paths** and command references
- **Assume production system knowledge** unless explicitly asked to explain

## NEVER REPEAT (SAVE PREMIUM REQUESTS)

- Supabase-first architecture explanations
- Edge Function setup procedures (automated)
- Static hosting deployment (documented)
- Database schema explanations (in `/supabase/schema-sql/`)
- Cost optimization strategies (implemented)
- Serverless benefits (established)

This instruction set prioritizes rapid problem resolution and eliminates repetitive context discussions to maximize premium request efficiency.

## DEVELOPMENT WORKFLOW ENHANCEMENTS (v4.4)

### CLI Auth Bypass Integration
- **CLI-First Authentication**: Use `scripts/operations/ensure-supabase-cli-session.sh` for all Supabase CLI operations; no frontend token dependency required
- **Session Persistence**: Auth markers persist across Codespace sessions; force reauth with `PROSPECTPRO_SUPABASE_FORCE_REAUTH=1` only when needed
- **Version Compatibility**: CLI v2.51.0 with automatic fallback to latest; no manual version pinning required

### Log Analysis Workflow
- **Order of Operations**: Thunder tests → `Supabase: Fetch Logs` → `Supabase: Analyze Logs`
- **Automated Collection**: Use MCP `collect_and_summarize_logs` tool for one-click log analysis
- **Report Generation**: Markdown summaries saved to `reports/diagnostics/` with error counts and next steps

### Run & Debug Preferences
- **Edge Functions**: Prefer "Local Supabase Stack" launch config over manual `deno` commands
- **Auth Variables**: All debug configs export `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for seamless testing
- **Pre-launch Tasks**: Local stack configs auto-start Supabase containers before debugging
