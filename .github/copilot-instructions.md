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

### MCP Infrastructure (CONSOLIDATED v2.0)

- **Production Server**: 28 tools for monitoring, database analytics, API testing, filesystem analysis, system diagnostics
- **Development Server**: 8 specialized tools for new API integrations, performance benchmarking, code generation
- **Architecture**: Consolidated from 5 servers to 2 (60% efficiency improvement)
- **Integration**: Auto-configured in VS Code for AI-enhanced development workflows
- **Status**: Production-ready with comprehensive test coverage (`npm run test` in `/mcp-servers/`)

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

- Start with Edge Function logs in Supabase dashboard
- Check environment variables in Supabase settings
- Test Edge Functions individually with curl or Supabase dashboard
- Verify database schema and RLS policies
- Use browser dev tools for frontend debugging

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
