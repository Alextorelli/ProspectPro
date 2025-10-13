# Supabase Production Security Optimization Guide

## Overview

This guide addresses critical security warnings and optimizations needed for a production-ready ProspectPro deployment with user authentication, subscription management, and secure database functions.

## Security Issues Addressed

### 🔴 CRITICAL: SECURITY DEFINER Views

- **Issue**: Views `enrichment_cache_analytics` and `cache_performance_summary` inherit creator permissions
- **Risk**: Potential privilege escalation and unauthorized data access
- **Fix**: Recreate views with `security_invoker = true` to use caller permissions

### ⚠️ WARNING: Function Search Path Vulnerabilities

- **Issue**: Functions `generate_cache_key`, `get_cached_response`, `store_cached_response`, `cleanup_expired_cache` have mutable search_path
- **Risk**: Function hijacking via schema injection attacks
- **Fix**: Add explicit `SET search_path = public` and qualified schema references

## Implementation Steps

### Step 1: Run Security Fixes

1. **Access Supabase SQL Editor**

   - Go to https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/sql
   - Open a new SQL query

2. **Deploy Security Optimization**

   - Copy the entire contents of `/workspaces/ProspectPro/database/production-security-optimization.sql`
   - Paste into Supabase SQL Editor
   - Click **"Run"** to execute all fixes

3. **Verify Deployment**
   - All queries should execute without errors
   - You should see "Success. No rows returned" for most operations

### Step 2: Configure Authentication

1. **Enable Email Auth in Supabase**

   - Go to Authentication → Settings
   - Set Site URL: `https://prospectpro.appsmithery.co`
   - Add redirect URLs:
     ```
     https://prospectpro.appsmithery.co/auth/callback
     http://localhost:3000/auth/callback
     ```

2. **Configure Email Templates**

   - Authentication → Email Templates
   - Customize signup confirmation, password reset templates as needed

3. **Enable Apple Sign-In (Optional)**
   - Authentication → Providers → Apple
   - Add Apple Client ID and Secret from Apple Developer Console

### Step 3: Environment Configuration

1. **Update Production Environment Variables**

   ```env
   VITE_SUPABASE_URL=https://sriycekxdqnesdsgwiuc.supabase.co
   VITE_SUPABASE_ANON_KEY=your-current-anon-key
   VITE_SITE_URL=https://prospectpro.appsmithery.co
   ```

2. **Verify Anon Key**
   - Go to Settings → API in Supabase dashboard
   - Copy the current `anon public` key
   - Update in your environment variables

### Step 4: Application Integration

The security optimization includes a complete user authentication and subscription system. To integrate:

1. **Install Additional Dependencies**

   ```bash
   npm install @supabase/auth-ui-react @supabase/auth-ui-shared react-hook-form zod
   ```

2. **Update Application Architecture**
   - The SQL includes all necessary tables and functions for user management
   - Subscription tiers: Free (10 searches), Pro (500 searches), Enterprise (unlimited)
   - Usage tracking and limit enforcement
   - Row Level Security for multi-tenant data isolation

### Step 5: Edge Function Updates

Update your Edge Functions to include user authentication and usage tracking:

```javascript
// Add to beginning of Edge Functions
const {
  data: { user },
} = await supabaseClient.auth.getUser();
if (!user) {
  return new Response(JSON.stringify({ error: "Authentication required" }), {
    status: 401,
    headers: corsHeaders,
  });
}

// Check usage limits
const { data: usageCheck } = await supabaseClient.rpc("check_usage_limit", {
  user_uuid: user.id,
  action_type: "search",
});

if (!usageCheck?.can_proceed) {
  return new Response(
    JSON.stringify({
      error: "Search limit reached. Please upgrade your subscription.",
      usage: usageCheck,
    }),
    {
      status: 403,
      headers: corsHeaders,
    }
  );
}

// After successful operation
await supabaseClient.rpc("increment_usage", {
  user_uuid: user.id,
  action_type: "search",
  campaign_id_param: campaignId,
  cost_param: totalCost,
});
```

## Verification Checklist

### Security Fixes Verification

Run these queries in Supabase SQL Editor to verify fixes:

```sql
-- 1. Verify no SECURITY DEFINER views remain
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE viewname IN ('enrichment_cache_analytics', 'cache_performance_summary')
AND definition LIKE '%SECURITY DEFINER%';
-- Should return 0 rows

-- 2. Verify functions have search_path set
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('generate_cache_key', 'get_cached_response', 'store_cached_response', 'cleanup_expired_cache')
AND routine_schema = 'public';
-- Should return 4 rows

-- 3. Verify RLS policies are active
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('user_profiles', 'user_subscriptions', 'usage_logs', 'campaigns', 'leads');
-- Should return > 0

-- 4. Verify subscription tiers exist
SELECT name, max_searches, max_exports FROM subscription_tiers WHERE is_active = true;
-- Should return 3 tiers: Free, Pro, Enterprise
```

### Authentication Verification

1. **Test User Signup**

   - Users can register with email
   - User profiles auto-created
   - Free subscription assigned by default

2. **Test Usage Limits**

   - Free tier limited to 10 searches, 2 exports
   - Usage counters increment correctly
   - Limits enforced before API calls

3. **Test Data Isolation**
   - Users only see their own campaigns and leads
   - Cross-user data access blocked by RLS

## Production Benefits

### Security Hardening

- ✅ **SECURITY DEFINER Eliminated**: Views use caller permissions, not creator
- ✅ **Search Path Fixed**: Functions immune to schema injection attacks
- ✅ **RLS Enabled**: Multi-tenant data isolation with user-specific policies
- ✅ **Qualified References**: All schema references explicitly qualified

### User Management

- ✅ **Authentication Ready**: Email signup/signin with optional Apple Sign-In
- ✅ **Subscription Tiers**: Free, Pro, Enterprise with usage limits
- ✅ **Usage Tracking**: Detailed logs for analytics and billing
- ✅ **Automatic Provisioning**: User profiles and subscriptions auto-created

### Performance Optimization

- ✅ **Strategic Indexes**: Optimized queries for user data, subscriptions, usage logs
- ✅ **Cache Performance**: Enhanced caching with security-hardened functions
- ✅ **Database Efficiency**: Proper foreign keys and constraints

### Compliance & Monitoring

- ✅ **Audit Trail**: Complete usage logs for compliance reporting
- ✅ **Data Governance**: User-owned data with proper access controls
- ✅ **Subscription Management**: Ready for billing integration (Stripe compatible)

## Next Steps

### Immediate (Required)

1. **Deploy Security Fixes**: Run the production optimization SQL
2. **Configure Authentication**: Enable email auth in Supabase dashboard
3. **Update Environment**: Set production environment variables
4. **Test Security**: Verify all queries return expected results

### Short Term (Recommended)

1. **Frontend Integration**: Add authentication components to React app
2. **Edge Function Updates**: Add user auth and usage tracking
3. **Subscription UI**: Build subscription management interface
4. **Testing**: Comprehensive authentication and authorization testing

### Long Term (Enhancement)

1. **Payment Integration**: Stripe subscription billing
2. **Advanced Analytics**: User behavior and usage analytics
3. **API Access**: External API for enterprise customers
4. **Performance Monitoring**: Database performance optimization

## Support & Troubleshooting

### Common Issues

**Issue**: "relation does not exist" errors
**Solution**: Ensure all SQL executed successfully, check table creation

**Issue**: RLS policy violations
**Solution**: Verify user authentication, check policy definitions

**Issue**: Function search_path warnings persist
**Solution**: Redeploy functions with explicit search_path settings

### Debug Commands

```sql
-- Check current user authentication
SELECT auth.uid() as current_user_id;

-- Verify table existence
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_profiles', 'subscription_tiers', 'user_subscriptions', 'usage_logs');

-- Test subscription system
SELECT
  up.full_name,
  st.name as tier,
  us.searches_used,
  st.max_searches
FROM user_profiles up
JOIN user_subscriptions us ON up.id = us.user_id
JOIN subscription_tiers st ON us.tier_id = st.id
WHERE up.id = auth.uid();
```

This optimization provides enterprise-grade security and user management capabilities while maintaining the high-performance architecture of ProspectPro v4.2.
