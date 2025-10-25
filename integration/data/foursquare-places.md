# Foursquare Places Data Specification

## Source Endpoint

- **Product**: Foursquare Places API (Get Place Details)
- **Endpoint**: `https://api.foursquare.com/v3/places/{fsq_id}`
- **HTTP Method**: `GET`
- **Authentication**: HTTP header `Authorization: <API_KEY>` (Enterprise tier key)
- **Required Path Parameter**: `fsq_id` obtained from Foursquare Places search results
- **Recommended Query Parameters**:
  - `fields=fsq_id,name,categories,location,geocodes,international_phone,website,features,price,rating,stats,delivery,caterings,photos` to minimise payload

## Canonical Fields

| Field                        | Type          | Description                        | ProspectPro Mapping                             |
| ---------------------------- | ------------- | ---------------------------------- | ----------------------------------------------- |
| `fsq_id`                     | string        | Unique Foursquare place identifier | Stored as secondary enrichment key              |
| `name`                       | string        | Business name                      | Cross-check against Google Places `result.name` |
| `location.formatted_address` | string        | Foursquare formatted address       | Address parity check                            |
| `location.address`           | string        | Street address                     | Lead `address_line1`                            |
| `location.locality`          | string        | City                               | Lead `address_city`                             |
| `location.region`            | string        | State/region                       | Lead `address_state`                            |
| `location.postcode`          | string        | Postal code                        | Lead `postal_code`                              |
| `location.country`           | string        | ISO country code                   | Lead `country_code`                             |
| `geocodes.main.latitude`     | number        | Primary latitude                   | Geospatial reconciliation                       |
| `geocodes.main.longitude`    | number        | Primary longitude                  | Geospatial reconciliation                       |
| `categories[*].id`           | string        | Foursquare category ID             | Category mapping table (ProspectPro taxonomy)   |
| `categories[*].name`         | string        | Category name                      | Tag for lead segmentation                       |
| `international_phone`        | string        | International phone number         | Verify against Google Places phone              |
| `website`                    | string        | Website URL                        | Fallback for email enrichment                   |
| `rating`                     | number        | Foursquare rating (0–10 scale)     | Normalised to 0–5 for analytics                 |
| `price`                      | integer       | 1–4 indicating price tier          | Lead `price_tier`                               |
| `stats.total_ratings`        | integer       | Review count                       | Lead `reviews.foursquare.count`                 |
| `features.delivery`          | boolean       | Delivery support flag              | Campaign filter                                 |
| `delivery[].url`             | array<object> | Delivery provider URLs             | Lead `delivery_providers`                       |
| `photos[*]`                  | array<object> | Photo metadata                     | Optional assets (stored via CDN pointer)        |

## Derived Fields

- **`category_primary`**: first entry in `categories` after mapping to ProspectPro taxonomy
- **`review_score_normalised`**: `rating / 2` to map 0–10 scale to 0–5
- **`data_quality_score`**: heuristics combining presence of phone, website, rating, and photo

## Validation Rules

1. **Coordinate parity**: verify delta between Google Places and Foursquare coordinates <= 200 meters.
2. **Category intersection**: ensure at least one mapped category intersects with target campaign taxonomy.
3. **Address reconciliation**: require match on `postal_code` and `country`; fuzzy match `locality`.
4. **Rating filter**: exclude listings with `rating` < 4 (equivalent to <2 on 0–5 scale) unless low-tier campaign.

## Sync Cadence

- Trigger Foursquare enrichment immediately after Google Places discovery
- Refresh every 45 days for active leads to capture rating/feature changes

## Rate Limits & Quotas

- Standard Enterprise plan: 100 requests per second burst, 1M requests/month (confirm contract)
- Monitor `x-ratelimit-remaining` headers; implement soft cut-off at 80% consumption

## Error Handling

| HTTP Code   | Meaning         | Retry Guidance                             |
| ----------- | --------------- | ------------------------------------------ |
| 200         | Success         | N/A                                        |
| 400         | Invalid FSQ ID  | Flag lead; no retry                        |
| 401         | Invalid API key | Alert security; halt enrichment            |
| 403         | Plan violation  | Pause requests; escalate                   |
| 404         | Place not found | Mark lead as archived                      |
| 429         | Rate limit hit  | Exponential backoff; respect `retry-after` |
| 500/502/503 | Server error    | Retry up to 3 times with backoff           |

## Security & Compliance

- Store API key in integration secrets vault; rotate quarterly.
- Restrict outbound IPs to Foursquare allowlist if enabled.

## Downstream Dependencies

- Data feeds the enrichment orchestrator for completeness scoring.
- Delivery flags used by marketing automation to tailor outreach messaging.
