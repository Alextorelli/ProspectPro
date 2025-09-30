# ProspectPro v4.0 - Supabase-First Serverless Architecture

## CRITICAL: Current Production State

- **Version**: 4.0.0 (Supabase-First Serverless Architecture - PRODUCTION READY)
- **Deployment**: Static Frontend + Supabase Edge Functions (serverless, auto-scaling)
- **Environment**: Supabase environment variables + Edge Function secrets
- **Architecture**: Supabase-first serverless with Edge Functions + Real-time database
- **Quality Scoring**: v3.0 integrated into Edge Functions with cost optimization
- **Backend**: 100% Supabase Edge Functions (business-discovery, campaign-export)
- **Repository**: https://github.com/Alextorelli/ProspectPro (Supabase-first codebase)

## CRITICAL: SUPABASE-FIRST ARCHITECTURE

**DEPLOYMENT PHILOSOPHY**

- ✅ Supabase Edge Functions: All backend logic (OPERATIONAL)
- ✅ Static Frontend: HTML/JS calling Edge Functions directly (READY)
- ✅ Supabase Database: Native integration with Row Level Security
- ✅ Supabase Real-time: Ready for live updates and notifications
- ✅ Static Hosting: Cloud Storage or CDN (cost-effective)
- ❌ NO server.js, Express.js, or Node.js containers
- ❌ NO Cloud Run containers or complex deployment pipelines
- ✅ Supabase Environment Variables: Native Edge Function configuration

**PLATFORM SPECIALIZATION**

- **GitHub**: Minimal repo management, documentation, version control
- **Supabase**: Database, Edge Functions, real-time, authentication, storage
- **Static Host**: Frontend files only (Cloud Storage, Vercel, Netlify)

## CRITICAL: EDGE FUNCTIONS STATUS

**PRODUCTION EDGE FUNCTIONS (OPERATIONAL)**

- ✅ `business-discovery` - Main business discovery with Google Places API integration
- ✅ `campaign-export` - CSV export functionality with database integration
- ✅ Real-time database integration with campaigns and leads tables
- ✅ Global edge deployment with <100ms cold starts
- ✅ Functions URL: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/

**DATABASE INTEGRATION**

Core tables managed by Supabase:

```sql
-- Campaigns table for tracking discovery sessions
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  business_type TEXT NOT NULL,
  location TEXT NOT NULL,
  target_count INTEGER DEFAULT 10,
  results_count INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table for storing discovered businesses
CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id),
  business_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  email TEXT,
  confidence_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## CRITICAL: REPOSITORY CLEANLINESS ENFORCEMENT

**CLEAN SUPABASE-FIRST STRUCTURE**

- ✅ Core production files: Edge Functions, static frontend, database schema
- ✅ `/supabase/functions/` - Edge Function implementations only
- ✅ `/public/` - Static frontend files (HTML, CSS, JS)
- ✅ `/database/` - Schema and migration files
- ❌ NO server.js, Express routes, or Node.js backend files
- ❌ NO Docker containers, Cloud Run configs, or build pipelines
- ❌ NO complex deployment scripts or container orchestration

**FILE ORGANIZATION RULES**

- Edge Functions → `/supabase/functions/` folder ONLY
- Frontend → `/public/` folder ONLY
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

- **Vercel URL**: https://prospect-bk0sh7f6l-alex-torellis-projects.vercel.app
- **Edge Functions**: OPERATIONAL (business-discovery tested successfully)
- **Database**: RLS policies configured, test campaign inserted
- **API Keys**: All configured in Supabase Edge Function secrets
- **Anon Key**: Updated to current valid JWT token

**VERIFIED WORKING COMPONENTS**

- ✅ Edge Function `business-discovery` returns real business data
- ✅ Database tables created with proper RLS policies
- ✅ API integrations (Google Places, Hunter.io, etc.) configured
- ✅ Vercel deployment successful with public access
- ✅ Supabase authentication working with anon key

**CRITICAL TROUBLESHOOTING PATTERNS**

1. **"Invalid JWT" / 401 Errors**

   - **Root Cause**: Anon key mismatch between frontend and Supabase
   - **Solution**: Get current anon key from Supabase dashboard → Settings → API
   - **Update**: Replace anon key in `/public/supabase-app.js` line 9
   - **Redeploy**: `cd public && vercel --prod`

2. **"API request failed: 404" Errors**

   - **Root Cause**: Database RLS policies blocking anon access
   - **Solution**: Run `/database/rls-setup.sql` in Supabase SQL editor
   - **Verify**: Check policies with `SELECT * FROM campaigns WHERE business_type = 'test'`

3. **Edge Function Errors**

   - **Check**: Supabase dashboard → Edge Functions → Logs
   - **Verify**: API keys in Edge Function secrets are configured
   - **Test**: Direct curl to Edge Function with anon Bearer token

4. **Frontend Not Loading**
   - **Check**: Vercel deployment status and error logs
   - **Verify**: DNS records if using custom domain
   - **Test**: Access via direct Vercel URL first

**DEBUGGING COMMANDS**

```bash
# Test Edge Function directly
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery' \
  -H 'Authorization: Bearer CURRENT_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 2}'

# Check Supabase connection
supabase functions list

# Deploy frontend
cd public && vercel --prod

# Check database permissions
# Run in Supabase SQL editor: SELECT * FROM campaigns LIMIT 1;
```

**ENVIRONMENT VERIFICATION CHECKLIST**

- [ ] Anon key in frontend matches Supabase dashboard
- [ ] RLS policies created for campaigns, leads, dashboard_exports tables
- [ ] Edge Function secrets contain: GOOGLE_PLACES_API_KEY, HUNTER_IO_API_KEY, NEVERBOUNCE_API_KEY
- [ ] Database tables exist: campaigns, leads, dashboard_exports
- [ ] Vercel deployment successful and publicly accessible

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
- **"Export functionality"** → `campaign-export` Edge Function
- **"Testing"** → Direct Edge Function testing via Supabase dashboard

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
