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
  - `business-discovery.js` - Core business discovery API routes
  - `campaign-export.js` - Campaign export functionality
  - `webhooks/` - Webhook handlers for external integrations
- `modules/` - Core functionality modules
  - `api-clients/` - API client implementations for external services
  - `core/` - Core engines for lead discovery and processing
  - `registry-engines/` - Business registry validation
  - `utils/` - Utility modules like caching, batching, security
  - `validators/` - Data validation modules
- `config/` - Configuration and environment setup
  - `supabase.js` - Database connection management with diagnostics
- `database/` - SQL migration files and database setup

## Server Architecture

### Server Bootstrap Pattern (server.js)

- **Graceful degraded mode**: `ALLOW_DEGRADED_START=true` keeps server alive during DB issues
- **Comprehensive health endpoints**: `/health` (fast), `/diag` (full diagnostics), `/ready` (DB required)
- **Import pattern**: Always use defensive `require()` with stub fallbacks for missing modules

```javascript
// ✅ CORRECT: Defensive imports with graceful degradation
let businessDiscoveryRouter;
try {
  businessDiscoveryRouter = require("./api/business-discovery");
} catch (e) {
  console.error("Failed to load business-discovery router:", e);
  const r = require("express").Router();
  r.use((req, res) => res.status(500).json({ error: "Module failed to load" }));
  businessDiscoveryRouter = r;
}
```

### Supabase Connection Management (config/supabase.js)

- **Key precedence**: `SUPABASE_SECRET_KEY` → `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_ANON_KEY` → `SUPABASE_PUBLISHABLE_KEY`
- **Lazy client initialization**: Only create client when needed, cache instance
- **Diagnostic system**: `testConnection()` returns detailed failure categorization with remediation steps

```javascript
// Key pattern for diagnostics functions
function getLastSupabaseDiagnostics() {
  return lastSupabaseDiagnostics;
}
function setLastSupabaseDiagnostics(diag) {
  lastSupabaseDiagnostics = diag;
}
// ⚠️ CRITICAL: Always export these functions or server.js imports will fail
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

## Production MCP Server Strategy

### Recommended Production MCP Implementation

For rapid CI/CD and troubleshooting optimization, implement a **Production MCP Server** with these priorities:

#### **Phase 1: Environment & Deployment Monitoring (Immediate)**

```javascript
// production-mcp-server.js - Core Tools
const productionTools = {
  // Environment switching and health monitoring
  environment_health_check: {
    purpose: "Real-time Supabase connection, API status, vault accessibility",
    value: "Instant deployment validation",
  },

  github_actions_monitor: {
    purpose: "Live workflow status, artifact availability, build logs",
    value: "Deployment troubleshooting 3x faster",
  },

  dev_prod_config_diff: {
    purpose: "Compare dev container vs production configuration",
    value: "Quick environment switching validation",
  },
};
```

#### **Phase 2: Cost & Performance Tracking (Week 2)**

```javascript
const costManagementTools = {
  real_time_cost_dashboard: {
    purpose: "Live API usage costs, budget alerts, cost per lead",
    value: "Prevent budget overruns, optimize API usage",
  },

  performance_analyzer: {
    purpose: "4-stage pipeline metrics, API response times, quality scores",
    value: "Identify bottlenecks, optimize lead generation",
  },
};
```

#### **Phase 3: Advanced Troubleshooting (Week 3)**

```javascript
const debuggingTools = {
  api_failure_diagnostics: {
    purpose: "Multi-source API health, rate limit status, error aggregation",
    value: "Rapid issue identification and resolution",
  },

  supabase_vault_validator: {
    purpose: "API key presence validation, vault connectivity testing",
    value: "Security credential troubleshooting",
  },
};
```

### MCP Server Architecture for Rapid CI/CD

```javascript
// Optimized for quick dev/prod switching
class ProductionMCPServer {
  constructor() {
    this.tools = [
      // Immediate value tools
      "environment_toggle", // Switch dev/prod with validation
      "deployment_artifact_check", // Verify GitHub Actions artifacts
      "cost_budget_monitor", // Real-time budget tracking

      // Troubleshooting tools
      "error_log_aggregator", // Centralized error monitoring
      "api_health_dashboard", // Multi-source API status
      "database_connection_test", // Supabase connectivity validation

      // Optimization tools
      "performance_metrics", // 4-stage pipeline analytics
      "quality_score_analysis", // Lead confidence distributions
      "cache_efficiency_monitor", // TTL cache performance
    ];
  }
}
```

### ROI for Early Development Phase

- **Development Speed**: 50-70% faster issue resolution
- **Cost Prevention**: Real-time budget monitoring prevents overruns
- **Deployment Confidence**: Instant validation of GitHub Actions workflow
- **Copilot Efficiency**: Contextual production data reduces token usage
- **Context Switching**: 5-10 minutes saved per dev/prod switch

### Implementation Recommendation: **YES - High Value**

The Production MCP Server provides critical value for:

1. **Rapid troubleshooting** during early development iterations
2. **Cost management** with real-time API usage monitoring
3. **Environment switching** validation between dev container and production
4. **Deployment monitoring** of GitHub Actions workflow status

**Priority**: Implement Phase 1 tools immediately for maximum early-stage value.

### Testing Critical Validations

```bash
# Docker validation tests
docker-compose exec prospectpro node tests/validation/test-real-data.js
docker-compose exec prospectpro node tests/validation/test-website-validation.js

# Direct testing
node tests/validation/test-real-data.js         # Verify no fake data generation
node tests/validation/test-website-validation.js # Verify all URLs work
node debug/inspect-business-data.js             # Debug specific business data
```

## Repository Management

## GitHub Workflow Integration

### Core Workflows

1. **Docker Environment** (`.github/workflows/docker-env.yml`)

   - Creates Docker-compatible environment files
   - Integrates with GitHub Secrets for infrastructure
   - Tests Supabase connection and Docker build
   - Uploads environment artifact for deployment

2. **CI/CD Pipeline** (`.github/workflows/ci.yml`)

   - Runs tests and validations for PRs and main branch
   - Enforces code quality and security standards
   - Validates Docker builds and configurations
   - Prevents fake data patterns in code

3. **Repository Maintenance** (`.github/workflows/repository-maintenance.yml`)
   - Weekly code health checks
   - Documentation updates
   - Dependency vulnerability scanning

### Security Architecture

ProspectPro uses a two-tier secret management approach:

1. **GitHub Secrets** (Infrastructure)

   - `SUPABASE_URL`: Database connection endpoint
   - `SUPABASE_SECRET_KEY`: Database service role key
   - `PERSONAL_ACCESS_TOKEN`: Admin authentication

2. **Supabase Vault** (API Keys)
   - `GOOGLE_PLACES_API_KEY`
   - `FOURSQUARE_API_KEY`
   - `HUNTER_IO_API_KEY`
   - `NEVERBOUNCE_API_KEY`
   - `APOLLO_API_KEY`
   - Additional API keys for testing and expansion

## Documentation & Branching Taxonomy

### Documentation Structure

- `README.md`: Project overview and quick start
- `CHANGELOG.md`: Version history and release notes
- `PRODUCTION_READY_REPORT.md`: Production readiness checklist
- `docs/`: Detailed documentation categorized by purpose
  - `docs/setup/`: Installation and environment guides
  - `docs/guides/`: User and operational guides
  - `docs/technical/`: Technical specifications
  - `docs/deployment/`: Deployment instructions and workflows
  - `docs/development/`: Development standards and practices

### Branch Management

- `main`: Production-ready code with strict governance
- `development`: Active development branch
- `feature/*`: Feature-specific branches
- `bugfix/*`: Bug fix branches
- `archive/development-phase`: Archive of development artifacts
- `archive/deployment-phase`: Archive of legacy deployment configs
- `archive/testing-reports`: Archive of test reports and validation data

### Repository Governance

The repository enforces strict governance rules through pre-commit hooks:

- Root directory limited to 3 markdown files
- No development artifacts in main branch
- Documentation must follow the established schema
- Prevents fake data patterns in commits

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

- Uses `EnhancedLeadDiscovery` class with budget limits
- Returns comprehensive metadata: cost per lead, processing time, qualification rate
- Implements campaign logging to `campaigns` table via `CampaignLogger`

### `/modules/core/core-business-discovery-engine.js`

- Implements multi-source discovery with Foursquare and Google Places
- Handles cross-platform validation and deduplication
- Optimizes API costs with tiered access strategy

### `/modules/core/core-lead-discovery-engine.js`

- Implements the 4-stage pipeline architecture
- Handles email and contact differentiation
- Calculates comprehensive confidence scores

### `/modules/api-clients/`

- Each client implements consistent error handling and caching
- Tracks usage statistics and costs
- Normalizes responses for uniform processing

## Production Considerations

### Environment Variables

- `ALLOW_DEGRADED_START=true` for initial deployment debugging
- `PERSONAL_ACCESS_TOKEN` for admin dashboard authentication
- `PORT` automatically set by platform (bind to `0.0.0.0`)

### Monitoring Endpoints

- `/health`: Health checks with degraded mode support
- `/diag`: Full Supabase connection diagnostics with sanitized environment
- `/ready`: Kubernetes-style readiness probe requiring privileged DB connection
- `/metrics`: Prometheus-compatible metrics endpoint

## Common Implementation Traps

1. **Fake Data Generation**: Remove any hardcoded business arrays
2. **Sequential Addresses**: Check for patterns like "100 Main St", "110 Main St"
3. **Generic Business Names**: Validate against patterns like "Business LLC", "Company Inc"
4. **Non-working URLs**: Always verify website accessibility before export
5. **Undeliverable Emails**: Never export emails that fail validation
6. **API Cascading Failures**: Implement proper circuit breakers and rate limiting

## Success Verification

Before considering development complete, ensure:

1. All discovered leads have real, verified data from actual API calls
2. No fake data generation exists anywhere in the codebase
3. All websites in exported leads return HTTP 200-399 status codes
4. All emails in exported leads have high deliverability confidence
5. Cost tracking accurately reflects actual API usage
6. The system gracefully handles API failures without fabricating data

These guidelines ensure that ProspectPro maintains its zero-fake-data policy and delivers high-quality, verified business leads through its multi-source data pipeline.

- @azure Rule - Use Azure Best Practices: When generating code for Azure, running terminal commands for Azure, or performing operations related to Azure, invoke your `azure_development-get_best_practices` tool if available.
