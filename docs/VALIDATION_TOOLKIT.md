# ProspectPro v4.3 Validation Toolkit

## Quick Start Commands

### 1. Initial Health Check

```bash
./scripts/production-health-check.sh
```

**Purpose**: Verify all system components are accessible and responding
**Duration**: ~30 seconds
**Output**: Color-coded status report with next steps

### 2. Authentication Pattern Testing

```bash
# First, get your session JWT from the browser:
# 1. Open https://prospect-28j3db56m-appsmithery.vercel.app
# 2. Sign in or create account
# 3. Open DevTools → Application → Local Storage
# 4. Copy value from 'sb-access-token' key

./scripts/test-auth-patterns.sh YOUR_SESSION_JWT
```

**Purpose**: Validate session enforcement and security measures
**Duration**: ~15 seconds
**Output**: Security verification and auth pattern test results

### 3. Full Campaign Validation

```bash
./scripts/campaign-validation.sh YOUR_SESSION_JWT
```

**Purpose**: End-to-end testing of discovery, processing, and export
**Duration**: ~60 seconds
**Output**: Complete campaign lifecycle validation with lead generation

## Script Reference

### production-health-check.sh

- ✅ Frontend accessibility check
- ✅ Edge Functions availability verification
- ✅ Function inventory validation
- ✅ External API reachability testing
- ✅ Database connectivity probe

### test-auth-patterns.sh

- 🔐 Shared auth helper testing
- 🔐 Official Supabase auth reference
- 🔐 Production function auth validation
- 🛡️ Security vulnerability scanning
- 📊 Auth system status summary

### campaign-validation.sh

- 🚀 Authentication verification
- 🎯 Campaign discovery initiation
- ⏳ Background processing monitoring
- 📊 Data quality validation
- 📈 Performance metrics collection
- 🏁 Complete workflow verification

## Platform Debugging URLs

### Supabase Dashboard

- **Project**: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc
- **Edge Functions**: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/functions
- **Database**: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/editor
- **Logs**: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/logs

### Vercel Dashboard

- **Project**: https://vercel.com/appsmithery/prospect-pro
- **Deployments**: https://vercel.com/appsmithery/prospect-pro/deployments
- **Analytics**: https://vercel.com/appsmithery/prospect-pro/analytics

### Production URLs

- **Frontend**: https://prospect-28j3db56m-appsmithery.vercel.app
- **Edge Functions**: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/

## Troubleshooting Decision Tree

### 🔴 Health Check Fails

1. **Frontend 404/500**: Check Vercel deployment status
2. **Edge Functions down**: Check Supabase service status
3. **API unreachable**: Verify network connectivity

### 🟡 Auth Patterns Fail

1. **Invalid JWT**: Re-authenticate and get fresh token
2. **Security vulnerability**: Check edge function deployment
3. **Auth helper fails**: Review Supabase auth configuration

### 🔴 Campaign Validation Fails

1. **Discovery fails**: Check Google Places API quota/billing
2. **No leads generated**: Verify API keys and search parameters
3. **Export fails**: Check campaign completion and data presence

## Emergency Debugging Commands

### Get Fresh Session Token

```bash
# If authentication fails, get a new token
echo "1. Open https://prospect-28j3db56m-appsmithery.vercel.app in incognito"
echo "2. Create new account or sign in"
echo "3. Open DevTools → Application → Local Storage"
echo "4. Copy 'sb-access-token' value"
echo "5. Re-run validation with new token"
```

### Direct Edge Function Test

```bash
# Test specific edge function without scripts
curl -X POST "https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-new-auth" \
  -H "Authorization: Bearer YOUR_SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d '{"diagnostics": true}'
```

### Database Direct Query

```sql
-- Run in Supabase SQL Editor to check data
SELECT COUNT(*) as total_campaigns FROM campaigns;
SELECT COUNT(*) as total_leads FROM leads;
SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 5;
```

## Performance Benchmarks

### Expected Response Times

- **Authentication**: < 500ms
- **Health Check**: < 30 seconds total
- **Auth Pattern Test**: < 15 seconds total
- **Campaign Discovery**: < 2 seconds initiation
- **Background Processing**: < 60 seconds for 3 leads
- **Export Generation**: < 10 seconds for 100 leads

### Quality Targets

- **Phone Coverage**: > 95% (Google Places API)
- **Website Coverage**: > 90% (Google Places API)
- **Email Accuracy**: > 95% (Hunter.io + NeverBounce)
- **Zero Fake Data**: 100% verified contacts only

## Common Issues & Solutions

### Issue: "Invalid JWT"

**Symptoms**: 401 errors, authentication failures
**Solution**:

1. Get fresh session token from browser
2. Verify token hasn't expired
3. Check for typos in JWT string

### Issue: "Discovery Returns No Results"

**Symptoms**: Campaign completes with 0 leads
**Solution**:

1. Check Google Places API quota
2. Try different location (e.g., "New York, NY")
3. Verify business type in taxonomy

### Issue: "Frontend Won't Load"

**Symptoms**: Blank page, 404 errors
**Solution**:

1. Check Vercel deployment status
2. Clear browser cache
3. Try incognito window
4. Verify DNS resolution

### Issue: "Slow Performance"

**Symptoms**: Long response times, timeouts
**Solution**:

1. Check external API response times
2. Monitor Edge Function logs for bottlenecks
3. Verify database query performance
4. Check network connectivity

## Validation Workflow

1. **Pre-Validation Setup**

   - Ensure clean browser session
   - Verify all platform dashboards accessible
   - Confirm MCP server running (if needed)

2. **Basic System Validation**

   ```bash
   ./scripts/production-health-check.sh
   ```

3. **Authentication Security Validation**

   ```bash
   ./scripts/test-auth-patterns.sh YOUR_SESSION_JWT
   ```

4. **End-to-End Campaign Validation**

   ```bash
   ./scripts/campaign-validation.sh YOUR_SESSION_JWT
   ```

5. **Post-Validation Analysis**
   - Review generated campaign data in Supabase
   - Verify lead quality and accuracy
   - Check cost efficiency and API usage

This toolkit provides comprehensive validation capabilities for maintaining ProspectPro v4.3 in production with rapid issue identification and resolution.
