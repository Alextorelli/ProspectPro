const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
// Note: We now prefer publishable and secret keys over legacy JWT keys
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',  // Keep for backwards compatibility until migration
  'SUPABASE_ANON_KEY'           // Keep for backwards compatibility until migration
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required Supabase environment variables:', missingEnvVars.join(', '));
  console.error('📋 Please check your .env file and ensure all Supabase credentials are set');
  console.error('⚠️  Consider upgrading to new Supabase publishable/secret keys for better security');
  process.exit(1);
}

// Connection pooling configuration for Railway/production deployment
function getOptimalConnectionConfig() {
  const poolMode = process.env.SUPABASE_POOL_MODE || 'transaction';
  const isProduction = process.env.NODE_ENV === 'production';
  const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL;
  
  let connectionUrl = process.env.SUPABASE_URL;
  let poolingStrategy = 'none';
  
  // For production/Railway deployments, optimize connection pooling
  if (isProduction || isRailway) {
    switch (poolMode) {
      case 'transaction':
        // Transaction pooler: Best for stateless apps, short-lived connections
        console.log('✅ Using Transaction Pooler (optimal for Railway stateless deployment)');
        poolingStrategy = 'transaction';
        // Use transaction pooler URL if available, otherwise use main URL
        if (process.env.SUPABASE_DATABASE_URL_TRANSACTION) {
          connectionUrl = process.env.SUPABASE_DATABASE_URL_TRANSACTION;
        }
        break;
      case 'session':
        // Session pooler: IPv4 compatible fallback
        console.log('⚠️  Using Session Pooler (IPv4 fallback mode)');
        poolingStrategy = 'session';
        // Use session pooler URL if available, otherwise use main URL
        if (process.env.SUPABASE_DATABASE_URL_SESSION) {
          connectionUrl = process.env.SUPABASE_DATABASE_URL_SESSION;
        }
        break;
      case 'direct':
        console.log('⚠️  Using Direct Connection (not recommended for production)');
        poolingStrategy = 'direct';
        // Use main URL for direct connections
        break;
      default:
        console.log('✅ Auto-selecting Transaction Pooler for production');
        poolingStrategy = 'transaction';
        if (process.env.SUPABASE_DATABASE_URL_TRANSACTION) {
          connectionUrl = process.env.SUPABASE_DATABASE_URL_TRANSACTION;
        }
    }
  } else {
    console.log('📍 Development mode: using direct connection');
    poolingStrategy = 'direct';
  }
  
  return {
    poolingStrategy,
    connectionUrl,
    optimizedForRailway: isRailway && poolingStrategy === 'transaction'
  };
}

const connectionConfig = getOptimalConnectionConfig();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Check if we have new-style keys (recommended)
const hasPublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const hasSecretKey = process.env.SUPABASE_SECRET_KEY;

if (hasPublishableKey && hasSecretKey) {
  console.log('✅ Using new Supabase publishable/secret keys (recommended)');
} else {
  console.log('⚠️  Using legacy JWT-based keys. Consider upgrading to publishable/secret keys');
  console.log('   See: https://supabase.com/dashboard/project/_/settings/api-keys/new');
}

// Service role client for server-side operations (full database access)
// Use secret key if available, fallback to service_role JWT
const serviceKey = hasSecretKey ? process.env.SUPABASE_SECRET_KEY : supabaseServiceKey;

// Create optimized client configuration for Railway deployment
const createOptimizedSupabaseClient = (url, key, options = {}) => {
  const defaultConfig = {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'User-Agent': 'ProspectPro/1.0 Server'
      }
    }
  };

  // Production optimizations for Railway
  if (connectionConfig.optimizedForRailway) {
    defaultConfig.db.pool = {
      min: 0,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 10000,
      reapIntervalMillis: 1000
    };
    defaultConfig.global.headers['Connection'] = 'keep-alive';
  }

  return createClient(url, key, { ...defaultConfig, ...options });
};

const supabase = createOptimizedSupabaseClient(supabaseUrl, serviceKey);

// Public client for browser-safe operations
// Use publishable key if available, fallback to anon JWT
const publicKey = hasPublishableKey ? process.env.SUPABASE_PUBLISHABLE_KEY : supabaseAnonKey;
const supabaseAnon = createOptimizedSupabaseClient(supabaseUrl, publicKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'User-Agent': 'ProspectPro/1.0 Client'
    }
  }
});

// Create authenticated client for specific user operations
const createUserClient = (accessToken) => {
  return createOptimizedSupabaseClient(supabaseUrl, publicKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ProspectPro/1.0 User'
      }
    }
  });
};

// Test database connection with retry logic for pooled connections
const testConnection = async (retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Testing Supabase connection (attempt ${attempt}/${retries})...`);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      
      console.log('✅ Supabase connection successful');
      if (connectionConfig.poolingStrategy === 'transaction') {
        console.log('🚀 Transaction Pooler active - optimized for Railway stateless deployment');
      }
      return true;
    } catch (error) {
      console.error(`❌ Supabase connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        console.error('💡 Troubleshooting tips:');
        console.error('   1. Verify SUPABASE_URL and credentials are correct');
        console.error('   2. Check Supabase dashboard for service status');
        if (connectionConfig.poolingStrategy === 'transaction') {
          console.error('   3. Try fallback: set SUPABASE_POOL_MODE=session');
        }
        console.error('   4. Verify database permissions and RLS policies');
        return false;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  return false;
};

// Initialize database tables if they don't exist
const initializeDatabase = async () => {
  try {
    console.log('🔧 Initializing ProspectPro database schema...');
    
    // Check if tables exist by trying to query them
    const tables = ['campaigns', 'businesses', 'api_usage', 'user_settings'];
    const tableChecks = [];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Table '${table}' exists`);
          tableChecks.push(true);
        } else {
          console.log(`❌ Table '${table}' missing or inaccessible`);
          tableChecks.push(false);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' check failed:`, err.message);
        tableChecks.push(false);
      }
    }
    
    const allTablesExist = tableChecks.every(check => check === true);
    
    if (!allTablesExist) {
      console.log('⚠️  Some tables are missing. Please run the schema SQL in your Supabase dashboard:');
      console.log('📂 See: docs/supabase-schema.sql');
      return false;
    }
    
    console.log('✅ All database tables are ready');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

module.exports = {
  supabase,
  supabaseAnon,
  createUserClient,
  testConnection,
  initializeDatabase,
  supabaseUrl,
  supabaseAnonKey,
  connectionConfig,
  createOptimizedSupabaseClient
};