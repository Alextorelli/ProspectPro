# ProspectPro v4.2 - Complete Email Discovery & Verification Platform

## CRITICAL: Current Production State

- **Version**: 4.2.0 (User-Aware Email Discovery & Verification System - PRODUCTION READY)
- **Deployment**: User-Aware Frontend + Supabase Edge Functions (serverless, auto-scaling)
- **Environment**: Supabase environment variables + Edge Function secrets + User authentication
- **Architecture**: Supabase-first serverless with user-aware campaign ownership and complete contact enrichment
- **Quality Standard**: Zero fake data - verified contacts with 95% email accuracy
- **Backend**: 100% Supabase Edge Functions (user-aware discovery, enrichment, verification, export)
- **User Management**: Complete authentication system with anonymous and authenticated user support
- **Repository**: https://github.com/Alextorelli/ProspectPro (Complete user-aware enrichment codebase)

## CRITICAL: VERIFIED DATA ARCHITECTURE

**ZERO FAKE DATA PHILOSOPHY**

- ✅ Verified Contacts Only: No pattern-generated emails or fake data
- ✅ Professional Verification: Apollo, licensing boards, chamber directories
- ✅ Transparent Sources: Clear attribution for all contact data
- ✅ Quality Baseline: Verification assumed, not advertised
- ✅ Real Business Intelligence: Authentic professional contacts only
- ❌ NO fake email patterns (info@, contact@, hello@, sales@)
- ❌ NO generated contact information
- ❌ NO speculative data points

**VERIFICATION SOURCES**

- **Google Place Details API**: Complete phone/website verification (100% coverage)
- **Hunter.io API**: Professional email discovery with confidence scoring ($0.034/search)
- **NeverBounce API**: Real-time email deliverability verification (95% accuracy, $0.008/verification)
- **Apollo API**: Executive and owner contact discovery ($1.00 per verified contact, OPTIONAL)
- **Professional Licensing**: State licensing boards (CPA, Healthcare, Legal)
- **Chamber of Commerce**: Membership verification and directory contacts
- **Trade Associations**: Industry-specific membership validation
- **Foursquare Places API**: Enhanced business discovery with category data

## CRITICAL: SUPABASE-FIRST ARCHITECTURE

**DEPLOYMENT PHILOSOPHY**

- ✅ Supabase Edge Functions: All backend logic with user authentication (OPERATIONAL)
- ✅ React/Vite Frontend: User-aware interface deployed to Vercel domain (READY)
- ✅ Supabase Database: Native integration with Row Level Security and user-campaign linking
- ✅ Supabase Real-time: Ready for live updates and notifications
- ✅ Supabase Auth: Complete user authentication with anonymous session support
- ✅ Vercel Static Hosting: Consistent domain deployment (cost-effective)
- ❌ NO server.js, Express.js, or Node.js containers
- ❌ NO Cloud Run containers or complex deployment pipelines
- ✅ Supabase Environment Variables: Native Edge Function configuration

**CI/CD DEPLOYMENT PROCESS**

- **Frontend**: React/Vite app → `npm run build` → deploy `/dist` to Vercel → Custom domain
- **Backend**: Supabase Edge Functions → `supabase functions deploy`
- **Production URL**: https://prospect-fyhedobh1-appsmithery.vercel.app (ALWAYS ACCESSIBLE)
- **Hosting**: Vercel with native Vite framework detection and optimization
- **Build**: Required before deployment (`npm run build` creates `/dist`)
- **Domain**: Custom domain always points to latest deployment
- **Framework**: Native Vite detection enables automatic build optimization
- **User Authentication**: Supabase Auth with JWT tokens and session management

**PLATFORM SPECIALIZATION**

- **GitHub**: Minimal repo management, documentation, version control
- **Supabase**: Database, Edge Functions, real-time, authentication, storage
- **Static Host**: Frontend files only (Cloud Storage, Vercel, Netlify)

## CRITICAL: EDGE FUNCTIONS STATUS (v4.2)

**PRODUCTION EDGE FUNCTIONS (6 ACTIVE - USER-AWARE)**

- ✅ `business-discovery-user-aware` (v2) - Complete user authentication with session management and database storage
- ✅ `campaign-export-user-aware` (v2) - User-authorized export with data isolation and access control
- ✅ `enrichment-hunter` (v1) - Hunter.io email discovery with all 6 API endpoints and 24-hour caching
- ✅ `enrichment-neverbounce` (v1) - NeverBounce email verification with 1,000 free/month quota management
- ✅ `enrichment-orchestrator` (v1) - Intelligent multi-service coordination with budget controls
- ✅ `test-google-places` (v1) - API testing function
- ✅ Real-time database integration with user-aware campaign and lead tracking
- ✅ Global edge deployment with <100ms cold starts
- ✅ User authentication via JWT tokens and new API key format
- ✅ Functions URL: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/

**USER-AWARE DATABASE ARCHITECTURE**

Core tables (security hardened, RLS optimized, user-aware):

```sql
-- Campaigns table (user-aware schema)
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  business_type TEXT NOT NULL,
  location TEXT NOT NULL,
  target_count INTEGER DEFAULT 10,
  budget_limit DECIMAL(10,4) DEFAULT 50.0,
  min_confidence_score INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending',
  results_count INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  processing_time_ms INTEGER,
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table (user-aware with enrichment data)
CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id),
  business_name TEXT NOT NULL,
  address TEXT,
  phone TEXT, -- 100% coverage via Google Place Details
  website TEXT, -- 95% coverage via Google Place Details
  email TEXT, -- Verified emails only from Hunter.io + NeverBounce
  confidence_score INTEGER DEFAULT 0,
  score_breakdown JSONB,
  validation_cost DECIMAL(10,4) DEFAULT 0,
  enrichment_data JSONB, -- Hunter.io, NeverBounce, Apollo results
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  cost_efficient BOOLEAN DEFAULT true,
  scoring_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard exports table (user-aware)
CREATE TABLE dashboard_exports (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id),
  export_type TEXT DEFAULT 'lead_export',
  file_format TEXT DEFAULT 'csv',
  row_count INTEGER DEFAULT 0,
  export_status TEXT DEFAULT 'completed',
  user_id UUID REFERENCES auth.users(id),
  session_user_id TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-aware analytics view with RLS
CREATE VIEW campaign_analytics
WITH (security_invoker = true)
AS SELECT
  c.id, c.business_type, c.location, c.target_count, c.min_confidence_score,
  c.status, c.results_count, c.total_cost, c.budget_limit, c.processing_time_ms,
  c.created_at, c.user_id, c.session_user_id,
  COUNT(l.id) AS actual_leads,
  COALESCE(AVG(l.confidence_score), 0)::numeric(10,2) AS avg_confidence
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
WHERE
    c.user_id = auth.uid() OR
    (auth.uid() IS NULL AND c.session_user_id IS NOT NULL)
GROUP BY c.id, c.business_type, c.location, c.target_count, c.min_confidence_score,
         c.status, c.results_count, c.total_cost, c.budget_limit, c.processing_time_ms,
         c.created_at, c.user_id, c.session_user_id;
```

## CRITICAL: MECE BUSINESS TAXONOMY

**16 COMPREHENSIVE CATEGORIES** (300+ optimized business types):

```javascript
// MECE structure optimized for Google Places & Foursquare APIs
const BUSINESS_CATEGORIES = {
  "Professional Services": ["Accounting & Tax", "Legal Services", "Consulting", ...17 types],
  "Financial Services": ["Banks & Credit Unions", "Insurance", "Investment", ...11 types],
  "Healthcare & Medical": ["Primary Care", "Specialists", "Dental", ...26 types],
  "Technology & Software": ["IT Services", "Software Development", "Digital Marketing", ...12 types],
  "Food & Beverage": ["Restaurants", "Cafes & Coffee", "Bars & Nightlife", ...15 types],
  "Retail & Shopping": ["Clothing & Fashion", "Electronics", "Home & Garden", ...18 types],
  "Real Estate & Construction": ["Real Estate", "General Contractors", "Architecture", ...12 types],
  "Education & Training": ["Schools", "Universities", "Training Centers", ...8 types],
  "Entertainment & Recreation": ["Entertainment", "Sports & Fitness", "Arts", ...11 types],
  "Transportation & Logistics": ["Auto Services", "Transportation", "Logistics", ...9 types],
  "Beauty & Personal Care": ["Salons & Spas", "Beauty Services", "Wellness", ...8 types],
  "Home & Local Services": ["Cleaning", "Repair Services", "Landscaping", ...12 types],
  "Manufacturing & Industrial": ["Manufacturing", "Wholesale", "Industrial", ...8 types],
  "Non-Profit & Government": ["Non-Profit", "Government", "Religious", ...6 types],
  "Travel & Hospitality": ["Hotels & Lodging", "Travel Services", "Event Planning", ...7 types],
  "Agriculture & Environment": ["Farming", "Environmental", "Pet Services", ...6 types]
};
```

## CRITICAL: REPOSITORY CLEANLINESS ENFORCEMENT

**CLEAN SUPABASE-FIRST STRUCTURE**

- ✅ Core production files: Edge Functions, static frontend, database schema
- ✅ `/supabase/functions/` - 2 essential Edge Functions only
- ✅ `/public/` - Static frontend with MECE taxonomy integration
- ✅ `/database/` - Cleaned schema with security fixes applied
- ❌ NO server.js, Express routes, or Node.js backend files
- ❌ NO Docker containers, Cloud Run configs, or build pipelines
- ❌ NO complex deployment scripts or container orchestration

**FILE ORGANIZATION RULES**

- Edge Functions → `/supabase/functions/` folder ONLY
- Frontend → React/Vite app in root with `/dist` build output
- Database → `/database/` folder ONLY
- Documentation → `/docs/` folder ONLY
- Archive material → `/archive/` folder ONLY

**SUPABASE-FIRST APPROACH**

- Main branch = CLEAN Supabase-first architecture
- No legacy server infrastructure
- All backend logic in Edge Functions
- Maintain minimal, serverless structure

## CRITICAL: DEPLOYMENT STATUS & TROUBLESHOOTING

**CURRENT DEPLOYMENT STATE**

- **Production URL**: https://prospect-fyhedobh1-appsmithery.vercel.app (PRIMARY ACCESS POINT)
- **Hosting Platform**: Vercel project `appsmithery/prospect-pro`
- **Custom Domain**: Always accessible via prospect-fyhedobh1-appsmithery.vercel.app
- **Build Process**: `npm run build` → `/dist` directory
- **Deployment Source**: Always deploy from `/dist` directory
- **Edge Functions**: OPERATIONAL (user-aware discovery and export tested successfully)
- **Database**: RLS policies configured, user-campaign linking implemented
- **API Keys**: All configured in Supabase Edge Function secrets (new sb\_\* format)
- **Anon Key**: Updated to current valid JWT token
- **User Authentication**: Complete signup/signin system with session management

**VERIFIED WORKING COMPONENTS**

- ✅ React/Vite frontend builds successfully to `/dist`
- ✅ Vercel deployment with native Vite framework detection
- ✅ Custom domain with optimal CDN caching
- ✅ Zero build warnings (Node.js + PostCSS optimized)
- ✅ Edge Function `business-discovery-user-aware` returns real business data with user context
- ✅ Edge Function `campaign-export-user-aware` provides user-authorized exports
- ✅ Database tables created with proper RLS policies and user linking
- ✅ API integrations (Google Places, Foursquare, Hunter.io) configured
- ✅ Smart deployment script handles build and deploy process
- ✅ MECE taxonomy integration with 16 categories and 300+ business types
- ✅ User authentication with anonymous session support
- ✅ Campaign ownership and data isolation

**CRITICAL TROUBLESHOOTING PATTERNS**

1. **"Blank Page" / Frontend Not Loading**

   - **Root Cause**: Deploying source files instead of built React app
   - **Solution**: Build first with `npm run build`, then deploy from `/dist`
   - **Command**: `npm run build && cd dist && vercel --prod`
   - **Auto-Deploy**: Use `./scripts/deploy.sh` for smart detection

2. **"Invalid JWT" / 401 Errors**

   - **Root Cause**: Anon key mismatch between frontend and Supabase
   - **Solution**: Get current anon key from Supabase dashboard → Settings → API
   - **Update**: Replace anon key in React app's Supabase configuration
   - **Redeploy**: `npm run build && cd dist && vercel --prod`

3. **"API request failed: 404" Errors**

   - **Root Cause**: Database RLS policies blocking anon access
   - **Solution**: Run `/database/remove-security-definer.sql` in Supabase SQL editor
   - **Verify**: Check policies with `SELECT * FROM campaigns WHERE business_type = 'test'`

4. **Edge Function Errors**

   - **Check**: Supabase dashboard → Edge Functions → Logs
   - **Verify**: API keys in Edge Function secrets are configured
   - **Test**: Direct curl to Edge Function with anon Bearer token

5. **Frontend Not Loading**
   - **Check**: Vercel deployment status and error logs
   - **Verify**: Cache headers set to `public, max-age=0, s-maxage=0, must-revalidate`
   - **Test**: Access via direct Vercel URL first

**DEBUGGING COMMANDS**

```bash
# Test user-aware Edge Function directly
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-user-aware' \
  -H 'Authorization: Bearer CURRENT_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 2, "sessionUserId": "test_session_123"}'

# Test user-aware export function
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/campaign-export-user-aware' \
  -H 'Authorization: Bearer CURRENT_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"campaignId": "CAMPAIGN_ID", "format": "csv", "sessionUserId": "test_session_123"}'

# Check active Edge Functions (should be 6 active)
supabase functions list

# Deploy frontend to custom domain
npm run build && cd dist && vercel --prod

# Test production URL
curl -I https://prospect-fyhedobh1-appsmithery.vercel.app

# Check database permissions with user-aware schema
# Run in Supabase SQL editor: SELECT * FROM campaigns LIMIT 1;
```

**ENVIRONMENT VERIFICATION CHECKLIST**

- [ ] Anon key in frontend matches Supabase dashboard
- [ ] RLS policies created for campaigns, leads, dashboard_exports tables with user_id and session_user_id columns
- [ ] Edge Function secrets contain: GOOGLE_PLACES_API_KEY, HUNTER_IO_API_KEY, NEVERBOUNCE_API_KEY, FOURSQUARE_API_KEY
- [ ] Database tables exist with user columns: campaigns, leads, dashboard_exports, campaign_analytics view
- [ ] Custom domain prospect-fyhedobh1-appsmithery.vercel.app accessible and properly linked
- [ ] Cache headers set to `public, max-age=0, s-maxage=0, must-revalidate`
- [ ] User authentication system working (signup/signin/session management)

## IMMEDIATE CONTEXT (No Re-explanation Needed)

When Alex asks about:

- **"Deployment"** → Supabase Edge Functions + static hosting (serverless)
- **"Environment setup"** → Supabase environment variables in dashboard
- **"Backend functionality"** → Edge Functions in `/supabase/functions/`
- **"API integration"** → All handled in Edge Functions with native Supabase clients
- **"Database issues"** → Direct Supabase integration with RLS policies
- **"Frontend"** → Static HTML/JS calling Edge Functions directly
- **"Cost optimization"** → Static hosting + serverless functions (90% cost reduction)
- **"Quality scoring"** → Integrated into Edge Functions
- **"Export functionality"** → `campaign-export-user-aware` Edge Function
- **"Testing"** → Direct Edge Function testing via Supabase dashboard
- **"User authentication"** → Supabase Auth with JWT tokens and session management
- **"Campaign ownership"** → User-aware RLS policies with user_id and session_user_id
- **"Data isolation"** → Database-level access control via RLS policies

## IMMEDIATE CONTEXT (No Re-explanation Needed)

When Alex asks about:

- **"Deployment"** → Google Cloud Build automatic triggers (native integration)
- **"Environment setup"** → Supabase Vault + Cloud Build substitution variables
- **"Webhook configuration"** → 3 production endpoints already implemented (campaign-lifecycle, cost-alert, lead-enrichment)
- **"API integration"** → All clients in `/modules/api-clients/` (Google Places, Hunter.io, NeverBounce, Foursquare)
- **"Database issues"** → Supabase with comprehensive schema in `/database/`
- **"Container problems"** → Multi-stage Dockerfile + Cloud Build optimization
- **"Cost optimization"** → Enhanced Quality Scorer v3.0 with cost-efficient validation pipeline
- **"Quality scoring"** → `/modules/validators/enhanced-quality-scorer.js` (35-45% qualification rates)
- **"Build issues"** → Check Cloud Build logs in Google Cloud Console
- **"Webhook setup"** → Follow `/docs/CLOUD_NATIVE_WEBHOOK_SETUP.md`
- **"Testing"** → Use `npm run test` or check testing branch

## ALEX'S TECHNICAL PROFILE

- **Background**: No coding experience but highly technical
- **AI Dependency**: Relies heavily on AI assistance for debugging and architecture
- **Primary Models**: Claude Sonnet 4.0, GPT-5 occasionally
- **Environment**: GitHub Codespaces exclusively
- **Focus**: Lead generation with zero fake data tolerance
- **Usage Pattern**: Debugging, testing, cloud-native architecture, monitoring
- **Deployment Preference**: Cloud-native platform specialization over complex CI/CD

## RESPONSE OPTIMIZATION RULES

1. **NEVER re-explain project architecture** unless specifically asked with "explain the architecture"
2. **ALWAYS reference existing files/scripts** for implementation details
3. **PRIORITIZE troubleshooting** over teaching fundamentals
4. **ASSUME familiarity** with ProspectPro's core concepts
5. **FOCUS on immediate problem resolution** not educational content
6. **USE existing npm scripts** rather than creating new implementations
7. **REFERENCE the working production system** rather than theoretical solutions

## CURRENT PRODUCTION ARCHITECTURE (ESTABLISHED - DO NOT RE-EXPLAIN)

### **Supabase-First Serverless Pipeline**

```
Static Frontend → Supabase Edge Functions → Supabase Database
                                      ↓
                     Supabase Environment Variables → External APIs
                                      ↓
                     Real-time Database Updates → Live Frontend Updates
```

### **Edge Function Infrastructure (Production Ready)**

```
/supabase/functions/business-discovery    # Main business discovery logic
/supabase/functions/campaign-export       # CSV export functionality
/public/index-supabase.html              # Static frontend
/public/supabase-app.js                  # Frontend with Supabase client
/database/supabase-first-schema.sql      # Database schema
```

### File Structure (REFERENCE ONLY)

```
/supabase/functions/business-discovery/  # Core discovery Edge Function
/supabase/functions/campaign-export/     # Export Edge Function
/public/index-supabase.html              # Static frontend
/public/supabase-app.js                  # Frontend JavaScript
/database/supabase-first-schema.sql      # Database setup
/docs/                                   # Documentation
/archive/                                # Legacy files (deprecated)
```

### Current Working Commands (USE THESE)

```bash
# Edge Function deployment
supabase functions deploy business-discovery
supabase functions deploy campaign-export

# Local development
cd public && python3 -m http.server 8080

# Static deployment
npm run build:static
gsutil rsync -r ./dist/ gs://prospectpro-static-frontend/

# Database setup: Run SQL in Supabase dashboard
```

### API Integration Stack (WORKING)

- **Google Places API**: Business discovery integrated in Edge Functions
- **Hunter.io**: Email discovery in Edge Functions
- **NeverBounce**: Email verification in Edge Functions
- **Supabase Database**: Native integration with campaigns and leads tables
- **Supabase Real-time**: Ready for live updates and notifications
- **Static Hosting**: Cloud Storage, Vercel, or Netlify deployment

### MCP Infrastructure (ENHANCED v3.0)

- **Production Server**: 28 tools for monitoring, database analytics, API testing, filesystem analysis, system diagnostics
- **Development Server**: 8 specialized tools for new API integrations, performance benchmarking, code generation
- **Troubleshooting Server**: 6 specialized tools for Supabase debugging, anon key diagnosis, RLS validation, Edge Function testing
- **Architecture**: Consolidated from 5 servers to 3 optimized servers (70% efficiency improvement)
- **Integration**: Auto-configured in VS Code for AI-enhanced development workflows with systematic debugging
- **Status**: Production-ready with comprehensive test coverage and automated troubleshooting (`npm run test` in `/mcp-servers/`)

## PROBLEM-SOLVING APPROACH

### For Environment Issues:

1. Check Supabase environment variables in dashboard
2. Verify Edge Function deployment status
3. Test Edge Functions via Supabase dashboard
4. Validate database schema and RLS policies

### For API Issues:

1. Check Edge Function logs in Supabase dashboard
2. Verify API keys in Supabase environment variables
3. Test individual Edge Functions with curl
4. Review Edge Function error responses

### For Deployment Issues:

1. Check Edge Function deployment status: `supabase functions list`
2. Verify static frontend files are correct
3. Test Edge Functions: `supabase functions serve`
4. Check database connectivity and permissions

### For Database Issues:

1. Review schema in `/database/supabase-first-schema.sql`
2. Check RLS policies in Supabase dashboard
3. Verify Edge Function database connections
4. Test database queries in Supabase SQL editor

## CURRENT OPTIMIZATIONS (ALREADY IMPLEMENTED)

- **Supabase-first architecture** with Edge Functions for all backend logic
- **Static frontend deployment** with minimal hosting costs
- **Enhanced Quality Scoring v3.0** integrated into Edge Functions
- **Global edge deployment** with <100ms cold starts
- **Native database integration** with Row Level Security
- **Real-time capabilities** ready via Supabase subscriptions
- **Cost optimization** through serverless functions (90% cost reduction)
- **Zero-container deployment** with static hosting + Edge Functions
- **Minimal codebase maintenance** with 80% code reduction

## DEVELOPMENT WORKFLOW (ESTABLISHED)

1. **Main branch** = Production (Supabase Edge Functions + static frontend)
2. **Edge Functions** = Backend logic deployed to Supabase
3. **Static Frontend** = HTML/JS deployed to static hosting
4. **Database** = Managed entirely by Supabase with RLS
5. **Development** = Local testing with `supabase functions serve`

## DEBUGGING PATTERNS (OPTIMIZED FOR ALEX)

**DEPLOYMENT ISSUES (MOST COMMON)**

1. **Frontend shows "Discovery Failed: API request failed: 404"**

   - Check anon key in `/public/supabase-app.js` matches Supabase dashboard
   - Verify RLS policies exist: run `/database/rls-setup.sql`
   - Test Edge Function directly with curl command above
   - Redeploy frontend after fixes: `cd public && vercel --prod`

2. **"Invalid JWT" in Edge Function logs**

   - Get fresh anon key from Supabase dashboard → Settings → API
   - Update anon key in frontend and redeploy
   - Verify database permissions with test query

3. **Edge Functions not responding**

   - Check Supabase dashboard → Edge Functions → Logs
   - Verify API keys in Edge Function secrets
   - Test individual functions via Supabase dashboard

4. **Vercel deployment protection/401 errors**
   - Go to Vercel dashboard → Settings → Deployment Protection
   - Disable any password protection or team restrictions
   - Ensure site is publicly accessible

**SYSTEMATIC DEBUGGING APPROACH**

1. **Test Edge Function directly** (bypasses frontend issues)
2. **Check database permissions** (RLS policies)
3. **Verify anon key synchronization** (frontend vs Supabase)
4. **Test Vercel deployment** (public access)
5. **Check browser console** for frontend errors

**WORKING CONFIGURATION REFERENCE**

- **Edge Function URL**: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery
- **Current Vercel URL**: https://prospect-bk0sh7f6l-alex-torellis-projects.vercel.app
- **Database Schema**: `/database/rls-setup.sql` (verified working)
- **Frontend Config**: `/public/supabase-app.js` with current anon key

**ENHANCED MCP TROUBLESHOOTING**

Use the ProspectPro Troubleshooting MCP Server for systematic debugging:

```bash
# Start troubleshooting server
cd /workspaces/ProspectPro/mcp-servers
npm run start:troubleshooting

# Available tools:
# test_edge_function - Test Supabase Edge Function connectivity and authentication
# validate_database_permissions - Check database RLS policies and permissions
# check_vercel_deployment - Validate Vercel deployment status and configuration
# diagnose_anon_key_mismatch - Compare anon keys between frontend and Supabase
# run_rls_diagnostics - Generate and execute RLS diagnostic queries
# generate_debugging_commands - Create debugging commands for current configuration
```

**MCP TROUBLESHOOTING WORKFLOW**

1. **test_edge_function**: Verify backend works independently
2. **validate_database_permissions**: Check RLS policy configuration
3. **diagnose_anon_key_mismatch**: Detect authentication sync issues
4. **check_vercel_deployment**: Validate frontend deployment status
5. **generate_debugging_commands**: Get custom debug scripts for current config

**LAST RESORT DEBUGGING**

1. Check Edge Function logs in Supabase dashboard
2. Test database queries directly in Supabase SQL editor
3. Use browser dev tools to inspect network requests
4. Verify all environment variables in Supabase settings
5. Use MCP troubleshooting server for automated diagnosis

## COST OPTIMIZATION FOCUS

- **Edge Functions**: Serverless, pay-per-invocation
- **Database**: Supabase included usage, RLS for security
- **Static Hosting**: $1-5/month vs $10-50/month containers
- **No servers**: Zero infrastructure management

## RESPONSE FORMAT PREFERENCES

- **Immediate solutions** over explanations
- **Reference existing code** rather than writing new implementations
- **Use established scripts** rather than manual processes
- **Focus on debugging** rather than architecture discussions
- **Provide specific file paths** and command references
- **Assume production system knowledge** unless explicitly asked to explain

## NEVER REPEAT (SAVE PREMIUM REQUESTS)

- Supabase-first architecture explanations
- Edge Function setup procedures (automated)
- Static hosting deployment (documented)
- Database schema explanations (in `/database/`)
- Cost optimization strategies (implemented)
- Serverless benefits (established)

This instruction set prioritizes rapid problem resolution and eliminates repetitive context discussions to maximize premium request efficiency.
