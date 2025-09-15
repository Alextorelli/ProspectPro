const const app = express();
const PORT = process.env.PORT || 8080;

// =====================================
// PRODUCTION DATABASE CONFIGURATION (NO MOCK DATA)
// =====================================

let supabase = null;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Supabase (REQUIRED - NO MOCK FALLBACKS)
async function initializeSupabase() {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test actual database connection
    const { data, error } = await supabase.from('campaigns').select('count').limit(1);
    if (error) throw error;
    
    console.log('✅ Supabase production database connected successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Supabase database connection failed:', error.message);
    
    if (isProduction) {
      console.error('🚨 PRODUCTION REQUIRES WORKING DATABASE - NO MOCK DATA ALLOWED');
      console.error('📋 Required environment variables:');
      console.error('   - SUPABASE_URL');
      console.error('   - SUPABASE_SERVICE_ROLE_KEY');
      console.error('   - GOOGLE_PLACES_API_KEY');
      process.exit(1); // Exit in production without database
    }
    
    console.warn('⚠️  Development mode: Database connection failed');
    return false;
  }
}s = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================
// SECURITY & MIDDLEWARE SETUP
// =====================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? allowedOrigins 
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'prospect-pro-api',
  points: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests
  duration: 60, // per 60 seconds
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1,
    });
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================

// Simple auth for personal use in production
const authMiddleware = (req, res, next) => {
  // Skip auth in development if configured
  if (process.env.NODE_ENV !== 'production' && process.env.SKIP_AUTH_IN_DEV === 'true') {
    req.user = { id: 'dev-user-id', email: 'dev@example.com' }; // Mock user for development
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

    // For personal use, we can set a default user
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

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV,
    supabase: 'connected' // We'll update this after connection test
  });
});

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
        console.log('   - SUPABASE_SERVICE_ROLE_KEY');
        console.log('   - SUPABASE_ANON_KEY');
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