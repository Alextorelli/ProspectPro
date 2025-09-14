# ProspectPro Deployment Guide

Complete guide for deploying ProspectPro with Supabase integration and all required API keys.

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy)

### Option 2: Render (Free Tier Available)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Option 3: Heroku (Requires Credit Card)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

---

## 📋 Prerequisites Checklist

Before deployment, gather these accounts and API keys:

### Required Services:
- [ ] **Supabase Account** - Database & Authentication
- [ ] **Google Cloud Console** - Places API
- [ ] **ScrapingDog Account** - Website scraping
- [ ] **Hunter.io Account** - Email discovery
- [ ] **NeverBounce Account** - Email validation

---

## 🔧 Step-by-Step Setup

### 1. Set Up Supabase Database

#### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose organization and enter project details:
   - Name: `ProspectPro-Database`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

#### 1.2 Configure Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `docs/supabase-schema.sql`
4. Paste and click "Run"
5. Verify tables are created in **Table Editor**

#### 1.3 Get Supabase Keys
1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):
   ```
   Project URL: https://your-project-id.supabase.co
   API Keys:
   - anon/public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   - service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2. Get Google Places API Key

#### 2.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "ProspectPro-APIs"
3. Enable billing (required for Places API)

#### 2.2 Enable Places API
1. Go to **APIs & Services** → **Library**
2. Search "Places API" and enable:
   - Places API (New)
   - Places API
   - Geocoding API
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **API Key**
5. Copy the API key
6. Click **Restrict Key** and limit to:
   - Places API
   - Geocoding API

**Cost Estimate**: ~$0.032 per search, $0.017 per place details

### 3. Get ScrapingDog API Key

1. Go to [scrapingdog.com](https://www.scrapingdog.com)
2. Sign up for free account (1000 free requests)
3. Go to dashboard and copy your API key
4. For production, consider the Startup plan ($20/month, 100K requests)

**Cost Estimate**: $0.0002 per request after free tier

### 4. Get Hunter.io API Key

1. Go to [hunter.io](https://hunter.io)
2. Sign up for free account (25 requests/month free)
3. Go to **API** section in dashboard
4. Copy your API key
5. For production, consider the Starter plan ($49/month, 1000 requests)

**Cost Estimate**: $0.049 per email search after free tier

### 5. Get NeverBounce API Key

1. Go to [neverbounce.com](https://neverbounce.com)
2. Sign up for free account (1000 free verifications)
3. Go to **Settings** → **API Keys**
4. Click **Generate New Key**
5. Copy the API key
6. For production, consider pay-as-you-go ($0.008 per verification)

**Cost Estimate**: $0.008 per email verification after free tier

---

## 🌐 Deployment Instructions

### Railway Deployment (Recommended)

#### 1. Connect Repository
1. Fork this repository to your GitHub
2. Go to [railway.app](https://railway.app)
3. Click "Deploy from GitHub repo"
4. Select your forked repository
5. Click "Deploy Now"

#### 2. Configure Environment Variables
In Railway dashboard, go to **Variables** tab and add:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys
GOOGLE_PLACES_API_KEY=AIzaSyBvOkBmhvOr1XKC...
SCRAPINGDOG_API_KEY=your-scrapingdog-key
HUNTER_IO_API_KEY=your-hunter-io-key
NEVERBOUNCE_API_KEY=your-neverbounce-key

# Security
PERSONAL_ACCESS_TOKEN=generate-a-strong-token-here
PERSONAL_USER_ID=your-user-id
PERSONAL_EMAIL=your-email@domain.com

# App Configuration
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://your-app.railway.app
```

#### 3. Generate Personal Access Token
```bash
# Generate a secure token (use this command or any password generator)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. Deploy and Test
1. Railway will automatically deploy after adding variables
2. Visit your app URL (shown in Railway dashboard)
3. Test the `/health` endpoint
4. Check `/api/status` for configuration verification

### Render Deployment

#### 1. Connect Repository
1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub and select the repository
4. Configure:
   - **Name**: ProspectPro
   - **Root Directory**: (leave blank)
   - **Environment**: Node
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`

#### 2. Set Environment Variables
Use the same environment variables as Railway above.

#### 3. Deploy
Click "Create Web Service" and wait for deployment.

### Heroku Deployment

#### 1. Install Heroku CLI
```powershell
# Install via npm
npm install -g heroku

# Or download from heroku.com/cli
```

#### 2. Deploy from CLI
```powershell
# Clone your repository
git clone https://github.com/your-username/ProspectPro.git
cd ProspectPro

# Login to Heroku
heroku login

# Create app
heroku create your-prospectpro-app

# Set environment variables
heroku config:set SUPABASE_URL=https://your-project-id.supabase.co
heroku config:set SUPABASE_ANON_KEY=your-anon-key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
heroku config:set GOOGLE_PLACES_API_KEY=your-google-api-key
heroku config:set SCRAPINGDOG_API_KEY=your-scrapingdog-key
heroku config:set HUNTER_IO_API_KEY=your-hunter-io-key
heroku config:set NEVERBOUNCE_API_KEY=your-neverbounce-key
heroku config:set PERSONAL_ACCESS_TOKEN=your-generated-token
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Open your app
heroku open
```

---

## 🔐 Security Configuration

### Personal Access Token
For personal/private deployment, the app uses a simple bearer token auth:

1. Generate a secure token:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Set as `PERSONAL_ACCESS_TOKEN` environment variable

3. Use in API requests:
   ```javascript
   fetch('/api/business/discover', {
     headers: {
       'Authorization': 'Bearer your-personal-access-token',
       'Content-Type': 'application/json'
     }
   })
   ```

### Supabase Row Level Security
The database schema includes RLS policies that restrict access based on user ID. This ensures data isolation if you later expand to multi-user.

---

## 📊 Cost Monitoring

### Expected Monthly Costs (1000 leads):
- **Google Places**: ~$50 (searches + details)
- **ScrapingDog**: ~$20 (website scraping)
- **Hunter.io**: ~$50 (email discovery)
- **NeverBounce**: ~$8 (email validation)
- **Railway/Render**: ~$5-10 (hosting)
- **Supabase**: $0-25 (database, depending on usage)

**Total**: ~$133-163/month for 1000 qualified leads

### Cost Optimization Tips:
1. Use pre-validation scoring to avoid expensive API calls on low-quality businesses
2. Cache business data in Supabase to avoid duplicate API calls
3. Set up API usage alerts in each service
4. Monitor cost per qualified lead in the dashboard

---

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-app-url.com/health
```
Should return status "ok" and Supabase "connected"

### 2. Status Check
```bash
curl -H "Authorization: Bearer your-token" https://your-app-url.com/api/status
```
Should show all API keys configured and database connected

### 3. Business Discovery Test
```bash
curl -X POST https://your-app-url.com/api/business/discover \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"businessType": "restaurant", "location": "New York, NY", "maxResults": 5}'
```

### 4. Run Automated Tests
```bash
# Clone repository locally
git clone https://github.com/your-username/ProspectPro.git
cd ProspectPro

# Install dependencies
npm install

# Run tests
npm run test                  # Zero fake data validation
npm run test:websites        # Website accessibility tests
npm run test:integration     # Full API integration tests
```

---

## 🚨 Troubleshooting

### Common Issues:

#### "Supabase connection failed"
- ✅ Check `SUPABASE_URL` format: `https://your-project-id.supabase.co`
- ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` is the service role key (not anon key)
- ✅ Ensure database schema was applied from `docs/supabase-schema.sql`

#### "Google Places API error"
- ✅ Enable billing in Google Cloud Console
- ✅ Enable Places API and Geocoding API
- ✅ Check API key restrictions match your domain

#### "High API costs"
- ✅ Enable pre-validation scoring in settings
- ✅ Lower `maxResults` in discovery requests
- ✅ Set up usage alerts in each API service

#### "Emails not validating"
- ✅ Check NeverBounce credit balance
- ✅ Verify API key is active
- ✅ Check email format before validation

### Debug Mode:
Set `DEBUG=true` in environment variables for detailed logging.

---

## 🔄 Updates and Maintenance

### Updating the Application:
```bash
# Pull latest changes
git pull origin main

# If using Railway/Render, it will auto-deploy
# If using Heroku:
git push heroku main
```

### Database Migrations:
Future schema changes will be in `docs/migrations/` directory. Apply them via Supabase SQL Editor.

### Monitoring:
- Set up Supabase dashboard monitoring
- Enable Railway/Render/Heroku metrics
- Monitor API usage in respective dashboards

---

## 🎯 Next Steps

After deployment:

1. **Test with real data** using the web interface
2. **Set up monitoring** and usage alerts
3. **Create your first campaign** with a small test batch
4. **Monitor costs** and optimize based on results
5. **Scale up** as you validate the lead quality

Your ProspectPro deployment is now ready to generate high-quality, verified business leads with zero fake data! 🎉