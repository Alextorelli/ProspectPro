const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required Supabase environment variables:', missingEnvVars.join(', '));
  console.error('📋 Please check your .env file and ensure all Supabase credentials are set');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Service role client for server-side operations (full database access)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Anonymous client for public operations
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Create authenticated client for specific user operations
const createUserClient = (accessToken) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
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