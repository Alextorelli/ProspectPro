require('dotenv').config();

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
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

// =====================================
// PRODUCTION DATABASE CONFIGURATION (NO MOCK DATA)
// =====================================

let supabase = null;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Supabase (REQUIRED - NO MOCK FALLBACKS)
// Security: Check for sensitive environment variables in logs
function sanitizeEnvForLogs() {
  const sanitized = {};
  const sensitiveKeys = [
    'SUPABASE_SERVICE_ROLE_KEY', 
    'SUPABASE_PUBLISHABLE_KEY',
    'GOOGLE_PLACES_API_KEY', 
    'HUNTER_IO_API_KEY',
    'NEVERBOUNCE_API_KEY',
    'SCRAPINGDOG_API_KEY',
    'JWT_SECRET',
    'PERSONAL_ACCESS_TOKEN',
    'ADMIN_PASSWORD'
  ];
  
  Object.keys(process.env).forEach(key => {
    if (sensitiveKeys.some(sensitive => key.includes(sensitive))) {
      sanitized[key] = key.includes('SUPABASE') 
        ? `${process.env[key]?.substring(0, 8)}...`
        : 'REDACTED';
    } else if (!key.includes('NODE_') && !key.includes('PATH')) {
      sanitized[key] = process.env[key];
    }
  });
  
  return sanitized;
}

// Enhanced Supabase initialization with proper secret key handling
async function initializeSupabase() {
  try {
    console.log('🔐 Initializing Supabase with security compliance...');
    
    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required Supabase environment variables');
    }
    
    // Security: Validate API key format (new format starts with sb_secret_)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_')) {
      console.warn('⚠️  WARNING: Using legacy Supabase key format.');
      console.warn('   Recommendation: Update to new Secret Key format (sb_secret_...) for better security.');
      console.warn('   See: https://github.com/orgs/supabase/discussions/29260');
      console.warn('   Legacy keys work until late 2026, but migration is recommended.');
    } else if (process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_')) {
      console.log('✅ Using modern Supabase Secret Key format');
    } else if (process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_publishable_')) {
      throw new Error('❌ ERROR: Using Publishable Key for server operations. Use Secret Key (sb_secret_...) instead.');
    }
    
    console.log('Environment check:', sanitizeEnvForLogs());
    
    // Use service role key for server-side operations
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    );

    // Test connection and create system user
    const { data: testData, error: testError } = await supabase
      .from('campaigns')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Supabase connection test failed:', testError.message);
      throw testError;
    }

    // Create or verify system user exists
    const { data: systemUser, error: userError } = await supabase
      .from('users')
      .upsert([
        {
          id: SYSTEM_USER_ID,
          email: 'system@prospectpro.internal',
          name: 'ProspectPro System',
          role: 'system',
          created_at: new Date().toISOString()
        }
      ], {
        onConflict: 'id',
        ignoreDuplicates: true
      })
      .select()
      .single();

    if (userError && userError.code !== '23505') { // Ignore duplicate key error
      console.error('❌ System user creation failed:', userError.message);
      throw userError;
    }

    console.log('✅ Supabase initialized successfully');
    console.log(`✅ System user verified: ${SYSTEM_USER_ID}`);
    
    return true;

  } catch (error) {
    console.error('❌ Supabase initialization failed:', error.message);
    throw error;
  }
}

// =====================================
// GOOGLE PLACES API SETUP
// =====================================

const googlePlacesClient = new Client({})

// Apply auth middleware to API routes
app.use('/api', authMiddleware);

// =====================================
// HEALTH CHECK & STATUS
// =====================================

// Health check endpoint for Railway monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: supabase ? 'connected' : 'disconnected',
    version: '1.0.0'
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
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
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
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    // Check API key configuration
    const apiKeysConfigured = {
      google_places: !!process.env.GOOGLE_PLACES_API_KEY,
      scrapingdog: !!process.env.SCRAPINGDOG_API_KEY,
      hunter_io: !!process.env.HUNTER_IO_API_KEY,
      neverbounce: !!process.env.NEVERBOUNCE_API_KEY
    };

    const allApiKeysSet = Object.values(apiKeysConfigured).every(Boolean);

    res.json({
      status: 'operational',
      database: dbConnected ? 'connected' : 'disconnected',
      api_keys: apiKeysConfigured,
      configuration_complete: dbConnected && allApiKeysSet,
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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

async function startServer() {
  try {
    console.log('🚀 Starting ProspectPro Real API Server...');
    console.log('========================================');

    // Test Supabase connection
    console.log('🔌 Testing Supabase connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Supabase connection failed.');
      if (process.env.NODE_ENV === 'development' || process.env.SKIP_AUTH_IN_DEV === 'true') {
        console.log('⚠️  Continuing in development mode without Supabase...');
      } else {
        console.log('📋 Make sure you have set the following environment variables:');
        console.log('   - SUPABASE_URL');
        console.log('   - SUPABASE_SERVICE_ROLE_KEY (use Secret Key: sb_secret_...)');
        console.log('   - GOOGLE_PLACES_API_KEY (required for business discovery)');
        console.log('   - HUNTER_IO_API_KEY (required for email discovery)');
        console.log('   - NEVERBOUNCE_API_KEY (required for email validation)');
        console.log('💡 Generate new API keys at: Settings → API → "Generate new API keys"');
        process.exit(1);
      }
    }

    // Initialize database schema
    console.log('🏗️  Checking database schema...');
    if (dbConnected) {
      const schemaReady = await initializeDatabase();
      
      if (!schemaReady) {
        console.warn('⚠️  Database schema may need initialization.');
        console.log('📋 Please run the SQL schema in your Supabase dashboard:');
        console.log('   File: docs/supabase-schema.sql');
        console.log('   URL: https://app.supabase.com/project/[your-project]/sql');
      }
    } else {
      console.log('⚠️  Skipping schema check (no database connection)');
    }

    // Check API key configuration
    const requiredApiKeys = [
      'GOOGLE_PLACES_API_KEY',
      'SCRAPINGDOG_API_KEY', 
      'HUNTER_IO_API_KEY',
      'NEVERBOUNCE_API_KEY'
    ];

    const missingKeys = requiredApiKeys.filter(key => !process.env[key]);
    
    if (missingKeys.length > 0) {
      console.warn('⚠️  Missing API keys:', missingKeys.join(', '));
      console.log('📋 Add these to your .env file for full functionality');
    } else {
      console.log('✅ All API keys configured');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`✅ ProspectPro server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🎯 Frontend: http://localhost:${PORT}`);
      console.log('========================================');
      console.log('🎉 ProspectPro is ready for real business data!');
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('');
        console.log('� Development Mode Tips:');
        console.log('- Run "npm run test" to validate zero fake data');
        console.log('- Run "npm run test:websites" to test URL validation');
        console.log('- Check /api/status for configuration status');
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;