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
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'User-Agent': 'ProspectPro/1.0 Server'
    }
  }
});

// Public client for browser-safe operations
// Use publishable key if available, fallback to anon JWT
const publicKey = hasPublishableKey ? process.env.SUPABASE_PUBLISHABLE_KEY : supabaseAnonKey;
const supabaseAnon = createClient(supabaseUrl, publicKey, {
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
  return createClient(supabaseUrl, publicKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ProspectPro/1.0 User'
      }
    }
  });
};

// Test database connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
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
  supabaseAnonKey
};