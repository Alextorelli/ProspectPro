# Cobalt Intelligence SOS Integration

## Overview

The ProspectPro registry engine now supports the [Cobalt Intelligence Secretary of State API](https://documentation.cobaltintelligence.com/) as the primary source for nationwide SOS business and officer data. The integration replaces the legacy Connecticut, New York, and California one-off clients with a single orchestrated provider that supports cache-first lookups with a live-data fallback.

## Environment Configuration

| Variable                         | Location                       | Description                                                                                        |
| -------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `COBALT_INTELLIGENCE_API_KEY`    | Supabase Edge Function secrets | Production API key for the Cobalt SOS gateway.                                                     |
| `COBALT_SOS_BASE_URL` (optional) | Supabase Edge Function secrets | Override for the API gateway base URL. Defaults to `https://apigateway.cobaltintelligence.com/v1`. |

> **Note:** Local development requires providing the key via environment variables or a `.env` file that is loaded before running the registry modules. No keys are committed to the repository.

## Client Usage

`modules/api-clients/cobalt-sos-client.js` exposes a `CobaltSOSClient` that implements:

- Cache-first search (`liveData: false`) with automatic polling for long-running jobs that return a `retryId`.
- Optional live fallback (`liveData: true`) that can be triggered by callers when cached data is unavailable.
- Address, UCC, and screenshot filters mapped to the SOS API query parameters.
- Normalized response metadata including completion status, polling attempts, and timing metrics.

Example:

```javascript
const client = new CobaltSOSClient();
const result = await client.searchBusiness({
  searchQuery: "ProspectPro LLC",
  state: "co",
  liveData: false,
});
```

## Provider Registration

`modules/registry-engines/providers/cobalt-sos-provider.js` wraps the client for use inside the registry engine:

- Determines relevance for US businesses based on state and country metadata.
- Performs cache-first validation with optional live fallback (enabled by default).
- Normalizes SOS results into ProspectPro's registry shape, including officer, UCC, and address data.
- Exposes owner candidate suggestions for downstream enrichment workflows.

The provider is registered in `modules/registry-engines/providers/index.js` under the key `"cobalt-sos"`. Existing discovery/enrichment workflows can opt-in by requesting this provider via the registry engine factory.

## Migration Notes (v4.3)

- The `cobalt-sos` provider is the primary SOS integration for all nationwide owner verification workflows.
- Legacy state-specific providers (`california-sos`, `newyork-sos`) are no longer active in v4.3; all SOS queries route through the Cobalt provider.
- Ensure Supabase Edge Functions have the `COBALT_INTELLIGENCE_API_KEY` secret configured before deploying discovery or enrichment updates that rely on this provider.

## Testing Checklist

1. Execute `npm run codebase:index` to refresh the repository index when auditing new modules.
2. Run the registry engine smoke tests (if available) or invoke a discovery edge function using a Supabase session JWT to verify Cobalt responses.
3. Confirm fallback behavior by inspecting the `metadata.usedCache` and `metadata.attemptedLiveLookup` flags in the provider response.
4. Monitor Supabase Edge Function logs for `cobalt_sos` entries to validate polling and error handling.
