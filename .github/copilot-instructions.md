# ProspectPro Real API Integration - AI Coding Agent Instructions

## Project Overview

ProspectPro is a lead generation platform built with Node.js/Express that implements a zero-tolerance policy for fake data. The system exclusively uses real business data obtained through multiple API integrations (Google Places, Foursquare Places, website scraping, email verification) to provide high-quality business leads with complete contact information.

## Production Environment Initialization

### GitHub Actions Automated Workflow

ProspectPro uses a sophisticated GitHub Actions workflow for zero-configuration production deployment:

#### **1. Automated Environment Generation** (`generate-dotenv.yml`)

```bash
# Triggers automatically on:
# - Push to main branch
# - Deployment events
# - Repository dispatch (API triggered)
# - Manual workflow dispatch

# Required GitHub Repository Secrets:
# - SUPABASE_URL: Your Supabase project URL
# - SUPABASE_SECRET_KEY: Service role key with full database access
```

**Workflow Process:**

- Verifies required secrets are present and valid
- Generates complete production `.env` with all performance settings
- Includes build metadata (timestamp, commit, branch, actor)
- Creates `production-environment-config` artifact for programmatic retrieval
- Validates all environment variables and server dependencies

#### **2. Environment Puller System** (`pull-env-from-secrets.js`)

```javascript
// Enhanced Option B1: Direct workflow output retrieval
const workflow = {
  trigger: "GitHub API with GHP_TOKEN authentication",
  process: "Polls workflow completion with timeout handling",
  extract: "Downloads .env from workflow artifacts",
  validate: "Ensures complete configuration before server start",
};
```

#### **3. Multi-Source Configuration Loader** (`environment-loader.js`)

**Configuration Priority Hierarchy:**

1. **GitHub Actions Environment** (highest priority - production secrets)
2. **Supabase Vault** (API keys loaded at runtime)
3. **Local .env file** (development fallback)
4. **Production defaults** (performance optimization)

#### **4. Production Initialization Commands**

```bash
# Complete production initialization (recommended)
npm run prod:init          # Full workflow: trigger → wait → validate → start

# Individual steps for debugging
npm run prod:setup-env     # Trigger GitHub Actions → generate .env
npm run prod:check         # Validate environment configuration
npm run prod               # Start production server with existing .env
```

### Production Features Auto-Enabled

The GitHub Actions workflow automatically configures:

```bash
# Performance Optimization
MAX_CONCURRENT_REQUESTS=10
BATCH_SIZE=25
CACHE_TTL_SECONDS=3600
ENABLE_TTL_CACHE=true
ENABLE_BATCH_PROCESSING=true

# Cost Management
DAILY_BUDGET_LIMIT=100.00
DEFAULT_BUDGET_LIMIT=25.00
ENABLE_COST_TRACKING=true

# Quality Assurance
MIN_CONFIDENCE_SCORE=85
EXPORT_CONFIDENCE_THRESHOLD=90

# Production Security
ENABLE_REQUEST_VALIDATION=true
ENABLE_RATE_LIMITING=true
REQUIRE_API_AUTHENTICATION=true
```

### Development vs Production Environment Management

#### **Development Environment (Dev Container)**

- **Theme**: Vira Deepforest (green color scheme) for visual distinction
- **MCP Servers**: Full suite (database, API, filesystem, monitoring)
- **Configuration**: Manual .env configuration with development API keys
- **Features**: Hot reload, debug endpoints, comprehensive logging

#### **Production Environment (Local/Remote)**

- **Theme**: Default VS Code theme (unchanged from user preferences)
- **Configuration**: Automated GitHub Actions → secrets → .env workflow
- **API Keys**: Loaded from Supabase Vault at runtime (secure)
- **Features**: Production optimization, monitoring, cost tracking

### Rapid Environment Switching Workflow

For troubleshooting and development cycles:

```bash
# Switch to development (dev container)
# 1. Open dev container (auto-applies Vira Deepforest theme)
# 2. MCP servers provide AI context for debugging
# 3. Manual API key configuration for testing

# Switch to production (local)
npm run prod:init  # Auto-downloads latest configuration from GitHub Actions

# Quick validation between environments
npm run health     # Check server health
npm run diag       # Comprehensive diagnostics
```

## Core Architecture

### 4-Stage Data Pipeline

1. **Discovery** (Initial): Multi-source business discovery using Google Places API and Foursquare Places API
2. **Enrichment** (Enhanced data): Website scraping, email discovery, contact extraction and differentiation
3. **Validation** (Verification): Multi-source validation including state registries, email deliverability checks
4. **Scoring** (Quality Assurance): Only verified, complete leads with high confidence scores are exported

### Key Directories & Responsibility

- `api/` - API route handlers and endpoints for business discovery and export
  - `business-discovery.js` - Core business discovery API routes **WITH SUPABASE VAULT INTEGRATION**
  - `campaign-export.js` - Campaign export functionality
  - `webhooks/` - Webhook handlers for external integrations
- `modules/` - Core functionality modules
  - `api-clients/` - API client implementations for external services
  - `core/` - Core engines for lead discovery and processing
  - `registry-engines/` - Business registry validation
  - `utils/` - Utility modules like caching, batching, security
    - `supabase-vault-loader.js` - **NEW: Runtime API key loading from Supabase Vault**
  - `validators/` - Data validation modules
- `config/` - Configuration and environment setup
  - `supabase.js` - Database connection management with diagnostics
  - `environment-loader.js` - **ENHANCED: Multi-source config with vault integration**
- `database/` - SQL migration files and database setup
  - `vault-js-interface.sql` - **NEW: JavaScript-callable vault functions**

## Server Architecture

### Server Bootstrap Pattern (server.js)

- **STRICT PRODUCTION MODE**: `ALLOW_DEGRADED_START=false` enforced in production
- **Supabase Vault Integration**: API keys loaded at startup from vault
- **Comprehensive health endpoints**: `/health` (fast), `/diag` (full diagnostics), `/ready` (DB required)
- **Enhanced startup validation**: Database, vault, critical API keys all validated before startup

```javascript
// ✅ CORRECT: Advanced Environment Loading with Vault Integration
console.log(`🔧 Initializing ProspectPro Environment Loader...`);
const EnvironmentLoader = require("./config/environment-loader");
const envLoader = new EnvironmentLoader();
const config = envLoader.getConfig();

// ✅ CORRECT: Strict Production Mode
if (config.isProduction) {
  console.log("🔑 Pre-loading API keys from Supabase Vault...");
  const apiKeys = await envLoader.getApiKeys();

  // Critical API validation - no degraded starts
  const criticalApis = ["foursquare", "googlePlaces"];
  const missingCritical = criticalApis.filter((api) => !apiKeys[api]);

  if (
    missingCritical.length > 0 &&
    process.env.ALLOW_DEGRADED_START !== "true"
  ) {
    process.exit(1);
  }
}
```

### Supabase Connection Management (config/supabase.js)

- **Key precedence**: `SUPABASE_SECRET_KEY` → `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_ANON_KEY` → `SUPABASE_PUBLISHABLE_KEY`
- **Lazy client initialization**: Only create client when needed, cache instance
- **Diagnostic system**: `testConnection()` returns detailed failure categorization with remediation steps

### **NEW: Supabase Vault Integration**

#### **API Key Loading Architecture**

```javascript
// modules/utils/supabase-vault-loader.js - Runtime API key access
class SupabaseVaultLoader {
  async loadApiKey(keyName) {
    const { data, error } = await supabase.rpc("vault_decrypt_secret", {
      secret_name: keyName,
    });

    if (data && data[0].status === "SUCCESS") {
      return data[0].decrypted_secret;
    }
    return null;
  }
}
```

#### **Database Vault Functions** (`vault-js-interface.sql`)

```sql
-- JavaScript-callable vault interface
CREATE OR REPLACE FUNCTION vault_decrypt_secret(secret_name TEXT)
RETURNS TABLE(
    secret_key TEXT,
    decrypted_secret TEXT,
    status TEXT,
    error_message TEXT
) AS $$
-- Secure vault access with proper error handling
$$;
```

#### **API Integration Pattern**

```javascript
// api/business-discovery.js - Vault-powered API keys
async function getApiKeys() {
  try {
    apiKeysCache = await envLoader.getApiKeys();
    console.log(`🔑 API keys refreshed from Supabase Vault`);
    return apiKeysCache;
  } catch (error) {
    console.log("🔄 Falling back to environment variables");
    return fallbackApiKeys;
  }
}
```

## Zero Fake Data Policy 🚨

### Prohibited Patterns

```javascript
// ❌ NEVER: Hardcoded business arrays
const fakeBusinesses = ["Artisan Bistro", "Downtown Café"];

// ❌ NEVER: Sequential fake addresses
const addresses = ["100 Main St", "110 Main St", "120 Main St"];

// ❌ NEVER: 555/000 phone numbers
const phones = ["(555) 123-4567", "(000) 123-4567"];

// ❌ NEVER: Domain patterns with placeholders
const websites = ["http://example.com", "http://business.com"];

// ❌ NEVER: Generate fake data on API failure
try {
  const realData = await apiCall();
  return realData;
} catch (error) {
  // NEVER DO THIS:
  return generateFakeData(); // ❌ PROHIBITED
}
```

### Required Real Data Sources

1. **Business names**: Must come from Foursquare Places API or Google Places API
2. **Addresses**: Must be real, geocodable locations from API responses
3. **Phones**: Must be validated, non-fake patterns (no 555-xxxx)
4. **Websites**: Must return HTTP 200-399 status codes when validated
5. **Emails**: Must pass NeverBounce deliverability validation (80%+ confidence)

## Production MCP Server Strategy

### **Enhanced Production MCP Implementation**

The Production MCP Server provides critical development acceleration with these core tools:

#### **Phase 1: Environment & Deployment Monitoring**

```javascript
// production-server.js - Enhanced tools for production optimization
const productionTools = {
  // EXISTING TOOLS (enhanced)
  environment_health_check:
    "Real-time Supabase connection, API status, vault accessibility",
  github_actions_monitor:
    "Live workflow status, artifact availability, build logs",
  dev_prod_config_diff: "Compare dev container vs production configuration",

  // NEW TOOLS FOR VAULT AND OPTIMIZATION
  vault_api_key_status:
    "Comprehensive Supabase Vault API key status and diagnostics",
  production_startup_validator:
    "Complete production startup validation and issue detection",
  github_workflow_optimizer:
    "GitHub Actions workflow analysis and cascade prevention",
};
```

#### **Phase 2: Cost & Performance Tracking**

```javascript
const costManagementTools = {
  cost_budget_monitor: "Live API usage costs, budget alerts, cost per lead",
  performance_metrics:
    "4-stage pipeline metrics, API response times, quality scores",
  api_health_dashboard:
    "Multi-source API health, rate limit status, error aggregation",
};
```

#### **MCP Server Usage Pattern**

```bash
# Copilot Chat Integration
@mcp vault_api_key_status                    # Check all API keys in Supabase Vault
@mcp production_startup_validator            # Validate production configuration
@mcp github_workflow_optimizer              # Prevent workflow cascade failures
@mcp environment_health_check               # Complete environment diagnostics
```

#### **ROI for Production Phase**

- **Issue Resolution**: 70% faster production issue identification
- **API Key Management**: Instant vault status and missing key detection
- **Workflow Optimization**: Prevents cascade failures and resource waste
- **Environment Switching**: 3-5 minutes faster dev/prod transitions
- **Cost Prevention**: Real-time budget monitoring prevents overruns

## API Client Implementation Pattern

All API clients follow a consistent pattern with proper caching, error handling, and usage tracking:

```javascript
class ExampleAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.example.com/v1';
    this.usageStats = {
      requests: 0,
      totalCost: 0,
      // Additional tracking metrics
    };
    // TTL Cache for optimizing API usage
    this.cache = new Map();
    this.cacheTTL = 3600000; // 1 hour in milliseconds
  }

  // Consistent cache methods
  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // API methods
  async methodName(params) {
    // API key validation
    if (!this.apiKey) {
      return { found: false, error: 'API key not configured' };
    }

    // Check cache first
    const cacheKey = `service_${JSON.stringify(params)}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // API call with proper error handling
      const response = await fetch(`${this.baseUrl}/endpoint`, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });

      // Track usage for cost monitoring
      this.usageStats.requests++;
      this.usageStats.totalCost += 0.XX; // Cost per request

      // Parse and normalize response
      const data = await response.json();
      const normalizedResponse = this.normalizeResponse(data);

      // Cache successful responses
      this.setCache(cacheKey, normalizedResponse);

      return normalizedResponse;
    } catch (error) {
      // Structured error response
      return {
        found: false,
        error: `API error: ${error.message}`,
        params
      };
    }
  }

  // Consistent usage stats reporting
  getUsageStats() {
    return { ...this.usageStats };
  }
}
```

## Cost Optimization Strategy

### Budget Management

```javascript
// Always check budget limits before making expensive API calls
if (this.totalCost >= budgetLimit) {
  console.warn(`⚠️ Budget limit reached: $${this.totalCost.toFixed(2)}`);
  return {
    success: false,
    error: "Budget limit exceeded",
    totalCost: this.totalCost,
  };
}

// Track costs per API call
const apiCallCost = 0.032; // Cost per Google Places search
this.totalCost += apiCallCost;

// Tiered API access strategy
// 1. Try free/cheap sources first
const foursquareResults = await this.discoverViaFoursquare(query, location);

// 2. Only use more expensive APIs if needed and budget allows
if (
  foursquareResults.length < needed &&
  this.totalCost + 0.032 <= budgetLimit
) {
  googleResults = await this.discoverViaGooglePlaces(query, location);
}
```

### API Cost Tracking

- Google Places: ~$0.032/search, $0.017/details
- Foursquare Places: Free tier available (950 requests/day)
- Hunter.io: ~$0.04/domain search (25 free/month)
- NeverBounce: ~$0.008/verification (1000 free/month)

### Comprehensive Caching

```javascript
// Multi-level caching strategy
// 1. Local in-memory cache per client
const cacheKey = `foursquare_${businessName}_${location}`;
const cached = this.getCache(cacheKey);
if (cached) return cached;

// 2. Global TTL cache for cross-service caching
const { globalCache } = require("../utils/cache-ttl-manager");
const globalCacheKey = TTLCache.generateKey("service_operation", queryParams);
let result = globalCache.get(globalCacheKey);
if (result) return result;

// 3. Batch processing for similar operations
const batchResults = await batchProcessor.batchEmailVerification(
  emailsToVerify
);
```

## Lead Discovery and Processing Architecture

### Enhanced Discovery Engine

The core discovery process is implemented in `modules/core/core-business-discovery-engine.js` and follows this pattern:

```javascript
// 1. Generate comprehensive search queries
const searchQueries = this.generateSearchQueries(businessType, location);

// 2. Multi-source discovery with budget awareness
const foursquareResults = await this.discoverViaFoursquare(query, location);
const googleResults = await this.discoverViaGooglePlaces(query, location);

// 3. Merge and deduplicate results with cross-platform validation
const allBusinesses = this.mergeAndDeduplicateResults(
  foursquareResults,
  googleResults
);

// 4. Process through the 4-stage pipeline
const processedResults = await this.leadDiscovery.discoverAndValidateLeads(
  allBusinesses,
  options
);

// 5. Apply strict quality filtering
const qualifiedLeads = this.applyQualityFilter(processedResults.leads);
```

### Lead Processing Pipeline

The lead processing pipeline is implemented in `modules/core/core-lead-discovery-engine.js` using a 4-stage approach:

```javascript
// Stage 1: Discovery + Pre-validation
const stage1Result = await this.stage1_DiscoveryAndPreValidation(business);

// Stage 2: Enrichment + Property Intelligence
const stage2Result = await this.stage2_EnrichmentAndPropertyIntel(stage1Result);

// Stage 3: Validation + Risk Assessment
const stage3Result = await this.stage3_ValidationAndRiskAssessment(
  stage2Result
);

// Stage 4: Quality Scoring + Export Preparation
const finalResult = await this.stage4_QualityScoringAndExport(stage3Result);
```

## Enhanced Contact Differentiation

The system now differentiates between company-level and owner-level contact information:

```javascript
// Contact differentiation model
{
  // Company-level contact info
  "companyPhone": "(415) 555-1234",
  "companyPhoneSource": "Google Places",
  "companyEmail": "info@business.com",
  "companyEmailSource": "website_scrape",
  "companyEmailConfidence": 75,

  // Owner-level contact info
  "ownerName": "Jane Smith",
  "ownerEmail": "jane@business.com",
  "ownerEmailSource": "hunter.io",
  "ownerEmailConfidence": 85,
  "ownerTitle": "Founder & CEO",

  // Legacy fields (for backward compatibility)
  "phone": "(415) 555-1234",
  "email": "info@business.com"
}
```

## Quality Assurance Standards

### Pre-validation Scoring

Before expensive API calls, score businesses 0-100% based on:

```javascript
function calculatePreValidationScore(business) {
  let score = 0;

  // Business name quality (25 points max)
  if (business.name) {
    score += !this.isGenericBusinessName(business.name) ? 25 : 15;
  }

  // Address completeness (20 points max)
  if (business.address) {
    score += this.isCompleteAddress(business.address) ? 20 : 15;
  }

  // Phone number format (20 points max)
  if (business.phone) {
    score += this.isValidPhoneFormat(business.phone) ? 20 : 10;
  }

  // Website presence (20 points max)
  if (business.website && business.website !== "http://example.com") {
    score += 20;
  }

  return Math.min(score, 100);
}
```

### Validation Requirements

Every business MUST pass ALL validation checks:

- `businessName`: Real, specific name (not generic patterns)
- `address`: Geocodeable, not sequential patterns
- `phone`: Valid format, not 555-xxxx fake patterns
- `website`: Returns successful HTTP response
- `email`: Passes deliverability check (80%+ confidence)

### Export Validation

```javascript
// Only export businesses meeting ALL criteria:
const qualifiedLeads = this.applyQualityFilter(businesses, {
  requireEmail: true,
  requirePhone: true,
  requireWebsite: true,
  requireOwnerQualified: true,
  minimumConfidence: 70,
  industry: businessType,
});
```

### Confidence Scoring

The final confidence score is calculated based on multiple factors:

```javascript
const qualityScores = {
  businessNameScore: this.scoreBusinessName(data),
  addressScore: this.scoreAddress(data),
  phoneScore: this.scorePhone(data),
  websiteScore: this.scoreWebsite(data),
  emailScore: this.scoreEmail(data),
  registrationScore: this.scoreRegistration(data),
  propertyScore: this.scoreProperty(data),
  foursquareScore: this.scoreFoursquare(data),
  nonprofitScore: this.scoreNonprofit(data),
};

// Calculate weighted score with specific weights
const weights = {
  businessNameScore: 0.12,
  addressScore: 0.12,
  phoneScore: 0.15,
  websiteScore: 0.12,
  emailScore: 0.15,
  registrationScore: 0.12,
  propertyScore: 0.05,
  foursquareScore: 0.1,
  nonprofitScore: 0.07,
};
```

## Error Handling Standards

### API Client Pattern

```javascript
// ✅ CORRECT: Never fallback to fake data
try {
  const realData = await apiClient.search(query);
  if (!realData || realData.length === 0) {
    return {
      found: false,
      error: "No results found for query",
      query,
    };
  }
  return realData;
} catch (error) {
  console.error("API failed:", error.message);
  return {
    found: false,
    error: error.message,
    query,
  };
}
```

### Server Resilience

```javascript
// Global error safety nets
process.on("unhandledRejection", (reason, p) => {
  console.error("🧨 Unhandled Promise Rejection:", reason);
  metrics.recordError("unhandled_rejection", "process", "critical", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err.stack || err.message);
  metrics.recordError("uncaught_exception", "process", "critical", err);
});

// API error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  const isDevelopment = config.isDevelopment;

  res.status(error.status || 500).json({
    error: "Internal server error",
    message: isDevelopment ? error.message : "Something went wrong",
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  });
});
```

## Database Schema Conventions

### Core Tables

- `enhanced_leads`: Main business records with confidence scoring (0-100)
- `campaigns`: User session tracking with cost attribution
- `api_costs`: Per-request cost tracking for budget management
- `validation_results`: Multi-source validation outcomes

### RLS Security Pattern

```sql
-- Enable RLS on all tables
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
-- User isolation with auth.uid()
CREATE POLICY "Users can only see own data" ON table_name
FOR ALL USING (auth.uid() = user_id);
```

## Multi-API Integration Strategy

### API Priority and Fallback Chain

1. **Foursquare Places API** (first choice - free tier available)
2. **Google Places API** (second choice - more expensive but comprehensive)
3. **Hunter.io API** (for email discovery - cost-effective with high accuracy)
4. **NeverBounce API** (for email verification - high deliverability confidence)
5. **Various registry APIs** (for business verification - mostly free or low cost)

### Cross-Platform Validation

```javascript
// Enhanced business with cross-platform data
function enhanceBusinessWithCrossData(primaryBusiness, secondaryBusiness) {
  // Fill in missing contact info
  if (!primaryBusiness.phone && secondaryBusiness.phone) {
    primaryBusiness.phone = secondaryBusiness.phone;
  }
  if (!primaryBusiness.website && secondaryBusiness.website) {
    primaryBusiness.website = secondaryBusiness.website;
  }

  // Add cross-platform validation boost
  primaryBusiness.crossPlatformMatch = true;
  primaryBusiness.sourceConfidenceBoost += 10;
  primaryBusiness.preValidationScore = Math.min(
    primaryBusiness.preValidationScore + 15,
    100
  );

  // Store secondary data for validation
  primaryBusiness.crossPlatformData = {
    source: secondaryBusiness.source,
    data: secondaryBusiness,
  };
}
```

## File-Specific Implementation Notes

### `/api/business-discovery.js`

- **ENHANCED**: Uses `EnvironmentLoader` with Supabase Vault integration
- **NEW**: Dynamic API key loading with caching and fallback
- Returns comprehensive metadata: cost per lead, processing time, qualification rate
- Implements campaign logging to `campaigns` table via `CampaignLogger`
- **CRITICAL**: Validates Foursquare API key presence before startup

### `/modules/core/core-business-discovery-engine.js`

- Implements multi-source discovery with Foursquare and Google Places
- Handles cross-platform validation and deduplication
- Optimizes API costs with tiered access strategy

### `/modules/core/core-lead-discovery-engine.js`

- Implements the 4-stage pipeline architecture
- Handles email and contact differentiation
- Calculates comprehensive confidence scores

### `/modules/utils/supabase-vault-loader.js` - **NEW**

- **Singleton pattern**: Single instance for entire application
- **Caching**: 5-minute TTL cache for API keys
- **Retry logic**: Exponential backoff for failed vault access
- **Fallback**: Environment variables if vault fails
- **Validation**: Filters placeholder and template values

### `/config/environment-loader.js` - **ENHANCED**

- **Multi-source loading**: GitHub Actions → Vault → .env → defaults
- **Vault integration**: `loadApiKeysFromVault()` method
- **Caching**: Prevents repeated vault calls
- **Diagnostics**: Comprehensive configuration reporting

### `/config/supabase.js`

- Each client implements consistent error handling and caching
- Tracks usage statistics and costs
- Normalizes responses for uniform processing

## Production Considerations

### Environment Variables

- **STRICT**: `ALLOW_DEGRADED_START=false` enforced in production
- `PERSONAL_ACCESS_TOKEN` for admin dashboard authentication
- `PORT` automatically set by platform (bind to `0.0.0.0`)

### Monitoring Endpoints

- `/health`: Health checks with degraded mode support
- `/diag`: Full Supabase connection diagnostics with sanitized environment
- `/ready`: Kubernetes-style readiness probe requiring privileged DB connection
- `/metrics`: Prometheus-compatible metrics endpoint

## GitHub Workflow Integration

### **OPTIMIZED WORKFLOWS**

#### **Repository Maintenance** (`repository-maintenance.yml`)

```yaml
# OPTIMIZED: No longer triggers on every push
on:
  schedule:
    - cron: "0 2 * * 0" # Weekly only
  workflow_dispatch: # Manual trigger only
```

#### **Docker Environment** (`docker-env.yml`)

```yaml
# OPTIMIZED: Manual and workflow_call only
on:
  workflow_dispatch:
  workflow_call: # Can be called by other workflows
```

#### **Benefits of Optimization:**

- **Prevents cascade failures**: No unintended workflow triggers
- **Reduces resource usage**: Only runs when needed
- **Improves reliability**: Manual control over maintenance tasks
- **Cost optimization**: Fewer GitHub Actions minutes consumed

### Security Architecture

ProspectPro uses a two-tier secret management approach:

1. **GitHub Secrets** (Infrastructure)

   - `SUPABASE_URL`: Database connection endpoint
   - `SUPABASE_SECRET_KEY`: Database service role key
   - `PERSONAL_ACCESS_TOKEN`: Admin authentication

2. **Supabase Vault** (API Keys) - **PRODUCTION READY**
   - `GOOGLE_PLACES_API_KEY`
   - `FOURSQUARE_API_KEY`
   - `HUNTER_IO_API_KEY`
   - `NEVERBOUNCE_API_KEY`
   - `APOLLO_API_KEY`
   - Additional API keys for testing and expansion

## Common Implementation Traps

1. **Fake Data Generation**: Remove any hardcoded business arrays
2. **Sequential Addresses**: Check for patterns like "100 Main St", "110 Main St"
3. **Generic Business Names**: Validate against patterns like "Business LLC", "Company Inc"
4. **Non-working URLs**: Always verify website accessibility before export
5. **Undeliverable Emails**: Never export emails that fail validation
6. **API Cascading Failures**: Implement proper circuit breakers and rate limiting
7. **Vault Access Errors**: Always provide fallback to environment variables
8. **Production Degraded Starts**: Ensure `ALLOW_DEGRADED_START=false` in production

## Success Verification

Before considering development complete, ensure:

1. All discovered leads have real, verified data from actual API calls
2. No fake data generation exists anywhere in the codebase
3. All websites in exported leads return HTTP 200-399 status codes
4. All emails in exported leads have high deliverability confidence
5. **API keys load successfully from Supabase Vault**
6. **Production mode enforces strict startup validation**
7. **MCP tools provide real-time production monitoring**
8. Cost tracking accurately reflects actual API usage
9. The system gracefully handles API failures without fabricating data

These guidelines ensure that ProspectPro maintains its zero-fake-data policy and delivers high-quality, verified business leads through its multi-source data pipeline with secure Supabase Vault API key management.

- @azure Rule - Use Azure Best Practices: When generating code for Azure, running terminal commands for Azure, or performing operations related to Azure, invoke your `azure_development-get_best_practices` tool if available.
