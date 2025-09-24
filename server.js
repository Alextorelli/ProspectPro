/**
 * ProspectPro Server - Production Optimized
 * Fast startup with comprehensive error handling and monitoring
 * @version 3.1.0 - Production Branch Optimized
 */

// CRITICAL: Load environment variables FIRST before any other imports
require("dotenv").config();

// Advanced Environment Loading
console.log(`🔧 Initializing ProspectPro Environment Loader...`);
const EnvironmentLoader = require("./config/environment-loader");
const envLoader = new EnvironmentLoader();
const config = envLoader.getConfig();

console.log(`🚀 ProspectPro v3.1.0 starting in ${config.environment} mode`);
console.log(
  `🔧 Binding to ${config.host || "0.0.0.0"}:${process.env.PORT || 3100}`
);

// Core dependencies with error handling
const express = require("express");
const path = require("path");

// Import streamlined Supabase client
const {
  testConnection,
  getSupabaseClient,
  getDatabaseInfo,
} = require("./config/supabase");

// Initialize Express app
const app = express();

// Production middleware stack
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Security headers for production
if (config.isProduction) {
  app.use((req, res, next) => {
    res.header("X-Powered-By", "ProspectPro");
    res.header("X-Content-Type-Options", "nosniff");
    res.header("X-Frame-Options", "DENY");
    next();
  });
}

// CORS configuration
if (config.isDevelopment) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Health endpoints for production monitoring
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.environment,
  });
});

app.get("/ready", async (req, res) => {
  try {
    const dbTest = await testConnection();
    if (dbTest.success || dbTest.warning) {
      res.json({
        status: "ready",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "not_ready",
        database: "disconnected",
        error: dbTest.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/diag", async (req, res) => {
  try {
    const dbInfo = getDatabaseInfo();
    const dbTest = await testConnection();

    res.json({
      database: dbInfo,
      connection: dbTest,
      environment: {
        node_env: config.environment,
        port: config.port,
        supabase_configured: !!process.env.SUPABASE_URL,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes with graceful degradation
let businessDiscoveryRouter;
try {
  businessDiscoveryRouter = require("./api/business-discovery");
} catch (e) {
  console.error("Failed to load business-discovery router:", e.message);
  const router = require("express").Router();
  router.use((req, res) =>
    res.status(503).json({
      error: "Business discovery service unavailable",
      details: config.isDevelopment
        ? e.message
        : "Service initialization failed",
    })
  );
  businessDiscoveryRouter = router;
}

let campaignExportRouter;
try {
  campaignExportRouter = require("./api/campaign-export");
} catch (e) {
  console.error("Failed to load campaign-export router:", e.message);
  const router = require("express").Router();
  router.use((req, res) =>
    res.status(503).json({
      error: "Campaign export service unavailable",
      details: config.isDevelopment
        ? e.message
        : "Service initialization failed",
    })
  );
  campaignExportRouter = router;
}

// Mount API routes
app.use("/api/business-discovery", businessDiscoveryRouter);
app.use("/api/campaign-export", campaignExportRouter);

// Default route - serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Catch-all for SPA routing
app.get("*", (req, res) => {
  // Only serve SPA for HTML requests (not API calls)
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  } else {
    res.status(404).json({ error: "Endpoint not found" });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error.message);

  res.status(error.status || 500).json({
    error: "Internal server error",
    message: config.isDevelopment ? error.message : "Something went wrong",
    ...(config.isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown handlers
process.on("SIGTERM", () => {
  console.log("🔄 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🔄 SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Unhandled error safety nets
process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

// Start server with enhanced database validation and schema cache handling
async function startServer() {
  try {
    console.log("🔍 Testing database connection...");
    const dbTest = await testConnection();

    if (dbTest.success && !dbTest.warning) {
      console.log("✅ Database connection verified");
    } else if (dbTest.success && dbTest.warning) {
      console.log("⚠️  Database connected with warning:", dbTest.warning);
      if (dbTest.warning.includes("schema cache")) {
        console.log(
          "🔧 Schema cache issue detected - this is common after database updates"
        );

        // STRICT PRODUCTION MODE: No degraded starts in production
        if (config.isProduction) {
          console.error(
            "❌ Production startup blocked: schema cache issues detected"
          );
          console.error("💡 Solutions:");
          console.error("   1. Wait 5-10 minutes for automatic cache refresh");
          console.error("   2. Restart your Supabase project in the dashboard");
          console.error("   3. Run: node scripts/refresh-schema-cache.js");
          console.error(
            "   4. Set ALLOW_DEGRADED_START=true for emergency bypass"
          );

          if (process.env.ALLOW_DEGRADED_START !== "true") {
            process.exit(1);
          } else {
            console.warn("🚨 EMERGENCY: Starting production in degraded mode");
          }
        }
      }
    } else {
      console.error("❌ Database connection failed:", dbTest.error);

      // STRICT PRODUCTION MODE: No database, no startup
      if (config.isProduction) {
        console.error(
          "❌ Production startup blocked: database connection failed"
        );
        console.error(
          "💡 Ensure Supabase URL and SECRET_KEY are correctly configured"
        );

        if (process.env.ALLOW_DEGRADED_START !== "true") {
          process.exit(1);
        } else {
          console.warn("� EMERGENCY: Starting production without database");
        }
      } else {
        console.log("🔄 Development mode: starting in degraded mode...");
      }
    }

    // Load API Keys from Vault in production
    if (config.isProduction) {
      console.log("🔑 Pre-loading API keys from Supabase Vault...");
      try {
        const apiKeys = await envLoader.getApiKeys();
        const keyCount = Object.values(apiKeys).filter(
          (key) => key && key !== "your_api_key_here" && !key.includes("your_")
        ).length;

        console.log(
          `� API Keys loaded: ${keyCount}/${
            Object.keys(apiKeys).length
          } available`
        );

        // Critical API validation for production
        const criticalApis = ["foursquare", "googlePlaces"];
        const missingCritical = criticalApis.filter((api) => !apiKeys[api]);

        if (missingCritical.length > 0) {
          console.error(
            `❌ Critical API keys missing: ${missingCritical.join(", ")}`
          );
          console.error(
            "💡 Business discovery engine requires Foursquare API key"
          );

          if (process.env.ALLOW_DEGRADED_START !== "true") {
            process.exit(1);
          } else {
            console.warn("� EMERGENCY: Starting without critical API keys");
          }
        }
      } catch (error) {
        console.error(
          "❌ Failed to load API keys from Supabase Vault:",
          error.message
        );

        if (process.env.ALLOW_DEGRADED_START !== "true") {
          process.exit(1);
        } else {
          console.warn("🚨 EMERGENCY: Starting without Vault API keys");
        }
      }
    }

    // Start HTTP server with optimized configuration
    const server = app.listen(
      process.env.PORT || 3100,
      config.host || "0.0.0.0",
      () => {
        const serverUrl = `http://${config.host || "0.0.0.0"}:${
          process.env.PORT || 3100
        }`;
        console.log(`🌐 ProspectPro v3.1.0 server running on ${serverUrl}`);
        console.log(`📊 Environment: ${config.environment}`);
        console.log(`🔗 Health check: ${serverUrl}/health`);
        console.log(`🔍 Diagnostics: ${serverUrl}/diag`);

        // Production status summary
        if (config.isProduction) {
          console.log("\n" + "=".repeat(50));
          console.log("🏭 PRODUCTION MODE ACTIVE");
          console.log("✅ Strict startup validation enabled");
          console.log("✅ Supabase Vault API key loading");
          console.log("✅ Zero-tolerance for degraded states");
          console.log("=".repeat(50) + "\n");
        }
      }
    );

    // Set server timeout for production
    server.timeout = 120000; // 2 minutes

    return server;
  } catch (error) {
    console.error("💥 Server startup failed:", error.message);
    if (config.isDevelopment) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Start the server
startServer();
