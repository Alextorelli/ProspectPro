# NeverBounce Data Specification

## Source Endpoint

- **Product**: NeverBounce Single Check API
- **Endpoint**: `https://api.neverbounce.com/v4/single/check`
- **HTTP Method**: `POST`
- **Authentication**: HTTP Basic (`username=<api_key>`, `password=<api_secret>`)
- **Required Parameters**:
  - `email` – email address to verify
- **Optional Parameters**:
  - `address_info` (boolean) – include parsed email parts
  - `timeout` – override server timeout (seconds)
  - `credits_info` – include remaining credits in response

## Canonical Fields

| Field | Type | Description | ProspectPro Mapping |
| --- | --- | --- | --- |
| `result` | enum | `valid`, `invalid`, `catchall`, `disposable`, `unknown` | Stored as verification result |
| `flags` | array<string> | Additional classifications (`role`, `free_email`, `government`, `spamtrap`, `does_not_accept_mail`) | Lead contact flags |
| `suggested_correction` | string | Spelling suggestion if domain typos detected | Auto-correction workflow |
| `retry_token` | string | Token to retry check if result was `unknown` | Used for delayed retries |
| `execution_time` | number | Time (ms) to process verification | Monitoring metric |
| `credits_info.balance` | integer | Remaining verification credits | Observability dashboard |
| `address_info.domain` | string | Domain component | Lead metadata |
| `address_info.username` | string | Local-part component | Lead metadata |

## Derived Fields

- **`verification_confidence`**: map `result` to numeric scale (valid=1.0, catchall=0.6, disposable=0.2, invalid=0.0, unknown=0.4)
- **`needs_manual_review`**: true if `result` is `catchall` or `unknown` and `flags` include `role` or `free_email`

## Validation Rules

1. Treat `result=valid` as pass, `invalid` as fail; others require manual or automated follow-up.
2. If `flags` contains `disposable_email` or `spamtrap`, blacklist contact immediately.
3. For `catchall`, schedule recheck in 24 hours using `retry_token`.

## Sync Cadence

- Trigger immediately after Hunter.io returns candidate email.
- Reverify every 30 days for active campaigns flagged as `catchall`.

## Rate Limits & Quotas

- API limited by purchased credits (e.g., 10k checks/month).
- Observability: track `credits_info.balance` and alert at <20%.

## Error Handling

| HTTP Code              | Meaning                         | Retry Guidance                             |
| ---------------------- | ------------------------------- | ------------------------------------------ |
| 200 + `status=success` | Success                         | N/A                                        |
| 400                    | Invalid request (missing email) | Do not retry; fix payload                  |
| 401                    | Authentication failed           | Rotate API keys                            |
| 402                    | Insufficient credits            | Pause verification, notify ops             |
| 429                    | Rate limited                    | Respect `Retry-After`; exponential backoff |
| 500                    | Server error                    | Retry up to 3 attempts                     |

## Security & Compliance

- Store API key/secret securely; restrict to verification service account.
- Do not log full email addresses in plaintext; mask local-part when logging.

## Downstream Dependencies

- Verification status persisted for campaign quality scoring.
- Contacts failing verification removed from export flows.
