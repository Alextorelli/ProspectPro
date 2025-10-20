# Test Run Expectations & Curl Templates

## Pass/Fail Criteria

- MCP validation suite (`npm run validate:full`) completes with no failures
- `npm run supabase:test:db` and `npm run supabase:test:functions` exit 0
- No fake data violations in logs
- Edge function curl probes return 200 and expected JSON

## Curl Templates

### Edge Function (Background Discovery)

```
curl -X POST 'https://<SUPABASE_PROJECT>.supabase.co/functions/v1/business-discovery-background' \
  -H 'Authorization: Bearer <SUPABASE_SESSION_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 2, "tierKey": "PROFESSIONAL", "sessionUserId": "test_session_123"}'
```

### Edge Function (Export)

```
curl -X POST 'https://<SUPABASE_PROJECT>.supabase.co/functions/v1/campaign-export-user-aware' \
  -H 'Authorization: Bearer <SUPABASE_SESSION_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"campaignId": "<CAMPAIGN_ID>", "format": "csv", "sessionUserId": "test_session_123"}'
```

_Replace `<SUPABASE_SESSION_JWT>`, `<SUPABASE_PROJECT>`, and `<CAMPAIGN_ID>` as needed._
