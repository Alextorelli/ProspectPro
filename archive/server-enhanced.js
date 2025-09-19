// Load environment early; ignore if missing (Railway injects vars directly)
try {
  require("dotenv").config();
} catch (e) {
  console.warn("⚠️  dotenv not loaded (likely fine in production):", e.message);
}

// Initialize Enhanced Monitoring System FIRST
const {
  ProspectProDeploymentMonitor,
  EnhancedLogger,
  RailwayDeploymentUtils,
} = require("./modules/deployment-monitor");
const { BootPhaseDebugger } = require("./modules/boot-debugger");

// Initialize monitoring and logging
const monitor = new ProspectProDeploymentMonitor();
const logger = new EnhancedLogger("ProspectPro-Server");
const bootDebugger = new BootPhaseDebugger();

// Log deployment environment with full context
const deploymentInfo = RailwayDeploymentUtils.getDeploymentMetrics();
logger.info("🚀 ProspectPro Server Starting", {
  deployment: deploymentInfo,
  railway: RailwayDeploymentUtils.isRailwayEnvironment(),
  environment: process.env.NODE_ENV || "development",
});

// Start comprehensive monitoring phases
const dependenciesPhase = monitor.startPhase(
  "dependencies-load",
  "Loading core dependencies and modules"
);
bootDebugger.startPhase(
  "dependencies-load",
  "Loading core dependencies and modules"
);

const express = require("express");
const path = require("path");

// Import enhanced Supabase diagnostics & lazy client with error handling
let supabaseModule;
try {
  supabaseModule = require("./config/supabase");
  const {
    testConnection,
    getLastSupabaseDiagnostics,
    getSupabaseClient,
    setLastSupabaseDiagnostics,
  } = supabaseModule;
  dependenciesPhase.addSubPhase(
    "supabase-config",
    "Supabase configuration loaded successfully"
  );
  logger.debug("Supabase module loaded successfully");
} catch (error) {
  logger.error("Failed to load Supabase configuration", {
    error: error.message,
    stack: error.stack,
  });
  dependenciesPhase.fail(error);

  // Stub functions if Supabase fails to load
  supabaseModule = {
    testConnection: async () => ({
      success: false,
      error: "Supabase not configured",
    }),
    getLastSupabaseDiagnostics: () => ({ error: "Module failed to load" }),
    getSupabaseClient: () => null,
    setLastSupabaseDiagnostics: () => {},
  };
}

// Import monitoring and security systems with error handling
let ProspectProMetrics, SecurityHardening, EnhancedLeadDiscovery;
try {
  ProspectProMetrics =
    require("./modules/prometheus-metrics").ProspectProMetrics;
  SecurityHardening = require("./modules/security-hardening").SecurityHardening;
  EnhancedLeadDiscovery =
    require("./modules/enhanced-lead-discovery").EnhancedLeadDiscovery;

  dependenciesPhase.addSubPhase(
    "monitoring-systems",
    "Monitoring and security systems loaded"
  );
  logger.debug("Monitoring and security systems loaded successfully");
} catch (error) {
  logger.error("Failed to load monitoring/security systems", {
    error: error.message,
  });

  // Create stub implementations
  ProspectProMetrics = class {
    getHttpMetricsMiddleware() {
      return (req, res, next) => next();
    }
    recordError() {}
    getMetrics() {
      return "# Metrics not available\n";
    }
    getMetricsSummary() {
      return { error: "Metrics not loaded" };
    }
  };
  SecurityHardening = class {
    getMiddleware() {
      return { general: [], apiLimiter: (req, res, next) => next() };
    }
    getSecurityLogger() {
      return (req, res, next) => next();
    }
  };
  EnhancedLeadDiscovery = class {};
}

// Import Google Maps with error handling
let googlePlacesClient;
try {
  const { Client } = require("@googlemaps/google-maps-services-js");
  googlePlacesClient = new Client({});
  dependenciesPhase.addSubPhase(
    "google-maps",
    "Google Maps client initialized"
  );
} catch (error) {
  logger.warn("Google Maps client failed to initialize", {
    error: error.message,
  });
  googlePlacesClient = null;
}

bootDebugger.endPhase(true);
dependenciesPhase.complete();

// =====================================
// CORE SYSTEM INITIALIZATION WITH MONITORING
// =====================================

const coreInitPhase = monitor.startPhase(
  "core-init",
  "Initializing Express app and core systems"
);
bootDebugger.startPhase(
  "core-init",
  "Initializing Express app and core systems"
);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize monitoring and security systems with error handling
let metrics, security;
try {
  metrics = new ProspectProMetrics();
  security = new SecurityHardening();
  coreInitPhase.addSubPhase(
    "systems-init",
    "Monitoring and security systems initialized"
  );
  logger.info("📈 Registered monitoring metrics and security hardening");
} catch (error) {
  logger.error("Failed to initialize monitoring systems", {
    error: error.message,
  });
  // Use stub implementations if the classes failed to load
  metrics = {
    getHttpMetricsMiddleware: () => (req, res, next) => next(),
    recordError: () => {},
    getMetrics: () => "# Metrics not available\n",
    getMetricsSummary: () => ({ error: "Metrics not loaded" }),
  };
  security = {
    getMiddleware: () => ({
      general: [],
      apiLimiter: (req, res, next) => next(),
    }),
    getSecurityLogger: () => (req, res, next) => next(),
  };
}

bootDebugger.endPhase(true);
coreInitPhase.complete();

// =====================================
// MIDDLEWARE SETUP WITH COMPREHENSIVE MONITORING
// =====================================

const middlewarePhase = monitor.startPhase(
  "middleware-setup",
  "Configuring security and application middleware"
);
bootDebugger.startPhase(
  "middleware-setup",
  "Configuring security and application middleware"
);

// Get security middleware with error handling
let securityMiddleware;
try {
  securityMiddleware = security.getMiddleware();
  middlewarePhase.addSubPhase(
    "security-middleware",
    "Security middleware configured"
  );
} catch (error) {
  logger.error("Failed to configure security middleware", {
    error: error.message,
  });
  securityMiddleware = { general: [], apiLimiter: (req, res, next) => next() };
}

// Apply security middleware first
securityMiddleware.general.forEach((middleware, index) => {
  try {
    app.use(middleware);
    logger.trace(`Applied security middleware ${index + 1}`);
  } catch (error) {
    logger.warn(`Failed to apply security middleware ${index + 1}`, {
      error: error.message,
    });
  }
});

// Add comprehensive monitoring middleware
try {
  app.use(metrics.getHttpMetricsMiddleware());
  middlewarePhase.addSubPhase(
    "metrics-middleware",
    "HTTP metrics middleware configured"
  );
} catch (error) {
  logger.warn("Failed to configure metrics middleware", {
    error: error.message,
  });
}

// Body parsing middleware with enhanced error handling
try {
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  middlewarePhase.addSubPhase(
    "body-parsing",
    "Body parsing middleware configured"
  );
} catch (error) {
  logger.error("Failed to configure body parsing", { error: error.message });
}

// Static files with error handling
try {
  app.use(express.static(path.join(__dirname, "public")));
  middlewarePhase.addSubPhase("static-files", "Static file serving configured");
} catch (error) {
  logger.error("Failed to configure static files", { error: error.message });
}

// Security logging with error handling
try {
  app.use(security.getSecurityLogger());
  middlewarePhase.addSubPhase(
    "security-logging",
    "Security logging configured"
  );
} catch (error) {
  logger.warn("Failed to configure security logging", { error: error.message });
}

// Flag & diagnostics storage
let degradedMode = false;
let startupDiagnostics = null;

bootDebugger.endPhase(true);
middlewarePhase.complete();

// =====================================
// GOOGLE PLACES API SETUP WITH MONITORING
// =====================================

const googlePlacesPhase = monitor.startPhase(
  "google-places-init",
  "Initializing Google Places API client"
);
bootDebugger.startPhase(
  "google-places-init",
  "Initializing Google Places API client"
);

if (!googlePlacesClient && process.env.GOOGLE_PLACES_API_KEY) {
  try {
    const { Client } = require("@googlemaps/google-maps-services-js");
    googlePlacesClient = new Client({});
    googlePlacesPhase.addSubPhase(
      "client-creation",
      "Google Places client created successfully"
    );
    logger.info("🗺️  Google Places API client initialized");
  } catch (error) {
    logger.error("Failed to create Google Places client", {
      error: error.message,
    });
    googlePlacesPhase.fail(error);
    googlePlacesClient = null;
  }
} else if (!process.env.GOOGLE_PLACES_API_KEY) {
  logger.warn("Google Places API key not configured");
  googlePlacesPhase.addSubPhase(
    "no-api-key",
    "Google Places API key not configured"
  );
}

bootDebugger.endPhase(true);
googlePlacesPhase.complete();

// =====================================
// ENHANCED AUTHENTICATION MIDDLEWARE
// =====================================

const authPhase = monitor.startPhase(
  "auth-setup",
  "Setting up authentication middleware"
);
bootDebugger.startPhase("auth-setup", "Setting up authentication middleware");

// Enhanced auth middleware for API routes with comprehensive logging
const authMiddleware = (req, res, next) => {
  const startTime = Date.now();

  try {
    // Skip auth in development if configured
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.SKIP_AUTH_IN_DEV === "true"
    ) {
      req.user = { id: "dev-user-id", email: "dev@example.com" };
      logger.debug("Development authentication bypass", { route: req.path });
      return next();
    }

    // Check for personal access token in production
    if (process.env.NODE_ENV === "production") {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

      if (!token || token !== process.env.PERSONAL_ACCESS_TOKEN) {
        // Record failed authentication with detailed logging
        metrics.recordError("auth_failure", "api_auth", "warning");
        logger.warn("Authentication failed", {
          route: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          hasToken: !!token,
          tokenMatch: token === process.env.PERSONAL_ACCESS_TOKEN,
        });

        return res.status(401).json({
          error: "Unauthorized access",
          message: "Valid access token required",
          timestamp: new Date().toISOString(),
        });
      }

      // For personal use, set a default user
      req.user = {
        id: process.env.PERSONAL_USER_ID || "personal-user",
        email: process.env.PERSONAL_EMAIL || "personal@example.com",
      };

      logger.debug("Authentication successful", {
        route: req.path,
        userId: req.user.id,
        duration: Date.now() - startTime,
      });
    }

    next();
  } catch (error) {
    logger.error("Authentication middleware error", {
      error: error.message,
      route: req.path,
      stack: error.stack,
    });

    res.status(500).json({
      error: "Authentication system error",
      timestamp: new Date().toISOString(),
    });
  }
};

// Apply auth middleware with rate limiting to API routes
try {
  app.use("/api", securityMiddleware.apiLimiter, authMiddleware);
  authPhase.addSubPhase(
    "auth-middleware",
    "Authentication middleware applied to /api routes"
  );
  logger.info("🔐 Authentication middleware configured for API routes");
} catch (error) {
  logger.error("Failed to configure authentication middleware", {
    error: error.message,
  });
  authPhase.fail(error);
}

bootDebugger.endPhase(true);
authPhase.complete();

// =====================================
// COMPREHENSIVE HEALTH CHECK & MONITORING ENDPOINTS
// =====================================

const healthPhase = monitor.startPhase(
  "health-endpoints",
  "Setting up health check and monitoring endpoints"
);
bootDebugger.startPhase(
  "health-endpoints",
  "Setting up health check and monitoring endpoints"
);

// Enhanced health endpoint with deployment monitor integration
app.get("/health", monitor.getHealthEndpoint());

// Comprehensive diagnostics endpoint
app.get("/diag", monitor.getDiagnosticsEndpoint());

// Boot report endpoint with enhanced information
app.get("/boot-report", (req, res) => {
  try {
    const report = {
      ...bootDebugger.getFullReport(),
      deployment: deploymentInfo,
      monitoring: monitor.generateHealthReport(),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      versions: process.versions,
    };

    res.json(report);
  } catch (error) {
    logger.error("Failed to generate boot report", { error: error.message });
    res.status(500).json({ error: "Failed to generate boot report" });
  }
});

// Enhanced metrics endpoint
app.get("/metrics", (req, res) => {
  try {
    const prometheusMetrics = metrics.getPrometheusMetrics();
    res.set("Content-Type", "text/plain");
    res.send(prometheusMetrics);
  } catch (error) {
    logger.error("Failed to generate metrics", { error: error.message });
    res.status(500).send("# Failed to generate metrics");
  }
});

// System info endpoint for debugging
app.get("/system-info", (req, res) => {
  try {
    const systemInfo = {
      deployment: deploymentInfo,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        railway: RailwayDeploymentUtils.isRailwayEnvironment(),
        port: PORT,
        degradedMode,
      },
      configuration: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SECRET_KEY,
        hasGoogleKey: !!process.env.GOOGLE_PLACES_API_KEY,
        allowDegradedStart: process.env.ALLOW_DEGRADED_START === "true",
      },
      monitoring: monitor.generateHealthReport(),
      timestamp: new Date().toISOString(),
    };

    res.json(systemInfo);
  } catch (error) {
    logger.error("Failed to generate system info", { error: error.message });
    res.status(500).json({ error: "Failed to generate system info" });
  }
});

// Enhanced Lead Discovery Algorithm with comprehensive monitoring
try {
  const enhancedLeadDiscovery = new EnhancedLeadDiscovery();
  app.use("/api/enhanced-lead-discovery", enhancedLeadDiscovery.getRouter());
  healthPhase.addSubPhase(
    "enhanced-lead-discovery",
    "Enhanced Lead Discovery Algorithm initialized"
  );
  logger.info("🔧 Enhanced Lead Discovery Algorithm initialized");
} catch (error) {
  logger.error("Failed to initialize Enhanced Lead Discovery", {
    error: error.message,
  });
}

bootDebugger.endPhase(true);
healthPhase.complete();

// =====================================
// API ROUTES WITH COMPREHENSIVE ERROR HANDLING
// =====================================

// Load API routes with enhanced error handling
const apiRoutes = [
  { path: "/api/business-discovery", file: "./api/business-discovery" },
  { path: "/api/export", file: "./api/export" },
  { path: "/api/dashboard-export", file: "./api/dashboard-export" },
];

apiRoutes.forEach(({ path, file }) => {
  try {
    const router = require(file);
    app.use(path, router);
    logger.debug(`API route loaded: ${path}`);
  } catch (error) {
    logger.error(`Failed to load API route: ${path}`, {
      error: error.message,
      file,
      stack: error.stack,
    });

    // Create a fallback route that returns an error
    app.use(path, (req, res) => {
      res.status(503).json({
        error: `Service temporarily unavailable: ${path}`,
        message: "This API endpoint failed to load during startup",
        timestamp: new Date().toISOString(),
      });
    });
  }
});

// =====================================
// SERVER STARTUP WITH COMPREHENSIVE MONITORING
// =====================================

const serverPhase = monitor.startPhase(
  "server-bind",
  "Binding server to network port"
);
bootDebugger.startPhase("server-bind", "Binding server to network port");

const server = app.listen(PORT, "0.0.0.0", async () => {
  try {
    serverPhase.addSubPhase("port-binding", `Server bound to port ${PORT}`);
    logger.info(
      `🚀 ProspectPro server listening on port ${PORT} (host: 0.0.0.0)`
    );
    logger.info(`📊 Health: http://localhost:${PORT}/health`);
    logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
    logger.info(`🔧 Boot Report: http://localhost:${PORT}/boot-report`);
    logger.info(`🛠️ Diagnostics: http://localhost:${PORT}/diag`);
    logger.info(`ℹ️  System Info: http://localhost:${PORT}/system-info`);

    bootDebugger.endPhase(true);
    serverPhase.complete();

    // Perform initial Supabase diagnostics in background
    const supabasePhase = monitor.startPhase(
      "supabase-test",
      "Testing Supabase connectivity and authentication"
    );
    logger.info("⏳ Running initial Supabase diagnostics...");

    try {
      const diagnostics = await supabaseModule.testConnection({
        timeout: 10000,
        includeTableTest: true,
      });

      if (diagnostics.success) {
        logger.info(
          `✅ Supabase connectivity OK (${diagnostics.durationMs}ms) [mode=${diagnostics.mode}]`
        );
        logger.info(
          `📊 Supabase metrics: success (${(
            diagnostics.durationMs / 1000
          ).toFixed(2)}s) [${diagnostics.mode}]`
        );
        supabasePhase.complete(diagnostics);
      } else {
        logger.warn("⚠️ Supabase connectivity issues", {
          error: diagnostics.error,
          failureCategory: diagnostics.failureCategory,
          remediation: diagnostics.remediation,
        });
        supabasePhase.fail(new Error(diagnostics.error));
        degradedMode = true;
      }

      supabaseModule.setLastSupabaseDiagnostics(diagnostics);
      startupDiagnostics = diagnostics;
    } catch (error) {
      logger.error("Supabase diagnostics failed", {
        error: error.message,
        stack: error.stack,
      });
      supabasePhase.fail(error);
      degradedMode = true;
    }

    // Record successful startup
    bootDebugger.recordMilestone("supabase-ready");

    // Final boot completion
    const bootReport = bootDebugger.getFullReport();
    logger.info("📊 BOOT COMPLETE", {
      bootId: bootReport.bootId,
      totalTime: bootReport.totalBootTime,
      phases: bootReport.phases.length,
      successRate: `${Math.round(
        (bootReport.successfulPhases / bootReport.phases.length) * 100
      )}%`,
      efficiency: `${Math.round(
        (1 - bootReport.overheadMs / bootReport.totalBootTime) * 100
      )}%`,
    });

    // Log boot metrics
    logger.info(
      `🚀 Boot metrics recorded: ${bootReport.totalBootTime}ms total boot time`
    );
    bootDebugger.recordMilestone("startup-complete");

    // Start heartbeat logging for Railway monitoring
    setInterval(() => {
      const uptime = Math.floor(process.uptime());
      const healthStatus = monitor.generateHealthReport();
      logger.info(
        `❤️  Heartbeat | uptime=${uptime}s | degraded=${degradedMode} | supabase=${
          startupDiagnostics?.success ? "ok" : "error"
        } | boot=healthy`,
        {
          uptime,
          degradedMode,
          supabaseStatus: startupDiagnostics?.success ? "ok" : "error",
          healthStatus: healthStatus.healthStatus,
        }
      );
    }, 120000); // Every 2 minutes
  } catch (error) {
    logger.error("Server startup failed", {
      error: error.message,
      stack: error.stack,
    });
    serverPhase.fail(error);
    bootDebugger.endPhase(false);
    process.exit(1);
  }
});

// Enhanced error handling for server
server.on("error", (error) => {
  logger.error("Server error", { error: error.message, stack: error.stack });

  if (error.code === "EADDRINUSE") {
    logger.error(`Port ${PORT} is already in use`);
  }
});

// Graceful shutdown with comprehensive cleanup
const gracefulShutdown = (signal) => {
  logger.info(`🔄 Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      logger.error("Error during server shutdown", { error: err.message });
    } else {
      logger.info("✅ Server closed successfully");
    }

    // Cleanup monitoring systems
    try {
      monitor.cleanup();
      logger.info("✅ Monitoring systems cleaned up");
    } catch (error) {
      logger.error("Error cleaning up monitoring", { error: error.message });
    }

    // Final log
    logger.info("👋 ProspectPro server shutdown complete");
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.warn("⚠️  Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

// Register shutdown handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Global error handlers with comprehensive logging
process.on("uncaughtException", (error) => {
  logger.error("🚨 Uncaught Exception", {
    error: error.message,
    stack: error.stack,
    uptime: process.uptime(),
  });

  // Let the deployment monitor handle the critical error
  monitor.handleCriticalError(error);

  // Exit after logging
  setTimeout(() => process.exit(1), 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("🚨 Unhandled Rejection", {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise?.toString(),
    uptime: process.uptime(),
  });

  // Let the deployment monitor handle the critical error
  if (reason instanceof Error) {
    monitor.handleCriticalError(reason);
  } else {
    monitor.handleCriticalError(new Error(`Unhandled Rejection: ${reason}`));
  }
});

// Event loop lag monitoring
setInterval(() => {
  const start = process.hrtime.bigint();
  setImmediate(() => {
    const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
    if (lag > 100) {
      // Log if lag > 100ms
      logger.warn("Event loop lag detected", { lagMs: Math.round(lag) });
    }
  });
}, 30000); // Check every 30 seconds

// Export for testing
module.exports = { app, server, monitor };
