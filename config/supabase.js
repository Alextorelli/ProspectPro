// ---------------- New Enhanced Diagnostics & Lazy Client -----------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseDbPoolerUrl = process.env.SUPABASE_DB_POOLER_URL;

function serializeError(err) {
  if (!err) return null;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...Object.fromEntries(Object.getOwnPropertyNames(err).map(p => [p, err[p]]))
    };
  }
  try { return JSON.parse(JSON.stringify(err)); } catch { return { raw: String(err) }; }
}

function selectSupabaseKey() {
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY; // new style
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY; // new style
  let key = null;
  let reason = null;
  if (secret) { key = secret; reason = 'secret_key'; }
  else if (sr) { key = sr; reason = 'service_role'; }
  else if (anon) { key = anon; reason = 'anon'; }
  else if (publishable) { key = publishable; reason = 'publishable'; }
  return {
    key,
    reason,
    hasAnon: !!anon,
    hasService: !!sr,
    hasSecret: !!secret,
    hasPublishable: !!publishable,
    preview: key ? key.slice(0, 8) + '...' : null
  };
}

let supabaseClientInstance = null;
let lastSupabaseDiagnostics = null;

function getSupabaseClient() {
  if (supabaseClientInstance) return supabaseClientInstance;
  if (!supabaseUrl) return null;
  const sel = selectSupabaseKey();
  if (!sel.key) return null;
  const { createClient } = require('@supabase/supabase-js');
  supabaseClientInstance = createClient(supabaseUrl, sel.key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'X-Client-Info': 'ProspectPro-Server' } }
  });
  return supabaseClientInstance;
}

async function testConnection(options = {}) {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const sel = selectSupabaseKey();
  const diag = {
    startedAt,
    supabaseUrl,
    keySelected: sel.reason,
    keyPresent: !!sel.key,
    keyPreview: sel.preview,
    hasAnon: sel.hasAnon,
    hasService: sel.hasService,
    hasSecret: sel.hasSecret,
    hasPublishable: sel.hasPublishable,
    success: false,
    durationMs: null,
    error: null,
    errorDetail: null,
    network: {},
    authProbe: {},
    tableProbe: {},
    recommendations: []
  };

  if (!supabaseUrl) {
    diag.error = 'SUPABASE_URL missing';
    diag.recommendations.push('Set SUPABASE_URL=https://<ref>.supabase.co');
    diag.durationMs = Date.now() - t0;
    lastSupabaseDiagnostics = diag;
    return diag;
  }
  if (!sel.key) {
    diag.error = 'No API key found';
    diag.recommendations.push('Provide SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY');
    diag.durationMs = Date.now() - t0;
    lastSupabaseDiagnostics = diag;
    return diag;
  }

  // Network probes
  const fetchFn = global.fetch || (await import('node-fetch')).default;
  const host = supabaseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  diag.network.host = host;

  async function safeFetch(label, url, init) {
    try {
      const res = await fetchFn(url, { method: 'GET', ...init });
      const text = await res.text();
      return { label, status: res.status, ok: res.ok, snippet: text.slice(0, 120) };
    } catch (e) {
      return { label, error: serializeError(e) };
    }
  }

  diag.network.root = await safeFetch('root', supabaseUrl);
  diag.network.restNoAuth = await safeFetch('restNoAuth', `${supabaseUrl}/rest/v1/`);

  // Auth probe
  try {
    const authRes = await fetchFn(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: sel.key, Authorization: `Bearer ${sel.key}` }
    });
    diag.authProbe.status = authRes.status;
    if (authRes.status === 401) {
      diag.recommendations.push('401 on manual REST probe: verify key validity.');
    }
  } catch (e) {
    diag.authProbe.error = serializeError(e);
    diag.recommendations.push('Manual REST probe network failure');
  }

  // Supabase JS query
  let client;
  try {
    client = getSupabaseClient();
    if (!client) {
      diag.error = 'Client creation failed';
      diag.durationMs = Date.now() - t0;
      lastSupabaseDiagnostics = diag;
      return diag;
    }
  } catch (e) {
    diag.error = 'createClient threw';
    diag.errorDetail = serializeError(e);
    diag.durationMs = Date.now() - t0;
    lastSupabaseDiagnostics = diag;
    return diag;
  }

  try {
    const { error, count } = await client
      .from('campaigns')
      .select('id', { count: 'exact', head: true });
    diag.tableProbe.table = 'campaigns';
    diag.tableProbe.count = count ?? null;
    if (error) {
      diag.tableProbe.error = serializeError(error);
      diag.error = 'Table probe failed';
      if (error.code === 'PGRST301' || /api key/i.test(error.message || '')) {
        diag.recommendations.push('REST 401 (PGRST301): wrong or missing key.');
      } else if (error.code === '42P01') {
        diag.recommendations.push('Table campaigns missing. Run migrations.');
      } else {
        diag.recommendations.push('Unexpected PostgREST error; inspect details.');
      }
    } else {
      diag.success = true;
    }
  } catch (e) {
    diag.error = 'Query threw';
    diag.errorDetail = serializeError(e);
    diag.recommendations.push('Low-level fetch failure in supabase-js');
  }

  diag.durationMs = Date.now() - t0;
  lastSupabaseDiagnostics = diag;
  if (diag.success) {
    console.log(`✅ Supabase connectivity OK (${diag.durationMs}ms)`);
  } else {
    console.error('❌ Supabase connectivity issue:', diag.error, `(${diag.durationMs}ms)`);
  }
  return diag;
}

function getLastSupabaseDiagnostics() { return lastSupabaseDiagnostics; }

module.exports = {
  testConnection,
  getLastSupabaseDiagnostics,
  getSupabaseClient,
  supabaseUrl,
  supabaseDbPoolerUrl
};