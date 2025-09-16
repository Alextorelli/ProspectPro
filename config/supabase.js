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

let supabaseUrl = process.env.SUPABASE_URL;
// Guard: Users sometimes set SUPABASE_URL to a Postgres connection string (postgresql://...) which @supabase/supabase-js rejects.
// Provide clear remediation and allow optional SUPABASE_DB_POOLER_URL for future direct pg usage.
if (supabaseUrl && /^postgres(ql)?:\/\//i.test(supabaseUrl)) {
  console.error('❌ SUPABASE_URL is a Postgres connection string, but the Supabase JS client expects the HTTPS project URL.');
  console.error('   Received:', supabaseUrl);
  console.error('✅ FIX: Set SUPABASE_URL to https://<project-ref>.supabase.co');
  console.error('   And (optionally) set SUPABASE_DB_POOLER_URL for raw Postgres access:');
  console.error('   postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres');
  if (process.env.SUPABASE_DB_POOLER_URL) {
    console.error('ℹ️  Detected SUPABASE_DB_POOLER_URL. Using this pattern is correct for direct pg libs, NOT for supabase-js.');
  }
  // Fail fast to avoid silent misconfiguration
  process.exit(1);
}
const supabaseDbPoolerUrl = process.env.SUPABASE_DB_POOLER_URL; // Optional: for future raw pg usage
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

// Holds last diagnostics result
let lastSupabaseDiagnostics = null;

// Internal utility to redact secrets safely
function redact(value) {
  if (!value || typeof value !== 'string') return value;
  if (value.length <= 10) return value.slice(0, 3) + '***';
  return value.slice(0, 6) + '...' + value.slice(-4);
}

// Test database connection with enhanced diagnostics
const testConnection = async (options = {}) => {
  const diagnostics = {
    startedAt: new Date().toISOString(),
    supabaseUrl,
    supabaseUrlRedacted: redact(supabaseUrl),
    network: {},
    query: {},
    healthEndpoint: {},
    success: false,
    durationMs: null,
    error: null
  };
  const start = Date.now();
  try {
    // Low-level health probe to auth service (very lightweight)
    const healthUrl = supabaseUrl.replace(/\/$/, '') + '/auth/v1/health';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.healthTimeoutMs || 4000);
      const res = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);
      diagnostics.healthEndpoint.status = res.status;
      diagnostics.healthEndpoint.ok = res.ok;
    } catch (e) {
      diagnostics.healthEndpoint.error = e.message;
    }

    // Primary query test
    const { error, count } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true });
    if (error) throw error;
    diagnostics.query = { table: 'campaigns', countChecked: true };
    diagnostics.success = true;
    diagnostics.durationMs = Date.now() - start;
    lastSupabaseDiagnostics = diagnostics;
    console.log(`✅ Supabase connection successful (${diagnostics.durationMs}ms)`);
    return true;
  } catch (error) {
    diagnostics.error = error.message || String(error);
    diagnostics.errorDetail = {
      name: error.name,
      stack: error.stack,
      ...(error.status && { status: error.status }),
      ...(error.code && { code: error.code }),
      ...(error.details && { details: error.details }),
      ...(error.hint && { hint: error.hint })
    };
    // Additional network probes
    try {
      const urlObj = new URL(supabaseUrl);
      diagnostics.network.host = urlObj.hostname;
      // Lazy DNS via fetch to root (HEAD)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const rootRes = await fetch(supabaseUrl, { method: 'HEAD', signal: controller.signal });
        diagnostics.network.rootStatus = rootRes.status;
      } catch (e) {
        diagnostics.network.rootError = e.message;
      } finally { clearTimeout(timeout); }
      // REST endpoint probe
      const restUrl = supabaseUrl.replace(/\/$/, '') + '/rest/v1';
      try {
        const restController = new AbortController();
        const restTimeout = setTimeout(() => restController.abort(), 3000);
        const restRes = await fetch(restUrl, { method: 'GET', signal: restController.signal });
        clearTimeout(restTimeout);
        diagnostics.network.restStatus = restRes.status;
      } catch (e) {
        diagnostics.network.restError = e.message;
      }
    } catch (probeErr) {
      diagnostics.network.probeError = probeErr.message;
    }
    diagnostics.durationMs = Date.now() - start;
    diagnostics.success = false;
    lastSupabaseDiagnostics = diagnostics;
    console.error('❌ Supabase connection failed:', diagnostics.error, `(${diagnostics.durationMs}ms)`);
    if (diagnostics.errorDetail) {
      console.error('   ↳ Error detail:', JSON.stringify(diagnostics.errorDetail));
    }
    if (diagnostics.network) {
      console.error('   ↳ Network probe:', JSON.stringify(diagnostics.network));
    }
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
  supabaseDbPoolerUrl,
  supabaseAnonKey,
  getLastSupabaseDiagnostics: () => lastSupabaseDiagnostics
};