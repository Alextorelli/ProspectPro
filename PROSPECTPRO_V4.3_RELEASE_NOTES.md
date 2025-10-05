# ProspectPro v4.3 Release Notes – October 5, 2025

## 🚀 Highlights

- **Background Discovery Pipeline** – New `business-discovery-background` edge function processes campaigns asynchronously, writing status + metrics to `discovery_jobs` while auto-inserting completed campaigns and leads.
- **Multi-Source Business Discovery** – Combines Google Places, Google Place Details, and Foursquare results with deduplication and optional geography expansion.
- **Census-Driven Targeting** – Integrates U.S. Census County Business Patterns to adjust search radius, expected results, and confidence multipliers when `CENSUS_API_KEY` is configured.
- **Tier-Aware Enrichment** – Starter/Professional/Enterprise/Compliance tiers encode price-per-lead, max cost, and enrichment options (Hunter/NeverBounce/Apollo) directly in the job payload.
- **Enhanced Enrichment Metadata** – Leads now store `verificationSources`, `emails`, `processingMetadata`, and `dataSources` for export + analytics; jobs track validation vs enrichment spend.
- **Frontend Alignment** – `useBusinessDiscovery` and UI now forward keywords, radius, geography, tier metadata, and discovery option toggles required by the background job.

## 🧠 Architecture Updates

| Component      | Update                                                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Edge Functions | New `business-discovery-background`; updated cost + metrics integration with `enrichment-orchestrator`; existing user-aware discovery remains for legacy flows.                                      |
| Database       | `discovery_jobs.metrics` expanded to include tier info, cost breakdowns, sources used, and census density score; inserted campaigns/leads include tier metadata + validation cost.                   |
| Frontend       | Business discovery flow posts tier payload (`tierKey`, `tierName`, `tierPrice`), keyword arrays, search radius, expand flag, and discovery options (trade associations, licensing, chamber, Apollo). |
| MCP            | Production MCP server exposes background job diagnostics; config now ships with quick commands for deploying/logging the new function.                                                               |

## 🔧 Deployment Checklist

1. Ensure Supabase Edge secrets include `CENSUS_API_KEY`, `FOURSQUARE_API_KEY`, and refreshed `SUPABASE_SERVICE_ROLE_KEY`.
2. Deploy updated function: `supabase functions deploy business-discovery-background`.
3. Redeploy enrichment orchestrator if local changes were made: `supabase functions deploy enrichment-orchestrator`.
4. Trigger a smoke test:
   ```bash
   curl -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background" \
     -H "Authorization: Bearer <JWT_ANON_KEY>" \
     -H "Content-Type": "application/json" \
     -d '{
           "businessType": "dental clinic",
           "location": "Austin, TX",
           "tierKey": "PROFESSIONAL",
           "maxResults": 3,
           "sessionUserId": "release-430-smoke",
           "keywords": ["invisalign", "cosmetic"],
           "expandGeography": true
         }'
   ```
5. Monitor progress via `discovery_jobs` real-time channel (`discovery_jobs:id=eq.<jobId>`) and confirm completed campaign + leads records.

## 📊 Data Quality & Cost Notes

- Validation cost baseline remains $0.02 per lead (Google verification); enrichment costs recorded per service.
- Census-enabled searches may expand radius automatically—cap results through `maxResults` to maintain budget.
- Foursquare API is optional; absent key simply reduces supplementary data without failing the job.

## ✅ Backwards Compatibility

- Legacy `business-discovery-user-aware` endpoint untouched for existing integrations.
- Export function remains `campaign-export-user-aware`, now outputting the richer enrichment metadata for all newly created campaigns.
- Frontend gracefully handles missing census/Foursquare keys by falling back to default heuristics.

Welcome to ProspectPro v4.3! The platform now delivers richer sourcing intelligence, deterministic cost accounting, and asynchronous campaign handling out of the box.
