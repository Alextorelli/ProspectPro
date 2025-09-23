/**
 * ProspectPro Server - Production Optimized
 * Fast startup with comprehensive error handling and monitoring
 * @version 3.1.0 - Production Branch Optimized
 */

// Production configuration with intelligent defaults
const config = {
  environment: process.env.NODE_ENV || "production",
  port: process.env.PORT || 3100,
  host: process.env.HOST || "0.0.0.0",
  isDevelopment: process.env.NODE_ENV === "development",
  allowDegradedStart: process.env.ALLOW_DEGRADED_START === "true",
};

console.log(`🚀 ProspectPro v3.1.0 starting in ${config.environment} mode`);
console.log(`🔧 Binding to ${config.host}:${config.port}`);

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
if (!config.isDevelopment) {
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
        console.log(
          "📋 The server will start in degraded mode until the cache refreshes"
        );
        console.log("💡 To fix this issue:");
        console.log("   1. Wait 5-10 minutes for automatic cache refresh");
        console.log("   2. Or restart your Supabase project in the dashboard");
        console.log("   3. Or run: node scripts/refresh-schema-cache.js");
      }
    } else {
      console.error("❌ Database connection failed:", dbTest.error);
      if (
        config.environment === "production" &&
        !process.env.ALLOW_DEGRADED_START
      ) {
        console.log("🔧 Production startup blocked due to database failure");
        console.log("💡 To start anyway, set ALLOW_DEGRADED_START=true");
        process.exit(1);
      }
      console.log("🔄 Starting in degraded mode...");
    }

    // Start HTTP server with optimized configuration
    const server = app.listen(config.port, config.host, () => {
      const serverUrl = `http://${config.host}:${config.port}`;
      console.log(`🌐 ProspectPro v3.1.0 server running on ${serverUrl}`);
      console.log(`📊 Environment: ${config.environment}`);
      console.log(`🔗 Health check: ${serverUrl}/health`);
      console.log(`🔍 Diagnostics: ${serverUrl}/diag`);

      if (dbTest.warning && dbTest.warning.includes("schema cache")) {
        console.log("");
        console.log("🚨 NOTICE: Schema cache refresh recommended");
        console.log("📋 Database operational but cache optimization pending");
        console.log("⏰ Automatic resolution expected within 5-10 minutes");
        console.log("🔧 Manual fix: node scripts/refresh-schema-cache.js");
        console.log("");
      }
    });

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
