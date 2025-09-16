/**
 * ProspectPro Security Hardening Module
 * Comprehensive security middleware, rate limiting, and input validation
 */

const { RateLimiterMemory } = require("rate-limiter-flexible");
const helmet = require("helmet");
const cors = require("cors");

class SecurityHardening {
  constructor() {
    this.rateLimiters = new Map();
    this.securityConfig = this.loadSecurityConfig();
    console.log("🛡️  Security hardening initialized");
  }

  loadSecurityConfig() {
    return {
      isProduction: process.env.NODE_ENV === "production",
      adminPassword: process.env.ADMIN_PASSWORD,
      personalAccessToken: process.env.PERSONAL_ACCESS_TOKEN,
      allowedOrigins: this.getAllowedOrigins(),
      trustedProxies: process.env.TRUSTED_PROXIES?.split(",") || [
        "127.0.0.1",
        "::1",
      ],
    };
  }

  getAllowedOrigins() {
    if (process.env.NODE_ENV === "production") {
      return [
        "https://prospectpro-production-ddc7.up.railway.app",
        process.env.FRONTEND_URL,
      ].filter(Boolean);
    }

    return [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
    ];
  }

  /**
   * Get comprehensive security middleware stack
   * @returns {Object} Security middleware functions
   */
  getMiddleware() {
    const middleware = [];

    // 1. Helmet for security headers
    middleware.push(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://cdn.jsdelivr.net",
              "https://fonts.googleapis.com",
            ],
            scriptSrc: [
              "'self'",
              "https://cdn.jsdelivr.net",
              "https://unpkg.com",
            ],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: [
              "'self'",
              "https://*.supabase.co",
              "https://api.hunter.io",
              "https://api.neverbounce.com",
              "https://maps.googleapis.com",
              "https://places.googleapis.com",
            ],
            fontSrc: [
              "'self'",
              "https://cdn.jsdelivr.net",
              "https://fonts.gstatic.com",
            ],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: this.securityConfig.isProduction
              ? []
              : null,
          },
        },
        crossOriginEmbedderPolicy: false, // Allow embedding for admin dashboard
        hsts: {
          maxAge: this.securityConfig.isProduction ? 31536000 : 0, // 1 year in production
          includeSubDomains: this.securityConfig.isProduction,
          preload: this.securityConfig.isProduction,
        },
      })
    );

    // 2. CORS with strict origin control
    middleware.push(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (Railway health checks, mobile apps, etc.)
          if (!origin) {
            return callback(null, true);
          }

          // Allow development origins when not in production
          if (!this.securityConfig.isProduction) {
            return callback(null, true);
          }

          if (this.securityConfig.allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            console.warn(`🚫 CORS blocked: ${origin}`);
            callback(new Error("CORS: Origin not allowed"));
          }
        },
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })
    );

    // 3. Trust proxy configuration for Railway
    middleware.push((req, res, next) => {
      // Railway uses proxies, trust them for rate limiting
      if (process.env.RAILWAY_ENVIRONMENT) {
        req.app.set("trust proxy", true);
      }
      next();
    });

    return {
      general: middleware,
      apiLimiter: this.getApiRateLimiter(),
      expensiveLimiter: this.getExpensiveRateLimiter(),
      adminLimiter: this.getAdminRateLimiter(),
    };
  }

  /**
   * General API rate limiter (100 requests per 15 minutes)
   */
  getApiRateLimiter() {
    if (!this.rateLimiters.has("api")) {
      const rateLimiter = new RateLimiterMemory({
        points: 100, // Number of requests
        duration: 15 * 60, // Per 15 minutes
        blockDuration: 15 * 60, // Block for 15 minutes if exceeded
      });

      const middleware = async (req, res, next) => {
        const key = req.user?.id || req.ip || "unknown";

        // Skip rate limiting for health checks
        if (
          req.path.startsWith("/health") ||
          req.path.startsWith("/live") ||
          req.path.startsWith("/ready")
        ) {
          return next();
        }

        try {
          await rateLimiter.consume(key);
          next();
        } catch (rateLimiterRes) {
          const remainingMs = rateLimiterRes.msBeforeNext;
          const remainingMin = Math.round(remainingMs / 1000 / 60);

          console.warn(
            `🚫 API rate limit exceeded for ${req.ip} (${
              req.user?.id || "anonymous"
            })`
          );

          res.status(429).json({
            error: "Rate limit exceeded",
            message:
              "Too many API requests from this IP, please try again later.",
            retryAfter: `${remainingMin} minutes`,
            limit: 100,
            window: "15 minutes",
          });
        }
      };

      this.rateLimiters.set("api", middleware);
    }
    return this.rateLimiters.get("api");
  }

  /**
   * Expensive operations rate limiter (10 requests per hour)
   */
  getExpensiveRateLimiter() {
    if (!this.rateLimiters.has("expensive")) {
      const rateLimiter = new RateLimiterMemory({
        points: 10, // Number of requests
        duration: 60 * 60, // Per hour
        blockDuration: 60 * 60, // Block for 1 hour if exceeded
      });

      const middleware = async (req, res, next) => {
        const key = req.user?.id || req.ip || "unknown";

        try {
          await rateLimiter.consume(key);
          next();
        } catch (rateLimiterRes) {
          const remainingMs = rateLimiterRes.msBeforeNext;
          const remainingMin = Math.round(remainingMs / 1000 / 60);

          console.warn(
            `🚫 Expensive operation rate limit exceeded for ${req.ip} (${
              req.user?.id || "anonymous"
            })`
          );
          console.warn(`   Endpoint: ${req.method} ${req.path}`);

          res.status(429).json({
            error: "Expensive operation rate limit exceeded",
            message:
              "Too many expensive operations from this IP. These operations consume external API quota.",
            retryAfter: `${remainingMin} minutes`,
            limit: 10,
            window: "1 hour",
          });
        }
      };

      this.rateLimiters.set("expensive", middleware);
    }
    return this.rateLimiters.get("expensive");
  }

  /**
   * Admin operations rate limiter (stricter limits)
   */
  getAdminRateLimiter() {
    if (!this.rateLimiters.has("admin")) {
      const rateLimiter = new RateLimiterMemory({
        points: 30, // Number of requests
        duration: 15 * 60, // Per 15 minutes
        blockDuration: 15 * 60, // Block for 15 minutes if exceeded
      });

      const middleware = async (req, res, next) => {
        const key = req.ip || "unknown";

        try {
          await rateLimiter.consume(key);
          next();
        } catch (rateLimiterRes) {
          const remainingMs = rateLimiterRes.msBeforeNext;
          const remainingMin = Math.round(remainingMs / 1000 / 60);

          console.error(`🔥 Admin rate limit exceeded for ${req.ip}`);

          res.status(429).json({
            error: "Admin rate limit exceeded",
            message: "Too many admin requests from this IP",
            retryAfter: `${remainingMin} minutes`,
          });
        }
      };

      this.rateLimiters.set("admin", middleware);
    }
    return this.rateLimiters.get("admin");
  }

  /**
   * Admin authentication middleware
   */
  getAdminAuthMiddleware() {
    return (req, res, next) => {
      // Extract token from Authorization header or query parameter
      let token = null;

      if (req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }

      // Fallback to query parameter for dashboard access
      if (!token && req.query.token) {
        token = req.query.token;
      }

      const validTokens = [
        this.securityConfig.adminPassword,
        this.securityConfig.personalAccessToken,
      ].filter(Boolean);

      if (!token || !validTokens.includes(token)) {
        console.warn(`🚫 Admin auth failed from ${req.ip}: ${req.path}`);
        return res.status(401).json({
          error: "Unauthorized",
          message: "Valid admin authorization required",
          path: req.path,
        });
      }

      // Add admin context to request
      req.admin = {
        authenticated: true,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      };

      next();
    };
  }

  /**
   * Input validation helpers
   */
  getInputValidation() {
    return {
      validateCampaignInput: (req, res, next) => {
        const { query, location, maxResults, budgetLimit } = req.body;
        const errors = [];

        // Business type validation
        if (!query || typeof query !== "string") {
          errors.push("query is required and must be a string");
        } else if (query.length > 200) {
          errors.push("query must be under 200 characters");
        } else if (query.trim().length < 2) {
          errors.push("query must be at least 2 characters");
        }

        // Location validation
        if (!location || typeof location !== "string") {
          errors.push("location is required and must be a string");
        } else if (location.length > 200) {
          errors.push("location must be under 200 characters");
        } else if (location.trim().length < 2) {
          errors.push("location must be at least 2 characters");
        }

        // Max results validation
        if (maxResults !== undefined) {
          if (
            typeof maxResults !== "number" ||
            maxResults < 1 ||
            maxResults > 100
          ) {
            errors.push("maxResults must be a number between 1 and 100");
          }
        }

        // Budget limit validation
        if (budgetLimit !== undefined) {
          if (
            typeof budgetLimit !== "number" ||
            budgetLimit < 0 ||
            budgetLimit > 1000
          ) {
            errors.push("budgetLimit must be a number between 0 and 1000");
          }
        }

        // Sanitize inputs
        if (!errors.length) {
          req.body.query = req.body.query.trim();
          req.body.location = req.body.location.trim();
        }

        if (errors.length > 0) {
          return res.status(400).json({
            error: "Invalid input",
            details: errors,
          });
        }

        next();
      },

      validateExportInput: (req, res, next) => {
        const { format, campaignId } = req.body;
        const errors = [];

        if (format && !["csv", "json", "xlsx"].includes(format)) {
          errors.push("format must be one of: csv, json, xlsx");
        }

        if (campaignId && typeof campaignId !== "string") {
          errors.push("campaignId must be a string");
        }

        if (errors.length > 0) {
          return res.status(400).json({
            error: "Invalid export input",
            details: errors,
          });
        }

        next();
      },

      sanitizeString: (str, maxLength = 1000) => {
        if (typeof str !== "string") return "";
        return str.trim().substring(0, maxLength);
      },

      validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },

      validateUuid: (uuid) => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      },
    };
  }

  /**
   * Security logging middleware
   */
  getSecurityLogger() {
    return (req, res, next) => {
      const securityEvents = [];

      // Log suspicious patterns
      if (req.path.includes("../") || req.path.includes("..\\")) {
        securityEvents.push("path_traversal_attempt");
      }

      if (
        req.headers["user-agent"]?.includes("bot") &&
        !req.path.startsWith("/health")
      ) {
        securityEvents.push("bot_access");
      }

      // Log failed auth attempts
      res.on("finish", () => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          securityEvents.push("auth_failure");
        }

        if (securityEvents.length > 0) {
          console.warn(
            `🚨 Security events for ${req.ip}: ${securityEvents.join(", ")}`
          );
        }
      });

      next();
    };
  }

  /**
   * Get security status for health checks
   */
  getSecurityStatus() {
    return {
      rateLimiters: {
        active: this.rateLimiters.size,
        types: Array.from(this.rateLimiters.keys()),
      },
      corsEnabled: true,
      helmetEnabled: true,
      isProduction: this.securityConfig.isProduction,
      allowedOrigins: this.securityConfig.allowedOrigins.length,
      authConfigured: !!(
        this.securityConfig.adminPassword ||
        this.securityConfig.personalAccessToken
      ),
    };
  }

  /**
   * Reset rate limiters (useful for testing)
   */
  resetRateLimiters() {
    this.rateLimiters.clear();
    console.log("🛡️  Rate limiters reset");
  }
}

module.exports = { SecurityHardening };
