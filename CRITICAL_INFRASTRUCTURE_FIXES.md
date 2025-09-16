# ProspectPro Critical Infrastructure Fixes & Hardening Instructions

## Executive Summary

Based on the comprehensive log analysis, network diagnostics, and Supabase AI security assessment, ProspectPro requires immediate critical fixes across multiple infrastructure layers. The application is experiencing persistent 502 errors due to a fatal function reference error combined with RLS security misconfigurations.

## Root Cause Analysis

### Primary Issues Identified:

1. **Fatal Runtime Error**: `TypeError: getLastSupabaseDiagnostics is not a function` causing process crashes
2. **Import/Export Mismatch**: Server.js references functions that don't exist in the current `config/supabase.js`
3. **RLS Security Vulnerabilities**: Multiple tables with policies but RLS disabled
4. **Network Connectivity**: TLS handshake successful but application layer failing
5. **Missing Boot Phase Visibility**: No granular startup diagnostics

### Secondary Infrastructure Gaps:

- No Prometheus monitoring for production observability
- Insufficient security hardening measures  
- Outdated documentation and configuration files
- Missing comprehensive error recovery mechanisms

---

## CRITICAL FIX #1: Function Reference Error Resolution

### Problem
Server crashes with `getLastSupabaseDiagnostics is not a function` in heartbeat timer (line 403).

### Root Cause
The `server.js` file references functions that were refactored or removed from `config/supabase.js` during recent updates.

### Implementation Instructions

**Step 1: Audit Current Function Exports**
```bash
# Check what's actually exported from config/supabase.js
grep -n "module.exports\|exports\." config/supabase.js
```

**Step 2: Fix `config/supabase.js` Export Structure**
Create a comprehensive, bulletproof export structure:

```javascript
// Add at the end of the file, replacing any existing module.exports

let lastDiagnosticsCache = null;
let supabaseClientInstance = null;

/**
 * Get cached diagnostics without re-running tests
 */
function getLastSupabaseDiagnostics() {
  return lastDiagnosticsCache;
}

/**
 * Store diagnostics in cache for retrieval
 */
function setLastSupabaseDiagnostics(diagnostics) {
  lastDiagnosticsCache = diagnostics;
}

/**
 * Get or create Supabase client instance
 */
function getSupabaseClient() {
  if (supabaseClientInstance) return supabaseClientInstance;
  
  const url = process.env.SUPABASE_URL;
  const { key } = resolveSupabaseKey();
  
  if (!url || !key) {
    console.warn('Supabase client creation failed: missing URL or key');
    return null;
  }

  const { createClient } = require('@supabase/supabase-js');
  supabaseClientInstance = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'X-Client-Info': 'ProspectPro-Server/2.0' } }
  });
  
  return supabaseClientInstance;
}

// Ensure testConnection updates the cache
async function testConnection(options = {}) {
  const diagnostics = await performConnectionTest(options);
  setLastSupabaseDiagnostics(diagnostics);
  return diagnostics;
}

// Export ALL required functions
module.exports = {
  testConnection,
  getLastSupabaseDiagnostics,
  setLastSupabaseDiagnostics,
  getSupabaseClient,
  resolveSupabaseKey
};
```

**Step 3: Fix `server.js` Import References**
```javascript
// Update the import section at the top

const { 
  testConnection, 
  getLastSupabaseDiagnostics, 
  getSupabaseClient 
} = require('./config/supabase');
```

---

## CRITICAL FIX #2: Boot Phase Debugging System

### Implementation: Multi-Phase Startup Instrumentation

Create a comprehensive boot phase debugging system:

```javascript
class BootPhaseDebugger {
  constructor() {
    this.phases = new Map();
    this.startTime = Date.now();
    this.currentPhase = null;
  }

  startPhase(name, description) {
    const now = Date.now();
    this.currentPhase = {
      name,
      description,
      startTime: now,
      relativeMs: now - this.startTime
    };
    
    console.log(`🚦 BOOT[${this.currentPhase.relativeMs}ms] Starting: ${name} - ${description}`);
    return this.currentPhase;
  }

  endPhase(success = true, error = null) {
    if (!this.currentPhase) return;
    
    const now = Date.now();
    const duration = now - this.currentPhase.startTime;
    
    const phase = {
      ...this.currentPhase,
      endTime: now,
      duration,
      success,
      error: error?.message || null
    };
    
    this.phases.set(phase.name, phase);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} BOOT[${now - this.startTime}ms] Completed: ${phase.name} (${duration}ms)`);
    
    if (!success && error) {
      console.error(`   Error Details: ${error.message}`);
    }
    
    this.currentPhase = null;
    return phase;
  }

  getPhaseReport() {
    const totalTime = Date.now() - this.startTime;
    const phases = Array.from(this.phases.values());
    const failed = phases.filter(p => !p.success);
    
    return {
      totalBootTime: totalTime,
      phaseCount: phases.length,
      failedPhases: failed.length,
      phases,
      failed
    };
  }

  logFinalReport() {
    const report = this.getPhaseReport();
    console.log(`\n📊 BOOT COMPLETE - Total: ${report.totalBootTime}ms, Phases: ${report.phaseCount}, Failed: ${report.failedPhases}`);
    
    if (report.failed.length > 0) {
      console.error('Failed phases:', report.failed.map(p => p.name).join(', '));
    }
  }
}

module.exports = { BootPhaseDebugger };
```

**Integration into server.js:**
```javascript
// Add at the very top, before any other imports
const { BootPhaseDebugger } = require('./modules/boot-debugger');
const bootDebugger = new BootPhaseDebugger();

// Wrap every major startup step
bootDebugger.startPhase('env-load', 'Loading environment variables');
try {
  require('dotenv').config({ path: '.env' });
  bootDebugger.endPhase(true);
} catch (e) {
  bootDebugger.endPhase(false, e);
}

bootDebugger.startPhase('express-init', 'Initializing Express application');
const express = require('express');
const app = express();
bootDebugger.endPhase(true);

bootDebugger.startPhase('port-bind', 'Binding to network port');
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  bootDebugger.endPhase(true);
  console.log(`🚀 ProspectPro server listening on port ${PORT} (host: 0.0.0.0)`);
  
  // Add boot phase report endpoint
  app.get('/boot-report', (req, res) => {
    res.json(bootDebugger.getPhaseReport());
  });
  
  // Continue with async initialization
  performAsyncBootPhases();
});

async function performAsyncBootPhases() {
  // Supabase connection phase
  bootDebugger.startPhase('supabase-test', 'Testing Supabase connectivity');
  try {
    const diagnostics = await testConnection();
    bootDebugger.endPhase(diagnostics.success, diagnostics.success ? null : new Error(diagnostics.error));
  } catch (e) {
    bootDebugger.endPhase(false, e);
  }
  
  bootDebugger.logFinalReport();
}
```

---

## CRITICAL FIX #3: RLS Security Implementation

### Analysis of Supabase AI Recommendations

The Supabase AI diagnostic revealed critical security vulnerabilities:
- Tables have policies but RLS is disabled
- Policies incorrectly target `public` role instead of `authenticated`
- Missing proper user isolation

### Implementation: Comprehensive RLS Security Script

```sql
-- ProspectPro RLS Security Hardening Script
-- Based on Supabase AI analysis and zero-trust security model

-- ===========================================
-- PHASE 1: Enable RLS on All Tables
-- ===========================================

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exported_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PHASE 2: Drop All Existing Insecure Policies
-- ===========================================

-- Remove policies that incorrectly target 'public' role
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can access businesses from their campaigns" ON public.businesses;
DROP POLICY IF EXISTS "Users can access validation data for their businesses" ON public.business_validation;
DROP POLICY IF EXISTS "Users can access cost data for their campaigns" ON public.api_costs;
DROP POLICY IF EXISTS "Users can access analytics for their campaigns" ON public.campaign_analytics;
DROP POLICY IF EXISTS "Users can access their exported leads" ON public.exported_leads;
DROP POLICY IF EXISTS "Authenticated users can read system settings" ON public.system_settings;

-- ===========================================
-- PHASE 3: Create Secure User-Isolated Policies
-- ===========================================

-- CAMPAIGNS TABLE: Users can only access their own campaigns
CREATE POLICY "campaign_select_owner" ON public.campaigns
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "campaign_insert_owner" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "campaign_update_owner" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "campaign_delete_owner" ON public.campaigns
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- BUSINESSES TABLE: Access via campaign ownership
CREATE POLICY "business_select_via_campaign" ON public.businesses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "business_insert_via_campaign" ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "business_update_via_campaign" ON public.businesses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "business_delete_via_campaign" ON public.businesses
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

-- BUSINESS_VALIDATION TABLE: Access via business->campaign ownership chain
CREATE POLICY "validation_select_via_ownership" ON public.business_validation
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = business_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "validation_insert_via_ownership" ON public.business_validation
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = business_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "validation_update_via_ownership" ON public.business_validation
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = business_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = business_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "validation_delete_via_ownership" ON public.business_validation
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.campaigns c ON c.id = b.campaign_id
      WHERE b.id = business_id AND c.user_id = auth.uid()
    )
  );

-- API_COSTS TABLE: Access via campaign ownership
CREATE POLICY "api_costs_select_via_campaign" ON public.api_costs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "api_costs_insert_via_campaign" ON public.api_costs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "api_costs_update_via_campaign" ON public.api_costs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "api_costs_delete_via_campaign" ON public.api_costs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

-- CAMPAIGN_ANALYTICS TABLE: Access via campaign ownership
CREATE POLICY "analytics_select_via_campaign" ON public.campaign_analytics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "analytics_insert_via_campaign" ON public.campaign_analytics
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "analytics_update_via_campaign" ON public.campaign_analytics
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "analytics_delete_via_campaign" ON public.campaign_analytics
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

-- EXPORTED_LEADS TABLE: Access via campaign ownership
CREATE POLICY "exported_leads_select_via_campaign" ON public.exported_leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "exported_leads_insert_via_campaign" ON public.exported_leads
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "exported_leads_update_via_campaign" ON public.exported_leads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "exported_leads_delete_via_campaign" ON public.exported_leads
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

-- SYSTEM_SETTINGS TABLE: Read-only access for authenticated users
CREATE POLICY "system_settings_read_authenticated" ON public.system_settings
  FOR SELECT TO authenticated
  USING (true);

-- ===========================================
-- PHASE 4: Performance Optimization Indexes
-- ===========================================

-- Indexes for policy performance (if not already present)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_user_id 
  ON public.campaigns(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_campaign_id 
  ON public.businesses(campaign_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_business_validation_business_id 
  ON public.business_validation(business_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_costs_campaign_id 
  ON public.api_costs(campaign_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_analytics_campaign_id 
  ON public.campaign_analytics(campaign_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exported_leads_campaign_id 
  ON public.exported_leads(campaign_id);

-- ===========================================
-- PHASE 5: Fix Security Definer Functions
-- ===========================================

-- Fix mutable search_path issue identified by Supabase AI
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ===========================================
-- PHASE 6: Verification Queries
-- ===========================================

-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity, checkcondition
FROM pg_tables 
JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE schemaname = 'public' 
  AND tablename IN ('campaigns', 'businesses', 'business_validation', 
                   'api_costs', 'campaign_analytics', 'exported_leads', 'system_settings');

-- Verify all policies target 'authenticated' role
SELECT schemaname, tablename, policyname, roles, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND 'public' = ANY(roles);  -- This should return 0 rows

-- Show policy count per table
SELECT tablename, count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

---

## FEATURE ADDITION #4: Prometheus Monitoring System

### Implementation: Full Production Monitoring

```javascript
const promClient = require('prom-client');

class ProspectProMetrics {
  constructor() {
    // Create custom metrics registry
    this.register = new promClient.Registry();
    
    // Add default Node.js metrics
    promClient.collectDefaultMetrics({ register: this.register });
    
    this.initializeCustomMetrics();
  }

  initializeCustomMetrics() {
    // HTTP Request metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    // Supabase Connection metrics
    this.supabaseConnectionDuration = new promClient.Histogram({
      name: 'supabase_connection_duration_seconds',
      help: 'Duration of Supabase connection tests',
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    this.supabaseConnectionStatus = new promClient.Gauge({
      name: 'supabase_connection_status',
      help: 'Current Supabase connection status (1=connected, 0=disconnected)'
    });

    this.supabaseFailures = new promClient.Counter({
      name: 'supabase_failures_total',
      help: 'Total number of Supabase connection failures',
      labelNames: ['failure_category']
    });

    // API Cost tracking
    this.apiCostTotal = new promClient.Counter({
      name: 'api_cost_total_cents',
      help: 'Total API costs in cents',
      labelNames: ['provider', 'operation']
    });

    this.apiRequestsTotal = new promClient.Counter({
      name: 'api_requests_total',
      help: 'Total API requests made to external services',
      labelNames: ['provider', 'status']
    });

    // Business Discovery metrics
    this.businessesDiscovered = new promClient.Counter({
      name: 'businesses_discovered_total',
      help: 'Total businesses discovered',
      labelNames: ['source']
    });

    this.businessesValidated = new promClient.Counter({
      name: 'businesses_validated_total',
      help: 'Total businesses that passed validation',
      labelNames: ['validation_type']
    });

    // Campaign metrics
    this.activeCampaigns = new promClient.Gauge({
      name: 'active_campaigns_current',
      help: 'Number of currently active campaigns'
    });

    this.campaignCompletionTime = new promClient.Histogram({
      name: 'campaign_completion_seconds',
      help: 'Time taken to complete campaigns',
      buckets: [60, 300, 600, 1800, 3600, 7200] // 1min to 2hours
    });

    // Error tracking
    this.errorRate = new promClient.Counter({
      name: 'errors_total',
      help: 'Total number of errors by type',
      labelNames: ['error_type', 'component']
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.supabaseConnectionDuration);
    this.register.registerMetric(this.supabaseConnectionStatus);
    this.register.registerMetric(this.supabaseFailures);
    this.register.registerMetric(this.apiCostTotal);
    this.register.registerMetric(this.apiRequestsTotal);
    this.register.registerMetric(this.businessesDiscovered);
    this.register.registerMetric(this.businessesValidated);
    this.register.registerMetric(this.activeCampaigns);
    this.register.registerMetric(this.campaignCompletionTime);
    this.register.registerMetric(this.errorRate);
  }

  // Express middleware for automatic HTTP metrics
  getHttpMetricsMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path || 'unknown';
        
        this.httpRequestDuration
          .labels(req.method, route, res.statusCode.toString())
          .observe(duration);
        
        this.httpRequestTotal
          .labels(req.method, route, res.statusCode.toString())
          .inc();
      });
      
      next();
    };
  }

  // Record Supabase connection metrics
  recordSupabaseConnection(duration, success, failureCategory = null) {
    this.supabaseConnectionDuration.observe(duration / 1000);
    this.supabaseConnectionStatus.set(success ? 1 : 0);
    
    if (!success && failureCategory) {
      this.supabaseFailures.labels(failureCategory).inc();
    }
  }

  // Record API costs
  recordApiCost(provider, operation, costCents) {
    this.apiCostTotal.labels(provider, operation).inc(costCents);
  }

  // Record business discovery
  recordBusinessDiscovery(source, count) {
    this.businessesDiscovered.labels(source).inc(count);
  }

  // Record errors
  recordError(errorType, component) {
    this.errorRate.labels(errorType, component).inc();
  }

  // Get metrics for /metrics endpoint
  getMetrics() {
    return this.register.metrics();
  }
}

module.exports = { ProspectProMetrics };
```

**Integration into server.js:**
```javascript
// Add to imports
const { ProspectProMetrics } = require('./modules/prometheus-metrics');

// Initialize metrics
const metrics = new ProspectProMetrics();

// Add metrics middleware
app.use(metrics.getHttpMetricsMiddleware());

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.send(await metrics.getMetrics());
});

// Update Supabase diagnostics to record metrics
async function performAsyncBootPhases() {
  bootDebugger.startPhase('supabase-test', 'Testing Supabase connectivity');
  const start = Date.now();
  
  try {
    const diagnostics = await testConnection();
    const duration = Date.now() - start;
    
    // Record metrics
    metrics.recordSupabaseConnection(duration, diagnostics.success, diagnostics.failureCategory);
    
    bootDebugger.endPhase(diagnostics.success, diagnostics.success ? null : new Error(diagnostics.error));
  } catch (e) {
    const duration = Date.now() - start;
    metrics.recordSupabaseConnection(duration, false, 'exception');
    metrics.recordError('supabase_connection', 'startup');
    bootDebugger.endPhase(false, e);
  }
  
  bootDebugger.logFinalReport();
}
```

---

## HARDENING PATCHES #5: Additional Security & Resilience

### Implementation: Comprehensive Security Middleware

```javascript
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

class SecurityHardening {
  static getMiddleware() {
    const middleware = [];

    // 1. Helmet for security headers
    middleware.push(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://*.supabase.co"],
          fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // 2. CORS with strict origins
    middleware.push(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://prospectpro-production-ddc7.up.railway.app']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // 3. Rate limiting for API endpoints
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // 4. Stricter rate limiting for expensive operations
    const expensiveLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit to 10 requests per hour
      message: {
        error: 'Rate limit exceeded for expensive operations',
        retryAfter: '1 hour'
      }
    });

    return {
      general: middleware,
      apiLimiter,
      expensiveLimiter
    };
  }

  static getAdminAuthMiddleware() {
    return (req, res, next) => {
      const adminPassword = process.env.ADMIN_PASSWORD;
      const providedPassword = req.headers.authorization?.replace('Bearer ', '');
      
      if (!adminPassword || !providedPassword || providedPassword !== adminPassword) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Valid admin authorization required'
        });
      }
      
      next();
    };
  }

  static getRequestValidation() {
    return {
      validateCampaignInput: (req, res, next) => {
        const { businessType, location, maxResults } = req.body;
        
        if (!businessType || typeof businessType !== 'string' || businessType.length > 100) {
          return res.status(400).json({
            error: 'Invalid businessType',
            message: 'Business type must be a string under 100 characters'
          });
        }
        
        if (!location || typeof location !== 'string' || location.length > 200) {
          return res.status(400).json({
            error: 'Invalid location',
            message: 'Location must be a string under 200 characters'
          });
        }
        
        if (maxResults && (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 100)) {
          return res.status(400).json({
            error: 'Invalid maxResults',
            message: 'Max results must be a number between 1 and 100'
          });
        }
        
        next();
      }
    };
  }
}

module.exports = { SecurityHardening };
```

---

## DOCUMENTATION UPDATES #6: Comprehensive Documentation Overhaul

### 6.1 Update `README.md`

```markdown
# ProspectPro - Real Lead Generation Platform

## Current Status: Production-Ready v2.0

### ✅ Recent Fixes Applied
- **Critical Function Reference Error**: Fixed missing `getLastSupabaseDiagnostics` export
- **RLS Security**: Implemented comprehensive row-level security policies
- **Boot Phase Debugging**: Added granular startup diagnostics
- **Prometheus Monitoring**: Full production metrics and observability
- **Security Hardening**: Helmet, CORS, rate limiting, input validation

### 🚀 Quick Start (Updated)

```bash
git clone [repository]
cd ProspectPro
npm install

# Set environment variables (see Environment Configuration below)
cp .env.example .env
# Edit .env with your API keys

# Run with boot debugging
npm run dev

# Check boot phases
curl http://localhost:3000/boot-report

# Check metrics
curl http://localhost:3000/metrics
```

### 📊 New Monitoring Endpoints

| Endpoint | Purpose | Authentication |
|----------|---------|----------------|
| `/live` | Basic liveness check | None |
| `/ready` | Readiness probe (requires DB) | None |
| `/health` | General health status | None |
| `/metrics` | Prometheus metrics | None |
| `/boot-report` | Boot phase analysis | None |
| `/diag` | Full diagnostics | None |
| `/env-snapshot` | Environment status | None |
| `/loop-metrics` | Event loop performance | None |

### 🔐 Security Features

- **RLS Policies**: User-isolated database access
- **Rate Limiting**: API protection (100 req/15min general, 10 req/hour expensive)
- **CSP Headers**: Content Security Policy protection
- **CORS**: Strict origin control
- **Input Validation**: Request sanitization

### 🏗️ Environment Configuration

```bash
# Core Database (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_key_here

# External APIs (REQUIRED for functionality)
GOOGLE_PLACES_API_KEY=your_google_key
HUNTER_IO_API_KEY=your_hunter_key
NEVERBOUNCE_API_KEY=your_neverbounce_key

# Security (REQUIRED for production)
ADMIN_PASSWORD=your_secure_admin_password
PERSONAL_ACCESS_TOKEN=your_secure_token

# Optional Development
ALLOW_DEGRADED_START=true  # Only for debugging
LOG_LEVEL=info
NODE_ENV=production
```

### 🔧 Troubleshooting

#### Common Issues & Solutions

1. **502 Bad Gateway**
   - Check `/boot-report` for failed phases
   - Verify `SUPABASE_SECRET_KEY` is set correctly
   - Confirm RLS policies allow your operations

2. **Supabase Connection Failures**
   - Run `curl /diag?force=true` to get detailed diagnostics
   - Check `failureCategory` in response:
     - `invalid-key`: Replace API key
     - `missing-table`: Run database migrations
     - `rls-block`: Check user authentication

3. **Rate Limiting**
   - General API: 100 requests per 15 minutes
   - Expensive operations: 10 requests per hour
   - Use `Retry-After` header for backoff timing

### 📈 Monitoring & Metrics

Prometheus metrics available at `/metrics`:

- HTTP request duration and counts
- Supabase connection health
- API cost tracking
- Business discovery rates
- Error rates by component
- Campaign completion times

### 🛡️ Security Model

1. **Database Security**: RLS policies ensure users only access their own data
2. **API Security**: Rate limiting and input validation
3. **Transport Security**: HTTPS enforced, secure headers
4. **Authentication**: Admin operations require password
5. **Monitoring**: All security events tracked in metrics

### 📋 Production Deployment Checklist

- [ ] Set all required environment variables
- [ ] Run RLS security hardening script
- [ ] Configure monitoring alerts
- [ ] Test rate limiting behavior  
- [ ] Verify backup and recovery procedures
- [ ] Load test with expected traffic
```

### 6.2 Create MONITORING.md

```markdown
# ProspectPro Monitoring & Observability Guide

## Metrics Overview

### Core Business Metrics
- `businesses_discovered_total`: Total businesses found by source
- `businesses_validated_total`: Businesses passing validation
- `api_cost_total_cents`: External API costs tracking
- `campaign_completion_seconds`: Campaign processing time

### Infrastructure Metrics
- `http_request_duration_seconds`: API response times
- `supabase_connection_status`: Database connectivity (1=connected)
- `errors_total`: Error rates by component
- `nodejs_*`: Node.js runtime metrics

### Alert Recommendations

```yaml
# Prometheus Alert Rules
groups:
- name: prospectpro
  rules:
  - alert: SupabaseDown
    expr: supabase_connection_status == 0
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Supabase connection lost"
      
  - alert: HighErrorRate
    expr: rate(errors_total[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      
  - alert: SlowAPIResponses
    expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 5
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "95th percentile response time > 5s"
```

### Dashboard Setup

Import the following Grafana dashboard configuration:
[Include JSON dashboard config]

### Log Analysis

Key log patterns to monitor:
- `BOOT[*]`: Startup phase issues
- `🔥 Uncaught Exception`: Critical errors
- `❌ Supabase connectivity issue`: Database problems
- `🛑 SIGTERM received`: Graceful shutdowns
```

### 6.3 Create SECURITY.md

```markdown
# ProspectPro Security Documentation

## Security Architecture

### Database Security (RLS)
- **User Isolation**: Each user can only access their own campaigns and related data
- **Policy Enforcement**: All operations go through Row Level Security policies
- **Function Security**: Database functions use `SECURITY DEFINER` with fixed search paths

### Application Security
- **Rate Limiting**: Tiered limits (general: 100/15min, expensive: 10/hour)
- **Input Validation**: All user inputs sanitized and validated
- **Security Headers**: CSP, HSTS, X-Frame-Options via Helmet
- **CORS**: Strict origin allowlist for production

### Authentication & Authorization
- **Admin Operations**: Protected by `ADMIN_PASSWORD` environment variable
- **API Keys**: Secure storage and rotation procedures
- **Database Access**: Service role key for server operations only

## Security Incident Response

### 1. Suspicious Activity Detection
- Monitor error rates in `/metrics`
- Check rate limiting violations in logs
- Review unusual database query patterns

### 2. Incident Containment
```bash
# Immediately rotate API keys if compromised
# Update ADMIN_PASSWORD if needed
# Check RLS policy violations in Supabase

# Emergency: Disable new registrations
export ALLOW_NEW_USERS=false

# Emergency: Enable maintenance mode
export MAINTENANCE_MODE=true
```

### 3. Recovery Procedures
- Verify RLS policies are functioning
- Audit recent data access patterns
- Update security patches
- Communicate with affected users

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Admin password set and secure (>20 chars)
- [ ] Rate limiting active and tested
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Database credentials rotated regularly
- [ ] Monitoring alerts configured
- [ ] Incident response plan tested
```

---

## FILE CLEANUP #7: Repository Maintenance

### 7.1 Files to Remove (Deprecated)

```bash
# Execute these commands to clean up the repository

# Remove outdated documentation
rm -f UPDATED_DEPLOYMENT_GUIDE.md
rm -f legacy-setup.md
rm -f old-railway-config.md

# Remove old Docker files if using Nixpacks
rm -f Dockerfile.old
rm -f docker-compose.yml.backup

# Remove test artifacts
rm -rf test/coverage/
rm -f test/results.xml

# Remove old configuration files
rm -f .env.old
rm -f config.json.backup

# Remove deprecated scripts
rm -f scripts/old-validation.js
rm -f scripts/legacy-setup.sh
```

### 7.2 Update .gitignore

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output/

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# ProspectPro specific
debug/exports/
test/output/
monitoring/alerts/
backup/
certificates/

# Metrics and monitoring
prometheus-data/
grafana-data/
```

---

## IMPLEMENTATION PRIORITY ORDER

### Phase 1: Critical Fixes (Do First)
1. Fix function export in `config/supabase.js`
2. Add boot phase debugger
3. Test basic connectivity

### Phase 2: Security (Do Second)  
1. Run RLS security hardening script
2. Test database policies
3. Implement security middleware

### Phase 3: Monitoring (Do Third)
1. Add Prometheus metrics
2. Set up monitoring endpoints
3. Configure alerts

### Phase 4: Documentation & Cleanup
1. Update all documentation
2. Remove deprecated files
3. Test full deployment

---

## VALIDATION COMMANDS

After implementing all fixes, run these commands to verify success:

```bash
# 1. Basic connectivity
curl https://your-app.railway.app/live

# 2. Boot phase analysis
curl https://your-app.railway.app/boot-report | jq

# 3. Full diagnostics
curl https://your-app.railway.app/diag?force=true | jq

# 4. Metrics endpoint
curl https://your-app.railway.app/metrics

# 5. Security headers
curl -I https://your-app.railway.app/

# 6. Rate limiting test
for i in {1..5}; do curl https://your-app.railway.app/api/status; done
```

## SUCCESS CRITERIA

- [ ] No 502 errors on any endpoint
- [ ] Boot report shows all phases successful
- [ ] Diagnostics show `success: true`
- [ ] Metrics endpoint returns Prometheus format
- [ ] Security headers present in responses
- [ ] RLS policies prevent unauthorized access
- [ ] All documentation updated and accurate
- [ ] Repository cleaned of deprecated files

This comprehensive fix addresses all identified issues and transforms ProspectPro into a production-ready, secure, monitored application.