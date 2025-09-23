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
