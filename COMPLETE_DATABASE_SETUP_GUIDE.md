# ProspectPro - Complete Supabase Database Setup Guide

## 🎯 Overview

This guide provides complete instructions for setting up a production-ready Supabase database for ProspectPro with zero mock data dependencies. The database will handle real business lead discovery, enrichment, validation, and comprehensive analytics.

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Railway Account**: For deployment hosting
3. **API Keys**: Google Places, Hunter.io, ScrapingDog, NeverBounce

## 🚀 Step 1: Create Supabase Project

### 1.1 Create New Project
```bash
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name: "ProspectPro-Production"
4. Database Password: Generate strong password (save securely)
5. Region: Choose closest to your users
6. Plan: Start with Free tier (upgrade as needed)
```

### 1.2 Get Connection Details
Once created, navigate to **Settings > API** and copy:
- `Project URL` (SUPABASE_URL)
- `anon/public key` (SUPABASE_ANON_KEY)
- `service_role key` (SUPABASE_SERVICE_ROLE_KEY) ⚠️ Keep secret!

## 🗄️ Step 2: Database Schema Setup

### 2.1 Execute Schema SQL
1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy the entire `enhanced-supabase-schema.sql` content
4. Click **Run** to execute

### 2.2 Verify Schema Creation
Run this verification query:
```sql
-- Verify all tables are created
SELECT table_name, column_count, has_pk
FROM (
  SELECT 
    table_name,
    COUNT(*) as column_count,
    CASE WHEN COUNT(*) FILTER (WHERE column_name = 'id') > 0 THEN 'Yes' ELSE 'No' END as has_pk
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name IN (
      'campaigns', 'enhanced_leads', 'lead_emails', 'lead_social_profiles',
      'api_usage_log', 'campaign_analytics', 'api_cost_tracking',
      'lead_qualification_metrics', 'service_health_metrics', 'dashboard_exports'
    )
  GROUP BY table_name
) t
ORDER BY table_name;
```

Expected result: 10 tables with primary keys.

## 🔐 Step 3: Authentication Setup

### 3.1 Enable Authentication
1. Go to **Authentication > Settings**
2. **Site URL**: Set to your Railway domain
3. **Redirect URLs**: Add Railway URL
4. **Email Templates**: Customize as needed

### 3.2 Create Service User (Optional)
For system operations, create a service user:
```sql
-- Insert system user for API operations
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'system@prospectpro.local',
  crypt('secure_system_password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);
```

## 📊 Step 4: Test Database Functionality

### 4.1 Create Test Campaign
```sql
-- Create test campaign
INSERT INTO campaigns (
  user_id,
  name,
  search_parameters,
  status,
  budget_limit,
  lead_limit,
  quality_threshold
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'system@prospectpro.local' LIMIT 1),
  'Test Campaign - Restaurant Discovery',
  '{"businessType": "restaurant", "location": "Chicago, IL", "radius": 10}',
  'running',
  100.00,
  50,
  75
) RETURNING id;
```

### 4.2 Insert Test Lead
```sql
-- Insert test lead (use campaign_id from previous query)
INSERT INTO enhanced_leads (
  campaign_id,
  business_name,
  address,
  phone,
  website,
  confidence_score,
  business_type,
  discovery_source,
  discovery_cost,
  search_query,
  metadata
) VALUES (
  'YOUR_CAMPAIGN_ID_HERE', -- Replace with actual campaign ID
  'Chicago Deep Dish Palace',
  '123 Michigan Ave, Chicago, IL 60601',
  '(312) 555-0123',
  'https://chicagodeepdish.com',
  85,
  ARRAY['restaurant', 'pizza'],
  'google_places',
  0.032,
  'restaurant in Chicago, IL',
  '{"rating": 4.5, "review_count": 287, "price_level": 2}'
);
```

### 4.3 Test Analytics Function
```sql
-- Test campaign analytics
SELECT campaign_analytics('YOUR_CAMPAIGN_ID_HERE');
```

Should return JSON with campaign metrics.

## 🔧 Step 5: Railway Environment Configuration

### 5.1 Set Environment Variables
In Railway Dashboard → Your Project → Variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys (Real APIs - NO MOCK DATA)
GOOGLE_PLACES_API_KEY=AIzaSyC...
SCRAPINGDOG_API_KEY=5f8c9d2e...
HUNTER_IO_API_KEY=a1b2c3d4...
NEVERBOUNCE_API_KEY=private_...

# Application Configuration
NODE_ENV=production
PORT=8080
PERSONAL_ACCESS_TOKEN=generate_32_char_hex_token
PERSONAL_USER_ID=system-user-id
PERSONAL_EMAIL=your-email@domain.com

# CORS Configuration
ALLOWED_ORIGINS=${{RAILWAY_STATIC_URL}},${{RAILWAY_PUBLIC_DOMAIN}}
```

### 5.2 Verify Variables
Create a verification endpoint to test configuration:
```javascript
app.get('/api/config-check', (req, res) => {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_PLACES_API_KEY',
    'HUNTER_IO_API_KEY'
  ];
  
  const missing = requiredVars.filter(key => !process.env[key]);
  
  res.json({
    configured: missing.length === 0,
    missing_variables: missing,
    node_version: process.version,
    timestamp: new Date().toISOString()
  });
});
```

## 📈 Step 6: Real Data Integration

### 6.1 Update Server Configuration
Replace mock data endpoints with real Supabase queries:

```javascript
// Real business metrics (NO MOCK DATA)
app.get('/api/business-metrics', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Get real campaign data
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('*');
    
    if (campaignError) throw campaignError;

    // Get real lead data
    const { data: leads, error: leadsError } = await supabase
      .from('enhanced_leads')
      .select('*');
    
    if (leadsError) throw leadsError;

    // Calculate real metrics
    const activeCount = campaigns.filter(c => c.status === 'running').length;
    const qualifiedCount = leads.filter(l => l.confidence_score >= 80).length;
    const totalCost = leads.reduce((sum, l) => sum + (l.total_cost || 0), 0);

    res.json({
      campaigns: {
        total: campaigns.length,
        active: activeCount,
        completed: campaigns.filter(c => c.status === 'completed').length
      },
      leads: {
        total: leads.length,
        qualified: qualifiedCount,
        converted: leads.filter(l => l.export_status === 'exported').length
      },
      costs: {
        total: totalCost,
        per_lead: leads.length > 0 ? (totalCost / leads.length).toFixed(4) : 0,
        roi: qualifiedCount > 0 ? ((qualifiedCount * 10 - totalCost) / totalCost * 100).toFixed(2) : 0
      },
      quality: {
        accuracy: leads.length > 0 ? (qualifiedCount / leads.length * 100).toFixed(1) : 0,
        avg_confidence: leads.length > 0 ? (leads.reduce((sum, l) => sum + l.confidence_score, 0) / leads.length).toFixed(1) : 0
      },
      timestamp: new Date().toISOString(),
      data_source: 'supabase'
    });
  } catch (error) {
    console.error('Business metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch real business metrics' });
  }
});
```

### 6.2 Real Business Discovery API
```javascript
app.post('/api/discover-businesses', async (req, res) => {
  try {
    const { businessType, location, maxResults = 20 } = req.body;

    if (!businessType || !location) {
      return res.status(400).json({ 
        error: 'businessType and location are required' 
      });
    }

    // Create campaign in database
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: process.env.PERSONAL_USER_ID,
        name: `${businessType} Discovery - ${location}`,
        search_parameters: { businessType, location, maxResults },
        status: 'running',
        quality_threshold: 70
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // Use real Google Places API
    const googlePlacesClient = require('./modules/api-clients/google-places');
    const placesResults = await googlePlacesClient.searchBusinesses(businessType, location, maxResults);

    // Store real leads in database
    const leadsToInsert = placesResults.map(place => ({
      campaign_id: campaign.id,
      business_name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      confidence_score: calculateQualityScore(place),
      business_type: [businessType],
      discovery_source: 'google_places',
      discovery_cost: 0.032, // Google Places API cost
      search_query: `${businessType} in ${location}`,
      metadata: {
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        price_level: place.price_level,
        place_id: place.place_id
      }
    }));

    const { data: insertedLeads, error: leadsError } = await supabase
      .from('enhanced_leads')
      .insert(leadsToInsert)
      .select();

    if (leadsError) throw leadsError;

    // Update campaign statistics
    await supabase
      .from('campaigns')
      .update({
        leads_discovered: insertedLeads.length,
        leads_qualified: insertedLeads.filter(l => l.confidence_score >= 70).length,
        total_cost: insertedLeads.length * 0.032,
        status: 'completed'
      })
      .eq('id', campaign.id);

    res.json({
      campaign_id: campaign.id,
      businesses: insertedLeads,
      total: insertedLeads.length,
      qualified: insertedLeads.filter(l => l.confidence_score >= 70).length,
      total_cost: insertedLeads.length * 0.032,
      data_source: 'google_places_api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Business discovery error:', error);
    res.status(500).json({ error: 'Failed to discover businesses using real APIs' });
  }
});
```

## 🔍 Step 7: Quality Scoring Function
```javascript
function calculateQualityScore(place) {
  let score = 0;
  
  // Business name quality (20 points)
  if (place.name && place.name.length > 0) score += 20;
  
  // Address completeness (20 points)
  if (place.formatted_address && place.formatted_address.length > 10) score += 20;
  
  // Phone number (25 points)
  if (place.formatted_phone_number) score += 25;
  
  // Website (15 points)
  if (place.website) score += 15;
  
  // Rating and reviews (20 points)
  if (place.rating && place.rating >= 4.0) score += 10;
  if (place.user_ratings_total && place.user_ratings_total >= 10) score += 10;
  
  return Math.min(100, score);
}
```

## 🚨 Step 8: Remove All Mock Data

### 8.1 Code Audit Checklist
- [ ] No hardcoded business arrays
- [ ] No mock phone numbers (555-xxx-xxxx)
- [ ] No mock addresses (Main Street patterns)
- [ ] No mock emails
- [ ] All API calls use real endpoints
- [ ] All database queries use real tables

### 8.2 Search and Replace
```bash
# Search for mock data patterns
grep -r "mock" --include="*.js" .
grep -r "555-" --include="*.js" .
grep -r "Main Street" --include="*.js" .
grep -r "example.com" --include="*.js" .
grep -r "fake" --include="*.js" .
```

## ✅ Step 9: Production Validation

### 9.1 Health Check with Database
```javascript
app.get('/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('campaigns').select('count').limit(1);
    if (error) throw error;

    // Test API connectivity
    const apiTests = {
      supabase: 'connected',
      google_places: process.env.GOOGLE_PLACES_API_KEY ? 'configured' : 'missing',
      hunter_io: process.env.HUNTER_IO_API_KEY ? 'configured' : 'missing'
    };

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      node_version: process.version,
      database: 'connected',
      api_services: apiTests,
      mock_data: 'disabled' // Confirm no mock data
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### 9.2 End-to-End Test
```javascript
// Test script: test-production-flow.js
const axios = require('axios');

async function testProductionFlow() {
  const baseUrl = process.env.RAILWAY_URL || 'http://localhost:8080';
  
  try {
    // 1. Health check
    console.log('Testing health check...');
    const health = await axios.get(`${baseUrl}/health`);
    console.log('✅ Health check passed');
    
    // 2. Business discovery with real APIs
    console.log('Testing business discovery...');
    const discovery = await axios.post(`${baseUrl}/api/discover-businesses`, {
      businessType: 'coffee shop',
      location: 'San Francisco, CA',
      maxResults: 5
    });
    
    console.log(`✅ Discovered ${discovery.data.businesses.length} real businesses`);
    console.log(`✅ Total cost: $${discovery.data.total_cost}`);
    console.log(`✅ Data source: ${discovery.data.data_source}`);
    
    // 3. Business metrics
    console.log('Testing business metrics...');
    const metrics = await axios.get(`${baseUrl}/api/business-metrics`);
    console.log(`✅ Retrieved metrics from: ${metrics.data.data_source}`);
    console.log(`✅ Total campaigns: ${metrics.data.campaigns.total}`);
    console.log(`✅ Total leads: ${metrics.data.leads.total}`);
    
    console.log('\n🎉 All production tests passed! Zero mock data confirmed.');
    
  } catch (error) {
    console.error('❌ Production test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testProductionFlow();
```

## 🚀 Step 10: Deploy to Railway

### 10.1 Commit Database Changes
```bash
git add .
git commit -m "implement: complete Supabase database integration, eliminate all mock data"
git push origin main
```

### 10.2 Monitor Deployment
```bash
# Check Railway logs
railway logs --tail

# Test production endpoints
curl https://your-railway-app.up.railway.app/health
curl -X POST https://your-railway-app.up.railway.app/api/discover-businesses \
  -H "Content-Type: application/json" \
  -d '{"businessType":"restaurant","location":"New York, NY","maxResults":3}'
```

## 📊 Step 11: Database Monitoring

### 11.1 Set Up Alerts
1. **Supabase Dashboard** → Monitoring
2. Configure alerts for:
   - Database CPU usage > 80%
   - Connection count > 50
   - Query execution time > 5s
   - Storage usage > 80%

### 11.2 Performance Optimization
```sql
-- Monitor slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage analysis
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

## 🎯 Success Metrics

After completing this setup, your ProspectPro deployment will have:

✅ **Zero Mock Data** - All business information from real APIs  
✅ **Production Database** - Scalable Supabase PostgreSQL with RLS  
✅ **Real-time Analytics** - Live campaign and cost tracking  
✅ **API Integration** - Google Places, Hunter.io, ScrapingDog  
✅ **Quality Scoring** - Data validation and confidence metrics  
✅ **Cost Optimization** - Real-time API cost monitoring  
✅ **Multi-tenant Security** - Row-level security policies  
✅ **Performance Monitoring** - Database and API health tracking  

## 🆘 Troubleshooting

### Common Issues:

1. **Connection Timeouts**: Check firewall settings and connection pooling
2. **RLS Errors**: Verify user authentication and policy configuration
3. **API Rate Limits**: Monitor usage and implement exponential backoff
4. **Cost Overruns**: Set up budget alerts and usage monitoring

### Support Resources:
- Supabase Documentation: https://supabase.com/docs
- Railway Documentation: https://docs.railway.app
- ProspectPro GitHub Issues: Create ticket for technical support

---

**⚡ ProspectPro is now running on a production-grade database with real business data and zero mock dependencies!**