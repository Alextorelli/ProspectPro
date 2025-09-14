# Environment Variables Setup

Complete environment configuration for ProspectPro deployment.

## 📝 Environment Variables Template

Copy this template to your `.env` file and fill in your actual values:

```env
# =====================================
# SUPABASE CONFIGURATION
# =====================================
# Get these from: https://app.supabase.com/project/[your-project]/settings/api

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjcwMDAwMDAwLCJleHAiOjE5ODU1NzYwMDB9.your-anon-key-signature
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NzAwMDAwMDAsImV4cCI6MTk4NTU3NjAwMH0.your-service-role-key-signature

# =====================================
# API KEYS
# =====================================

# Google Places API - Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_PLACES_API_KEY=AIzaSyBvOkBmhvOr1XKC...

# ScrapingDog API - Get from: https://www.scrapingdog.com/dashboard
SCRAPINGDOG_API_KEY=your-scrapingdog-api-key

# Hunter.io API - Get from: https://hunter.io/api_keys  
HUNTER_IO_API_KEY=your-hunter-io-api-key

# NeverBounce API - Get from: https://app.neverbounce.com/settings/api
NEVERBOUNCE_API_KEY=your-neverbounce-api-key

# =====================================
# AUTHENTICATION & SECURITY
# =====================================

# Personal Access Token (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
PERSONAL_ACCESS_TOKEN=your-secure-64-character-hex-token

# Personal User Configuration
PERSONAL_USER_ID=your-unique-user-id
PERSONAL_EMAIL=your-email@domain.com

# =====================================
# APPLICATION CONFIGURATION
# =====================================

# Environment
NODE_ENV=production

# Server Port (Railway/Render will override this)
PORT=3000

# CORS Origins (comma-separated for multiple domains)
ALLOWED_ORIGINS=https://your-app.railway.app,https://your-domain.com

# =====================================
# OPTIONAL SETTINGS
# =====================================

# Skip authentication in development (DO NOT SET IN PRODUCTION)
# SKIP_AUTH_IN_DEV=true

# Enable debug logging
# DEBUG=true

# Rate limiting (requests per minute per IP)
# RATE_LIMIT_REQUESTS=100

# Request timeout (milliseconds)
# REQUEST_TIMEOUT=30000
```

## 🔧 Platform-Specific Instructions

### Railway Deployment

1. Go to your Railway dashboard
2. Select your ProspectPro service
3. Click **Variables** tab
4. Add each variable individually:

```
Variable Name: SUPABASE_URL
Value: https://your-project-id.supabase.co
```

### Render Deployment

1. Go to your Render dashboard
2. Select your ProspectPro service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable from the template above

### Heroku Deployment

Using Heroku CLI:

```powershell
# Set all environment variables
heroku config:set SUPABASE_URL=https://your-project-id.supabase.co
heroku config:set SUPABASE_ANON_KEY=your-anon-key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
heroku config:set GOOGLE_PLACES_API_KEY=your-google-api-key
heroku config:set SCRAPINGDOG_API_KEY=your-scrapingdog-key
heroku config:set HUNTER_IO_API_KEY=your-hunter-io-key
heroku config:set NEVERBOUNCE_API_KEY=your-neverbounce-key
heroku config:set PERSONAL_ACCESS_TOKEN=your-generated-token
heroku config:set PERSONAL_USER_ID=your-user-id
heroku config:set PERSONAL_EMAIL=your-email@domain.com
heroku config:set NODE_ENV=production

# View all config vars
heroku config
```

## 🎯 Getting Your API Keys

### 1. Supabase Keys

1. **Create Project**: [supabase.com](https://supabase.com) → New Project
2. **Get Keys**: Project Dashboard → Settings → API
3. **Copy Values**:
   - `SUPABASE_URL`: Project URL
   - `SUPABASE_ANON_KEY`: anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key (⚠️ Keep secret!)

### 2. Google Places API Key

1. **Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)
2. **Create Project**: "ProspectPro-APIs"
3. **Enable APIs**: 
   - Places API (New)
   - Places API
   - Geocoding API
4. **Create Credentials**: APIs & Services → Credentials → Create API Key
5. **Restrict Key**: Click on key → Restrict to Places APIs only

**⚠️ Important**: Enable billing or you'll get "This API project is not authorized to use this API" errors.

### 3. ScrapingDog API Key

1. **Sign Up**: [scrapingdog.com](https://www.scrapingdog.com)
2. **Dashboard**: Copy API key from dashboard
3. **Free Tier**: 1,000 requests/month
4. **Upgrade**: Startup plan ($20/month, 100K requests)

### 4. Hunter.io API Key

1. **Sign Up**: [hunter.io](https://hunter.io)
2. **API Section**: Dashboard → API
3. **Copy Key**: Your API key
4. **Free Tier**: 25 requests/month
5. **Upgrade**: Starter plan ($49/month, 1K requests)

### 5. NeverBounce API Key

1. **Sign Up**: [neverbounce.com](https://neverbounce.com)
2. **API Keys**: Settings → API Keys → Generate New Key
3. **Copy Key**: Your API key  
4. **Free Tier**: 1,000 verifications
5. **Pay-as-you-go**: $0.008 per verification

## 🔐 Security Best Practices

### Personal Access Token Generation

Generate a cryptographically secure token:

```javascript
// Method 1: Node.js crypto
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

// Method 2: OpenSSL
openssl rand -hex 32

// Method 3: Online generator (use reputable sites)
// - passwordsgenerator.net
// - random.org/strings
```

### Key Management

1. **Never commit keys to Git**:
   ```gitignore
   # .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Use different keys for different environments**:
   - Development: `.env.local`
   - Staging: `.env.staging` 
   - Production: Platform environment variables

3. **Rotate keys regularly**:
   - Personal tokens: Every 90 days
   - API keys: When team members leave

4. **Monitor key usage**:
   - Set up usage alerts in API dashboards
   - Review access logs monthly

## 🧪 Validating Configuration

### Test Your Environment Setup

Create a test script to validate all keys:

```javascript
// test-config.js
require('dotenv').config();

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_PLACES_API_KEY',
  'SCRAPINGDOG_API_KEY',
  'HUNTER_IO_API_KEY',
  'NEVERBOUNCE_API_KEY',
  'PERSONAL_ACCESS_TOKEN'
];

console.log('🔧 Environment Configuration Check');
console.log('=====================================');

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? `${value.substring(0, 8)}...` : 'NOT SET';
  
  console.log(`${status} ${varName}: ${display}`);
  
  if (!value) allConfigured = false;
});

console.log('=====================================');
console.log(allConfigured ? '🎉 All required variables configured!' : '⚠️  Some variables missing');

// Test API format validation
if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('https://')) {
  console.log('❌ SUPABASE_URL must start with https://');
  allConfigured = false;
}

if (process.env.GOOGLE_PLACES_API_KEY && !process.env.GOOGLE_PLACES_API_KEY.startsWith('AIza')) {
  console.log('⚠️  GOOGLE_PLACES_API_KEY should start with "AIza"');
}

process.exit(allConfigured ? 0 : 1);
```

Run the test:
```bash
node test-config.js
```

### Production Deployment Checklist

- [ ] All environment variables set
- [ ] API keys have sufficient credits/quota
- [ ] Supabase database schema applied
- [ ] Personal access token is secure (64+ characters)
- [ ] CORS origins match your deployment domain
- [ ] NODE_ENV set to "production"
- [ ] No development flags enabled
- [ ] API key restrictions configured (Google)
- [ ] Usage monitoring enabled for all APIs
- [ ] Billing alerts set up

## 🚨 Common Issues & Solutions

### "Invalid API key" errors
- ✅ Check for extra spaces or quotes around keys
- ✅ Verify key is active in service dashboard
- ✅ Ensure API is enabled (Google Cloud Console)

### "Database connection failed" 
- ✅ Verify SUPABASE_URL format: `https://abc.supabase.co`
- ✅ Use service_role key for SUPABASE_SERVICE_ROLE_KEY
- ✅ Check database schema was applied

### "Unauthorized access"
- ✅ PERSONAL_ACCESS_TOKEN must match exactly
- ✅ Use Bearer token format in Authorization header
- ✅ Check if SKIP_AUTH_IN_DEV is accidentally enabled

### Rate limiting issues
- ✅ Monitor API usage in service dashboards  
- ✅ Implement request queuing for high volume
- ✅ Consider upgrading API plans if needed

---

Your environment is now ready for ProspectPro deployment! 🚀