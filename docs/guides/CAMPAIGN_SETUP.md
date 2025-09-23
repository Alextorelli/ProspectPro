# ProspectPro Real Campaign Setup Instructions

## Quick Start (3 Steps)

### Step 1: Configure Supabase Connection

Edit `.env` file with your Supabase credentials:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your_service_role_key_here
```

### Step 2: Setup Database

Run this SQL file in your Supabase Dashboard → SQL Editor:

```bash
database/all-phases-consolidated.sql
```

### Step 3: Add API Keys to Supabase Vault

Go to Supabase Dashboard → Settings → Vault and add:

#### Required for Lead Discovery (minimum viable):

- `GOOGLE_PLACES_API_KEY` - Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  - Enable: Places API, Places Details API, Geocoding API
  - Cost: ~$0.032 per search, $0.017 per details

#### Optional but Recommended:

- `HUNTER_IO_API_KEY` - Get from [Hunter.io](https://hunter.io/api_keys)
  - 25 free searches/month, then $0.04 per search
- `NEVERBOUNCE_API_KEY` - Get from [NeverBounce](https://app.neverbounce.com/settings/api)
  - 1000 free verifications/month, then $0.008 per verification
- `FOURSQUARE_API_KEY` - Get from [Foursquare Developer](https://developer.foursquare.com/)
  - For location verification and additional business data

## Launch Real Campaign

Once configured, run:

```bash
npm start                           # Start ProspectPro server
node launch-real-campaign.js       # Launch the real campaign
```

Or make direct API call:

```bash
curl -X POST http://localhost:3000/api/business-discovery/discover-businesses \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "plumbing company",
    "location": "San Diego, CA",
    "maxResults": 5,
    "budgetLimit": 2.50,
    "minConfidenceScore": 80,
    "additionalQueries": ["wellness studio San Diego", "beauty salon San Diego"]
  }'
```

## What Happens During Real Campaign

1. **Google Places Search**: Finds 20-30 initial businesses (~$0.10)
2. **Pre-validation**: Filters out fake/generic businesses (free)
3. **Website Verification**: Tests all websites are accessible (free)
4. **Email Discovery**: Hunter.io finds business emails (~$0.60)
5. **Email Verification**: NeverBounce validates deliverability (~$0.04)
6. **Final Scoring**: Calculates confidence scores (free)
7. **Export**: Returns only 80%+ confidence leads

**Expected Result**: 5 qualified leads for ~$0.75-$1.25 total cost

## Monitoring & Export

- **Real-time Dashboard**: http://localhost:3000/admin-dashboard.html
- **Health Check**: http://localhost:3000/health
- **Campaign Export**: GET /api/campaigns/export/{campaignId}
- **Cost Tracking**: Stored in `api_cost_tracking` table
- **Lead Storage**: All leads in `enhanced_leads` table

## Troubleshooting

### Server won't start:

```bash
# Check health status
curl http://localhost:3000/health

# Check logs for missing modules
npm install
```

### Database connection fails:

```bash
# Verify Supabase credentials in .env
# Run database setup SQL files
# Check Supabase project is active
```

### API keys not loading:

```bash
# Verify Vault is enabled: database/08-enable-supabase-vault.sql
# Check keys are in Supabase Dashboard → Vault
# Ensure service role key has vault access
```

### Campaign returns no results:

- Check Google Places API has proper billing enabled
- Verify geographic location is valid
- Try broader business type search terms
- Lower minConfidenceScore if needed

## Cost Estimates

| Service       | Free Tier                    | Cost After                         | Per Lead Cost  |
| ------------- | ---------------------------- | ---------------------------------- | -------------- |
| Google Places | $200/month credit            | $0.049 per request                 | $0.10-0.15     |
| Hunter.io     | 25 searches/month            | $0.04 per search                   | $0.20-0.40     |
| NeverBounce   | 1000 verifications/month     | $0.008 per verification            | $0.04-0.08     |
| **Total**     | **Good for ~50 leads/month** | **~$0.50-1.00 per qualified lead** | **$0.34-0.63** |

ProspectPro is designed to maximize your free tier usage and minimize costs through intelligent pre-validation.
