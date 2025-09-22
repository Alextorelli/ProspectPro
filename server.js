// Load environment configuration first
const EnvironmentLoader = require("./config/environment-loader");
const envLoader = new EnvironmentLoader();
const config = envLoader.getConfig();

console.log(`🚀 Starting ProspectPro in ${config.environment} mode`);
console.log(
  `📊 Performance features: ${JSON.stringify(config.features, null, 2)}`
);

// Dynamically load secrets from Supabase app_secrets table
const { createClient } = require("@supabase/supabase-js");

async function loadSecretsFromSupabase() {
  const startTime = Date.now();
  const supabaseUrl = config.supabase.url;
  const supabaseKey = config.supabase.secretKey;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "Supabase config missing from environment-loader, skipping dynamic secret loading"
    );
    console.warn(
      "💡 Tip: Set SUPABASE_URL and SUPABASE_SECRET_KEY in your environment or GitHub secrets"
    );
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Access vault secrets using RPC function (secure approach)
    try {
      console.log("🔑 Accessing Supabase Vault secrets via RPC function...");

      const vaultKeyNames = [
        "GOOGLE_PLACES_API_KEY",
        "FOURSQUARE_API_KEY",
        "HUNTER_IO_API_KEY",
        "ZEROBOUNCE_API_KEY",
        "NEVERBOUNCE_API_KEY",
        "SCRAPINGDOG_API_KEY",
        "APOLLO_API_KEY",
        "PERSONAL_ACCESS_TOKEN",
      ];

      // First try the RPC function approach (preferred)
      const { data: vaultSecrets, error: vaultError } = await supabase.rpc(
        "get_vault_secrets",
        {
          secret_names: vaultKeyNames,
        }
      );

      if (!vaultError && vaultSecrets && Array.isArray(vaultSecrets)) {
        console.log(
          `📋 Found ${vaultSecrets.length} vault secrets via RPC function`
        );
        await loadVaultSecretsIntoEnv(vaultSecrets, startTime);
        return;
      }

      // If RPC function doesn't exist, create it and retry
      if (
        vaultError &&
        (vaultError.code === "42883" ||
          vaultError.message?.includes("does not exist"))
      ) {
        console.log(
          "� RPC function not found, attempting to create vault access functions..."
        );

        try {
          // Try to create the vault access functions
          await createVaultAccessFunctions(supabase);

          // Retry the RPC call
          const { data: retryVaultSecrets, error: retryError } =
            await supabase.rpc("get_vault_secrets", {
              secret_names: vaultKeyNames,
            });

          if (
            !retryError &&
            retryVaultSecrets &&
            Array.isArray(retryVaultSecrets)
          ) {
            console.log(
              "✅ Successfully created vault functions and retrieved secrets"
            );
            await loadVaultSecretsIntoEnv(retryVaultSecrets, startTime);
            return;
          } else if (retryError) {
            throw retryError;
          }
        } catch (createError) {
          console.warn(
            "⚠️ Could not create vault access functions:",
            createError.message
          );
        }
      }

      // Final fallback: check if secrets are already in environment (manual injection)
      console.log(
        "🔍 Checking for manually injected vault secrets in environment..."
      );
      let foundEnvSecrets = 0;
      vaultKeyNames.forEach((keyName) => {
        const envValue = process.env[keyName];
        if (
          envValue &&
          envValue !== "PLACEHOLDER_VALUE_SET_VIA_DASHBOARD" &&
          !envValue.startsWith("your_")
        ) {
          foundEnvSecrets++;
          console.log(`✅ Found ${keyName} in environment`);
        }
      });

      if (foundEnvSecrets > 0) {
        const duration = Date.now() - startTime;
        console.log(
          `✅ Using ${foundEnvSecrets} secrets from environment injection (${duration}ms)`
        );
        return;
      }

      // If we get here, vault access completely failed
      if (vaultError) {
        throw vaultError;
      } else {
        throw new Error("No vault secrets found via any method");
      }
    } catch (vaultErr) {
      console.warn(
        "❌ Vault access failed:",
        vaultErr.message,
        "\n🔄 Falling back to legacy app_secrets table"
      );
    }

    // Fallback to app_secrets table (legacy method)
    console.log("📂 Attempting legacy app_secrets table access...");
    const { data, error } = await supabase
      .from("app_secrets")
      .select("key,value");
    if (error) throw error;

    let legacySecretsLoaded = 0;
    data.forEach(({ key, value }) => {
      if (
        !process.env[key] &&
        value &&
        value !== "CONFIGURE_IN_SUPABASE_DASHBOARD"
      ) {
        process.env[key] = value;
        legacySecretsLoaded++;
      }
    });

    const duration = Date.now() - startTime;
    console.log(
      `✅ Loaded ${legacySecretsLoaded} secrets from legacy app_secrets (${duration}ms)`
    );
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(
      `❌ Failed to load secrets from Supabase (${duration}ms):`,
      err.message
    );
    console.log("🔄 Continuing with environment variables only");
  }
}

// Helper function to load vault secrets into environment
async function loadVaultSecretsIntoEnv(vaultSecrets, startTime) {
  let vaultSecretsLoaded = 0;

  if (Array.isArray(vaultSecrets)) {
    vaultSecrets.forEach(({ name, decrypted_secret }) => {
      if (name && decrypted_secret && !process.env[name]) {
        // Validate secret isn't placeholder
        if (
          decrypted_secret !== "PLACEHOLDER_VALUE_SET_VIA_DASHBOARD" &&
          decrypted_secret !== "CONFIGURE_IN_SUPABASE_DASHBOARD" &&
          !decrypted_secret.startsWith("your_")
        ) {
          process.env[name] = decrypted_secret;
          vaultSecretsLoaded++;
          console.log(
            `🔑 Loaded vault secret: ${name} = ${decrypted_secret.substring(
              0,
              8
            )}...`
          );
        }
      }
    });
  }

  const duration = Date.now() - startTime;
  console.log(
    `✅ Successfully loaded ${vaultSecretsLoaded} secrets from Supabase Vault (${duration}ms)`
  );
}

// Helper function to create vault access functions if they don't exist
async function createVaultAccessFunctions(supabase) {
  const fs = require("fs");
  const path = require("path");

  // Check if the vault functions file exists
  const vaultFunctionsPath = path.join(
    __dirname,
    "database",
    "12-vault-access-functions.sql"
  );

  if (fs.existsSync(vaultFunctionsPath)) {
    console.log("📋 Found vault access functions SQL file, executing...");
    const vaultSQL = fs.readFileSync(vaultFunctionsPath, "utf8");

    // Split into individual statements and execute them
    const statements = vaultSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await supabase.rpc("exec_sql", { sql: statement });
        } catch (error) {
          // Log but continue - some statements might fail if already exist
          console.warn(`⚠️ SQL statement warning:`, error.message);
        }
      }
    }

    console.log("✅ Vault access functions setup completed");
  } else {
    console.warn("⚠️ Vault access functions SQL file not found");
    throw new Error("Cannot create vault access functions - SQL file missing");
  }
}

// Synchronously load secrets before booting core systems
(async () => {
  await loadSecretsFromSupabase();
})();

// Initialize Boot Phase Debugger first
const { BootPhaseDebugger } = require("./modules/utils/boot-debugger");
const bootDebugger = new BootPhaseDebugger();

bootDebugger.startPhase(
  "dependencies-load",
  "Loading core dependencies and modules"
);

const express = require("express");
const path = require("path");

// Import enhanced Supabase diagnostics & lazy client
const {
  testConnection,
  getLastSupabaseDiagnostics,
  getSupabaseClient,
  setLastSupabaseDiagnostics,
} = require("./config/supabase");

// Import new monitoring and security systems
const {
  ProspectProMetrics,
} = require("./modules/monitoring/prometheus-metrics");
const { SecurityHardening } = require("./modules/utils/security-hardening");
const RailwayWebhookMonitor = require("./modules/monitoring/railway-webhook-monitor");

const { Client } = require("@googlemaps/google-maps-services-js");

bootDebugger.endPhase(true);

// =====================================
// CORE SYSTEM INITIALIZATION
// =====================================

bootDebugger.startPhase(
  "core-init",
  "Initializing Express app and core systems"
);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize monitoring and security systems
const metrics = new ProspectProMetrics();
const security = new SecurityHardening();
const webhookMonitor = new RailwayWebhookMonitor();

bootDebugger.endPhase(true);

// =====================================
// MIDDLEWARE SETUP
// =====================================

bootDebugger.startPhase(
  "middleware-setup",
  "Configuring security and application middleware"
);

// Get security middleware
const securityMiddleware = security.getMiddleware();

// Apply security middleware first
securityMiddleware.general.forEach((middleware) => app.use(middleware));

// Add metrics middleware
app.use(metrics.createHttpMiddleware());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Security logging
app.use(security.getSecurityLogger());

// Flag & diagnostics storage
let degradedMode = false;
let startupDiagnostics = null;

bootDebugger.endPhase(true);

// =====================================
// GOOGLE PLACES API SETUP
// =====================================

bootDebugger.startPhase(
  "google-places-init",
  "Initializing Google Places API client"
);

const googlePlacesClient = new Client({});

bootDebugger.endPhase(true);

// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================

bootDebugger.startPhase("auth-setup", "Setting up authentication middleware");

// Enhanced auth middleware for API routes
const authMiddleware = (req, res, next) => {
  // Skip auth in development if configured
  if (config.isDevelopment && process.env.SKIP_AUTH_IN_DEV === "true") {
    req.user = { id: "dev-user-id", email: "dev@example.com" };
    return next();
  }

  // Check for personal access token in production
  if (config.isProduction) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token || token !== process.env.PERSONAL_ACCESS_TOKEN) {
      // Record failed authentication
      metrics.recordError("auth_failure", "api_auth", "warning");

      return res.status(401).json({
        error: "Unauthorized access",
        message: "Valid access token required",
      });
    }

    // For personal use, set a default user
    req.user = {
      id: process.env.PERSONAL_USER_ID || "personal-user",
      email: process.env.PERSONAL_EMAIL || "personal@example.com",
    };
  }

  next();
};

// Apply auth middleware with rate limiting to API routes
app.use("/api", securityMiddleware.apiLimiter, authMiddleware);

bootDebugger.endPhase(true);

// =====================================
// ENHANCED HEALTH CHECK & STATUS ENDPOINTS
// =====================================

bootDebugger.startPhase(
  "health-endpoints",
  "Setting up health check and monitoring endpoints"
);

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    const metricsData = await metrics.getMetrics();
    res.send(metricsData);
  } catch (error) {
    console.error("Metrics endpoint error:", error);
    metrics.recordError("metrics_endpoint", "monitoring", "error");
    res.status(500).send("# Error generating metrics\n");
  }
});

// Boot phase report endpoint
app.get("/boot-report", (req, res) => {
  const report = bootDebugger.getPhaseReport();
  res.json({
    ...report,
    securityStatus: security.getSecurityStatus(),
    metricsStatus: metrics.getMetricsSummary(),
  });
});

// Health check endpoint for Railway monitoring (enhanced)
app.get("/health", (req, res) => {
  const diag = startupDiagnostics || getLastSupabaseDiagnostics();
  const bootHealth = bootDebugger.getHealthStatus();

  if (!diag)
    return res.status(200).json({
      status: "starting",
      degradedMode,
      bootStatus: bootHealth,
    });

  const payload = {
    status: diag.success ? "ok" : degradedMode ? "degraded" : "error",
    degradedMode,
    timestamp: new Date().toISOString(),
    environment: config.environment,
    version: "2.0.0",
    bootHealth,
    supabase: {
      success: diag.success,
      error: diag.success ? null : diag.error,
      authStatus: diag.authProbe?.status,
      recommendations: diag.recommendations,
      durationMs: diag.durationMs,
    },
    security: security.getSecurityStatus(),
  };
  res.status(200).json(payload);
});

// Lightweight liveness probe (no DB work)
app.get("/live", (req, res) => {
  const bootHealth = bootDebugger.getHealthStatus();
  res.json({
    status: "alive",
    ts: Date.now(),
    pid: process.pid,
    uptime: process.uptime(),
    bootId: bootHealth.bootId,
  });
});

// Readiness probe requires a successful privileged (secret/service) connection
app.get("/ready", async (req, res) => {
  const start = Date.now();

  if (req.query.force === "true" || !getLastSupabaseDiagnostics()) {
    const testDiag = await testConnection();
    metrics.recordSupabaseConnection(
      testDiag.durationMs,
      testDiag.success,
      testDiag.authMode,
      testDiag.failureCategory
    );
  }

  const diag = getLastSupabaseDiagnostics();
  if (diag && diag.success && /privileged/.test(diag.authMode || "")) {
    return res.json({
      status: "ready",
      mode: diag.authMode,
      durationMs: diag.durationMs,
      checkDuration: Date.now() - start,
    });
  }

  // Record failed readiness check
  metrics.recordError("readiness_check", "health_endpoint", "warning");

  res.status(503).json({
    status: "not-ready",
    degradedMode,
    reason: diag?.failureCategory || diag?.error || "no-diagnostics",
    authMode: diag?.authMode,
    recommendations: diag?.recommendations || [],
    checkDuration: Date.now() - start,
  });
});

// Environment + runtime snapshot (enhanced with boot info)
app.get("/env-snapshot", (req, res) => {
  const bootReport = bootDebugger.getPhaseReport();
  res.json({
    portConfigured: PORT,
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptimeSeconds: process.uptime(),
    bootInfo: {
      bootId: bootReport.bootId,
      totalBootTime: bootReport.totalBootTime,
      successRate: bootReport.successRate,
      failedPhases: bootReport.failedPhases,
    },
    envKeys: Object.keys(process.env).filter((k) =>
      /SUPABASE|GOOGLE|HUNTER|NEVERBOUNCE|SCRAPINGDOG|PORT|NODE_ENV/.test(k)
    ),
    diagnostics: getLastSupabaseDiagnostics(),
    securityStatus: security.getSecurityStatus(),
  });
});

// Admin dashboard route with enhanced authentication
app.get(
  "/admin-dashboard.html",
  securityMiddleware.adminLimiter,
  security.getAdminAuthMiddleware(),
  (req, res) => {
    // Read the admin dashboard HTML and inject secure configuration
    const fs = require("fs");
    let dashboardHtml = fs.readFileSync(
      path.join(__dirname, "public", "admin-dashboard.html"),
      "utf8"
    );

    // Inject secure admin password from environment
    const adminPassword = process.env.ADMIN_PASSWORD || "ProspectPro2024!";
    dashboardHtml = dashboardHtml.replace(
      "window.ADMIN_PASSWORD || 'DEFAULT_ADMIN_PASS'",
      `'${adminPassword}'`
    );

    res.send(dashboardHtml);
  }
);

// Admin API endpoints for dashboard data
app.get("/api/admin/metrics", async (req, res) => {
  try {
    // Authenticate admin request
    const token =
      req.query.token || req.headers.authorization?.replace("Bearer ", "");
    if (!token || token !== process.env.PERSONAL_ACCESS_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const supabase = getSupabaseClient();
    if (!supabase)
      return res.status(503).json({ error: "Database not available" });

    const timeRange = req.query.range || "7d";
    const timeFilter = getTimeFilter(timeRange);

    // Fetch business metrics
    const [leadsResult, campaignsResult, costsResult] = await Promise.all([
      supabase.from("enhanced_leads").select("*").gte("created_at", timeFilter),
      supabase.from("campaigns").select("*").gte("created_at", timeFilter),
      supabase.from("api_costs").select("*").gte("created_at", timeFilter),
    ]);

    // Calculate metrics
    const totalLeads = leadsResult.data?.length || 0;
    const activeCampaigns =
      campaignsResult.data?.filter((c) => c.status === "active").length || 0;
    const qualifiedLeads =
      leadsResult.data?.filter((l) => l.is_qualified).length || 0;
    const successRate =
      totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : "0";

    // Calculate costs
    const totalCosts =
      costsResult.data?.reduce(
        (sum, cost) => sum + parseFloat(cost.amount || 0),
        0
      ) || 0;
    const costBreakdown = calculateCostBreakdown(costsResult.data || []);

    res.json({
      totalLeads,
      activeCampaigns,
      successRate: `${successRate}%`,
      dailyCost: totalCosts.toFixed(2),
      costBreakdown,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// Helper function to calculate time filters
function getTimeFilter(range) {
  const now = new Date();
  switch (range) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}

// Helper function to calculate cost breakdown by API
function calculateCostBreakdown(costs) {
  const breakdown = {
    google: 0,
    hunter: 0,
    neverbounce: 0,
    scrapingdog: 0,
  };

  costs.forEach((cost) => {
    const service = cost.service?.toLowerCase() || "";
    if (service.includes("google"))
      breakdown.google += parseFloat(cost.amount || 0);
    else if (service.includes("hunter"))
      breakdown.hunter += parseFloat(cost.amount || 0);
    else if (service.includes("neverbounce"))
      breakdown.neverbounce += parseFloat(cost.amount || 0);
    else if (service.includes("scrapingdog"))
      breakdown.scrapingdog += parseFloat(cost.amount || 0);
  });

  return {
    google: breakdown.google.toFixed(2),
    hunter: breakdown.hunter.toFixed(2),
    neverbounce: breakdown.neverbounce.toFixed(2),
    scrapingdog: breakdown.scrapingdog.toFixed(2),
  };
}

app.get("/api/status", async (req, res) => {
  const diag = getLastSupabaseDiagnostics();
  const apiKeysConfigured = {
    google_places: !!process.env.GOOGLE_PLACES_API_KEY,
    scrapingdog: !!process.env.SCRAPINGDOG_API_KEY,
    hunter_io: !!process.env.HUNTER_IO_API_KEY,
    neverbounce: !!process.env.NEVERBOUNCE_API_KEY,
  };
  const allApiKeysSet = Object.values(apiKeysConfigured).every(Boolean);
  res.json({
    status: diag
      ? diag.success
        ? "operational"
        : degradedMode
        ? "degraded"
        : "db-error"
      : "starting",
    database: diag ? (diag.success ? "connected" : "error") : "unknown",
    degradedMode,
    api_keys: apiKeysConfigured,
    configuration_complete: !!diag && diag.success && allApiKeysSet,
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    supabase: diag || { note: "no diagnostics yet" },
  });
});

// =====================================
// DIAGNOSTICS ENDPOINT (SANITIZED)
// =====================================

function redactValue(val) {
  if (val == null) return val;
  const str = String(val);
  if (str.length <= 6) return str[0] + "***";
  return str.slice(0, 4) + "..." + str.slice(-4);
}

const SENSITIVE_KEYS = [
  "SUPABASE",
  "GOOGLE",
  "HUNTER",
  "NEVERBOUNCE",
  "SCRAPINGDOG",
  "JWT",
  "PASSWORD",
  "TOKEN",
  "KEY",
  "SECRET",
];

function buildSanitizedEnv() {
  const out = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (SENSITIVE_KEYS.some((s) => k.includes(s))) {
      out[k] = redactValue(v);
    } else if (!k.startsWith("NODE_") && !k.startsWith("PATH")) {
      out[k] = v;
    }
  }
  return out;
}

app.get("/diag", async (req, res) => {
  if (req.query.force === "true") {
    startupDiagnostics = await testConnection();
    degradedMode = !startupDiagnostics.success;
  }

  // Get deployment status from webhook monitor
  const deploymentStatus = webhookMonitor.getDeploymentStatus();

  res.json({
    service: "ProspectPro",
    timestamp: new Date().toISOString(),
    degradedMode,
    startupDiagnostics,
    lastDiagnostics: getLastSupabaseDiagnostics(),
    deployment: {
      status: deploymentStatus.systemHealth,
      recentFailures: deploymentStatus.consecutiveFailures,
      averageBuildTime: deploymentStatus.averageBuildTime,
      lastSuccess: deploymentStatus.lastSuccessfulDeployment?.timestamp,
      railwayWebhooks: {
        configured: !!process.env.RAILWAY_WEBHOOK_SECRET,
        eventsReceived: deploymentStatus.webhookStatus.totalEventsProcessed,
        lastEventReceived: deploymentStatus.webhookStatus.lastEventReceived,
        activeBuilds: deploymentStatus.webhookStatus.activeBuilds,
      },
    },
    environment: buildSanitizedEnv(),
    pid: process.pid,
    uptimeSeconds: process.uptime(),
  });
});

// =====================================
// API ROUTES
// =====================================

// Railway webhook endpoint (before auth middleware)
app.post(
  "/railway-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    await webhookMonitor.processWebhook(req, res);
  }
);

// Deployment status dashboard endpoint
app.get("/deployment-status", (req, res) => {
  // Require admin token for sensitive deployment information
  const token =
    req.query.token || req.headers.authorization?.replace("Bearer ", "");
  if (!token || token !== process.env.PERSONAL_ACCESS_TOKEN) {
    return res
      .status(401)
      .json({ error: "Unauthorized - admin token required" });
  }

  const deploymentStatus = webhookMonitor.getDeploymentStatus();
  const diag = getLastSupabaseDiagnostics();

  res.json({
    ...deploymentStatus,
    railwayIntegration: {
      webhookConfigured: !!process.env.RAILWAY_WEBHOOK_SECRET,
      lastWebhookReceived: webhookMonitor.lastWebhookTimestamp,
      monitoringActive: true,
    },
    systemStatus: {
      degradedMode,
      supabaseConnected: diag?.success || false,
      timestamp: new Date().toISOString(),
    },
  });
});

// Import API routes
let businessDiscoveryRouter;
try {
  businessDiscoveryRouter = require("./api/business-discovery");
} catch (e) {
  console.error(
    "Failed to load business-discovery router:",
    e.stack || e.message
  );
  // Provide a stub router so app still responds
  const r = require("express").Router();
  r.use((req, res) =>
    res.status(500).json({
      error: "business-discovery module failed to load",
      message: e.message,
    })
  );
  businessDiscoveryRouter = r;
}

// Import dashboard export routes
let dashboardExportRouter;
try {
  const { createDashboardExportRoutes } = require("./api/dashboard-export");
  dashboardExportRouter = createDashboardExportRoutes();
} catch (e) {
  console.error("Failed to load dashboard-export router:", e);
  const r = require("express").Router();
  r.use((req, res) =>
    res.status(500).json({ error: "dashboard-export module failed to load" })
  );
  dashboardExportRouter = r;
}

// End health-endpoints phase before mounting routes
bootDebugger.endPhase(true);

// Mount API routes
app.use("/api/business", businessDiscoveryRouter);
app.use("/api/export", dashboardExportRouter);

// Add campaign-specific export API
try {
  const campaignExportRouter = require("./api/campaign-export");
  app.use("/api/campaigns", campaignExportRouter);
  console.log("📤 Campaign export API mounted at /api/campaigns");
} catch (error) {
  console.error("⚠️ Failed to load campaign export API:", error.message);
}

// Add dashboard metrics API
try {
  const dashboardMetricsRouter = require("./api/dashboard-metrics");
  app.use("/api/dashboard-metrics", dashboardMetricsRouter);
  console.log("📊 Dashboard metrics API mounted at /api/dashboard-metrics");
} catch (error) {
  console.error("⚠️ Failed to load dashboard metrics API:", error.message);
}

// Add webhook endpoints (without auth middleware for external calls)
try {
  const leadEnrichmentWebhook = require("./api/webhooks/lead-enrichment");
  app.use("/api/webhooks/lead-enrichment", leadEnrichmentWebhook);
  console.log(
    "🔔 Lead enrichment webhook mounted at /api/webhooks/lead-enrichment"
  );
} catch (error) {
  console.error("⚠️ Failed to load lead enrichment webhook:", error.message);
}

try {
  const costAlertWebhook = require("./api/webhooks/cost-alert");
  app.use("/api/webhooks/cost-alert", costAlertWebhook);
  console.log("💰 Cost alert webhook mounted at /api/webhooks/cost-alert");
} catch (error) {
  console.error("⚠️ Failed to load cost alert webhook:", error.message);
}

try {
  const campaignLifecycleWebhook = require("./api/webhooks/campaign-lifecycle");
  app.use("/api/webhooks/campaign-lifecycle", campaignLifecycleWebhook);
  console.log(
    "📋 Campaign lifecycle webhook mounted at /api/webhooks/campaign-lifecycle"
  );
} catch (error) {
  console.error("⚠️ Failed to load campaign lifecycle webhook:", error.message);
}

// =====================================
// STATIC FILE SERVING
// =====================================

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Simplified business dashboard route (Railway handles infrastructure)
app.get("/monitoring", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "business-dashboard.html"));
});

// Main dashboard route
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "business-dashboard.html"));
});

// Handle SPA routing - serve index.html for non-API routes
app.get("*", (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =====================================
// ERROR HANDLING
// =====================================

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  // Don't leak error details in production
  const isDevelopment = config.isDevelopment;

  res.status(error.status || 500).json({
    error: "Internal server error",
    message: isDevelopment ? error.message : "Something went wrong",
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  });
});

// =====================================
// ENHANCED SERVER STARTUP
// =====================================

bootDebugger.startPhase("server-bind", "Binding server to network port");

// Early bind server then run diagnostics async
const server = app.listen(PORT, "0.0.0.0", () => {
  bootDebugger.endPhase(true);

  console.log(
    `🚀 ProspectPro server listening on port ${PORT} (host: 0.0.0.0)`
  );
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`� Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🔧 Boot Report: http://localhost:${PORT}/boot-report`);
  console.log(`�🛠️ Diagnostics: http://localhost:${PORT}/diag`);
  console.log("⏳ Running initial Supabase diagnostics...");

  bootDebugger.endPhase(true);

  // Enhanced heartbeat every 120s for liveness visibility
  setInterval(() => {
    const diag = getLastSupabaseDiagnostics();
    const bootHealth = bootDebugger.getHealthStatus();
    console.log(
      `❤️  Heartbeat | uptime=${process
        .uptime()
        .toFixed(0)}s | degraded=${degradedMode} | supabase=${
        diag ? (diag.success ? "ok" : "err") : "pending"
      } | boot=${bootHealth.status}`
    );

    // Update uptime metric
    metrics.uptime.set(process.uptime());
  }, 120000).unref();

  // Enhanced global error safety nets with metrics
  process.on("unhandledRejection", (reason, p) => {
    console.error("🧨 Unhandled Promise Rejection:", reason);
    metrics.recordError("unhandled_rejection", "process", "critical", reason);
  });

  process.on("uncaughtException", (err) => {
    console.error("🔥 Uncaught Exception:", err.stack || err.message);
    metrics.recordError("uncaught_exception", "process", "critical", err);
  });

  process.on("exit", (code) => {
    const finalReport = bootDebugger.logFinalReport();
    console.error(
      `⚰️  Process exiting with code ${code}, uptime: ${process
        .uptime()
        .toFixed(0)}s`
    );
  });

  // Enhanced event loop delay monitor with metrics
  const loopIntervals = [];
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    const delay = now - lastTick - 1000; // expected 1s interval
    lastTick = now;
    loopIntervals.push(delay);
    if (loopIntervals.length > 60) loopIntervals.shift();

    // Record concerning delays
    if (delay > 500) {
      console.warn(`🐌 Event loop delay: ${delay}ms`);
      metrics.recordError("event_loop_delay", "nodejs", "warning");
    }
  }, 1000).unref();

  app.get("/loop-metrics", (req, res) => {
    const recent = [...loopIntervals];
    const max = Math.max(0, ...recent);
    const avg = recent.length
      ? recent.reduce((a, b) => a + b, 0) / recent.length
      : 0;
    res.json({
      sampleCount: recent.length,
      maxDelayMs: max,
      avgDelayMs: avg.toFixed(2),
      concerningDelays: recent.filter((d) => d > 500).length,
    });
  });

  // Start async boot phases
  performAsyncBootPhases();
});

// Enhanced async boot phases with comprehensive monitoring
async function performAsyncBootPhases() {
  bootDebugger.startPhase(
    "supabase-test",
    "Testing Supabase connectivity and authentication"
  );
  const start = Date.now();

  try {
    startupDiagnostics = await testConnection();
    const duration = Date.now() - start;

    // Record comprehensive metrics
    metrics.recordSupabaseConnection(
      duration,
      startupDiagnostics.success,
      startupDiagnostics.authMode,
      startupDiagnostics.failureCategory
    );

    if (!startupDiagnostics.success) {
      degradedMode = process.env.ALLOW_DEGRADED_START === "true";

      if (!degradedMode) {
        bootDebugger.endPhase(false, new Error(startupDiagnostics.error));
        console.error(
          "🔴 Critical: Supabase connection failed and degraded mode disabled"
        );
        metrics.recordError("startup_failure", "supabase", "critical");
        process.exit(1);
      } else {
        bootDebugger.endPhase(
          false,
          new Error(`Degraded mode: ${startupDiagnostics.error}`)
        );
        console.error(
          "🟠 Warning: Supabase connection failed. Continuing in degraded mode."
        );
        console.warn("🟠 Periodic retry every 60s enabled.");

        // Setup retry logic with metrics
        setInterval(async () => {
          const retryStart = Date.now();
          const d = await testConnection();
          const retryDuration = Date.now() - retryStart;

          metrics.recordSupabaseConnection(
            retryDuration,
            d.success,
            d.authMode,
            d.failureCategory
          );

          if (d.success && degradedMode) {
            degradedMode = false;
            console.log(
              "🟢 Supabase connectivity restored from degraded mode."
            );
            bootDebugger.addMilestone("supabase-recovery", {
              previouslyDegraded: true,
            });
          }
        }, 60000).unref();
      }
    } else {
      degradedMode = false;
      bootDebugger.endPhase(true);
      console.log("✅ Supabase connectivity established.");
      bootDebugger.addMilestone("supabase-ready", {
        authMode: startupDiagnostics.authMode,
      });
    }
  } catch (error) {
    const duration = Date.now() - start;
    metrics.recordSupabaseConnection(duration, false, "unknown", "exception");
    metrics.recordError("supabase_connection", "startup", "critical", error);
    bootDebugger.endPhase(false, error);

    if (process.env.ALLOW_DEGRADED_START !== "true") {
      console.error(
        "🔥 Fatal: Supabase connection threw exception and degraded mode disabled"
      );
      process.exit(1);
    }
  }

  // Record final boot metrics
  const finalReport = bootDebugger.logFinalReport();
  metrics.recordBootComplete(finalReport.totalBootTime);

  // Record individual boot phase metrics
  finalReport.phases.forEach((phase) => {
    metrics.recordBootPhase(
      phase.name,
      phase.success ? "success" : "failed",
      phase.duration
    );
  });

  bootDebugger.addMilestone("startup-complete", {
    totalPhases: finalReport.phaseCount,
    successRate: finalReport.successRate,
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  process.exit(0);
});

module.exports = app;
