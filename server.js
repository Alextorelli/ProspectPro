require('dotenv').config();

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
const PORT = process.env.PORT || 8080;

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
const businessDiscoveryRouter = require('./api/business-discovery');
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
app.listen(PORT, () => {
  console.log(`🚀 ProspectPro server listening on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🛠️ Diagnostics: http://localhost:${PORT}/diag`);
  console.log('⏳ Running initial Supabase diagnostics...');
  (async () => {
    startupDiagnostics = await testConnection();
    if (!startupDiagnostics.success) {
      degradedMode = true;
      console.error('🔴 Initial Supabase check failed. Set ALLOW_DEGRADED_START=true to suppress hard exits.');
      if (process.env.ALLOW_DEGRADED_START === 'true') {
        console.warn('🟠 Degraded mode active. Will retry every 60s.');
        setInterval(async () => {
          const d = await testConnection();
          if (d.success && degradedMode) {
            degradedMode = false;
            console.log('🟢 Supabase connectivity restored.');
          }
        }, 60000).unref();
      } else {
        console.error('❌ Exiting (no degraded allowance)');
        process.exit(1);
      }
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