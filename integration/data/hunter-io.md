# Hunter.io Data Specification

## Source Endpoint

- **Product**: Hunter.io Email Finder API
- **Endpoint**: `https://api.hunter.io/v2/email-finder`
- **HTTP Method**: `GET`
- **Authentication**: Query parameter `api_key` (environment-specific) or HTTP header `Authorization: Bearer <token>`
- **Required Parameters**:
  - `domain` – company domain (e.g., `example.com`)
  - `first_name` and `last_name` _or_ `full_name`
- **Optional Parameters**: `company`, `position`, `seniority`, `country`, `confidence_threshold`

## Canonical Fields

| Field                      | Type            | Description                                                          | ProspectPro Mapping                     |
| -------------------------- | --------------- | -------------------------------------------------------------------- | --------------------------------------- |
| `data.email`               | string          | Suggested email address                                              | Lead contact `email`                    |
| `data.score`               | integer (0–100) | Confidence score for email                                           | Lead contact `email_confidence`         |
| `data.domain`              | string          | Domain used for discovery                                            | Derived from website or manual override |
| `data.first_name`          | string          | First name                                                           | Lead contact `first_name`               |
| `data.last_name`           | string          | Last name                                                            | Lead contact `last_name`                |
| `data.position`            | string          | Title if provided                                                    | Lead contact `role_title`               |
| `data.seniority`           | string          | `junior`/`senior`/`executive` etc.                                   | Lead contact `role_seniority`           |
| `data.department`          | string          | Department classification                                            | Lead contact `department`               |
| `data.linkedin_url`        | string          | Public LinkedIn profile (if any)                                     | Lead contact `linkedin_url`             |
| `data.twitter`             | string          | Twitter handle                                                       | Lead contact `twitter_handle`           |
| `data.phone_number`        | string          | Phone number if available                                            | Lead contact `phone_secondary`          |
| `data.accept_all`          | boolean         | Domain accepts any email                                             | Impacts verification flow               |
| `data.sources[*].uri`      | string          | Source URL used to validate email                                    | Stored for provenance                   |
| `data.verification.status` | enum            | `valid`, `invalid`, `disposable`, `accept_all`, `webmail`, `unknown` | Pre-NeverBounce status                  |
| `data.verification.date`   | string (ISO)    | Verification timestamp                                               | Lead `email_verified_at`                |

## Derived Fields

- **`email_pattern`**: derived from `data.pattern` when present (e.g., `{first}.{last}`)
- **`confidence_bucket`**: `high` (>=90), `medium` (75-89), `low` (<75)
- **`verification_required`**: `true` unless Hunter verification status is `valid`

## Validation Rules

1. Require `data.email` and `data.score` >= 70; otherwise escalate for manual review.
2. Reject if `data.verification.status` is `invalid` or `disposable` even before NeverBounce.
3. For `accept_all` domains, mark lead for mandatory downstream NeverBounce verification.
4. Ensure email matches regex `^[^@\s]+@[^@\s]+\.[^@\s]+$` and domain portion matches requested domain.

## Sync Cadence

- Execute on-demand during lead enrichment.
- Revalidate emails older than 60 days to capture role changes.

## Rate Limits & Quotas

- API key typically provides 50–100 requests/minute; hard quota defined by plan (e.g., 50k searches/month).
- Monitor `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers.

## Error Handling

| HTTP Code              | Meaning                                     | Retry Guidance                    |
| ---------------------- | ------------------------------------------- | --------------------------------- |
| 200 + `status=success` | Success                                     | N/A                               |
| 200 + `status=error`   | Parameter error                             | Correct request; do not retry     |
| 401                    | Invalid API key                             | Halt requests; rotate key         |
| 403                    | Quota exceeded                              | Backoff until `X-RateLimit-Reset` |
| 422                    | Unprocessable entity (missing names/domain) | Fix payload                       |
| 429                    | Rate limited                                | Retry after header delay          |
| 500                    | Server error                                | Retry up to 3 times               |

## Security & Compliance

- API key stored in secrets manager; environment-specific keys.
- Ensure GDPR compliance: store only necessary contact data, honour opt-out requests.
- Track `sources` for audit; do not expose to end-users without review.

## Downstream Dependencies

- NeverBounce verification uses `data.email`.
- CRM sync writes `confidence_bucket` and `verification_required` to segmentation fields.
