# ProspectPro Railway Webhooks Guide

This document explains how to configure and operate Railway webhooks in ProspectPro, including endpoint security, database logging, and validation.

## Summary
- Endpoint: `POST /railway-webhook`
- Verification: HMAC signature via `x-railway-signature` or shared secret token via `?token=` or header `X-Railway-Token`
- Storage: `public.railway_webhook_logs` with `idempotency_key` and unique index
- Purpose: Track build/deploy lifecycle, enable analytics and troubleshooting

## 1. Configure Environment
Set in Railway Project → Variables:
- `SUPABASE_URL` — Supabase Project URL (https://<ref>.supabase.co)
- `SUPABASE_SECRET_KEY` — Service-role key
- `RAILWAY_WEBHOOK_SECRET` — Long random string for verification

Optional (recommended): `PERSONAL_ACCESS_TOKEN` for `/deployment-status` admin endpoint.

## 2. Endpoint Details
- Path: `POST /railway-webhook`
- Content-Type: `application/json`
- Auth options:
  - Preferred: HMAC signature header `x-railway-signature` (computed with `RAILWAY_WEBHOOK_SECRET`)
  - Alternate: `?token=<RAILWAY_WEBHOOK_SECRET>` or header `X-Railway-Token: <RAILWAY_WEBHOOK_SECRET>`
- Body: Railway build/deploy event JSON

Signature handling:
- The server uses `express.raw({ type: 'application/json' })` for exact payload bytes
- If signature verification fails, token fallback is accepted if `RAILWAY_WEBHOOK_SECRET` matches

## 3. Database Logging & Idempotency
- Table: `public.railway_webhook_logs`
- Columns (core):
  - `event_type`, `deployment_id`, `project_id`, `environment_id`, `payload`, `processed_at`
  - `idempotency_key` — derived from `deployment.id` or a SHA-256 hash of event content
- Indexes:
  - `ux_railway_webhook_idempotency` — unique on `idempotency_key`
  - `idx_railway_webhook_logs_event_type`, `idx_railway_webhook_logs_deployment`, `idx_railway_webhook_logs_processed`
- RLS:
  - Enabled on webhook tables in `05-security-and-rls.sql`
  - Optional strict policy can restrict inserts to service-role (commented in `06-webhook-hardening.sql`)

## 4. Setup Steps
1. Apply SQL (in order):
   - `database/03-monitoring-and-analytics.sql`
   - `database/05-security-and-rls.sql`
   - `database/06-webhook-hardening.sql`
2. Set `RAILWAY_WEBHOOK_SECRET` in Railway
3. Configure webhook in Railway UI:
   - Endpoint: `https://<your-app>.up.railway.app/railway-webhook?token=<RAILWAY_WEBHOOK_SECRET>`
   - Events: select all
   - Method: POST, Content-Type: application/json
4. Test from UI ("Test Webhook") and verify DB receives the event

## 5. Validation
- Query latest events:
```sql
SELECT event_type, deployment_id, processed_at, idempotency_key
FROM public.railway_webhook_logs
ORDER BY processed_at DESC
LIMIT 10;
```
- Curl test (token fallback):
```powershell
$body = '{ "type":"deployment.success", "deployment": { "id":"test-' + [Guid]::NewGuid().ToString() + '" } }'
curl -Method POST `
     -Uri "https://<your-app>.up.railway.app/railway-webhook?token=<RAILWAY_WEBHOOK_SECRET>" `
     -Headers @{ "Content-Type" = "application/json" } `
     -Body $body
```

## 6. Troubleshooting
- 401 Unauthorized: Check signature header or token matches `RAILWAY_WEBHOOK_SECRET`
- Duplicates in DB: Ensure `06-webhook-hardening.sql` ran and the unique index exists
- No DB records: Verify `SUPABASE_URL`/`SUPABASE_SECRET_KEY` and that server logs show "Supabase logging enabled"

## 7. Related Endpoints
- `/deployment-status?token=<PERSONAL_ACCESS_TOKEN>` — summarized status for admin
- `/diag` — diagnostics snapshot including latest webhook status

## 8. Maintenance
- Rotate `RAILWAY_WEBHOOK_SECRET` periodically
- Consider archiving old webhook logs (>90 days)
- Review indexes for performance quarterly
