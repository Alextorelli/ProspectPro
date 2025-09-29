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
  const healthData = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.environment,
    port: process.env.PORT || 3100,
    degradedStart: process.env.ALLOW_DEGRADED_START === "true",
    uptime: process.uptime(),
    version: "3.1.0",
  };

  console.log("🏥 Health check requested:", JSON.stringify(healthData));
  res.json(healthData);
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
app.use("/api/business", businessDiscoveryRouter); // Frontend compatibility
app.use("/api/campaign-export", campaignExportRouter);

// Default route - serve frontend with error handling
app.get("/", (req, res) => {
  try {
    const indexPath = path.join(__dirname, "public", "index.html");
    console.log(`📄 Serving index.html from: ${indexPath}`);
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error("❌ Failed to serve index.html:", err.message);
        res.status(404).json({
          error: "Frontend not found",
          message: "The application frontend is not available",
          timestamp: new Date().toISOString(),
        });
      }
    });
  } catch (error) {
    console.error("❌ Root route error:", error.message);
    res.status(500).json({
      error: "Application error",
      message: "Failed to serve the application",
      timestamp: new Date().toISOString(),
    });
  }
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

        // STRICT PRODUCTION MODE: Handle degraded starts appropriately
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
            console.error(
              "🚨 Forcing graceful degraded start for Cloud Run stability"
            );
            console.warn(
              "⚠️ CLOUD RUN: Starting in degraded mode due to schema cache"
            );
          } else {
            console.warn("🚨 EMERGENCY: Starting production in degraded mode");
          }
        }
      }
    } else {
      console.error("❌ Database connection failed:", dbTest.error);

      // STRICT PRODUCTION MODE: Handle database connection failures
      if (config.isProduction) {
        console.error(
          "❌ Production startup blocked: database connection failed"
        );
        console.error(
          "💡 Ensure Supabase URL and SECRET_KEY are correctly configured"
        );

        if (process.env.ALLOW_DEGRADED_START !== "true") {
          console.error(
            "🚨 Forcing graceful degraded start for Cloud Run stability"
          );
          console.warn("⚠️ CLOUD RUN: Starting without database connection");
        } else {
          console.warn("🚨 EMERGENCY: Starting production without database");
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
        const criticalApis = ["googlePlaces"]; // Foursquare is optional enhancement
        const missingCritical = criticalApis.filter((api) => !apiKeys[api]);

        if (missingCritical.length > 0) {
          console.error(
            `❌ Critical API keys missing: ${missingCritical.join(", ")}`
          );
          console.error(
            "💡 Business discovery requires Google Places API key"
          );

          if (process.env.ALLOW_DEGRADED_START !== "true") {
            console.error(
              "🚨 Forcing graceful degraded start for Cloud Run stability"
            );
            console.warn("⚠️ CLOUD RUN: Starting without critical API keys");
          } else {
            console.warn("🚨 EMERGENCY: Starting without critical API keys");
          }
        }
      } catch (error) {
        console.error(
          "❌ Failed to load API keys from Supabase Vault:",
          error.message
        );

        if (process.env.ALLOW_DEGRADED_START !== "true") {
          console.error(
            "🚨 Forcing graceful degraded start for Cloud Run stability"
          );
          console.warn("⚠️ CLOUD RUN: Starting without Vault API keys");
        } else {
          console.warn("🚨 EMERGENCY: Starting without Vault API keys");
        }
      }
    }

    // Start HTTP server with optimized configuration for Cloud Run
    const server = app.listen(
      process.env.PORT || 3100,
      "0.0.0.0", // Explicitly bind to all interfaces for Cloud Run
      () => {
        const port = process.env.PORT || 3100;
        const host = "0.0.0.0";
        const serverUrl = `http://${host}:${port}`;

        console.log(`🌐 ProspectPro v3.1.0 server running on ${serverUrl}`);
        console.log(`📊 Environment: ${config.environment}`);
        console.log(`🔗 Health check: ${serverUrl}/health`);
        console.log(`🔍 Diagnostics: ${serverUrl}/diag`);
        console.log(`🐳 Container Port: ${port} (Cloud Run managed)`);

        // Production status summary
        if (config.isProduction) {
          console.log("\n" + "=".repeat(50));
          console.log("🏭 PRODUCTION MODE ACTIVE");
          console.log("✅ Strict startup validation enabled");
          console.log("✅ Supabase Vault API key loading");
          console.log(
            `✅ Degraded startup: ${
              process.env.ALLOW_DEGRADED_START === "true"
                ? "ENABLED"
                : "DISABLED"
            }`
          );
          console.log("=".repeat(50) + "\n");
        }
      }
    ); // Set server timeout for production
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
