#!/usr/bin/env node

/**
 * ProspectPro Supabase Troubleshooting MCP Server
 * Enhanced debugging and diagnostics for Supabase-first architecture
 */

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
          name: "check_vercel_deployment",
          description: "Validate Vercel deployment status and configuration",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Vercel deployment URL to check",
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
                description: "Current anon key",
              },
              vercelUrl: {
                type: "string",
                description: "Vercel deployment URL",
              },
            },
            required: ["supabaseUrl", "anonKey"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "test_edge_function":
          return await this.testEdgeFunction(request.params.arguments);
        case "validate_database_permissions":
          return await this.validateDatabasePermissions(
            request.params.arguments
          );
        case "check_vercel_deployment":
          return await this.checkVercelDeployment(request.params.arguments);
        case "diagnose_anon_key_mismatch":
          return await this.diagnoseAnonKeyMismatch(request.params.arguments);
        case "run_rls_diagnostics":
          return await this.runRlsDiagnostics(request.params.arguments);
        case "generate_debugging_commands":
          return await this.generateDebuggingCommands(request.params.arguments);
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

  async checkVercelDeployment({ url }) {
    try {
      const { stdout, stderr } = await execAsync(`curl -I "${url}"`);

      const statusCode = stdout.match(/HTTP\/\d+\.?\d*\s+(\d+)/)?.[1];
      const headers = stdout.split("\n").filter((line) => line.includes(": "));

      return {
        content: [
          {
            type: "text",
            text: `Vercel Deployment Check for: ${url}

Status Code: ${statusCode}
${
  statusCode === "200"
    ? "✅ Deployment accessible"
    : `❌ Deployment issue (${statusCode})`
}

Headers:
${headers.slice(0, 10).join("\n")}

Analysis:
${this.analyzeVercelResponse(statusCode, headers)}

${stderr ? `Errors: ${stderr}` : ""}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Vercel deployment check failed: ${error.message}`,
          },
        ],
      };
    }
  }

  analyzeVercelResponse(statusCode, headers) {
    if (statusCode === "401") {
      return `❌ 401 Unauthorized - Deployment protection is enabled
Fix: Go to Vercel dashboard → Settings → Deployment Protection → Disable`;
    }

    if (statusCode === "404") {
      return "❌ 404 Not Found - Deployment URL invalid or site not deployed";
    }

    if (statusCode === "200") {
      return "✅ Deployment is live and accessible";
    }

    return `⚠️ Unexpected status code ${statusCode} - check Vercel deployment logs`;
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
