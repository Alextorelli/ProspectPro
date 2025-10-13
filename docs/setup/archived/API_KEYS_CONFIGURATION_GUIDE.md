# 🔑 API Keys Configuration Guide

## Quick Start: Adding API Keys to Supabase Edge Functions

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc
2. Click **Settings** → **Edge Functions** in the left sidebar
3. Find the **Secrets** section

### Step 2: Add Required API Keys

Click **Add Secret** for each of the following:

#### 1. Hunter.io API Key (REQUIRED)

**Secret Name**: `HUNTER_IO_API_KEY`

**Where to Get**:

1. Go to https://hunter.io/dashboard
2. Click your account icon → **API**
3. Copy your API Key

**Format**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (40 characters)

**Free Tier**: 50 searches/month, email count is always FREE

---

#### 2. NeverBounce API Key (REQUIRED)

**Secret Name**: `NEVERBOUNCE_API_KEY`

**Where to Get**:

1. Go to https://app.neverbounce.com/
2. Click **Account** → **API**
3. Copy your API Key

**Format**: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Free Tier**: 1,000 verifications/month

---

#### 3. Apollo API Key (OPTIONAL - Premium)

**Secret Name**: `APOLLO_API_KEY`

**Where to Get**:

1. Go to https://app.apollo.io/
2. Click **Settings** → **Integrations** → **API**
3. Copy your API Key

**Format**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Cost**: $1.00 per organization enrichment (owner/executive contacts)

**Note**: Leave this blank to skip Apollo enrichment and keep costs low

---

### Step 3: Verify Configuration

After adding API keys, test the Edge Functions:

#### Test Hunter.io (FREE endpoint)

```bash
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-hunter' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "email-count", "domain": "google.com"}'
```

Should return:

```json
{
  "success": true,
  "action": "email-count",
  "data": {
    "domain": "google.com",
    "total": 1234,
    ...
  },
  "cost": 0
}
```

#### Test NeverBounce (FREE endpoint)

```bash
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enrichment-neverbounce' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "syntax-check", "email": "test@example.com"}'
```

Should return:

```json
{
  "success": true,
  "action": "syntax-check",
  "data": {
    "email": "test@example.com",
    "valid": true,
    ...
  },
  "cost": 0
}
```

---

## 📊 API Key Summary

| Service           | Required?             | Free Tier                 | Paid Tier               | Where to Get                    |
| ----------------- | --------------------- | ------------------------- | ----------------------- | ------------------------------- |
| **Hunter.io**     | ✅ Yes                | 50 searches/month         | $49/mo (1,000 searches) | https://hunter.io/api           |
| **NeverBounce**   | ✅ Yes                | 1,000 verifications/month | $0.008/verification     | https://app.neverbounce.com/api |
| **Apollo**        | ❌ Optional           | Trial credits             | $1.00/organization      | https://app.apollo.io/api       |
| **Google Places** | ✅ Already configured | N/A                       | $0.017/request          | Already active                  |
| **Foursquare**    | ✅ Already configured | 5,000/day                 | N/A                     | Already active                  |
| **Census**        | ✅ Already configured | N/A                       | FREE                    | Already active                  |

---

## 🔐 Security Best Practices

### DO ✅

- Store API keys as Supabase Edge Function secrets
- Use service role key for testing (never expose publicly)
- Rotate API keys every 90 days
- Monitor API usage in respective dashboards
- Set budget limits in each API service

### DON'T ❌

- Never commit API keys to GitHub
- Never use API keys in frontend JavaScript
- Never share API keys in documentation
- Never use production keys in testing environments

---

## 💰 Cost Management

### Hunter.io

- **FREE Tier**: 50 domain searches/month
- **Email Count**: Always FREE (no quota impact)
- **Paid Plans**: Start at $49/month for 1,000 searches
- **Recommendation**: Start with free tier, upgrade if needed

### NeverBounce

- **FREE Tier**: 1,000 verifications/month
- **Pay-as-you-go**: $0.008 per verification after free quota
- **Recommendation**: Use free quota first, then pay-as-you-go

### Apollo

- **Trial**: Limited credits for testing
- **Paid**: $1.00 per organization enrichment
- **Recommendation**: Keep disabled until needed for high-value leads

---

## 🧪 Testing Workflow

### 1. Start with FREE Endpoints

Test without using paid quotas:

```bash
# Hunter.io Email Count (FREE)
{"action": "email-count", "domain": "google.com"}

# NeverBounce Syntax Check (FREE)
{"action": "syntax-check", "email": "test@example.com"}
```

### 2. Test with Budget Limits

Test paid endpoints with strict cost controls:

```bash
# Hunter.io Domain Search with $0.05 limit
{
  "action": "domain-search",
  "domain": "example.com",
  "limit": 5,
  "maxCostPerRequest": 0.05
}

# NeverBounce Verification with $0.01 limit
{
  "action": "verify",
  "email": "test@example.com",
  "maxCostPerRequest": 0.01
}
```

### 3. Test Complete Pipeline

Test orchestrator with all services:

```bash
{
  "businessName": "Test Business",
  "domain": "example.com",
  "discoverEmails": true,
  "verifyEmails": true,
  "apolloEnrichment": false,
  "maxCostPerBusiness": 0.50
}
```

---

## 📈 Expected Results

### After Configuration

With API keys configured, you should see:

1. **Hunter.io Email Discovery**

   - Find 5-10 emails per domain
   - 80-95% confidence scores
   - Costs: $0.034 per domain search

2. **NeverBounce Verification**

   - Verify email deliverability
   - 95% accuracy for valid emails
   - Costs: Uses free quota first, then $0.008/email

3. **Complete Business Enrichment**
   - Google Place Details: phone + website (FREE after cache)
   - Hunter.io: verified emails ($0.034)
   - NeverBounce: email validation ($0.008-$0.088)
   - Total: $0.042-$0.122 per business

---

## ⚠️ Troubleshooting

### "Invalid JWT" Error

- **Cause**: API keys not configured or using wrong authentication
- **Fix**: Add API keys to Supabase Edge Function secrets
- **Test**: Use service role key from Supabase dashboard

### "Hunter.io API error: 401"

- **Cause**: Invalid or expired Hunter.io API key
- **Fix**: Check API key in https://hunter.io/dashboard
- **Verify**: Copy key exactly, no extra spaces

### "NeverBounce API error: Authentication failed"

- **Cause**: Invalid NeverBounce API key format
- **Fix**: Key should start with `secret_`
- **Verify**: Check API key format in NeverBounce dashboard

### "Cost limit exceeded"

- **Cause**: Request would exceed `maxCostPerRequest` budget
- **Fix**: Increase budget limit or reduce scope
- **Note**: This is a feature, not a bug - prevents overspending

---

## 🎯 Success Checklist

- [ ] Hunter.io API key added to Supabase secrets
- [ ] NeverBounce API key added to Supabase secrets
- [ ] Tested Hunter.io email count (FREE endpoint)
- [ ] Tested NeverBounce syntax check (FREE endpoint)
- [ ] Tested Hunter.io domain search (PAID endpoint)
- [ ] Tested NeverBounce verification (PAID endpoint)
- [ ] Tested enrichment orchestrator (full pipeline)
- [ ] Monitored costs in respective dashboards
- [ ] Verified caching reduces repeat costs

---

## 📞 Support Resources

- **Hunter.io Support**: support@hunter.io
- **Hunter.io Docs**: https://hunter.io/api-documentation
- **NeverBounce Support**: https://neverbounce.com/support
- **NeverBounce Docs**: https://developers.neverbounce.com/
- **Supabase Support**: https://supabase.com/support

---

## ✅ Configuration Complete!

Once you've added the API keys:

1. ✅ Edge Functions will authenticate successfully
2. ✅ Enrichment services will return real data
3. ✅ Costs will be tracked per request
4. ✅ Caching will reduce repeat costs
5. ✅ Budget controls will prevent overspending

**Next**: Test each endpoint individually before running full enrichment pipeline! 🚀
