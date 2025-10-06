# ProspectPro v4.3 Technical Summary – Tier-Aware Background Discovery

## Executive Snapshot

ProspectPro v4.3 introduces an asynchronous _business-discovery-background_ pipeline that unifies Google Places, Foursquare, and U.S. Census intelligence with tier-aware cost controls. Base, Professional, and Enterprise tiers now drive enrichment rules directly in the background job, guaranteeing that every campaign records validation, enrichment, and sourcing metadata for exports and analytics.

## Key Enhancements

- **Background Discovery Edge Function**: `business-discovery-background` runs as an EdgeRuntime job, writing progress + metrics to `discovery_jobs` while inserting completed campaigns/leads.
- **Multi-Source Discovery**: Google Places + Place Details + Foursquare search with dedupe and optional geography expansion based on Census density.
- **Census Intelligence**: County Business Patterns data sets `expected_results`, `confidence_multiplier`, and search radius recommendations when `CENSUS_API_KEY` is present.
- **Tier-Aware Budgeting**: Base/Professional/Enterprise tiers map to precise `pricePerLead`, `maxCostPerLead`, and enrichment toggles; UI forwards tier payload, keywords, custom radius, and discovery options.
- **Enrichment Upgrades**: Hunter/NeverBounce/Apollo (optional) orchestrated via `enrichment-orchestrator` with full cost breakdown (`validationCost`, `enrichmentCost`, service list, cache metadata).
- **Structured Metrics**: `discovery_jobs.metrics` now tracks sources used, total cost, validation vs enrichment spend, census density, tier info, and per-lead confidence.

## Production Edge Functions (October 2025)

| Function                        | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `business-discovery-background` | Asynchronous discovery + enrichment orchestration      |
| `campaign-export-user-aware`    | User-authorized CSV export with cost + source metadata |
| `enrichment-orchestrator`       | Hunter/NeverBounce/Apollo coordination + budgeting     |
| `enrichment-hunter`             | Hunter.io API proxy with caching + circuit breakers    |
| `enrichment-neverbounce`        | NeverBounce verification proxy                         |
| `test-google-places`            | Diagnostics for Google Places billing & quotas         |

> Historical functions (`business-discovery-user-aware`, `business-discovery-optimized`, etc.) remain in repo for reference but all production workloads now run through `business-discovery-background`.

## Data Pipeline Overview

```
UI Campaign Request (tier, keywords, options)
        ↓
`business-discovery-background`
        ↓  (Google Places + Place Details)
  Candidate Businesses
        ↓  (Foursquare supplement + dedupe)
  Enriched Business List
        ↓  (Quality Scorer w/ Census multiplier)
  Qualified Leads
        ↓  (enrichment-orchestrator)
  Verified Contacts + Cost Metrics
        ↓
Campaign + Leads persisted with tier metadata
```

## Tier Reference Table

| Tier         | Price / Lead | Max Cost / Lead | Includes                                            |
| ------------ | ------------ | --------------- | --------------------------------------------------- |
| Base         | $0.15        | $0.50           | Business verification + generic company email       |
| Professional | $0.45        | $1.50           | Email discovery & verification + company enrichment |
| Enterprise   | $2.50        | $7.50           | Executive contacts + compliance verification        |

Base tier provides essential business data; higher tiers add progressive email discovery, executive contact enrichment, and compliance verification.

## Database Touchpoints

- **`discovery_jobs`** – Stores real-time status, metrics, tier info, sources used, density scores.
- **`campaigns`** – Receives completed campaign record with `total_cost`, `results_count`, and tier metadata when job finishes.
- **`leads`** – Each lead includes `enrichment_data` (`verificationSources`, `emails`, `processingMetadata`, `dataSources`) and `validation_cost`.

## Operational Notes

- **Secrets**: Ensure `CENSUS_API_KEY`, `FOURSQUARE_API_KEY`, `GOOGLE_PLACES_API_KEY`, `HUNTER_IO_API_KEY`, `NEVERBOUNCE_API_KEY`, and Supabase keys are populated in Edge Function secrets.
- **Testing**: Run `supabase functions serve business-discovery-background --env-file .env.edge` for local dry runs; verify job status via `discovery_jobs` table.
- **Exports**: `campaign-export-user-aware` now emits tier pricing, total validation/enrichment spend, and sources used for every lead.
- **MCP Integration**: Production MCP server exposes new diagnostics (`test_background_job`, `analyze_discovery_metrics`) for the background workflow.

## Quick Command Cheatsheet

```bash
# Deploy background discovery function
supabase functions deploy business-discovery-background

# Tail background discovery logs
supabase functions logs business-discovery-background --follow

# Trigger a minimal background job
curl -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background" \
  -H "Authorization: Bearer <JWT_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
        "businessType": "coffee shop",
        "location": "Seattle, WA",
        "maxResults": 2,
        "tierKey": "BASE",
        "sessionUserId": "debug-session-001",
        "keywords": ["latte", "wifi"],
        "expandGeography": true
      }'
```

Use this summary as the authoritative reference for v4.3 conversations, deployment coordination, and AI tooling context.
