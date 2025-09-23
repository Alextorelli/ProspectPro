# ProspectPro API Keys Setup Guide

## Step 1: Set Up Supabase Connection (Required)

### 1.1 Get Your Supabase Credentials

1. Go to your Supabase dashboard: https://app.supabase.com/projects
2. Select your ProspectPro project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (looks like: `https://abcd1234.supabase.co`)
   - **Service Role Key** (the `service_role` secret key - NOT the anon key)

### 1.2 Configure Environment File

Edit `/home/node/ProspectPro/.env`:

```bash
# Replace with your actual values
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your_actual_service_role_key_here

# Keep these settings
NODE_ENV=production
PORT=3000
ALLOW_DEGRADED_START=true
DEFAULT_BUDGET_LIMIT=10.00
MIN_CONFIDENCE_SCORE=80
```

## Step 2: Set Up Database (One-time setup)

### 2.1 Run Database Setup

1. Go to your Supabase dashboard
2. Click **SQL Editor** in the sidebar
3. Create a new query
4. Copy and paste the entire contents of: `/home/node/ProspectPro/database/all-phases-consolidated.sql`
5. Click **Run** (this may take 30-60 seconds)
6. You should see "Success. No rows returned" - this is normal

### 2.2 Enable Supabase Vault

1. In the same SQL Editor, create another new query
2. Copy and paste: `/home/node/ProspectPro/database/08-enable-supabase-vault.sql`
3. Click **Run**
4. You should see success messages about creating vault secrets

## Step 3: Add API Keys to Supabase Vault

### 3.1 Access Supabase Vault

1. In your Supabase dashboard, go to **Settings** → **Vault**
2. You should see placeholder secrets already created

### 3.2 Required API Key: Google Places (Minimum for basic functionality)

**Get Google Places API Key:**

1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing
3. Go to **APIs & Services** → **Library**
4. Enable these APIs:
   - Places API
   - Places API (New)
   - Geocoding API
5. Go to **APIs & Services** → **Credentials**
6. Click **Create Credentials** → **API Key**
7. Restrict the key to the above APIs (recommended)
8. Set up billing (Google gives $200/month free credit)

**Add to Supabase Vault:**

1. In Supabase Vault, find `GOOGLE_PLACES_API_KEY`
2. Click **Edit**
3. Paste your Google API key
4. Save

### 3.3 Recommended API Keys (For full functionality)

#### Hunter.io (Email Discovery)

1. Sign up at: https://hunter.io/
2. Go to: https://hunter.io/api_keys
3. Copy your API key
4. In Supabase Vault, edit `HUNTER_IO_API_KEY` and paste it
5. **Free tier**: 25 email searches/month

#### NeverBounce (Email Verification)

1. Sign up at: https://app.neverbounce.com/
2. Go to: Settings → API
3. Copy your API key
4. In Supabase Vault, edit `NEVERBOUNCE_API_KEY` and paste it
5. **Free tier**: 1,000 email verifications/month

#### Foursquare (Location Data)

1. Sign up at: https://developer.foursquare.com/
2. Create an app
3. Copy the API key
4. In Supabase Vault, edit `FOURSQUARE_API_KEY` and paste it
5. **Free tier**: Good limits for small usage

## Step 4: Test Your Setup

### 4.1 Start ProspectPro Server

```bash
cd /home/node/ProspectPro
npm start
```

You should see:

- ✅ Secrets loaded from Supabase Vault
- ✅ Database connection successful
- 🚀 Server listening on port 3000

### 4.2 Test Health Check

```bash
curl http://localhost:3000/health
```

Should return `"status":"ok"` (not "degraded")

### 4.3 Run Your First Real Campaign

```bash
curl -X POST http://localhost:3000/api/business-discovery/discover-businesses \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "plumbing company",
    "location": "San Diego, CA",
    "maxResults": 3,
    "budgetLimit": 2.00,
    "minConfidenceScore": 80
  }'
```

## Step 5: Monitor and Export Results

### 5.1 View Dashboard

Open: http://localhost:3000/admin-dashboard.html

### 5.2 Export Campaign Results

After running a campaign, you'll get a `campaignId`. Use it to export:

```bash
curl http://localhost:3000/api/campaigns/export/YOUR_CAMPAIGN_ID
```

### 5.3 Check Costs

```bash
curl http://localhost:3000/api/dashboard-metrics/costs
```

## API Key Cost Guide

| Service           | Free Tier                 | Paid Rate                      | ProspectPro Usage |
| ----------------- | ------------------------- | ------------------------------ | ----------------- |
| **Google Places** | $200/month credit         | $0.032/search + $0.017/details | ~$0.15 per lead   |
| **Hunter.io**     | 25 searches/month         | $0.034/search                  | ~$0.20 per lead   |
| **NeverBounce**   | 1,000 verifications/month | $0.008/verification            | ~$0.04 per lead   |
| **Foursquare**    | 1,000 requests/day        | Varies                         | ~$0.01 per lead   |

**Total cost per qualified lead: $0.30-0.50**

## Troubleshooting

### "Supabase connection failed"

- Check your SUPABASE_URL and SUPABASE_SECRET_KEY in .env
- Make sure you're using the service_role key, not anon key
- Verify your Supabase project is active (not paused)

### "No secrets loaded from vault"

- Run the vault setup SQL: `08-enable-supabase-vault.sql`
- Check that API keys are actually saved in Supabase Vault (not just placeholders)

### "Google Places API failed"

- Verify billing is enabled in Google Cloud Console
- Check that Places API is enabled
- Test your API key with a simple request

### "Campaign returns empty results"

- Try broader search terms ("plumber" instead of "plumbing company")
- Lower minConfidenceScore to 70
- Check if location is too specific

## File Locations Reference

- **Environment**: `/home/node/ProspectPro/.env`
- **Database SQL**: `/home/node/ProspectPro/database/all-phases-consolidated.sql`
- **Vault Setup**: `/home/node/ProspectPro/database/08-enable-supabase-vault.sql`
- **Server Start**: `npm start` from ProspectPro directory
- **Health Check**: `http://localhost:3000/health`
- **Dashboard**: `http://localhost:3000/admin-dashboard.html`

Once you complete these steps, you'll be able to run unlimited real campaigns with actual API calls and get qualified business leads!
