// Load environment early; ignore if missing (Railway injects vars directly)
try {
  require('dotenv').config();
} catch (e) {
  console.warn('⚠️  dotenv not loaded (likely fine in production):', e.message);
}

const express = require('express');
const path = require('path');
// Import enhanced Supabase diagnostics & lazy client
const {
  testConnection,
  getLastSupabaseDiagnostics,
  getSupabaseClient
} = require('./config/supabase');
const { Client } = require('@googlemaps/google-maps-services-js');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================
// MIDDLEWARE SETUP
// =====================================

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Flag & diagnostics storage
let degradedMode = false;
let startupDiagnostics = null;

// =====================================
// GOOGLE PLACES API SETUP
// =====================================

const googlePlacesClient = new Client({})

// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================

// Simple auth middleware for API routes
const authMiddleware = (req, res, next) => {
  // Skip auth in development if configured
  if (process.env.NODE_ENV !== 'production' && process.env.SKIP_AUTH_IN_DEV === 'true') {
    req.user = { id: 'dev-user-id', email: 'dev@example.com' };
    return next();
  }

  // Check for personal access token in production
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token || token !== process.env.PERSONAL_ACCESS_TOKEN) {
      return res.status(401).json({ 
        error: 'Unauthorized access',
        message: 'Valid access token required'
      });
    }

    // For personal use, set a default user
    req.user = { 
      id: process.env.PERSONAL_USER_ID || 'personal-user',
      email: process.env.PERSONAL_EMAIL || 'personal@example.com'
    };
  }

  next();
};

// Apply auth middleware to API routes
app.use('/api', authMiddleware);

// =====================================
// HEALTH CHECK & STATUS
// =====================================

// Health check endpoint for Railway monitoring
app.get('/health', (req, res) => {
  const diag = startupDiagnostics || getLastSupabaseDiagnostics();
  if (!diag) return res.status(200).json({ status: 'starting', degradedMode });
  const payload = {
    status: diag.success ? 'ok' : (degradedMode ? 'degraded' : 'error'),
    degradedMode,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    supabase: {
      success: diag.success,
      error: diag.success ? null : diag.error,
      authStatus: diag.authProbe?.status,
      recommendations: diag.recommendations,
      durationMs: diag.durationMs
    }
  };
  res.status(200).json(payload);
});

// Lightweight liveness probe (no DB work)
app.get('/live', (req, res) => {
  res.json({ status: 'alive', ts: Date.now(), pid: process.pid });
});

// Readiness probe requires a successful privileged (secret/service) connection
app.get('/ready', async (req, res) => {
  if (req.query.force === 'true' || !getLastSupabaseDiagnostics()) {
    await testConnection();
  }
  const diag = getLastSupabaseDiagnostics();
  if (diag && diag.success && /privileged/.test(diag.authMode || '')) {
    return res.json({ status: 'ready', mode: diag.authMode, durationMs: diag.durationMs });
  }
  res.status(503).json({
    status: 'not-ready',
    degradedMode,
    reason: diag?.failureCategory || diag?.error || 'no-diagnostics',
    authMode: diag?.authMode,
    recommendations: diag?.recommendations || []
  });
});

// Environment + runtime snapshot (no secrets leaked beyond redaction)
app.get('/env-snapshot', (req, res) => {
  res.json({
    portConfigured: PORT,
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptimeSeconds: process.uptime(),
    envKeys: Object.keys(process.env).filter(k => /SUPABASE|GOOGLE|HUNTER|NEVERBOUNCE|SCRAPINGDOG|PORT|NODE_ENV/.test(k)),
    diagnostics: getLastSupabaseDiagnostics()
  });
});

// Admin dashboard route with authentication and secure password injection
app.get('/admin-dashboard.html', (req, res) => {
  // Simple token-based authentication
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || token !== process.env.PERSONAL_ACCESS_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin token' });
  }
  
  // Read the admin dashboard HTML and inject secure configuration
  const fs = require('fs');
  let dashboardHtml = fs.readFileSync(path.join(__dirname, 'public', 'admin-dashboard.html'), 'utf8');
  
  // Inject secure admin password from environment
  const adminPassword = process.env.ADMIN_PASSWORD || 'ProspectPro2024!';
  dashboardHtml = dashboardHtml.replace(
    'window.ADMIN_PASSWORD || \'DEFAULT_ADMIN_PASS\'',
    `'${adminPassword}'`
  );
  
  res.send(dashboardHtml);
});

// Admin API endpoints for dashboard data
app.get('/api/admin/metrics', async (req, res) => {
  try {
    // Authenticate admin request
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token || token !== process.env.PERSONAL_ACCESS_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Database not available' });
    
    const timeRange = req.query.range || '7d';
    const timeFilter = getTimeFilter(timeRange);
    
    // Fetch business metrics
    const [leadsResult, campaignsResult, costsResult] = await Promise.all([
      supabase.from('enhanced_leads').select('*').gte('created_at', timeFilter),
      supabase.from('campaigns').select('*').gte('created_at', timeFilter),  
      supabase.from('api_costs').select('*').gte('created_at', timeFilter)
    ]);
    
    // Calculate metrics
    const totalLeads = leadsResult.data?.length || 0;
    const activeCampaigns = campaignsResult.data?.filter(c => c.status === 'active').length || 0;
    const qualifiedLeads = leadsResult.data?.filter(l => l.is_qualified).length || 0;
    const successRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0';
    
    // Calculate costs
    const totalCosts = costsResult.data?.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0) || 0;
    const costBreakdown = calculateCostBreakdown(costsResult.data || []);
    
    res.json({
      totalLeads,
      activeCampaigns,
      successRate: `${successRate}%`,
      dailyCost: totalCosts.toFixed(2),
      costBreakdown,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Admin metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Helper function to calculate time filters
function getTimeFilter(range) {
  const now = new Date();
  switch (range) {
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}

// Helper function to calculate cost breakdown by API
function calculateCostBreakdown(costs) {
  const breakdown = {
    google: 0,
    hunter: 0,
    neverbounce: 0,
    scrapingdog: 0
  };
  
  costs.forEach(cost => {
    const service = cost.service?.toLowerCase() || '';
    if (service.includes('google')) breakdown.google += parseFloat(cost.amount || 0);
    else if (service.includes('hunter')) breakdown.hunter += parseFloat(cost.amount || 0);
    else if (service.includes('neverbounce')) breakdown.neverbounce += parseFloat(cost.amount || 0);
    else if (service.includes('scrapingdog')) breakdown.scrapingdog += parseFloat(cost.amount || 0);
  });
  
  return {
    google: breakdown.google.toFixed(2),
    hunter: breakdown.hunter.toFixed(2), 
    neverbounce: breakdown.neverbounce.toFixed(2),
    scrapingdog: breakdown.scrapingdog.toFixed(2)
  };
}

app.get('/api/status', async (req, res) => {
  const diag = getLastSupabaseDiagnostics();
  const apiKeysConfigured = {
    google_places: !!process.env.GOOGLE_PLACES_API_KEY,
    scrapingdog: !!process.env.SCRAPINGDOG_API_KEY,
    hunter_io: !!process.env.HUNTER_IO_API_KEY,
    neverbounce: !!process.env.NEVERBOUNCE_API_KEY
  };
  const allApiKeysSet = Object.values(apiKeysConfigured).every(Boolean);
  res.json({
    status: diag ? (diag.success ? 'operational' : (degradedMode ? 'degraded' : 'db-error')) : 'starting',
    database: diag ? (diag.success ? 'connected' : 'error') : 'unknown',
    degradedMode,
    api_keys: apiKeysConfigured,
    configuration_complete: !!diag && diag.success && allApiKeysSet,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    supabase: diag || { note: 'no diagnostics yet' }
  });
});

// =====================================
// DIAGNOSTICS ENDPOINT (SANITIZED)
// =====================================

function redactValue(val) {
  if (val == null) return val;
  const str = String(val);
  if (str.length <= 6) return str[0] + '***';
  return str.slice(0, 4) + '...' + str.slice(-4);
}

const SENSITIVE_KEYS = [
  'SUPABASE', 'GOOGLE', 'HUNTER', 'NEVERBOUNCE', 'SCRAPINGDOG', 'JWT', 'PASSWORD', 'TOKEN', 'KEY', 'SECRET'
];

function buildSanitizedEnv() {
  const out = {};
  for (const [k,v] of Object.entries(process.env)) {
    if (SENSITIVE_KEYS.some(s => k.includes(s))) {
      out[k] = redactValue(v);
    }
    else if (!k.startsWith('NODE_') && !k.startsWith('PATH')) {
      out[k] = v;
    }
  }
  return out;
}

app.get('/diag', async (req, res) => {
  if (req.query.force === 'true') {
    startupDiagnostics = await testConnection();
    degradedMode = !startupDiagnostics.success;
  }
  res.json({
    service: 'ProspectPro',
    timestamp: new Date().toISOString(),
    degradedMode,
    startupDiagnostics,
    lastDiagnostics: getLastSupabaseDiagnostics(),
    environment: buildSanitizedEnv(),
    pid: process.pid,
    uptimeSeconds: process.uptime()
  });
});

// =====================================
// API ROUTES
// =====================================

// Import API routes
let businessDiscoveryRouter;
try {
  businessDiscoveryRouter = require('./api/business-discovery');
} catch (e) {
  console.error('Failed to load business-discovery router:', e.stack || e.message);
  // Provide a stub router so app still responds
  const r = require('express').Router();
  r.use((req, res) => res.status(500).json({ error: 'business-discovery module failed to load', message: e.message }));
  businessDiscoveryRouter = r;
}
// Use simplified business dashboard instead of complex monitoring
const { createSimplifiedDashboardRoutes } = require('./api/simplified-business-dashboard');

// Mount API routes
app.use('/api/business', businessDiscoveryRouter);
app.use('/', createSimplifiedDashboardRoutes()); // Business metrics only

// =====================================
// STATIC FILE SERVING
// =====================================

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Simplified business dashboard route (Railway handles infrastructure)
app.get('/monitoring', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'business-dashboard.html'));
});

// Main dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'business-dashboard.html'));
});

// Handle SPA routing - serve index.html for non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================================
// ERROR HANDLING
// =====================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
});

// =====================================
// SERVER STARTUP
// =====================================

// Early bind server then run diagnostics async
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ProspectPro server listening on port ${PORT} (host: 0.0.0.0)`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🛠️ Diagnostics: http://localhost:${PORT}/diag`);
  console.log('⏳ Running initial Supabase diagnostics...');
  // Heartbeat every 120s for liveness visibility
  setInterval(() => {
    const diag = getLastSupabaseDiagnostics();
    console.log(`❤️  Heartbeat | uptime=${process.uptime().toFixed(0)}s | degraded=${degradedMode} | supabase=${diag ? (diag.success ? 'ok' : 'err') : 'pending'}`);
  }, 120000).unref();

  // Global error safety nets
  process.on('unhandledRejection', (reason, p) => {
    console.error('🧨 Unhandled Promise Rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err.stack || err.message);
  });
  process.on('exit', (code) => {
    console.error('⚰️  Process exiting with code', code, 'uptimeSeconds=', process.uptime());
  });

  // Event loop delay monitor (coarse) for diagnosing stalls
  const loopIntervals = [];
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    const delay = now - lastTick - 1000; // expected 1s interval
    lastTick = now;
    loopIntervals.push(delay);
    if (loopIntervals.length > 60) loopIntervals.shift();
  }, 1000).unref();

  app.get('/loop-metrics', (req, res) => {
    const recent = [...loopIntervals];
    const max = Math.max(0, ...recent);
    const avg = recent.length ? recent.reduce((a,b)=>a+b,0)/recent.length : 0;
    res.json({ sampleCount: recent.length, maxDelayMs: max, avgDelayMs: avg.toFixed(2) });
  });
  (async () => {
    startupDiagnostics = await testConnection();
    if (!startupDiagnostics.success) {
      degradedMode = true;
      console.error('🔴 Initial Supabase check failed. Continuing in degraded mode (will NOT exit).');
      console.warn('🟠 Periodic retry every 60s enabled.');
      setInterval(async () => {
        const d = await testConnection();
        if (d.success && degradedMode) {
          degradedMode = false;
          console.log('🟢 Supabase connectivity restored.');
        }
      }, 60000).unref();
    } else {
      console.log('✅ Supabase connectivity established.');
    }
  })();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;