# Thunder Client Test Collections - README

## Overview

ProspectPro includes comprehensive Thunder Client test collections for API/Edge Function testing with failure-mode coverage and zero-fake-data validation.

## Collections

### 1. ProspectPro-Auth.json

**Authentication & Session Validation**

- ✅ Valid session JWT authentication (`test-new-auth`, `test-official-auth`)
- ❌ Missing Authorization header
- ❌ Invalid JWT token format
- ❌ Expired session token

### 2. ProspectPro-Discovery.json

**Business Discovery Endpoints**

Success Cases:

- ✅ Background discovery with Professional tier
- ✅ Optimized discovery with Enterprise tier

Failure Modes:

- ❌ Invalid tier key
- ❌ Budget exhausted (zero budget limit)
- ❌ Missing required parameters
- ❌ Unauthorized user (no auth)

### 3. ProspectPro-Enrichment.json

**Enrichment Orchestrator & Services**

Success Cases:

- ✅ Full enrichment orchestration
- ✅ Hunter.io email discovery
- ✅ NeverBounce email verification

Failure Modes:

- ❌ Hunter.io timeout/rate limit
- ❌ NeverBounce invalid email (soft fail)
- ❌ Orchestrator budget exceeded
- ❌ Missing required domain

### 4. ProspectPro-Export.json

**Campaign Export Functionality**

Success Cases:

- ✅ CSV export (authorized user)
- ✅ JSON export (authorized user)

Failure Modes:

- ❌ Unauthorized user (different user ID)
- ❌ Campaign not found
- ❌ No authentication token
- ❌ Invalid export format

### 5. ProspectPro-Database.json

**Database Health & RPC Functions**

RPC Functions:

- ✅ Reset test user campaigns
- ✅ Get campaign statistics

Health Checks:

- ✅ Campaigns table access
- ✅ Leads table access
- ✅ Campaign analytics view

## Environment Setup

### thunder-environment.json Variables

```json
{
  "SUPABASE_URL": "https://sriycekxdqnesdsgwiuc.supabase.co",
  "SUPABASE_ANON_KEY": "[sync from Vercel or .env]",
  "SUPABASE_SESSION_JWT": "[extract from browser DevTools]",
  "SUPABASE_SESSION_JWT_ALT_USER": "[alternative user for unauthorized tests]",
  "EXPIRED_SESSION_JWT": "[expired token for auth failure tests]",
  "TEST_CAMPAIGN_ID": "[create via discovery first]",
  "TEST_LEAD_ID": "[create via discovery first]"
}
```

### Syncing Environment Variables

**VS Code Task (Recommended):**

```bash
Ctrl+Alt+S  # Thunder: Sync Environment Variables
```

**CLI:**

```bash
npm run thunder:env:sync
```

**Manual:**

```bash
vercel env pull .env.thunder --yes
```

## VS Code Integration

### Keybindings

- `Ctrl+Alt+T` - Run full Thunder test suite
- `Ctrl+Alt+A` - Run auth tests only
- `Ctrl+Alt+D` - Run discovery tests only
- `Ctrl+Alt+E` - Run enrichment tests only
- `Ctrl+Alt+X` - Run export tests only
- `Ctrl+Alt+S` - Sync environment variables

### Tasks

Available via `Ctrl+Shift+P` → `Tasks: Run Task`:

- `Thunder: Run Full Test Suite` - Runs all collections sequentially
- `Thunder: Run Auth Tests` - Auth collection only
- `Thunder: Run Discovery Tests` - Discovery collection only
- `Thunder: Run Enrichment Tests` - Enrichment collection only
- `Thunder: Run Export Tests` - Export collection only
- `Thunder: Run Database Tests` - Database collection only
- `Thunder: Sync Environment Variables` - Pull latest env from Vercel

## Testing Workflow

### Initial Setup

1. **Sync environment variables:**

   ```bash
   Ctrl+Alt+S
   # or
   npm run thunder:env:sync
   ```

2. **Extract session JWT:**

   - Open browser DevTools (F12)
   - Navigate to Application → Local Storage → Supabase
   - Copy `sb-sriycekxdqnesdsgwiuc-auth-token.access_token`
   - Paste into Thunder environment as `SUPABASE_SESSION_JWT`

3. **Create test fixtures:**
   - Run a discovery request to create `TEST_CAMPAIGN_ID`
   - Extract campaign ID from response
   - Update Thunder environment

### Running Tests

**Full Suite:**

```bash
Ctrl+Alt+T
```

**Individual Collections:**

```bash
Ctrl+Alt+A  # Auth
Ctrl+Alt+D  # Discovery
Ctrl+Alt+E  # Enrichment
Ctrl+Alt+X  # Export
```

**Monitor Results:**

- Watch Thunder Client response panel
- Check Supabase extension → Edge Function logs
- Validate database changes via Supabase extension

### Debugging Failures

1. **Auth Issues:**

   - Verify `SUPABASE_SESSION_JWT` is current (not expired)
   - Check Supabase Auth dashboard for user session
   - Re-extract JWT from browser if needed

2. **Edge Function Errors:**

   - Open Supabase extension → Functions → Logs
   - Filter by function name
   - Check for authentication, validation, or runtime errors

3. **Database/RLS Issues:**
   - Open Supabase extension → Database → Table Editor
   - Verify RLS policies allow expected operations
   - Check user_id and session_user_id columns

## Zero Fake Data Validation

All Thunder tests enforce ProspectPro's zero-fake-data policy:

- ✅ **Verified Contacts Only**: Hunter.io, NeverBounce, Apollo, licensing boards
- ✅ **Professional Verification**: Executive contacts, chamber directories, trade associations
- ✅ **Transparent Sources**: Clear attribution for all contact data
- ❌ **NO Fake Patterns**: No info@, contact@, hello@, sales@ generated emails
- ❌ **NO Speculative Data**: No pattern-generated or assumed contact information

### Validation Assertions

Thunder tests include:

- Email confidence scoring validation (Hunter.io)
- Email deliverability checks (NeverBounce)
- Source attribution in enrichment_data JSONB
- RLS policy enforcement for cross-user isolation

## pgTAP Mirror Tests

Thunder collections are mirrored in pgTAP for automated regression testing:

```bash
# Run pgTAP database tests
npm run supabase:test:db

# VS Code task
Test: Run Database Tests
```

**Test Files:**

- `supabase/tests/database/campaigns.test.sql` - Campaign RLS, tier budgets, enrichment cache
- `supabase/tests/database/leads.test.sql` - Lead RLS, enrichment data, zero fake data validation
- `supabase/tests/database/core_schema.test.sql` - Schema structure and indexes

## Adding New Tests

### Thunder Client Collection

1. **Create request in Thunder UI:**

   - Right-click collection → New Request
   - Configure URL, headers, body
   - Add test assertions

2. **Export updated collection:**

   - Right-click collection → Export
   - Save to `thunder-collection/ProspectPro-*.json`

3. **Update documentation:**
   - Add test case to this README
   - Update collection description in copilot-instructions.md

### pgTAP Database Test

1. **Add test case:**

   ```sql
   -- In campaigns.test.sql or leads.test.sql
   PREPARE test_new_scenario AS
     SELECT * FROM campaigns WHERE condition;

   SELECT lives_ok(
     'test_new_scenario',
     'Description of expected behavior'
   );
   ```

2. **Update plan count:**

   ```sql
   select plan(16);  -- Increment for each new test
   ```

3. **Run tests:**
   ```bash
   npm run supabase:test:db
   ```

## Troubleshooting

### "401 Unauthorized" on all requests

**Cause:** Session JWT is missing or expired

**Fix:**

1. Re-extract JWT from browser DevTools
2. Update Thunder environment `SUPABASE_SESSION_JWT`
3. Retry request

### "404 Not Found" on Edge Functions

**Cause:** Function not deployed or incorrect URL

**Fix:**

1. Verify function is deployed: `npm run edge:list`
2. Check `SUPABASE_URL` in Thunder environment
3. Deploy function: `npm run edge:deploy:critical`

### "RLS policy violation" in database tests

**Cause:** Row Level Security blocking test operations

**Fix:**

1. Check current user context: `SELECT auth.uid()`
2. Verify RLS policies in Supabase dashboard
3. Ensure test uses correct `user_id` or `session_user_id`

### Environment variables not syncing

**Cause:** Vercel CLI not authenticated or project mismatch

**Fix:**

```bash
vercel login
vercel link
npm run thunder:env:sync
```

## Best Practices

1. **Keep environment synced**: Run `Ctrl+Alt+S` before each test session
2. **Refresh session JWT**: Extract new token every 1-2 hours to avoid expiration
3. **Run full suite regularly**: `Ctrl+Alt+T` to catch regressions
4. **Monitor Supabase logs**: Keep extension panel open during tests
5. **Document new scenarios**: Add both Thunder and pgTAP coverage
6. **Validate zero fake data**: Check enrichment_data for verified sources
7. **Test failure modes**: Include error cases for every success scenario

## Related Documentation

- [Copilot Instructions - Testing Section](../.github/copilot-instructions.md#testing--debugging-supabase--thunder-client-integration)
- [System Reference - Testing](../docs/technical/SYSTEM_REFERENCE.md)
- [VS Code Tasks Reference](../.vscode/TASKS_REFERENCE.md)
- [Edge Function Testing Guide](../docs/edge-auth-testing.md)

## Support

For issues or questions:

1. Check Supabase extension logs for Edge Function errors
2. Verify RLS policies via Supabase dashboard
3. Review Thunder Client response/test tabs
4. Run pgTAP tests for database-level validation
5. Consult copilot-instructions.md for AI-assisted debugging
