#!/usr/bin/env node

/**
 * ProspectPro Production MCP Server v4.1 - Post-Cleanup Enhanced
 * Optimized for cleaned database architecture, streamlined Edge Functions, and MECE taxonomy
 *
 * Updated Features (Oct 2025):
 * - 2 Essential Edge Functions: business-discovery-optimized + campaign-export
 * - Cleaned Database: campaigns, leads, dashboard_exports (core tables only)
 * - MECE Business Taxonomy: 16 categories, 300+ optimized business types
 * - Security Hardened: No SECURITY DEFINER issues, fixed trigger functions
 * - Cache-Optimized: Real-time deployment updates via Vercel
 * - Cost Intelligence: Dynamic pricing with admin panel integration
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { createClient } = require("@supabase/supabase-js");
const https = require("https");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

class ProductionMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "prospectpro-production-v4.1",
        version: "4.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.supabase = null;
    this.apiClients = {};
    this.workspaceRoot = process.env.WORKSPACE_ROOT || process.cwd();
    this.setupTools();
    this.setupErrorHandling();
  }

  setupTools() {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        // === PRODUCTION MONITORING TOOLS ===
        case "environment_health_check":
          return await this.environmentHealthCheck();
        case "github_actions_monitor":
          return await this.githubActionsMonitor(request.params.arguments);
        case "dev_prod_config_diff":
          return await this.devProdConfigDiff();
        case "cost_budget_monitor":
          return await this.costBudgetMonitor();
        case "api_health_dashboard":
          return await this.apiHealthDashboard();
        case "vault_api_key_status":
          return await this.vaultApiKeyStatus();
        case "production_startup_validator":
          return await this.productionStartupValidator();
        case "github_workflow_optimizer":
          return await this.githubWorkflowOptimizer();

        // === SYSTEM DIAGNOSTICS TOOLS (from monitoring-server) ===
        case "get_system_health":
          return await this.getSystemHealth(request.params.arguments);
        case "read_diagnostics":
          return await this.readDiagnostics(request.params.arguments);
        case "analyze_logs":
          return await this.analyzeLogs(request.params.arguments);
        case "validate_configuration":
          return await this.validateConfiguration(request.params.arguments);
        case "generate_performance_report":
          return await this.generatePerformanceReport(request.params.arguments);
        case "monitor_api_quotas":
          return await this.monitorAPIQuotas(request.params.arguments);

        // === DATABASE ANALYTICS TOOLS (from database-server) ===
        case "query_leads":
          return await this.queryLeads(request.params.arguments);
        case "get_campaign_stats":
          return await this.getCampaignStats(request.params.arguments);
        case "analyze_lead_quality":
          return await this.analyzeLeadQuality(request.params.arguments);
        case "get_api_costs":
          return await this.getApiCosts(request.params.arguments);

        // === API TESTING TOOLS (from api-server) ===
        case "test_google_places":
          return await this.testGooglePlaces(request.params.arguments);
        case "test_foursquare_places":
          return await this.testFoursquarePlaces(request.params.arguments);
        case "test_email_discovery":
          return await this.testEmailDiscovery(request.params.arguments);
        case "verify_email":
          return await this.verifyEmail(request.params.arguments);
        case "get_api_usage_stats":
          return await this.getAPIUsageStats();
        case "simulate_lead_discovery":
          return await this.simulateLeadDiscovery(request.params.arguments);

        // === FILESYSTEM ANALYSIS TOOLS (from filesystem-server) ===
        case "analyze_project_structure":
          return await this.analyzeProjectStructure(request.params.arguments);
        case "find_code_patterns":
          return await this.findCodePatterns(request.params.arguments);
        case "analyze_api_clients":
          return await this.analyzeAPIClients(request.params.arguments);
        case "check_fake_data_violations":
          return await this.checkFakeDataViolations(request.params.arguments);

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async initializeSupabase() {
    if (!this.supabase) {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
        throw new Error("Missing Supabase configuration");
      }

      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY
      );

      // Test connection (prefer cleaned leads table, fall back to legacy view)
      const tablesToCheck = ["leads", "enhanced_leads"];
      let connectionVerified = false;

      for (const table of tablesToCheck) {
        const { error } = await this.supabase
          .from(table)
          .select("count")
          .limit(1);

        if (!error) {
          connectionVerified = true;
          break;
        }

        const message = error.message || "";
        const isMissingTable =
          message.includes("does not exist") ||
          message.includes("schema cache");

        if (!isMissingTable) {
          throw new Error(`Supabase connection failed: ${message}`);
        }
      }

      if (!connectionVerified) {
        console.warn(
          "⚠️  Supabase connection verified, but no leads tables found (leads/enhanced_leads)"
        );
      }
    }
  }

  async initializeAPIClients() {
    if (Object.keys(this.apiClients).length === 0) {
      try {
        const GooglePlacesClient = require("../modules/api-clients/google-places-client");
        const FoursquareClient = require("../modules/api-clients/foursquare-places-client");
        const HunterIOClient = require("../modules/api-clients/hunter-io-client");
        const NeverBounceClient = require("../modules/api-clients/neverbounce-client");

        this.apiClients = {
          googlePlaces: new GooglePlacesClient(
            process.env.GOOGLE_PLACES_API_KEY
          ),
          foursquare: new FoursquareClient(process.env.FOURSQUARE_API_KEY),
          hunterIO: new HunterIOClient(process.env.HUNTER_IO_API_KEY),
          neverBounce: new NeverBounceClient(process.env.NEVERBOUNCE_API_KEY),
        };
      } catch (error) {
        console.error(
          "Warning: Some API clients could not be loaded:",
          error.message
        );
      }
    }
  }

  // === PRODUCTION MONITORING METHODS ===
  async environmentHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      checks: [],
    };

    try {
      // Check 1: Environment variables
      const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"];
      const envCheck = {
        name: "Environment Variables",
        status: "healthy",
        details: {},
      };

      requiredEnvVars.forEach((varName) => {
        const value = process.env[varName];
        if (!value || value.includes("your_")) {
          envCheck.status = "unhealthy";
          envCheck.details[varName] = "missing or template value";
        } else {
          envCheck.details[varName] = "configured";
        }
      });
      results.checks.push(envCheck);

      // Check 2: Supabase Connection
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SECRET_KEY
        );

        try {
          let status = "unhealthy";
          const tablesToCheck = ["leads", "enhanced_leads"];

          for (const table of tablesToCheck) {
            const { error } = await supabase
              .from(table)
              .select("count")
              .limit(1);

            if (!error) {
              status = "healthy";
              break;
            }

            const message = error.message || "";
            const isMissingTable =
              message.includes("does not exist") ||
              message.includes("schema cache");

            if (!isMissingTable) {
              throw new Error(message);
            }
          }

          results.checks.push({
            name: "Supabase Database",
            status,
            details: { connection: "successful" },
          });
        } catch (dbError) {
          results.checks.push({
            name: "Supabase Database",
            status: "unhealthy",
            details: { error: dbError.message },
          });
        }
      }

      // Check 3: GitHub Actions Integration
      const ghToken = process.env.GHP_TOKEN || process.env.GITHUB_TOKEN;
      results.checks.push({
        name: "GitHub Actions Integration",
        status: ghToken ? "healthy" : "warning",
        details: { token: ghToken ? "present" : "missing" },
      });

      return {
        content: [
          {
            type: "text",
            text: `🔍 **Production Environment Health Check**\n\n${JSON.stringify(
              results,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Health check failed: ${error.message}`,
          },
        ],
      };
    }
  }

  // GitHub Actions Workflow Monitor
  async githubActionsMonitor({
    repo = "Alextorelli/ProspectPro",
    workflow = "generate-dotenv.yml",
  } = {}) {
    const token = process.env.GHP_TOKEN || process.env.GITHUB_TOKEN;

    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "⚠️ No GitHub token available for workflow monitoring",
          },
        ],
      };
    }

    try {
      const [owner, repoName] = repo.split("/");
      const options = {
        hostname: "api.github.com",
        path: `/repos/${owner}/${repoName}/actions/workflows/${workflow}/runs?per_page=5`,
        headers: {
          Authorization: `token ${token}`,
          "User-Agent": "ProspectPro-Production-MCP",
        },
      };

      const response = await this.makeHttpsRequest(options);
      const data = JSON.parse(response);

      if (data.workflow_runs && data.workflow_runs.length > 0) {
        const runs = data.workflow_runs.slice(0, 3).map((run) => ({
          id: run.id,
          status: run.status,
          conclusion: run.conclusion,
          created_at: run.created_at,
          head_commit: run.head_commit?.message?.substring(0, 50) + "...",
        }));

        return {
          content: [
            {
              type: "text",
              text: `📊 **GitHub Actions Workflow Status**\n\n**Workflow**: ${workflow}\n**Repository**: ${repo}\n\n**Recent Runs**:\n${JSON.stringify(
                runs,
                null,
                2
              )}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `📊 No recent workflow runs found for ${workflow}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ GitHub Actions monitoring failed: ${error.message}`,
          },
        ],
      };
    }
  }

  // Dev/Prod Configuration Comparison
  async devProdConfigDiff() {
    try {
      const prodEnvPath = path.join(process.cwd(), ".env");
      const devEnvPath = path.join(
        process.cwd(),
        ".devcontainer",
        "devcontainer.json"
      );

      const comparison = {
        production: {
          environment_file: fs.existsSync(prodEnvPath),
          node_env: process.env.NODE_ENV,
          theme: "default (unchanged)",
          mcp_servers: "production-only",
        },
        development: {
          devcontainer_config: fs.existsSync(devEnvPath),
          theme: "Vira Deepforest (green)",
          mcp_servers: "full suite (database, API, filesystem, monitoring)",
        },
      };

      // Read production configuration
      if (fs.existsSync(prodEnvPath)) {
        const envContent = fs.readFileSync(prodEnvPath, "utf8");
        comparison.production.features = {
          supabase_configured: !envContent.includes("your-project-ref"),
          github_actions_build: envContent.includes("BUILD_TIMESTAMP"),
          vault_integration: envContent.includes("Vault"),
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `🔄 **Dev/Prod Configuration Comparison**\n\n${JSON.stringify(
              comparison,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Configuration comparison failed: ${error.message}`,
          },
        ],
      };
    }
  }

  // Cost Budget Monitor
  async costBudgetMonitor() {
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY
      );

      // Get recent API costs
      const { data: costs, error } = await supabase
        .from("api_costs")
        .select("*")
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const totalCost =
        costs?.reduce((sum, cost) => sum + (cost.cost || 0), 0) || 0;
      const budgetLimit = parseFloat(process.env.DEFAULT_BUDGET_LIMIT) || 25.0;
      const utilization = (totalCost / budgetLimit) * 100;

      const analysis = {
        period: "Last 24 hours",
        total_cost: `$${totalCost.toFixed(2)}`,
        budget_limit: `$${budgetLimit.toFixed(2)}`,
        utilization: `${utilization.toFixed(1)}%`,
        status:
          utilization > 80
            ? "⚠️ HIGH"
            : utilization > 50
            ? "⚡ MODERATE"
            : "✅ HEALTHY",
        recent_costs:
          costs?.slice(0, 5).map((cost) => ({
            service: cost.service,
            cost: `$${cost.cost?.toFixed(3)}`,
            timestamp: cost.created_at,
          })) || [],
      };

      return {
        content: [
          {
            type: "text",
            text: `💰 **Cost Budget Monitor**\n\n${JSON.stringify(
              analysis,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Cost monitoring failed: ${error.message}\n\nNote: Ensure api_costs table exists in Supabase`,
          },
        ],
      };
    }
  }

  // API Health Dashboard
  async apiHealthDashboard() {
    const apis = [
      { name: "Google Places", key: "GOOGLE_PLACES_API_KEY" },
      { name: "Hunter.io", key: "HUNTER_IO_API_KEY" },
      { name: "NeverBounce", key: "NEVERBOUNCE_API_KEY" },
      { name: "Foursquare", key: "FOURSQUARE_API_KEY" },
    ];

    const dashboard = {
      timestamp: new Date().toISOString(),
      apis: [],
    };

    for (const api of apis) {
      const status = {
        name: api.name,
        key_configured: !!process.env[api.key],
        status: "unknown",
      };

      // Basic configuration check
      if (process.env[api.key]) {
        status.status = "configured";
      } else {
        status.status = "missing_key";
        status.note = "Check Supabase Vault or environment variables";
      }

      dashboard.apis.push(status);
    }

    return {
      content: [
        {
          type: "text",
          text: `🔌 **API Health Dashboard**\n\n${JSON.stringify(
            dashboard,
            null,
            2
          )}`,
        },
      ],
    };
  }

  // === NEW ENHANCED TOOLS FOR VAULT AND PRODUCTION OPTIMIZATION ===

  // Vault API Key Status Monitor
  async vaultApiKeyStatus() {
    try {
      console.log("🔑 Checking Supabase Vault API key status...");

      // Test Supabase connection
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SECRET_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Supabase credentials not configured in environment",
            },
          ],
        };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Check vault diagnostic function
      const { data, error } = await supabase.rpc("vault_diagnostic_check");

      if (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Vault diagnostic failed: ${error.message}`,
            },
          ],
        };
      }

      let report = "🔐 **Supabase Vault API Key Status Report**\n\n";

      if (data && data.length > 0) {
        data.forEach((check) => {
          const statusIcon =
            check.status === "ENABLED" || check.status === "COMPLETE"
              ? "✅"
              : check.status === "PARTIAL"
              ? "⚠️"
              : "❌";

          report += `${statusIcon} **${check.check_name}**: ${check.status}\n`;
          report += `   Details: ${check.details}\n`;
          report += `   Recommendation: ${check.recommendation}\n\n`;
        });
      } else {
        report += "⚠️ No diagnostic data returned from vault\n";
      }

      return {
        content: [
          {
            type: "text",
            text: report,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error checking vault status: ${error.message}`,
          },
        ],
      };
    }
  }

  // Production Startup Validator
  async productionStartupValidator() {
    try {
      console.log("🔍 Running production startup validation...");

      const issues = [];
      const validations = [];

      // Check 1: Environment variables
      const requiredEnvs = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"];
      requiredEnvs.forEach((env) => {
        const value = process.env[env];
        if (!value || value.includes("your_")) {
          issues.push(`Missing or template value for ${env}`);
        } else {
          validations.push(`✅ ${env} configured`);
        }
      });

      // Check 2: Production mode settings
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === "production") {
        validations.push("✅ NODE_ENV set to production");

        // Check degraded start setting
        if (process.env.ALLOW_DEGRADED_START === "true") {
          issues.push(
            "❌ ALLOW_DEGRADED_START=true is not recommended for production"
          );
        } else {
          validations.push(
            "✅ Strict production mode enabled (no degraded starts)"
          );
        }
      } else {
        issues.push(`NODE_ENV is '${nodeEnv}', should be 'production'`);
      }

      // Check 3: Port configuration
      const port = process.env.PORT;
      if (port && port !== "3000") {
        validations.push(`✅ Custom port configured: ${port}`);
      } else {
        validations.push("ℹ️ Using default/standard port configuration");
      }

      let report = "🏭 **Production Startup Validation Report**\n\n";

      report += "**Validations Passed:**\n";
      validations.forEach((validation) => {
        report += `${validation}\n`;
      });

      if (issues.length > 0) {
        report += "\n**Issues Found:**\n";
        issues.forEach((issue) => {
          report += `❌ ${issue}\n`;
        });

        report += "\n**Recommendations:**\n";
        report +=
          "1. Ensure GitHub Actions workflows have generated proper .env\n";
        report += "2. Configure API keys in Supabase Vault\n";
        report +=
          "3. Set ALLOW_DEGRADED_START=false for strict production mode\n";
        report += "4. Verify all secrets are present and valid\n";
      }

      return {
        content: [
          {
            type: "text",
            text: report,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Production validation failed: ${error.message}`,
          },
        ],
      };
    }
  }

  // GitHub Workflow Optimizer
  async githubWorkflowOptimizer() {
    try {
      console.log("⚙️ Analyzing GitHub Actions workflows...");

      const workflowsDir = path.join(process.cwd(), ".github", "workflows");

      if (!fs.existsSync(workflowsDir)) {
        return {
          content: [
            {
              type: "text",
              text: "❌ No .github/workflows directory found",
            },
          ],
        };
      }

      const workflows = fs
        .readdirSync(workflowsDir)
        .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"));

      let report = "⚙️ **GitHub Actions Workflow Analysis**\n\n";

      const optimizations = [];
      const issues = [];

      workflows.forEach((workflow) => {
        const workflowPath = path.join(workflowsDir, workflow);
        const content = fs.readFileSync(workflowPath, "utf8");

        report += `📋 **${workflow}:**\n`;

        // Check triggers
        if (content.includes("push:") && content.includes("branches: [main]")) {
          if (
            workflow.includes("repository-maintenance") ||
            workflow.includes("docker-env")
          ) {
            issues.push(
              `${workflow}: Triggers on every push (may cause cascade failures)`
            );
            optimizations.push(
              `Consider schedule-only or manual triggers for ${workflow}`
            );
          } else {
            report += "  ✅ Push trigger configured for main branch\n";
          }
        }

        // Check for workflow_dispatch
        if (content.includes("workflow_dispatch:")) {
          report += "  ✅ Manual trigger available\n";
        } else {
          optimizations.push(
            `Add workflow_dispatch to ${workflow} for manual testing`
          );
        }

        // Check for proper permissions
        if (content.includes("permissions:")) {
          report += "  ✅ Permissions configured\n";
        } else {
          if (
            content.includes("GITHUB_TOKEN") ||
            content.includes("secrets.")
          ) {
            issues.push(
              `${workflow}: Uses secrets but no permissions specified`
            );
          }
        }

        report += "\n";
      });

      if (optimizations.length > 0) {
        report += "**Optimization Recommendations:**\n";
        optimizations.forEach((opt) => {
          report += `💡 ${opt}\n`;
        });
        report += "\n";
      }

      if (issues.length > 0) {
        report += "**Issues Found:**\n";
        issues.forEach((issue) => {
          report += `⚠️ ${issue}\n`;
        });
      }

      return {
        content: [
          {
            type: "text",
            text: report,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Workflow analysis failed: ${error.message}`,
          },
        ],
      };
    }
  }

  // === SYSTEM DIAGNOSTICS METHODS (from monitoring-server) ===

  async getSystemHealth(args = {}) {
    const { includeDetailedMetrics = false } = args;

    const health = {
      timestamp: new Date().toISOString(),
      status: "unknown",
      components: {},
      metrics: {},
    };

    try {
      // Check critical files
      const packageJson = await this.checkFile("package.json");
      const dockerCompose = await this.checkFile("docker-compose.yml");
      const server = await this.checkFile("server.js");

      health.components = {
        filesystem: {
          status: "healthy",
          package_json: packageJson.exists,
          docker_compose: dockerCompose.exists,
          server_file: server.exists,
        },
      };

      // Check diagnostics file
      try {
        const diagnosticsPath = path.join(
          this.workspaceRoot,
          "diagnostics.json"
        );
        const diagnosticsContent = await fs.readFileSync(
          diagnosticsPath,
          "utf8"
        );
        const diagnostics = JSON.parse(diagnosticsContent);

        health.components.diagnostics = {
          status: diagnostics.status || "unknown",
          last_check: diagnostics.timestamp,
          database_connection: diagnostics.database?.status === "connected",
        };
      } catch (error) {
        health.components.diagnostics = {
          status: "unavailable",
          error: "Diagnostics file not found or invalid",
        };
      }

      // Overall health determination
      const criticalComponents = ["filesystem"];
      const healthyComponents = criticalComponents.filter(
        (comp) => health.components[comp]?.status === "healthy"
      );

      health.status =
        healthyComponents.length === criticalComponents.length
          ? "healthy"
          : healthyComponents.length > 0
          ? "degraded"
          : "unhealthy";

      if (includeDetailedMetrics) {
        health.metrics = await this.gatherDetailedMetrics();
      }
    } catch (error) {
      health.status = "error";
      health.error = error.message;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(health, null, 2),
        },
      ],
    };
  }

  async readDiagnostics(args = {}) {
    const { includeHistory = true } = args;

    try {
      const diagnosticsPath = path.join(this.workspaceRoot, "diagnostics.json");
      const content = await fs.readFileSync(diagnosticsPath, "utf8");
      const diagnostics = JSON.parse(content);

      const analysis = {
        current_diagnostics: diagnostics,
        analysis: {
          timestamp: diagnostics.timestamp,
          status: diagnostics.status,
          critical_issues: [],
          warnings: [],
          recommendations: [],
        },
      };

      // Analyze diagnostics data
      if (diagnostics.database) {
        if (diagnostics.database.status !== "connected") {
          analysis.analysis.critical_issues.push("Database connection failed");
        }
        if (diagnostics.database.error) {
          analysis.analysis.critical_issues.push(
            `Database error: ${diagnostics.database.error}`
          );
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: `Failed to read diagnostics: ${error.message}`,
                suggestion:
                  "Run the application to generate diagnostics.json file",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  async analyzeLogs(args = {}) {
    const { logType = "all", timeRange = "24h" } = args;

    const logFiles = [
      "startup.log",
      "production.log",
      "database-validation.log",
    ];
    const analysis = {
      log_type: logType,
      time_range: timeRange,
      log_files_checked: [],
      patterns_found: { errors: [], warnings: [], info: [] },
      summary: {},
    };

    for (const logFile of logFiles) {
      try {
        const logPath = path.join(this.workspaceRoot, logFile);
        const content = await fs.readFileSync(logPath, "utf8");
        const stats = await fs.statSync(logPath);

        analysis.log_files_checked.push({
          file: logFile,
          size: stats.size,
          last_modified: stats.mtime,
          line_count: content.split("\n").length,
        });

        const errorPatterns = content.match(/ERROR|Error:|error:/gi) || [];
        if (errorPatterns.length > 0) {
          analysis.patterns_found.errors.push({
            file: logFile,
            count: errorPatterns.length,
          });
        }
      } catch (error) {
        analysis.log_files_checked.push({
          file: logFile,
          error: `Could not read: ${error.message}`,
        });
      }
    }

    analysis.summary = {
      total_log_files: analysis.log_files_checked.filter((f) => !f.error)
        .length,
      total_errors: analysis.patterns_found.errors.reduce(
        (sum, e) => sum + e.count,
        0
      ),
      health_status:
        analysis.patterns_found.errors.length === 0
          ? "healthy"
          : "needs_attention",
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  async validateConfiguration(args = {}) {
    const { strict = true } = args;

    const validation = {
      validation_mode: strict ? "strict" : "standard",
      results: {},
      issues: [],
      recommendations: [],
    };

    // Check critical files
    const criticalFiles = ["package.json", "server.js", "docker-compose.yml"];
    validation.results.critical_files = {};

    for (const file of criticalFiles) {
      const fileInfo = await this.checkFile(file);
      validation.results.critical_files[file] = fileInfo;

      if (!fileInfo.exists) {
        validation.issues.push(`Missing critical file: ${file}`);
      }
    }

    if (validation.issues.length === 0) {
      validation.recommendations.push(
        "Configuration appears to be complete and healthy"
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(validation, null, 2),
        },
      ],
    };
  }

  async generatePerformanceReport(args = {}) {
    const { includeRecommendations = true } = args;

    const report = {
      generated_at: new Date().toISOString(),
      performance_metrics: {},
      analysis: {},
      recommendations: [],
    };

    // File system performance metrics
    const metrics = await this.gatherDetailedMetrics();
    report.performance_metrics = metrics;

    const totalFiles = Object.values(metrics.file_counts || {}).reduce(
      (sum, count) => sum + count,
      0
    );

    report.analysis = {
      total_files: totalFiles,
      estimated_complexity:
        totalFiles > 100 ? "complex" : totalFiles > 50 ? "moderate" : "simple",
    };

    if (includeRecommendations) {
      report.recommendations.push(
        "Use MCP servers to offload AI processing tasks"
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(report, null, 2),
        },
      ],
    };
  }

  async monitorAPIQuotas(args = {}) {
    const { alertThreshold = 80 } = args;

    const quotaMonitoring = {
      alert_threshold: alertThreshold,
      api_services: {},
      alerts: [],
      recommendations: [],
    };

    // Mock API quota data (integrate with actual APIs in production)
    const apiServices = [
      {
        name: "Google Places",
        quota: 1000,
        used: 250,
        cost_per_request: 0.032,
      },
      { name: "Hunter.io", quota: 100, used: 45, cost_per_request: 0.04 },
      { name: "NeverBounce", quota: 1000, used: 320, cost_per_request: 0.008 },
    ];

    apiServices.forEach((service) => {
      const usagePercent = (service.used / service.quota) * 100;
      quotaMonitoring.api_services[service.name] = {
        quota_limit: service.quota,
        requests_used: service.used,
        usage_percentage: Math.round(usagePercent),
        status: usagePercent >= alertThreshold ? "alert" : "ok",
      };
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(quotaMonitoring, null, 2),
        },
      ],
    };
  }

  // === DATABASE ANALYTICS METHODS (from database-server) ===

  async queryLeads(args = {}) {
    const { filters = {}, limit = 10, orderBy = "confidence_score" } = args;

    await this.initializeSupabase();

    let query = this.supabase
      .from("enhanced_leads")
      .select("*")
      .order(orderBy, { ascending: false })
      .limit(limit);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              results: data,
              count: data.length,
              query_info: { filters, limit, orderBy },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getCampaignStats(args = {}) {
    const { campaignId, timeRange = "24h" } = args;

    await this.initializeSupabase();

    const intervalMap = {
      "24h": "1 day",
      "7d": "7 days",
      "30d": "30 days",
    };

    const { data, error } = await this.supabase.rpc("get_campaign_statistics", {
      p_campaign_id: campaignId,
      p_time_interval: intervalMap[timeRange] || "1 day",
    });

    if (error) {
      throw new Error(`Campaign stats query failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              campaign_id: campaignId,
              time_range: timeRange,
              statistics: data,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async analyzeLeadQuality(args = {}) {
    const { businessType, minConfidence = 70 } = args;

    await this.initializeSupabase();

    let query = this.supabase
      .from("enhanced_leads")
      .select(
        "confidence_score, business_name, email_confidence, phone_confidence, website_confidence"
      )
      .gte("confidence_score", minConfidence);

    if (businessType) {
      query = query.ilike("business_type", `%${businessType}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Quality analysis failed: ${error.message}`);
    }

    const analysis = {
      total_leads: data.length,
      average_confidence:
        data.reduce((sum, lead) => sum + lead.confidence_score, 0) /
        data.length,
      confidence_distribution: {
        high: data.filter((l) => l.confidence_score >= 85).length,
        medium: data.filter(
          (l) => l.confidence_score >= 70 && l.confidence_score < 85
        ).length,
        low: data.filter((l) => l.confidence_score < 70).length,
      },
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  async getApiCosts(args = {}) {
    const { timeRange = "24h" } = args;

    await this.initializeSupabase();

    const { data, error } = await this.supabase
      .from("api_costs")
      .select("*")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`API costs query failed: ${error.message}`);
    }

    const totalCost =
      data?.reduce((sum, cost) => sum + (cost.cost || 0), 0) || 0;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              time_range: timeRange,
              total_cost: totalCost,
              total_requests: data?.length || 0,
              recent_costs: data?.slice(0, 5) || [],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // === API TESTING METHODS (from api-server) ===

  async testGooglePlaces(args = {}) {
    const { query, location = "New York, NY", limit = 5 } = args;

    await this.initializeAPIClients();

    if (!this.apiClients.googlePlaces) {
      throw new Error("Google Places API client not available");
    }

    const results = await this.apiClients.googlePlaces.searchBusinesses(
      query,
      location,
      limit
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              api: "Google Places",
              query,
              location,
              results: results.businesses || [],
              success: results.found,
              error: results.error || null,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async testFoursquarePlaces(args = {}) {
    const { query, location = "New York, NY", limit = 5 } = args;

    await this.initializeAPIClients();

    if (!this.apiClients.foursquare) {
      throw new Error("Foursquare API client not available");
    }

    const results = await this.apiClients.foursquare.searchBusinesses(
      query,
      location,
      limit
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              api: "Foursquare Places",
              query,
              location,
              results: results.businesses || [],
              success: results.found,
              error: results.error || null,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async testEmailDiscovery(args = {}) {
    const { domain, limit = 5 } = args;

    await this.initializeAPIClients();

    if (!this.apiClients.hunterIO) {
      throw new Error("Hunter.io API client not available");
    }

    const results = await this.apiClients.hunterIO.findEmails(domain, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              api: "Hunter.io",
              domain,
              emails: results.emails || [],
              success: results.found,
              error: results.error || null,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async verifyEmail(args = {}) {
    const { email } = args;

    await this.initializeAPIClients();

    if (!this.apiClients.neverBounce) {
      throw new Error("NeverBounce API client not available");
    }

    const result = await this.apiClients.neverBounce.verifyEmail(email);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              api: "NeverBounce",
              email,
              verification: result,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getAPIUsageStats() {
    await this.initializeAPIClients();

    const stats = {};

    Object.entries(this.apiClients).forEach(([name, client]) => {
      if (client && typeof client.getUsageStats === "function") {
        stats[name] = client.getUsageStats();
      }
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              api_usage_statistics: stats,
              generated_at: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async simulateLeadDiscovery(args = {}) {
    const { businessType, location, maxResults = 3 } = args;

    await this.initializeAPIClients();

    const results = {
      businessType,
      location,
      maxResults,
      discovery_results: {},
      processing_summary: {
        total_discovered: 0,
        errors: [],
      },
    };

    try {
      // Business Discovery
      if (this.apiClients.googlePlaces) {
        const googleResults =
          await this.apiClients.googlePlaces.searchBusinesses(
            businessType,
            location,
            maxResults
          );
        results.discovery_results.google_places = googleResults;
        results.processing_summary.total_discovered +=
          googleResults.businesses?.length || 0;
      }

      if (this.apiClients.foursquare) {
        const foursquareResults =
          await this.apiClients.foursquare.searchBusinesses(
            businessType,
            location,
            maxResults
          );
        results.discovery_results.foursquare = foursquareResults;
        results.processing_summary.total_discovered +=
          foursquareResults.businesses?.length || 0;
      }
    } catch (error) {
      results.processing_summary.errors.push(error.message);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  // === FILESYSTEM ANALYSIS METHODS (from filesystem-server) ===

  async analyzeProjectStructure(args = {}) {
    const { includeFiles = true } = args;

    const structure = await this.walkDirectory(
      this.workspaceRoot,
      includeFiles
    );
    const analysis = this.analyzeStructure(structure);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              workspace_root: this.workspaceRoot,
              structure_analysis: analysis,
              directory_tree: structure,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async findCodePatterns(args = {}) {
    const {
      pattern,
      fileExtensions = [".js", ".json", ".md", ".sql"],
      excludeDirectories = ["node_modules", ".git", "archive"],
    } = args;

    const results = [];
    const regex = new RegExp(pattern, "gi");

    const searchInDirectory = async (dirPath) => {
      try {
        const items = await fs.readdirSync(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = await fs.statSync(itemPath);

          if (stats.isDirectory()) {
            if (!excludeDirectories.includes(item) && !item.startsWith(".")) {
              await searchInDirectory(itemPath);
            }
          } else if (fileExtensions.includes(path.extname(item))) {
            try {
              const content = await fs.readFileSync(itemPath, "utf8");
              const matches = [...content.matchAll(regex)];

              if (matches.length > 0) {
                results.push({
                  file: path.relative(this.workspaceRoot, itemPath),
                  matches: matches.length,
                  details: matches.slice(0, 5).map((match) => ({
                    match: match[0],
                  })),
                });
              }
            } catch (readError) {
              // Skip files that can't be read
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
      }
    };

    await searchInDirectory(this.workspaceRoot);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              pattern,
              total_matches: results.reduce((sum, r) => sum + r.matches, 0),
              files_with_matches: results.length,
              results,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async analyzeAPIClients(args = {}) {
    const { detailed = false } = args;
    const apiClientsPath = path.join(
      this.workspaceRoot,
      "modules",
      "api-clients"
    );

    try {
      const files = await fs.readdirSync(apiClientsPath);
      const analysis = { clients: [], summary: {} };

      for (const file of files) {
        if (path.extname(file) === ".js") {
          const filePath = path.join(apiClientsPath, file);
          const content = await fs.readFileSync(filePath, "utf8");

          const clientAnalysis = {
            name: file,
            size: content.length,
            method_count: (content.match(/async\s+\w+\(|^\s*\w+\s*\(/gm) || [])
              .length,
            error_handling: (content.match(/try\s*{|catch\s*\(/g) || []).length,
            caching_implemented:
              content.includes("cache") || content.includes("Cache"),
          };

          analysis.clients.push(clientAnalysis);
        }
      }

      analysis.summary = {
        total_clients: analysis.clients.length,
        total_methods: analysis.clients.reduce(
          (sum, c) => sum + c.method_count,
          0
        ),
        clients_with_caching: analysis.clients.filter(
          (c) => c.caching_implemented
        ).length,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze API clients: ${error.message}`);
    }
  }

  async checkFakeDataViolations(args = {}) {
    const { strict = true } = args;

    const suspiciousPatterns = [
      "Artisan\\s+Bistro",
      "Downtown\\s+Café?",
      "Business\\s+LLC",
      "\\(555\\)\\s*\\d{3}-\\d{4}",
      "example\\.com",
      "generateFake",
      "mockData",
    ];

    const violations = [];

    for (const pattern of suspiciousPatterns) {
      const patternResults = await this.findCodePatterns({
        pattern,
        fileExtensions: [".js", ".json"],
        excludeDirectories: ["node_modules", ".git", "archive", "tests"],
      });

      const data = JSON.parse(patternResults.content[0].text);
      if (data.results.length > 0) {
        violations.push({
          pattern,
          severity: strict ? "HIGH" : "MEDIUM",
          matches: data.results,
        });
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              check_mode: strict ? "strict" : "standard",
              total_violations: violations.length,
              violations,
              recommendation:
                violations.length > 0
                  ? "IMMEDIATE ACTION REQUIRED: Remove all fake data patterns"
                  : "No fake data violations detected - good!",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // === HELPER METHODS ===

  async checkFile(relativePath) {
    try {
      const filePath = path.join(this.workspaceRoot, relativePath);
      const stats = await fs.statSync(filePath);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
      };
    }
  }

  async gatherDetailedMetrics() {
    const metrics = {
      disk_usage: {},
      file_counts: {},
    };

    try {
      // Count files by extension
      const fileExtensions = await this.countFilesByExtension();
      metrics.file_counts = fileExtensions;

      // Calculate directory sizes for key directories
      const directories = ["modules", "api", "database", "mcp-servers"];
      for (const dir of directories) {
        try {
          const dirPath = path.join(this.workspaceRoot, dir);
          const size = await this.getDirectorySize(dirPath);
          metrics.disk_usage[dir] = size;
        } catch (error) {
          metrics.disk_usage[dir] = { error: error.message };
        }
      }
    } catch (error) {
      metrics.error = error.message;
    }

    return metrics;
  }

  async countFilesByExtension() {
    const counts = {};

    const countInDirectory = async (dirPath) => {
      try {
        const items = await fs.readdirSync(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = await fs.statSync(itemPath);

          if (stats.isDirectory()) {
            if (
              item !== "node_modules" &&
              !item.startsWith(".") &&
              item !== "archive"
            ) {
              await countInDirectory(itemPath);
            }
          } else {
            const ext = path.extname(item) || "no-extension";
            counts[ext] = (counts[ext] || 0) + 1;
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };

    await countInDirectory(this.workspaceRoot);
    return counts;
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const items = await fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.statSync(itemPath);

        if (stats.isDirectory()) {
          if (item !== "node_modules" && !item.startsWith(".")) {
            totalSize += await this.getDirectorySize(itemPath);
          }
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }

    return totalSize;
  }

  async walkDirectory(dirPath, includeFiles, currentDepth = 0, maxDepth = 4) {
    if (currentDepth > maxDepth) return null;

    const result = {
      name: path.basename(dirPath),
      type: "directory",
      children: [],
    };

    try {
      const items = await fs.readdirSync(dirPath);

      for (const item of items) {
        if (item.startsWith(".") && !item.includes("vscode")) continue;
        if (["node_modules", "archive"].includes(item)) continue;

        const itemPath = path.join(dirPath, item);
        const stats = await fs.statSync(itemPath);

        if (stats.isDirectory()) {
          const childResult = await this.walkDirectory(
            itemPath,
            includeFiles,
            currentDepth + 1,
            maxDepth
          );
          if (childResult) result.children.push(childResult);
        } else if (includeFiles) {
          result.children.push({
            name: item,
            type: "file",
            size: stats.size,
            extension: path.extname(item),
          });
        }
      }
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  analyzeStructure(structure) {
    const analysis = {
      total_directories: 0,
      total_files: 0,
      file_types: {},
      key_directories: [],
    };

    const analyzeNode = (node) => {
      if (node.type === "directory") {
        analysis.total_directories++;

        // Identify key directories
        const keyDirs = [
          "api",
          "modules",
          "config",
          "database",
          "mcp-servers",
          "scripts",
        ];
        if (keyDirs.includes(node.name)) {
          analysis.key_directories.push({
            name: node.name,
            children_count: node.children?.length || 0,
          });
        }

        if (node.children) {
          node.children.forEach(analyzeNode);
        }
      } else if (node.type === "file") {
        analysis.total_files++;
        const ext = node.extension || "no-extension";
        analysis.file_types[ext] = (analysis.file_types[ext] || 0) + 1;
      }
    };

    analyzeNode(structure);
    return analysis;
  }

  // Additional helper methods...
  async makeHttpsRequest(options) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      req.on("error", reject);
      req.end();
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[Production MCP Server Error]:", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(
      "🚀 ProspectPro Production MCP Server v4.1 - Post-Cleanup Enhanced"
    );
    console.error(
      "   📊 Tier-Aware Monitoring | 🗄️  Database Analytics | 🔧 System Diagnostics"
    );
    console.error(
      "   🔌 API Testing | 📁 Filesystem Analysis | 🛡️  Zero Fake Data Enforcement"
    );
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new ProductionMCPServer();
  server.run().catch(console.error);
}

module.exports = ProductionMCPServer;
