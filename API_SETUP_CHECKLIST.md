# ProspectPro Phase 1 API Setup Checklist

## ✅ Completed Setup

1. **Supabase Database**
   - ✅ Project: vvxdprgfltzblwvpedpx
   - ✅ URL: https://vvxdprgfltzblwvpedpx.supabase.co
   - ✅ Keys configured in secrets file

2. **Google Places API**
   - ✅ Key: AIzaSyB3BbYJRUiGSwgyon2iBWQkv6ON3V3eSik
   - ✅ Active and tested
   - ✅ APIs enabled: Places API, Places Details, Geocoding

3. **ScrapingDog API**
   - ✅ Key: 68c368582456a537af2a2247
   - ✅ Configured for website scraping
   - ✅ Free tier: 1000 requests/month

4. **Railway Deployment**
   - ✅ Repository: https://github.com/alextorelli/ProspectPro.git
   - ✅ Auto-deployment configured
   - ✅ Environment variables ready

## ❗ Needs Verification/Setup

### 1. Hunter.io Email Discovery API
**Current Status**: ⚠️ Key appears incorrect (duplicate of ScrapingDog)
**Action Required**:
1. Go to https://hunter.io/api
2. Sign up for account or verify existing account
3. Get actual API key from dashboard
4. Update in both .env and Railway environment variables
5. **Free tier**: 25 email searches/month
6. **Paid tier**: $49/month for 1,000 searches

### 2. NeverBounce Email Verification API
**Current Status**: ⚠️ Need to verify account and quota
**Key**: private_56e6fb6612fccb12bdf0d237f70e5b96
**Action Required**:
1. Go to https://neverbounce.com/api
2. Verify account is active with this key
3. Check remaining quota in dashboard
4. **Free tier**: 1,000 verifications/month
5. **Paid tier**: $18/month for 5,000 verifications

### 3. OpenCorporates Business Registry API
**Current Status**: ❌ Not configured yet
**Action Required**:
1. Go to https://opencorporates.com/api
2. Sign up for free account
3. Get API key from dashboard
4. Add to environment variables
5. **Free tier**: 200 requests/day
6. **Paid tier**: $500/month for 2,000 requests/day

### 4. State Business Registry APIs
**Current Status**: ✅ Implemented but endpoints are placeholders
**Action Required**:
1. Research actual state API endpoints
2. Some states require registration/approval
3. Many are free but have rate limits
4. Update StateRegistryClient.js with real endpoints

## 🚀 Deployment Steps

### 1. Update Local Environment
```bash
# Copy real keys to .env file
HUNTER_IO_API_KEY=your_real_hunter_key_here
NEVERBOUNCE_API_KEY=private_56e6fb6612fccb12bdf0d237f70e5b96
OPENCORPORATES_API_KEY=your_opencorporates_key_here
```

### 2. Update Railway Environment Variables
1. Go to Railway dashboard
2. Select ProspectPro project
3. Go to Variables tab
4. Update:
   - `HUNTER_IO_API_KEY`
   - `NEVERBOUNCE_API_KEY` (verify current one)
   - `OPENCORPORATES_API_KEY` (add new)

### 3. Test API Connections
```bash
# Test all APIs are working
npm run test-apis  # Need to create this script
```

### 4. Monitor API Usage
- Set up alerts for quota limits
- Track costs per campaign
- Monitor success rates

## 📊 Expected Costs (Per Month)

### Free Tier Limits:
- OpenCorporates: 6,000 requests/month (200/day)
- Hunter.io: 25 email searches/month
- NeverBounce: 1,000 email verifications/month
- Google Places: Pay-per-use (~$0.032/search)

### Paid Tier Costs:
- Google Places: ~$50-100/month (moderate usage)
- Hunter.io: $49/month (1,000 searches)
- NeverBounce: $18/month (5,000 verifications)
- OpenCorporates: $500/month (enterprise)

**Total estimated**: $117-667/month depending on usage

## 🔒 Security Notes

1. **Never commit real API keys to git**
2. **Use environment variables in production**
3. **Rotate keys regularly**
4. **Monitor for unusual API usage**
5. **Set up billing alerts**

## ✅ Deployment Readiness

Current readiness: **70%**

**Ready**: Database, Google Places, ScrapingDog, Railway deployment
**Needs work**: Hunter.io verification, OpenCorporates setup
**Optional**: State registry APIs (can implement gradually)

The system can run with current keys for basic functionality, but enhanced owner discovery requires the additional APIs to be properly configured.