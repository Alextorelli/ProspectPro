# Google Places Data Specification

## Source Endpoint

- **Product**: Google Places API (Place Details)
- **Endpoint**: `https://maps.googleapis.com/maps/api/place/details/json`
- **HTTP Method**: `GET`
- **Required Parameters**:
  - `place_id` – unique identifier returned by the Places Search/Autocomplete APIs
  - `fields` – comma-delimited list limiting the response payload (e.g. `name,formatted_address,geometry,international_phone_number,website,rating,user_ratings_total,business_status,types`)
  - `key` – Maps Platform API key with Places permissions
- **Recommended Projection**: request only required fields to control cost and latency

## Canonical Fields

| Field                                | Type          | Description                                                               | ProspectPro Mapping                                                               |
| ------------------------------------ | ------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `result.place_id`                    | string        | Stable Google Places identifier                                           | Stored as canonical place key; passed downstream to Foursquare enrichment         |
| `result.name`                        | string        | Business display name                                                     | Lead `display_name`                                                               |
| `result.formatted_address`           | string        | Fully formatted address                                                   | Lead `address_full`                                                               |
| `result.address_components[*].types` | array         | Structured address roles (e.g. `locality`, `administrative_area_level_1`) | Normalised into `address_city`, `address_state`, `address_country`, `postal_code` |
| `result.geometry.location.lat`       | number        | Latitude                                                                  | Geospatial index (`lat`)                                                          |
| `result.geometry.location.lng`       | number        | Longitude                                                                 | Geospatial index (`lng`)                                                          |
| `result.types`                       | array         | Google category taxonomy (e.g. `cafe`, `restaurant`)                      | Mapped to ProspectPro business taxonomy (`businessTaxonomy.ts`)                   |
| `result.business_status`             | enum          | `OPERATIONAL`, `CLOSED_TEMPORARILY`, `CLOSED_PERMANENTLY`                 | Lead `operating_status`                                                           |
| `result.user_ratings_total`          | integer       | Number of Google reviews                                                  | Lead `reviews.count`                                                              |
| `result.rating`                      | number        | Average Google rating (0.0–5.0)                                           | Lead `reviews.rating`                                                             |
| `result.website`                     | string        | Business website URL                                                      | Lead `website_url`                                                                |
| `result.international_phone_number`  | string        | E.164 formatted phone                                                     | Lead `phone.primary`                                                              |
| `result.utc_offset`                  | integer       | Minutes offset from UTC                                                   | Lead `timezone_offset_minutes`                                                    |
| `result.opening_hours.weekday_text`  | array<string> | Localised weekly schedule                                                 | Lead `hours.weekly_schedule`                                                      |
| `result.opening_hours.open_now`      | boolean       | Real-time open flag                                                       | Lead `hours.open_now`                                                             |

## Derived Fields

- **`lead_geo_hash`**: generated via lat/lng (precision 7) for clustering
- **`primary_category`**: mapped from first `types` entry via `businessTaxonomy.ts`
- **`review_density`**: computed as `user_ratings_total / max(months_since_created, 1)` when `result.utc_offset` is available

## Validation Rules

1. **Address completeness**: require at minimum `street_number`, `route`, `locality`, `administrative_area_level_1`, `country`, `postal_code` components. Reject otherwise.
2. **Geospatial sanity**: lat between −90 and 90; lng between −180 and 180. Out-of-range records flagged for manual review.
3. **Category filter**: enforce ProspectPro allowlist (coffee shops, restaurants, etc.). If no overlap, drop result.
4. **Status filter**: only ingest `OPERATIONAL` listings unless running a dormant-business campaign.
5. **Website/phone validation**: ensure URLs begin with `http(s)://` and phone numbers pass E.164 regex `^\+?[1-9]\d{6,14}$`.

## Sync Cadence

- **Primary discovery**: real-time per search request
- **Refresh window**: re-query every 30 days for active leads to keep ratings and status fresh
- **Webhook alternative**: none (polling only)

## Rate Limits & Quotas

- Daily quota based on Maps Platform billing; default 100,000 requests/day per project (subject to contract)
- Recommended to batch multi-field lookups using `fields` parameter to reduce cost
- Monitor `X-RateLimit-Remaining` style quota via Google Cloud console (no header in response)

## Error Handling

| HTTP Code                      | Meaning                          | Retry Guidance                                  |
| ------------------------------ | -------------------------------- | ----------------------------------------------- |
| 200 + `status=OK`              | Success                          | N/A                                             |
| 200 + `status=ZERO_RESULTS`    | Place ID invalid                 | Do not retry; mark lead as stale                |
| 403 / 429                      | Quota exceeded or key restricted | Back off exponentially; alert operations        |
| 400 + `status=INVALID_REQUEST` | Missing/invalid parameters       | Fix request payload; no retry                   |
| 503                            | Service unavailable              | Retry with exponential backoff (max 3 attempts) |

## Security & Compliance

- API key restricted to allowed domains/IPs.
- Use separate keys per environment (development, troubleshooting, production).
- Do not log raw API key; redact in diagnostics.

## Downstream Dependencies

- Foursquare Places enrichment uses `place_id`, `name`, `formatted_address`, and `geometry`.
- Census targeting consumes `lat`, `lng`, and structured address components.
- Email enrichment (Hunter.io) uses `domain` derived from `website`.
