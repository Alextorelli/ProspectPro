#!/usr/bin/env node

/**
 * ProspectPro Supabase Troubleshooting MCP Server
 * Enhanced debugging and diagnostics for Supabase-first architecture
 */

// Environment loader sourcing
import { selectEnvironment } from "../../../config/environment-loader.v2.js";

// Dry-run mode support
const DRY_RUN = process.argv.includes("--dry-run");


import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import { exec } from "child_process";
import fs from "fs/promises";
import { promisify } from "util";

const execAsync = promisify(exec);

class SupabaseTroubleshootingServer {
  constructor() {
    this.server = new Server(
    this.environment = selectEnvironment();
    if (DRY_RUN) {
      console.log("[DRY RUN] Supabase Troubleshooting MCP Server initialized. No actions will be executed.");
    }
      {
        name: "prospectpro-supabase-troubleshooting",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "capture_api_trace",
          description: "Capture OpenTelemetry trace for a given API call (discovery/enrichment/validation)",
          inputSchema: {
            type: "object",
            properties: {
              apiEndpoint: { type: "string", description: "API endpoint URL" },
              method: { type: "string", description: "HTTP method", default: "POST" },
              payload: { type: "object", description: "Request payload" },
              authKey: { type: "string", description: "API key or token" },
            },
            required: ["apiEndpoint", "authKey"],
          },
        },
        {
          name: "compare_campaign_costs",
          description: "Compare cost metrics across multiple campaigns using API telemetry and Supabase logs",
          inputSchema: {
            type: "object",
            properties: {
              campaignIds: { type: "array", items: { type: "string" }, description: "List of campaign IDs" },
              sinceTime: { type: "string", description: "Time window (e.g., 24h)" },
            },
            required: ["campaignIds"],
          },
        },
        {
          name: "predict_campaign_roi",
          description: "Predict campaign ROI using cost, enrichment, and validation telemetry",
          inputSchema: {
            type: "object",
            properties: {
              campaignId: { type: "string", description: "Campaign ID" },
              tierKey: { type: "string", description: "Tier or plan key" },
              targetCount: { type: "integer", description: "Target lead count" },
            },
            required: ["campaignId", "tierKey", "targetCount"],
          },
        },
        {
          name: "collect_react_runtime_logs",
          description:
            "Tail Vercel build output or local dev server logs for React hook violations and runtime errors.",
          inputSchema: {
            type: "object",
            properties: {
              logPath: {
                type: "string",
                description: "Path to Vercel build or dev server log file.",
                default:
                  "/workspaces/ProspectPro/reports/logs/vercel-build.log",
              },
              lines: {
                type: "integer",
                description: "Number of lines to tail.",
                default: 100,
              },
            },
            required: ["logPath"],
          },
        },
        {
          name: "test_edge_function",
          description:
            "Test Supabase Edge Function connectivity and authentication",
          inputSchema: {
            type: "object",
            properties: {
              functionName: {
                type: "string",
                description: "Name of the Edge Function to test",
                default: "business-discovery",
              },
              anonKey: {
                type: "string",
                description: "Supabase anon key for authentication",
              },
              testPayload: {
                type: "object",
                description: "Test payload to send to function",
                default: { businessType: "test", location: "test" },
              },
            },
            required: ["functionName", "anonKey"],
          },
        },
        {
          name: "validate_database_permissions",
          description: "Check database RLS policies and permissions",
          inputSchema: {
            type: "object",
            properties: {
              supabaseUrl: {
                type: "string",
                description: "Supabase project URL",
              },
              anonKey: {
                type: "string",
                description: "Supabase anon key",
              },
            },
            required: ["supabaseUrl", "anonKey"],
          },
        },
        {
          name: "check_production_deployment",
          description:
            "Validate production deployment status and configuration at prospectpro.appsmithery.co",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description:
                  "Production URL to check (default: prospectpro.appsmithery.co)",
              },
            },
            required: ["url"],
          },
        },
        {
          name: "diagnose_anon_key_mismatch",
          description:
            "Compare anon keys between frontend and Supabase to detect mismatches",
          inputSchema: {
            type: "object",
            properties: {
              frontendPath: {
                type: "string",
                description: "Path to frontend file with anon key",
                default: "/workspaces/ProspectPro/public/supabase-app.js",
              },
              expectedAnonKey: {
                type: "string",
                description: "Expected anon key from Supabase dashboard",
              },
            },
            required: ["expectedAnonKey"],
          },
        },
        {
          name: "run_rls_diagnostics",
          description: "Generate and execute RLS diagnostic queries",
          inputSchema: {
            type: "object",
            properties: {
              supabaseUrl: {
                type: "string",
                description: "Supabase project URL",
              },
              anonKey: {
                type: "string",
                description: "Supabase anon key",
              },
            },
            required: ["supabaseUrl", "anonKey"],
          },
        },
        {
          name: "generate_debugging_commands",
          description:
            "Generate curl commands and debugging scripts for current configuration",
          inputSchema: {
            type: "object",
            properties: {
              supabaseUrl: {
                type: "string",
                description: "Supabase project URL",
              },
              anonKey: {
                type: "string",
                description: "Supabase anon key",
              },
              vercelUrl: {
                type: "string",
                description: "Vercel deployment URL",
              },
            },
            required: ["supabaseUrl", "anonKey"],
          },
        },
        {
          name: "collect_and_summarize_logs",
          description:
            "Fetch Supabase Edge Function logs and generate analysis summary",
          inputSchema: {
            type: "object",
            properties: {
              functionName: {
                type: "string",
                description: "Name of the Edge Function to fetch logs for",
                default: "business-discovery-background",
              },
              sinceTime: {
                type: "string",
                description: "Time period for logs (e.g., 1h, 24h)",
                default: "24h",
              },
            },
            required: ["functionName"],
          },
        },
        {
          name: "validate_ci_cd_suite",
          description:
            "Run lint, unit tests, build, and optional Supabase CLI checks to validate workspace pipeline",
          inputSchema: {
            type: "object",
            properties: {
              skipBuild: {
                type: "boolean",
                description: "Skip build step for faster feedback",
                default: false,
              },
              includeSupabase: {
                type: "boolean",
                description: "Also run Supabase CLI status/functions list",
                default: true,
              },
            },
          },
        },
        {
          name: "thunder_suite_report",
          description:
            "Validate Thunder Client environment sync and list available collections",
          inputSchema: {
            type: "object",
            properties: {
              collectionDir: {
                type: "string",
                description: "Directory containing Thunder collections",
                default: "thunder-collection",
              },
              envPath: {
                type: "string",
                description: "Thunder environment file path",
                default: ".env.thunder",
              },
            },
          },
        },
        {
          name: "vercel_status_check",
          description:
            "Check production Vercel deployment status code, latency, and cache headers",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Deployment URL to check",
                default: "https://prospect-fyhedobh1-appsmithery.vercel.app",
              },
            },
          },
        },
        {
          name: "supabase_cli_healthcheck",
          description:
            "Run Supabase CLI status, functions list, and migration list to catch drift",
          inputSchema: {
            type: "object",
            properties: {
              includeMigrations: {
                type: "boolean",
                default: true,
              },
              includeFunctions: {
                type: "boolean",
                default: true,
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "collect_react_runtime_logs": {
          // Tail Vercel build/dev logs for React hook violations
          const { logPath, lines = 100 } = request.params.arguments;
          try {
            const logContent = await fs.readFile(logPath, "utf8");
            const logLines = logContent.split("\n").slice(-lines);
            // Filter for React hook/runtime errors
            const reactErrors = logLines.filter(
              (line) =>
                /React(\s+)?(Hook|Error|Violation|Warning)/i.test(line) ||
                /Invalid hook call|Hooks must be called/i.test(line)
            );
            return {
              content: [
                {
                  type: "text",
                  text: `React Runtime Errors (last ${lines} lines):\n\n${
                    reactErrors.join("\n") || "No React errors found."
                  }`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error reading log file: ${error.message}`,
                },
              ],
            };
          }
        }
        case "test_edge_function":
          return await this.testEdgeFunction(request.params.arguments);
        case "validate_database_permissions":
          return await this.validateDatabasePermissions(
            request.params.arguments
          );
        case "check_production_deployment":
          return await this.checkProductionDeployment(request.params.arguments);
        case "diagnose_anon_key_mismatch":
          return await this.diagnoseAnonKeyMismatch(request.params.arguments);
        case "run_rls_diagnostics":
          return await this.runRlsDiagnostics(request.params.arguments);
        case "generate_debugging_commands":
          return await this.generateDebuggingCommands(request.params.arguments);
        case "collect_and_summarize_logs":
          return await this.collectAndSummarizeLogs(request.params.arguments);
        case "validate_ci_cd_suite":
          return await this.validateCiCdSuite(request.params.arguments);
        case "thunder_suite_report":
          return await this.thunderSuiteReport(request.params.arguments);
        case "vercel_status_check":
          return await this.vercelStatusCheck(request.params.arguments);
        case "supabase_cli_healthcheck":
          return await this.supabaseCliHealthcheck(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async testEdgeFunction({
    functionName,
    anonKey,
    testPayload = { businessType: "test", location: "test" },
  }) {
    try {
      const url = `https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/${functionName}`;

      const curlCommand = `curl -X POST '${url}' \\
  -H 'Authorization: Bearer ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(testPayload)}'`;

      const { stdout, stderr } = await execAsync(curlCommand);

      let result;
      try {
        result = JSON.parse(stdout);
      } catch {
        result = stdout;
      }

      return {
        content: [
          {
            type: "text",
            text: `Edge Function Test Results for '${functionName}':

Command executed:
${curlCommand}

Response:
${JSON.stringify(result, null, 2)}

Status: ${stderr ? "ERROR" : "SUCCESS"}
${stderr ? `Error: ${stderr}` : ""}

Diagnostics:
${this.analyzeEdgeFunctionResponse(result, stderr)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error testing Edge Function: ${error.message}

This could indicate:
1. Network connectivity issues
2. Invalid anon key
3. Edge Function not deployed
4. Supabase project configuration issues`,
          },
        ],
      };
    }
  }

  analyzeEdgeFunctionResponse(result, stderr) {
    if (stderr) {
      return "❌ Edge Function call failed - check network and authentication";
    }

    if (typeof result === "object" && result.code === 401) {
      return `❌ Authentication failed (401): ${result.message}
Troubleshooting steps:
1. Verify anon key is current and valid
2. Check RLS policies allow anon access
3. Ensure database tables exist`;
    }

    if (typeof result === "object" && result.success) {
      return "✅ Edge Function working correctly - returning successful results";
    }

    return "⚠️ Unexpected response format - may indicate Edge Function errors";
  }

  async validateDatabasePermissions({ supabaseUrl, anonKey }) {
    try {
      const supabase = createClient(supabaseUrl, anonKey);

      const tests = [
        { table: "campaigns", operation: "SELECT" },
        { table: "leads", operation: "SELECT" },
        { table: "dashboard_exports", operation: "SELECT" },
      ];

      const results = [];

      for (const test of tests) {
        try {
          const { data, error } = await supabase
            .from(test.table)
            .select("count", { count: "exact" })
            .limit(1);

          results.push({
            table: test.table,
            status: error ? "FAILED" : "SUCCESS",
            error: error?.message,
            count: data ? "accessible" : "not accessible",
          });
        } catch (err) {
          results.push({
            table: test.table,
            status: "FAILED",
            error: err.message,
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Database Permissions Validation Results:

${results
  .map(
    (r) => `Table: ${r.table}
Status: ${r.status}
${r.error ? `Error: ${r.error}` : ""}
${r.count ? `Access: ${r.count}` : ""}
`
  )
  .join("\n")}

Summary:
${
  results.every((r) => r.status === "SUCCESS")
    ? "✅ All database permissions are correctly configured"
    : "❌ Database permission issues detected - check RLS policies"
}

Recommended actions:
${
  results.some((r) => r.status === "FAILED")
    ? "1. Run /database/rls-setup.sql in Supabase SQL editor\n2. Verify anon key is correct\n3. Check table existence"
    : "Database permissions are working correctly"
}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Database validation failed: ${error.message}

This indicates:
1. Invalid Supabase URL or anon key
2. Network connectivity issues
3. Supabase project not accessible`,
          },
        ],
      };
    }
  }

  async checkProductionDeployment({
    url = "https://prospectpro.appsmithery.co/",
  }) {
    try {
      const { stdout, stderr } = await execAsync(`curl -I "${url}"`);

      const statusCode = stdout.match(/HTTP\/\d+\.?\d*\s+(\d+)/)?.[1];
      const headers = stdout.split("\n").filter((line) => line.includes(": "));

      return {
        content: [
          {
            type: "text",
            text: `Production Deployment Check for: ${url}

Status Code: ${statusCode}
${
  statusCode === "200"
    ? "✅ Deployment accessible"
    : `❌ Deployment issue (${statusCode})`
}

Headers:
${headers.slice(0, 10).join("\n")}

Analysis:
${this.analyzeProductionResponse(statusCode, headers)}

${stderr ? `Errors: ${stderr}` : ""}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Production deployment check failed: ${error.message}`,
          },
        ],
      };
    }
  }

  analyzeProductionResponse(statusCode, headers) {
    if (statusCode === "401") {
      return `❌ 401 Unauthorized - Deployment protection is enabled
Fix: Check domain configuration and Vercel project settings`;
    }

    if (statusCode === "404") {
      return `❌ 404 Not Found - Check if React app was built and deployed from /dist
Fix: npm run build && cd dist && vercel --prod`;
    }

    if (statusCode === "200") {
      return "✅ Production deployment is live and accessible";
    }

    return `⚠️ Unexpected status code ${statusCode} - check deployment logs`;
  }

  async diagnoseAnonKeyMismatch({
    frontendPath = "/workspaces/ProspectPro/public/supabase-app.js",
    expectedAnonKey,
  }) {
    try {
      const frontendContent = await fs.readFile(frontendPath, "utf8");
      const keyMatch = frontendContent.match(/["']eyJ[^"']+["']/);
      const frontendKey = keyMatch ? keyMatch[0].slice(1, -1) : null;

      const isMatch = frontendKey === expectedAnonKey;

      return {
        content: [
          {
            type: "text",
            text: `Anon Key Mismatch Diagnosis:

Frontend key (from ${frontendPath}):
${frontendKey ? frontendKey.substring(0, 50) + "..." : "NOT FOUND"}

Expected key (from Supabase dashboard):
${expectedAnonKey.substring(0, 50)}...

Match Status: ${isMatch ? "✅ MATCH" : "❌ MISMATCH"}

${
  !isMatch
    ? `
Fix Required:
1. Update the anon key in ${frontendPath} line ~9
2. Replace the key with: ${expectedAnonKey}
3. Redeploy frontend: cd public && vercel --prod
`
    : "No action needed - keys match correctly"
}

Current frontend anon key location:
Line: ${
              frontendContent
                .split("\n")
                .findIndex((line) => line.includes("eyJ")) + 1
            }`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading frontend file: ${error.message}`,
          },
        ],
      };
    }
  }

  async runRlsDiagnostics({ supabaseUrl, anonKey }) {
    const diagnosticSQL = `
-- RLS Diagnostics for ProspectPro
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE schemaname = 'public' 
  AND tablename IN ('campaigns', 'leads', 'dashboard_exports');

-- Check specific policies
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('campaigns', 'leads', 'dashboard_exports');
`;

    return {
      content: [
        {
          type: "text",
          text: `RLS Diagnostic Queries Generated:

Run these queries in Supabase SQL Editor to diagnose RLS issues:

${diagnosticSQL}

Expected Results:
- All tables should have rls_enabled = true
- Each table should have at least 1-3 policies
- Policies should include anon role permissions

If any table shows rls_enabled = false or policy_count = 0:
1. Run /database/rls-setup.sql
2. Verify policies are created correctly
3. Check anon role has necessary permissions`,
        },
      ],
    };
  }

  async generateDebuggingCommands({ supabaseUrl, anonKey, vercelUrl }) {
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/business-discovery`;

    const commands = {
      testEdgeFunction: `curl -X POST '${edgeFunctionUrl}' \\
  -H 'Authorization: Bearer ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{"businessType": "coffee shop", "location": "Seattle, WA", "maxResults": 2}'`,

      checkVercelStatus: `curl -I "${vercelUrl}"`,

      testSupabaseConnection: `curl -X GET '${supabaseUrl}/rest/v1/campaigns?select=count' \\
  -H 'Authorization: Bearer ${anonKey}' \\
  -H 'apikey: ${anonKey}'`,

      checkEdgeFunctionLogs: `supabase functions logs --project-ref sriycekxdqnesdsgwiuc`,

      deployFrontend: `cd /workspaces/ProspectPro/public && vercel --prod`,

      listEdgeFunctions: `supabase functions list`,
    };

    return {
      content: [
        {
          type: "text",
          text: `Generated Debugging Commands for Current Configuration:

🔧 Test Edge Function:
${commands.testEdgeFunction}

🌐 Check Vercel Status:
${commands.checkVercelStatus}

🗄️ Test Database Connection:
${commands.testSupabaseConnection}

📋 Check Edge Function Logs:
${commands.checkEdgeFunctionLogs}

🚀 Redeploy Frontend:
${commands.deployFrontend}

📊 List Edge Functions:
${commands.listEdgeFunctions}

Configuration Used:
- Supabase URL: ${supabaseUrl}
- Anon Key: ${anonKey.substring(0, 20)}...
- Vercel URL: ${vercelUrl || "Not provided"}

Save these commands for quick debugging!`,
        },
      ],
    };
  }

  async validateCiCdSuite({ skipBuild = false, includeSupabase = true } = {}) {
    const workspace = "/workspaces/ProspectPro";
    const steps = [
      { name: "Lint", command: "npm run lint" },
      { name: "Unit Tests", command: "npm test" },
    ];

    if (!skipBuild) {
      steps.push({ name: "Build", command: "npm run build" });
    }

    const results = [];

    for (const step of steps) {
      const outcome = await this.runCommand(step.command, { cwd: workspace });
      results.push({
        step: step.name,
        success: outcome.success,
        stdout: this.truncateOutput(outcome.stdout),
        stderr: this.truncateOutput(outcome.stderr),
        error: outcome.error,
      });
    }

    let supabase = null;

    if (includeSupabase) {
      supabase = await this.runCommand(
        "bash -lc 'cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh >/dev/null 2>&1 && npx --yes supabase@latest functions list'",
        { cwd: workspace }
      );
    }

    const recommendations = [];

    if (results.some((item) => !item.success)) {
      recommendations.push(
        "Pipeline step failed. Resolve errors, then rerun VS Code task CI/CD: Validate Workspace Pipeline."
      );
    }

    if (includeSupabase && supabase && !supabase.success) {
      recommendations.push(
        "Supabase CLI call failed. Run Supabase: Ensure Session task before retrying."
      );
    }

    if (!recommendations.length) {
      recommendations.push(
        "CI/CD pipeline healthy. Proceed with deployment (Deploy: Full Automated Frontend)."
      );
    }

    return {
      content: [
        {
          type: "text",
          text: `🧪 CI/CD Validation Results\n\n${JSON.stringify(
            {
              executed_at: new Date().toISOString(),
              steps: results,
              supabase: includeSupabase
                ? {
                    success: supabase.success,
                    stdout: this.truncateOutput(supabase.stdout),
                    stderr: this.truncateOutput(supabase.stderr),
                    error: supabase.error,
                  }
                : null,
              recommendations,
            },
            null,
            2
          )}`,
        },
      ],
    };
  }

  async thunderSuiteReport({
    collectionDir = "thunder-collection",
    envPath = ".env.thunder",
  } = {}) {
    const workspace = "/workspaces/ProspectPro";
    const collectionPath = `${workspace}/${collectionDir}`;
    const envFile = `${workspace}/${envPath}`;

    const report = {
      generated_at: new Date().toISOString(),
      collection_dir: collectionPath,
      env_file: envFile,
      env_present: false,
      collections: [],
      recommendations: [],
    };

    try {
      await fs.access(envFile);
      report.env_present = true;
    } catch {
      report.recommendations.push(
        "Thunder environment missing. Run npm run thunder:env:sync before executing collections."
      );
    }

    try {
      const files = await fs.readdir(collectionPath);
      const jsonFiles = files.filter((file) => file.endsWith(".json"));

      for (const file of jsonFiles) {
        const stats = await fs.stat(`${collectionPath}/${file}`);
        report.collections.push({
          file,
          size_bytes: stats.size,
          modified: stats.mtime,
        });
      }

      if (!jsonFiles.length) {
        report.recommendations.push(
          "No Thunder collections detected. Restore thunder-collection/*.json from main branch."
        );
      }
    } catch {
      report.recommendations.push(
        `Thunder collection directory missing: ${collectionPath}`
      );
    }

    if (!report.recommendations.length) {
      report.recommendations.push(
        "Run Thunder: Run Full Test Suite task to validate discovery, enrichment, and export flows."
      );
    }

    return {
      content: [
        {
          type: "text",
          text: `⚡ Thunder Suite Report\n\n${JSON.stringify(report, null, 2)}`,
        },
      ],
    };
  }

  async vercelStatusCheck({
    url = "https://prospect-fyhedobh1-appsmithery.vercel.app",
  } = {}) {
    const started = Date.now();

    return await new Promise((resolve) => {
      const request = https.request(url, { method: "GET" }, (response) => {
        const latencyMs = Date.now() - started;
        const payload = {
          checked_at: new Date().toISOString(),
          url,
          status_code: response.statusCode,
          latency_ms: latencyMs,
          cache_control: response.headers["cache-control"] || null,
          s_maxage: response.headers["s-maxage"] || null,
          last_modified: response.headers["last-modified"] || null,
        };

        response.resume();
        response.on("end", () => {
          payload.recommendation =
            payload.status_code !== 200
              ? "Non-200 response. Review Deploy: Full Automated Frontend task logs and vercel --prod output."
              : "Production healthy. Confirm cache headers stay at public, max-age=0, s-maxage=0, must-revalidate.";

          resolve({
            content: [
              {
                type: "text",
                text: `🌐 Vercel Status Check\n\n${JSON.stringify(
                  payload,
                  null,
                  2
                )}`,
              },
            ],
          });
        });
      });

      request.on("error", (error) => {
        resolve({
          content: [
            {
              type: "text",
              text: `❌ Vercel status check failed: ${error.message}`,
            },
          ],
        });
      });

      request.end();
    });
  }

  async supabaseCliHealthcheck({
    includeMigrations = true,
    includeFunctions = true,
  } = {}) {
    const workspace = "/workspaces/ProspectPro";
    const commands = [
      {
        name: "Supabase Status",
        command:
          "bash -lc 'cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh >/dev/null 2>&1 && npx --yes supabase@latest status'",
      },
    ];

    if (includeFunctions) {
      commands.push({
        name: "Functions List",
        command:
          "bash -lc 'cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh >/dev/null 2>&1 && npx --yes supabase@latest functions list'",
      });
    }

    if (includeMigrations) {
      commands.push({
        name: "Migration List",
        command:
          "bash -lc 'cd supabase && source ../scripts/operations/ensure-supabase-cli-session.sh >/dev/null 2>&1 && npx --yes supabase@latest migration list'",
      });
    }

    const results = [];

    for (const command of commands) {
      const outcome = await this.runCommand(command.command, {
        cwd: workspace,
      });
      results.push({
        step: command.name,
        success: outcome.success,
        stdout: this.truncateOutput(outcome.stdout),
        stderr: this.truncateOutput(outcome.stderr),
        error: outcome.error,
      });
    }

    const recommendations = results.some((item) => !item.success)
      ? [
          "Supabase CLI reported errors. Run Supabase: Ensure Session task, then repeat healthcheck.",
        ]
      : [
          "Supabase CLI healthy. Continue with supabase functions deploy or supabase db push as needed.",
        ];

    return {
      content: [
        {
          type: "text",
          text: `🛠️ Supabase CLI Healthcheck\n\n${JSON.stringify(
            {
              executed_at: new Date().toISOString(),
              checks: results,
              recommendations,
            },
            null,
            2
          )}`,
        },
      ],
    };
  }

  async collectAndSummarizeLogs({ functionName, sinceTime = "24h" }) {
    try {
      // Step 1: Fetch logs using Supabase CLI
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const logFile = `reports/logs/supabase-logs-${timestamp}.log`;

      // Ensure reports directory exists
      await fs.mkdir("reports/logs", { recursive: true });

      const fetchCommand = `cd /workspaces/ProspectPro && source scripts/operations/ensure-supabase-cli-session.sh && npx --yes supabase@latest functions logs ${functionName} --since=${sinceTime} > ${logFile}`;

      const { stdout: fetchStdout, stderr: fetchStderr } = await execAsync(
        fetchCommand
      );

      if (fetchStderr && !fetchStderr.includes("ready=")) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching logs: ${fetchStderr}`,
            },
          ],
        };
      }

      // Step 2: Analyze logs using diagnostics script
      const analyzeCommand = `cd /workspaces/ProspectPro && ./scripts/diagnostics/edge-function-diagnostics.sh ${logFile}`;

      const { stdout: analyzeStdout, stderr: analyzeStderr } = await execAsync(
        analyzeCommand
      );

      // Step 3: Read the generated report
      const reportPath = logFile
        .replace("reports/logs/", "reports/diagnostics/")
        .replace(".log", ".md");
      let reportContent = "";

      try {
        reportContent = await fs.readFile(reportPath, "utf8");
      } catch (readError) {
        reportContent = `Could not read analysis report: ${readError.message}`;
      }

      // Tag ESLint/react-hook errors in the report
      const reactErrorMatches = reportContent.match(
        /(React(\s+)?(Hook|Error|Violation|Warning)|Invalid hook call|Hooks must be called|react-hooks\/rules-of-hooks|jsx-sort-props)/gi
      );
      const reactErrorSummary =
        reactErrorMatches && reactErrorMatches.length > 0
          ? `\n**React/ESLint Errors Detected:**\n${reactErrorMatches.join(
              "\n"
            )}`
          : "\nNo React/ESLint errors detected.";

      return {
        content: [
          {
            type: "text",
            text: `## Supabase Log Collection & Analysis Complete

**Function:** ${functionName}
**Time Period:** ${sinceTime}
**Log File:** ${logFile}
**Analysis Report:** ${reportPath}

### Fetch Results
${fetchStdout || "Logs fetched successfully"}

### Analysis Summary
${analyzeStdout || "Analysis completed"}

### Detailed Report
${reportContent}
${reactErrorSummary}

### Next Steps
1. Review the analysis report above for errors and warnings
2. Check Supabase dashboard for additional context if needed
3. Run specific function tests if issues are identified
4. Consider redeploying functions if deployment errors are found`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error collecting and summarizing logs: ${error.message}

This could indicate:
1. Supabase CLI authentication issues
2. Network connectivity problems
3. Invalid function name or time period
4. File system permissions issues

Try running the commands manually:
- source scripts/operations/ensure-supabase-cli-session.sh
- npx --yes supabase@latest functions logs ${functionName} --since=${sinceTime}`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(
      "ProspectPro Supabase Troubleshooting MCP server running on stdio"
    );
  }
}

const server = new SupabaseTroubleshootingServer();
server.run().catch(console.error);
