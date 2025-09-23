/**
 * ProspectPro Server - Production Optimized
 * Streamlined startup for production deployment
 */

// Load environment configuration
const config = {
  environment: process.env.NODE_ENV || 'production',
  port: process.env.PORT || 3000,
  isDevelopment: (process.env.NODE_ENV || 'production') !== 'production'
};

console.log(`🚀 Starting ProspectPro in ${config.environment} mode`);
console.log(`🔧 Server will bind to port ${config.port}`);

// Core dependencies
const express = require('express');
const path = require('path');

// Import streamlined Supabase client
const { testConnection, getSupabaseClient, getDatabaseInfo } = require('./config/supabase');

// Initialize Express app
const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS for development
if (config.isDevelopment) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health endpoints for production monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.environment
  });
});

app.get('/ready', async (req, res) => {
  try {
    const dbTest = await testConnection();
    if (dbTest.success || dbTest.warning) {
      res.json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        database: 'disconnected',
        error: dbTest.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/diag', async (req, res) => {
  try {
    const dbInfo = getDatabaseInfo();
    const dbTest = await testConnection();
    
    res.json({
      database: dbInfo,
      connection: dbTest,
      environment: {
        node_env: config.environment,
        port: config.port,
        supabase_configured: !!process.env.SUPABASE_URL
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes with graceful degradation
let businessDiscoveryRouter;
try {
  businessDiscoveryRouter = require('./api/business-discovery');
} catch (e) {
  console.error('Failed to load business-discovery router:', e.message);
  const router = require('express').Router();
  router.use((req, res) => res.status(503).json({ 
    error: 'Business discovery service unavailable',
    details: config.isDevelopment ? e.message : 'Service initialization failed'
  }));
  businessDiscoveryRouter = router;
}

let campaignExportRouter;
try {
  campaignExportRouter = require('./api/campaign-export');
} catch (e) {
  console.error('Failed to load campaign-export router:', e.message);
  const router = require('express').Router();
  router.use((req, res) => res.status(503).json({ 
    error: 'Campaign export service unavailable',
    details: config.isDevelopment ? e.message : 'Service initialization failed'
  }));
  campaignExportRouter = router;
}

// Mount API routes
app.use('/api/business-discovery', businessDiscoveryRouter);
app.use('/api/campaign-export', campaignExportRouter);

// Default route - serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all for SPA routing
app.get('*', (req, res) => {
  // Only serve SPA for HTML requests (not API calls)
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error.message);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: config.isDevelopment ? error.message : 'Something went wrong',
    ...(config.isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled error safety nets
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Start server with database validation
async function startServer() {
  try {
    console.log('🔍 Testing database connection...');
    const dbTest = await testConnection();
    
    if (dbTest.success) {
      console.log('✅ Database connection verified');
    } else if (dbTest.warning) {
      console.log('⚠️  Database connected with warning:', dbTest.warning);
    } else {
      console.error('❌ Database connection failed:', dbTest.error);
      if (config.environment === 'production' && !process.env.ALLOW_DEGRADED_START) {
        process.exit(1);
      }
      console.log('🔄 Starting in degraded mode...');
    }

    // Start HTTP server
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`🌐 ProspectPro server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.environment}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
      console.log(`🔍 Diagnostics: http://localhost:${config.port}/diag`);
    });

    // Set server timeout for production
    server.timeout = 120000; // 2 minutes

    return server;

  } catch (error) {
    console.error('💥 Server startup failed:', error.message);
    if (config.isDevelopment) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Start the server
startServer();