# 🚀 Tomorrow's API Setup Checklist
*ProspectPro Phase 1 - API Key Verification & Enhancement*

## 🎯 Quick Start (5 minutes)

### Step 1: Test Current API Status
```bash
cd C:\Users\Alext\OneDrive\Documents\Personal\Projects\Appsmithery\ProspectPro\ProspectPro_REBUILD
npm install node-fetch  # If not already installed
node test-api-keys.js
```

This will show you exactly which APIs are working and which need attention.

### Step 2: Check Railway Deployment
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Open ProspectPro project
3. Verify deployment is live and running
4. Check logs for any errors

---

## 🔧 API Key Fixes (Priority Order)

### **HIGH PRIORITY** - Required for Core Features

#### ✅ Google Places API
- **Status**: Should be working
- **Key**: `[CONFIGURED_IN_ENVIRONMENT]`
- **Test**: Run script above
- **If broken**: 
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Check API quotas and billing
  3. Enable Places API if disabled

#### ⚠️ Hunter.io Email Discovery 
- **Current Issue**: Using wrong key (duplicate of ScrapingDog)
- **Fix Steps**:
  1. Go to [Hunter.io](https://hunter.io/api)
  2. Sign up or log into existing account
  3. Get API key from dashboard
  4. Update in `.env`: `HUNTER_IO_API_KEY=your_real_key`
  5. Update Railway environment variables
- **Free Tier**: 25 searches/month
- **Cost**: $49/month for 1,000 searches

#### 🟡 NeverBounce Email Verification
- **Key**: `private_56e6fb6612fccb12bdf0d237f70e5b96`
- **Test**: Script will show quota status
- **If broken**:
  1. Go to [NeverBounce](https://neverbounce.com/api)
  2. Log into account
  3. Check if key is still valid
  4. Get new key if needed
- **Free Tier**: 1,000 verifications/month

### **MEDIUM PRIORITY** - Enhanced Features

#### 🆕 OpenCorporates Business Registry
- **Status**: Not configured yet
- **Setup**:
  1. Go to [OpenCorporates API](https://opencorporates.com/api)
  2. Create free account
  3. Get API token from profile
  4. Add to `.env`: `OPENCORPORATES_API_KEY=your_token`
  5. Update Railway variables
- **Free Tier**: 200 requests/day
- **Cost**: $500/month for enterprise (skip for now)

### **LOW PRIORITY** - Future Enhancement

#### 📋 State Business Registries
- **Status**: Implemented but needs research
- **Action**: Research which states have public APIs
- **Timeline**: Can implement gradually
- **Cost**: Most are free but require registration

---

## 🔐 Railway Environment Variable Updates

### Current Variables to Verify:
```
SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
GOOGLE_PLACES_API_KEY=[YOUR_GOOGLE_API_KEY]
SCRAPINGDOG_API_KEY=68c368582456a537af2a2247
```

### Variables to Add/Fix:
```
HUNTER_IO_API_KEY=your_real_hunter_key
NEVERBOUNCE_API_KEY=private_56e6fb6612fccb12bdf0d237f70e5b96  # Verify this works
OPENCORPORATES_API_KEY=your_new_opencorporates_token
```

### Update Process:
1. Railway Dashboard → ProspectPro Project
2. Variables tab
3. Add/edit each variable
4. Deploy automatically triggers

---

## 🧪 Testing Workflow

### 1. Local Testing
```bash
# Test APIs locally first
node test-api-keys.js

# Test the app locally
npm start
# Try a business discovery search
```

### 2. Production Testing
1. Check Railway deployment logs
2. Test API endpoints directly
3. Run a small campaign
4. Check cost tracking works

### 3. Validation Checklist
- [ ] Google Places returns real businesses
- [ ] Hunter.io finds real email addresses
- [ ] NeverBounce verifies emails properly
- [ ] Cost tracking shows accurate API usage
- [ ] Campaign logger saves results
- [ ] Quality grades (A-F) display correctly

---

## 💰 Cost Management

### Set Up Monitoring:
1. **Google Cloud**: Set billing alerts
2. **Hunter.io**: Check quota in dashboard
3. **NeverBounce**: Monitor credit usage
4. **ProspectPro**: Check campaign logs for cost tracking

### Expected Monthly Costs:
- **Light Usage**: ~$20-50/month
- **Moderate Usage**: ~$100-200/month  
- **Heavy Usage**: ~$300-500/month

### Cost Optimization Tips:
- Use free sources first (state registries, OpenCorporates free tier)
- Batch email verifications
- Cache results to avoid duplicate API calls
- Set daily spend limits

---

## 🚨 Troubleshooting

### Common Issues:

#### "API Key Invalid"
- Check key hasn't expired
- Verify correct variable name in .env
- Ensure no extra spaces/characters

#### "Quota Exceeded"
- Check API dashboard for usage
- Wait for quota reset (usually daily/monthly)
- Consider upgrading to paid tier

#### "Railway Deploy Failed"
- Check logs in Railway dashboard
- Verify all environment variables set
- Look for syntax errors in recent changes

#### "Database Connection Failed"  
- Verify Supabase project is active
- Check if database needs table creation
- Confirm URL and key are correct

---

## 🎯 Success Metrics

By end of tomorrow, you should have:
- [ ] All API keys verified and working
- [ ] Railway deployment fully functional
- [ ] Test campaign with real data completed
- [ ] Cost tracking showing accurate usage
- [ ] Quality grades working for business data

## ⏰ Time Estimates:
- **API key fixes**: 30-60 minutes
- **Testing and validation**: 30 minutes  
- **Railway updates**: 15 minutes
- **End-to-end testing**: 30 minutes

**Total**: ~2 hours maximum

---

## 🆘 If You Get Stuck:

1. **Run the test script first** - it will tell you exactly what's broken
2. **Check Railway logs** - they show deployment and runtime errors
3. **Verify .env file** - make sure keys are correctly formatted
4. **Test one API at a time** - isolate the problem
5. **Check API documentation** - each service has different key formats

The system is 70% ready - you're just adding the final API connections!