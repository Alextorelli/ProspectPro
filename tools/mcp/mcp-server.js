/**
 * ProspectPro MCP Server
 *
 * Model Context Protocol server for running tests and validating Foursquare Places API integration.
 * Provides tools for test execution and live API verification.
 *
 * Usage:
 *   node tools/mcp/mcp-server.js
 *
 * MCP Client Configuration:
 *   {
 *     "mcpServers": {
 *       "prospectpro": {
 *         "command": "node",
 *         "args": ["tools/mcp/mcp-server.js"],
 *         "env": { "NODE_ENV": "development" }
 *       }
 *     }
 *   }
 */

require("dotenv").config();

const {
  McpServer,
} = require("../../node_modules/@modelcontextprotocol/sdk/dist/cjs/server/mcp.js");
const {
  StdioServerTransport,
} = require("../../node_modules/@modelcontextprotocol/sdk/dist/cjs/server/stdio.js");
const { z } = require("zod");
const { exec } = require("child_process");
const fetch = global.fetch;

const server = new McpServer(
  { name: "prospectpro-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

/**
 * Utility: Obfuscate sensitive strings for logging
 */
function obfuscate(str = "") {
  if (!str || str.length < 8) return "***";
  return str.slice(0, 4) + "…" + str.slice(-4);
}

/**
 * Utility: Execute shell commands with proper error handling
 */
async function runCmd(cmd, options = {}) {
  return new Promise((resolve, reject) => {
    const child = exec(
      cmd,
      {
        env: process.env,
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd(),
        ...options,
      },
      (err, stdout, stderr) => {
        if (err) {
          err.stdout = stdout;
          err.stderr = stderr;
          return reject(err);
        }
        resolve({ stdout, stderr });
      }
    );
  });
}

/**
 * Tool: Run project test suite
 */
server.tool(
  "run_tests",
  {
    description:
      "Execute the ProspectPro test suite (npm test or custom script).",
    inputSchema: z.object({
      script: z
        .string()
        .optional()
        .default("test")
        .describe('npm script to run (default: "test")'),
      timeoutMs: z
        .number()
        .optional()
        .default(600000)
        .describe("Maximum execution time in milliseconds"),
    }),
  },
  async ({ script = "test", timeoutMs }) => {
    try {
      const { stdout, stderr } = await runCmd(`npm run -s ${script}`, {
        timeout: timeoutMs,
      });
      const output = stdout || stderr || "Test execution completed";

      return {
        content: [
          {
            type: "text",
            text: `✅ Test Results for "${script}":\n\n${output}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Test Failed for "${script}":\n\nExit Code: ${error.code}\nStdout: ${error.stdout}\nStderr: ${error.stderr}`,
          },
        ],
      };
    }
  }
);

/**
 * Tool: Foursquare Places API search
 */
server.tool(
  "foursquare_search",
  {
    description:
      "Search for places using the Foursquare Places API with Service Key authentication.",
    inputSchema: z.object({
      query: z
        .string()
        .describe('Search term (e.g., "coffee", "restaurant", "Starbucks")'),
      ll: z
        .string()
        .describe('Latitude,longitude coordinates (e.g., "37.7749,-122.4194")'),
      radius: z
        .number()
        .optional()
        .default(5000)
        .describe("Search radius in meters (max 100000)"),
      limit: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of results (max 50)"),
      sort: z
        .string()
        .optional()
        .describe('Sort order: "RELEVANCE" or "DISTANCE"'),
      categories: z
        .string()
        .optional()
        .describe("Comma-separated category IDs to filter by"),
    }),
  },
  async ({ query, ll, radius = 5000, limit = 5, sort, categories }) => {
    const serviceKey = process.env.FOURSQUARE_SERVICE_API_KEY || "";
    const fallbackKey = process.env.FOURSQUARE_PLACES_API_KEY || "";
    const version = process.env.FOURSQUARE_PLACES_API_VERSION || "2025-06-17";

    const token = serviceKey || fallbackKey;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "❌ Missing Foursquare API key. Set FOURSQUARE_SERVICE_API_KEY (preferred) or FOURSQUARE_PLACES_API_KEY in your environment.",
          },
        ],
      };
    }

    try {
      // Build search parameters
      const params = new URLSearchParams({
        query: query.trim(),
        ll: ll.trim(),
        radius: String(Math.min(radius, 100000)),
        limit: String(Math.min(limit, 50)),
      });

      if (sort) params.set("sort", sort.toUpperCase());
      if (categories) params.set("categories", categories);

      const url = `https://places-api.foursquare.com/places/search?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Places-Api-Version": version,
          Accept: "application/json",
          "User-Agent": "ProspectPro-MCP/1.0",
        },
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Foursquare search failed:\n\nStatus: ${
                response.status
              } ${response.statusText}\nURL: ${url}\nKey: ${obfuscate(
                token
              )}\nResponse: ${JSON.stringify(body, null, 2)}`,
            },
          ],
        };
      }

      // Normalize and format results
      const results = Array.isArray(body.results) ? body.results : [];
      const formatted = results.map((place) => ({
        id: place.fsq_place_id || place.fsq_id,
        name: place.name,
        address:
          place.location?.formatted_address || place.location?.address || null,
        latitude: place.latitude ?? place.geocodes?.main?.latitude ?? null,
        longitude: place.longitude ?? place.geocodes?.main?.longitude ?? null,
        categories: (place.categories || []).map((cat) => cat.name),
        phone: place.tel || place.phone || null,
        website: place.website || place.link || null,
        distance: place.distance || null,
      }));

      return {
        content: [
          {
            type: "text",
            text: `✅ Foursquare Search Results (${
              formatted.length
            } found):\n\n${JSON.stringify(
              {
                query,
                location: ll,
                count: formatted.length,
                results: formatted,
              },
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
            text: `❌ Foursquare search error:\n\n${
              error.message
            }\n\nKey: ${obfuscate(token)}\nVersion: ${version}`,
          },
        ],
      };
    }
  }
);

/**
 * Tool: Get detailed place information by Foursquare ID
 */
server.tool(
  "foursquare_details",
  {
    description:
      "Retrieve detailed information for a specific place using its Foursquare ID.",
    inputSchema: z.object({
      id: z.string().describe("Foursquare place ID (fsq_place_id)"),
    }),
  },
  async ({ id }) => {
    const token =
      process.env.FOURSQUARE_SERVICE_API_KEY ||
      process.env.FOURSQUARE_PLACES_API_KEY ||
      "";
    const version = process.env.FOURSQUARE_PLACES_API_VERSION || "2025-06-17";

    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "❌ Missing Foursquare API key. Configure FOURSQUARE_SERVICE_API_KEY or FOURSQUARE_PLACES_API_KEY.",
          },
        ],
      };
    }

    try {
      const url = `https://places-api.foursquare.com/places/${encodeURIComponent(
        id
      )}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Places-Api-Version": version,
          Accept: "application/json",
          "User-Agent": "ProspectPro-MCP/1.0",
        },
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Place details failed:\n\nStatus: ${response.status} ${
                response.statusText
              }\nURL: ${url}\nKey: ${obfuscate(
                token
              )}\nResponse: ${JSON.stringify(body, null, 2)}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ Place Details:\n\n${JSON.stringify(body, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Place details error:\n\n${
              error.message
            }\n\nID: ${id}\nKey: ${obfuscate(token)}`,
          },
        ],
      };
    }
  }
);

/**
 * Tool: Run Foursquare integration test
 */
server.tool(
  "test_foursquare_integration",
  {
    description:
      "Execute the Foursquare integration test to validate API connectivity and response format.",
    inputSchema: z.object({
      timeoutMs: z
        .number()
        .optional()
        .default(30000)
        .describe("Test timeout in milliseconds"),
    }),
  },
  async ({ timeoutMs }) => {
    try {
      const { stdout, stderr } = await runCmd(
        "node test/test-foursquare-integration.js",
        { timeout: timeoutMs }
      );
      const output = stdout || stderr;

      return {
        content: [
          {
            type: "text",
            text: `✅ Foursquare Integration Test Results:\n\n${output}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Foursquare Integration Test Failed:\n\nExit Code: ${
              error.code
            }\nOutput: ${error.stdout || error.stderr || error.message}`,
          },
        ],
      };
    }
  }
);

/**
 * Tool: Health check the running ProspectPro server
 */
server.tool(
  "health_check",
  {
    description: "Check the health status of the running ProspectPro server.",
    inputSchema: z.object({
      endpoint: z
        .string()
        .optional()
        .default("/health")
        .describe("Health endpoint to check (/health, /ready, /live)"),
      host: z
        .string()
        .optional()
        .default("localhost:3000")
        .describe("Server host and port"),
    }),
  },
  async ({ endpoint = "/health", host = "localhost:3000" }) => {
    try {
      const url = `http://${host}${endpoint}`;
      const response = await fetch(url, { timeout: 5000 });
      const body = await response.json().catch(() => ({}));

      return {
        content: [
          {
            type: "text",
            text: `✅ Health Check (${endpoint}):\n\nStatus: ${
              response.status
            }\nResponse: ${JSON.stringify(body, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Health Check Failed:\n\nEndpoint: ${endpoint}\nError: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Start the MCP server
(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ProspectPro MCP Server started successfully");
})().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
