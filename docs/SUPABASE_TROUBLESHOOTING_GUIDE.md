# ProspectPro Supabase Troubleshooting Guide

## 🚨 CRITICAL DEPLOYMENT ISSUES - SYSTEMATIC DEBUGGING

### 1. FRONTEND SHOWS "Discovery Failed: API request failed: 404"

**IMMEDIATE DIAGNOSIS**

```bash
# Run these commands in order to isolate the issue:

# 1. Test Edge Function directly (bypasses frontend)
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery' \
  -H 'Authorization: Bearer YOUR_CURRENT_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 2}'

# 2. Check Vercel deployment status
curl -I "https://your-vercel-url.vercel.app"

# 3. Test database permissions
curl -X GET 'https://sriycekxdqnesdsgwiuc.supabase.co/rest/v1/campaigns?select=count' \
  -H 'Authorization: Bearer YOUR_CURRENT_ANON_KEY' \
  -H 'apikey: YOUR_CURRENT_ANON_KEY'
```

**ROOT CAUSE ANALYSIS**

- ✅ **Edge Function working + Database accessible + Vercel 200** = Anon key mismatch
- ❌ **Edge Function 401** = Invalid anon key or RLS policy issue
- ❌ **Vercel 401** = Deployment protection enabled
- ❌ **Database 401** = RLS policies not configured

### 2. ANON KEY MISMATCH (MOST COMMON ISSUE)

**DETECTION**

1. Go to Supabase Dashboard → Settings → API
2. Copy the current **anon/public** key
3. Check `/public/supabase-app.js` line ~9
4. Compare keys - they must match EXACTLY

**FIX PROCEDURE**

```bash
# 1. Update anon key in frontend
# Edit /public/supabase-app.js line 9 with current key from Supabase dashboard

# 2. Redeploy frontend
cd /workspaces/ProspectPro/public
vercel --prod

# 3. Test immediately
curl -I "https://your-new-vercel-url.vercel.app"
```

### 3. DATABASE RLS POLICIES NOT CONFIGURED

**SYMPTOMS**

- Edge Function test returns 401 errors
- Database queries fail with "new row violates row-level security policy"

**FIX PROCEDURE**

```sql
-- Run this in Supabase SQL Editor
-- Enable RLS and create policies for anon access

-- For campaigns table
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select campaigns" ON campaigns FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert campaigns" ON campaigns FOR INSERT TO anon WITH CHECK (true);

-- For leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select leads" ON leads FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert leads" ON leads FOR INSERT TO anon WITH CHECK (true);

-- For dashboard_exports table
ALTER TABLE dashboard_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select dashboard_exports" ON dashboard_exports FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert dashboard_exports" ON dashboard_exports FOR INSERT TO anon WITH CHECK (true);

-- Test with a simple query
INSERT INTO campaigns (id, business_type, location) VALUES ('test-' || now(), 'test', 'test');
SELECT * FROM campaigns WHERE business_type = 'test' LIMIT 1;
```

### 4. VERCEL DEPLOYMENT PROTECTION

**SYMPTOMS**

- Vercel URL returns 401 Unauthorized
- Site asks for password or team access

**FIX PROCEDURE**

1. Go to Vercel Dashboard
2. Select your ProspectPro project
3. Settings → Deployment Protection
4. **Disable** any password protection
5. **Disable** any team-only restrictions
6. Save changes
7. Test: `curl -I "https://your-vercel-url.vercel.app"`

### 5. EDGE FUNCTIONS NOT RESPONDING

**DIAGNOSIS**

```bash
# Check Edge Function logs
supabase functions logs --project-ref sriycekxdqnesdsgwiuc

# List deployed functions
supabase functions list

# Test specific function
supabase functions serve business-discovery
```

**COMMON FIXES**

- **API keys missing**: Add to Supabase Edge Function secrets
- **Function not deployed**: Run `supabase functions deploy business-discovery`
- **Wrong project reference**: Verify project ref in logs

### 6. MCP TROUBLESHOOTING SERVER USAGE

**Available Tools**

```bash
# Install and test MCP troubleshooting server
cd /workspaces/ProspectPro/mcp-servers
npm install
npm run start:troubleshooting

# Available MCP tools:
# - test_edge_function: Test Supabase Edge Function connectivity
# - validate_database_permissions: Check RLS policies and permissions
# - check_vercel_deployment: Validate Vercel deployment status
# - diagnose_anon_key_mismatch: Compare frontend vs Supabase anon keys
# - run_rls_diagnostics: Generate RLS diagnostic queries
# - generate_debugging_commands: Create debugging commands for current config
```

## 🔧 SYSTEMATIC DEBUGGING WORKFLOW

### STEP 1: ISOLATION TEST

```bash
# Test each component independently
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery' \
  -H 'Authorization: Bearer CURRENT_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "test", "location": "test", "maxResults": 1}'
```

**Expected**: JSON response with business data or clear error message

### STEP 2: AUTHENTICATION VERIFICATION

```bash
# Test database access with current anon key
curl -X GET 'https://sriycekxdqnesdsgwiuc.supabase.co/rest/v1/campaigns?select=count' \
  -H 'Authorization: Bearer CURRENT_ANON_KEY' \
  -H 'apikey: CURRENT_ANON_KEY'
```

**Expected**: `[{"count": N}]` or RLS policy error

### STEP 3: FRONTEND DEPLOYMENT CHECK

```bash
# Check Vercel deployment accessibility
curl -I "https://your-vercel-url.vercel.app"
```

**Expected**: `HTTP/2 200` status

### STEP 4: ANON KEY SYNCHRONIZATION

1. Get current anon key from Supabase Dashboard → Settings → API
2. Update `/public/supabase-app.js` line 9
3. Redeploy: `cd public && vercel --prod`
4. Test new deployment

## 📋 ENVIRONMENT VERIFICATION CHECKLIST

- [ ] **Anon key**: Frontend matches Supabase dashboard exactly
- [ ] **RLS policies**: Created for campaigns, leads, dashboard_exports tables
- [ ] **Edge Functions**: business-discovery and campaign-export deployed
- [ ] **API keys**: Configured in Supabase Edge Function secrets
- [ ] **Vercel deployment**: Publicly accessible without protection
- [ ] **Database tables**: campaigns, leads, dashboard_exports exist
- [ ] **Test data**: At least one test campaign can be inserted/selected

## 🚀 QUICK RECOVERY COMMANDS

```bash
# Complete reset and redeploy
cd /workspaces/ProspectPro

# 1. Update anon key (get from Supabase dashboard)
# Edit /public/supabase-app.js line 9

# 2. Redeploy frontend
cd public && vercel --prod

# 3. Test Edge Function
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery' \
  -H 'Authorization: Bearer NEW_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 1}'

# 4. Test new deployment
curl -I "https://your-new-vercel-url.vercel.app"
```

## 📊 SUCCESS INDICATORS

**✅ WORKING SYSTEM**

- Edge Function returns real business data (not errors)
- Database queries succeed without 401 errors
- Vercel deployment returns 200 status
- Frontend loads without console errors
- Business discovery finds actual businesses

**❌ SYSTEM ISSUES**

- 401 Unauthorized errors from any component
- "Invalid JWT" messages in logs
- Empty business results or API errors
- Frontend shows generic error messages
- Database queries fail with RLS violations

## 🔍 ADVANCED DEBUGGING

### Browser Developer Tools

1. Open browser dev tools (F12)
2. Go to Network tab
3. Try business discovery
4. Check for:
   - Failed network requests (red)
   - 401/403 status codes
   - CORS errors
   - Missing Authorization headers

### Supabase Dashboard Debugging

1. **Edge Functions** → Logs: Check for runtime errors
2. **API** → Settings: Verify anon key is current
3. **SQL Editor**: Test database queries directly
4. **Authentication** → Settings: Check RLS configuration

### MCP Server Debugging

Use the ProspectPro troubleshooting MCP server tools for automated diagnosis:

- `test_edge_function`: Automated Edge Function testing
- `validate_database_permissions`: Comprehensive RLS analysis
- `diagnose_anon_key_mismatch`: Automatic key comparison
- `generate_debugging_commands`: Custom debug scripts

## 📞 ESCALATION PATH

If systematic debugging doesn't resolve the issue:

1. **Gather Evidence**

   - Edge Function curl test results
   - Browser console errors
   - Supabase Edge Function logs
   - Current anon key from dashboard

2. **Create Minimal Test Case**

   - Simplest possible business discovery request
   - Clear reproduction steps
   - Expected vs actual behavior

3. **Review Architecture**
   - Confirm Supabase-first architecture is maintained
   - Verify no legacy Node.js/Express dependencies
   - Check static hosting configuration

**Remember**: The backend (Edge Functions + Database) should work independently of the frontend. Always test Edge Functions directly first to isolate frontend vs backend issues.
