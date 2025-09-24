#!/usr/bin/env node

/**
 * ProspectPro Production MCP Server
 * Optimized for rapid CI/CD, environment switching, and troubleshooting
 *
 * Phase 1: Core production monitoring and environment management
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
        name: "prospectpro-production",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupErrorHandling();
  }

  setupTools() {
    // Phase 1: Environment & Deployment Monitoring

    // 1. Environment Health Check
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
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

        case "deployment_artifact_check":
          return await this.deploymentArtifactCheck();

        case "supabase_vault_validator":
          return await this.supabaseVaultValidator();

        case "performance_metrics":
          return await this.performanceMetrics();

        case "vault_api_key_status":
          return await this.vaultApiKeyStatus();

        case "production_startup_validator":
          return await this.productionStartupValidator();

        case "github_workflow_optimizer":
          return await this.githubWorkflowOptimizer();

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  // Core Environment Health Check
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
          const { error } = await supabase
            .from("enhanced_leads")
            .select("count")
            .limit(1);
          results.checks.push({
            name: "Supabase Database",
            status:
              error && !error.message.includes("does not exist")
                ? "unhealthy"
                : "healthy",
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
    console.error("🚀 ProspectPro Production MCP Server running");
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new ProductionMCPServer();
  server.run().catch(console.error);
}

module.exports = ProductionMCPServer;
