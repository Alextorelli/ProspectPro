/**
 * ProspectPro Supabase Configuration - Production Optimized
 * Streamlined for production initialization workflow
 */

const supabaseUrl = process.env.SUPABASE_URL;
let supabaseClient = null;
let lastConnectionTest = null;

/**
 * Get or create Supabase client instance
 * Uses SUPABASE_SECRET_KEY from GitHub Actions environment
 */
function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL not configured');
    return null;
  }

  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseKey) {
    console.error('❌ SUPABASE_SECRET_KEY not configured');
    return null;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { 
        autoRefreshToken: false, 
        persistSession: false 
      },
      global: { 
        headers: { 'X-Client-Info': 'ProspectPro-Production' } 
      }
    });

    console.log('✅ Supabase client initialized');
    return supabaseClient;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error.message);
    return null;
  }
}

/**
 * Simple connection test for production readiness
 * Returns boolean success/failure for quick health checks
 */
async function testConnection() {
  const startTime = Date.now();
  
  try {
    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        error: 'No Supabase client available',
        duration: Date.now() - startTime
      };
    }

    // Simple query to test connection
    const { data, error } = await client
      .from('campaigns')
      .select('count')
      .limit(1);

    if (error) {
      // If campaigns table doesn't exist, that's OK for initial setup
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('⚠️  Database connected but campaigns table not found (this is OK for initial setup)');
        return {
          success: true,
          warning: 'Database schema needs initialization',
          duration: Date.now() - startTime
        };
      }
      
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }

    const result = {
      success: true,
      duration: Date.now() - startTime
    };

    lastConnectionTest = result;
    console.log(`✅ Database connection verified (${result.duration}ms)`);
    return result;

  } catch (error) {
    const result = {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };

    lastConnectionTest = result;
    console.error(`❌ Database connection failed (${result.duration}ms):`, error.message);
    return result;
  }
}

/**
 * Get last connection test result for diagnostics
 */
function getLastSupabaseDiagnostics() {
  return lastConnectionTest;
}

/**
 * Set diagnostics for testing purposes
 */
function setLastSupabaseDiagnostics(diagnostics) {
  lastConnectionTest = diagnostics;
  return diagnostics;
}

/**
 * Get database URL for logging (without exposing credentials)
 */
function getDatabaseInfo() {
  return {
    url: supabaseUrl ? `${supabaseUrl.split('.')[0]}...supabase.co` : 'Not configured',
    hasClient: !!supabaseClient,
    lastTest: lastConnectionTest
  };
}

module.exports = {
  getSupabaseClient,
  testConnection,
  getLastSupabaseDiagnostics,
  setLastSupabaseDiagnostics,
  getDatabaseInfo,
  supabaseUrl
};