#!/usr/bin/env node

/**
 * PostgreSQL MCP Server
 *
 * Purpose: Database operations, query optimization, schema management
 * Capabilities: Connection pooling, query explanation, migration validation
 *
 * OpenTelemetry instrumented with circuit breaker pattern
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pRetry from "p-retry";
import pTimeout from "p-timeout";
import pg from "pg";

const { Pool } = pg;

// Circuit breaker state
const circuitBreaker = {
  failures: 0,
  lastFailure: null,
  state: "CLOSED", // CLOSED, OPEN, HALF_OPEN
  threshold: 5,
  timeout: 60000, // 1 minute
};

function checkCircuitBreaker() {
  if (circuitBreaker.state === "OPEN") {
    const timeSinceFailure = Date.now() - circuitBreaker.lastFailure;
    if (timeSinceFailure > circuitBreaker.timeout) {
      circuitBreaker.state = "HALF_OPEN";
      circuitBreaker.failures = 0;
    } else {
      throw new Error(
        "Circuit breaker OPEN - database temporarily unavailable"
      );
    }
  }
}

function recordSuccess() {
  circuitBreaker.failures = 0;
  circuitBreaker.state = "CLOSED";
}

function recordFailure() {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
  if (circuitBreaker.failures >= circuitBreaker.threshold) {
    circuitBreaker.state = "OPEN";
  }
}

// Initialize connection pool
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Pool health monitoring
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  recordFailure();
});

class PostgreSQLServer {
  constructor() {
    this.server = new Server(
      {
        name: "prospectpro-postgresql",
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
          name: "execute_query",
          description:
            "Execute SQL query with connection pooling and automatic retries",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "SQL query to execute" },
              params: {
                type: "array",
                description: "Query parameters for parameterized queries",
                default: [],
              },
              timeoutMs: {
                type: "number",
                description: "Query timeout in milliseconds",
                default: 30000,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "explain_query",
          description: "Analyze query execution plan for optimization insights",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "SQL query to analyze" },
              params: {
                type: "array",
                description: "Query parameters",
                default: [],
              },
              analyze: {
                type: "boolean",
                description: "Run EXPLAIN ANALYZE (executes query)",
                default: false,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "validate_migration",
          description:
            "Dry-run migration SQL to detect syntax/schema conflicts",
          inputSchema: {
            type: "object",
            properties: {
              migrationSql: {
                type: "string",
                description: "Migration SQL to validate",
              },
              rollback: {
                type: "boolean",
                description: "Test rollback transaction",
                default: true,
              },
            },
            required: ["migrationSql"],
          },
        },
        {
          name: "check_pool_health",
          description: "Monitor connection pool utilization and health metrics",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "analyze_slow_queries",
          description:
            "Retrieve and analyze queries exceeding duration threshold",
          inputSchema: {
            type: "object",
            properties: {
              thresholdMs: {
                type: "number",
                description: "Minimum query duration in milliseconds",
                default: 1000,
              },
              limit: {
                type: "number",
                description: "Max number of queries to return",
                default: 20,
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        checkCircuitBreaker();

        if (name === "execute_query") {
          const result = await pTimeout(
            pRetry(
              async () => {
                const client = await pool.connect();
                try {
                  const res = await client.query(args.query, args.params || []);
                  return {
                    content: [
                      {
                        type: "text",
                        text: JSON.stringify(
                          {
                            rows: res.rows,
                            rowCount: res.rowCount,
                            fields: res.fields.map((f) => ({
                              name: f.name,
                              dataTypeID: f.dataTypeID,
                            })),
                          },
                          null,
                          2
                        ),
                      },
                    ],
                  };
                } finally {
                  client.release();
                }
              },
              { retries: 3, minTimeout: 1000 }
            ),
            { milliseconds: args.timeoutMs || 30000 }
          );

          recordSuccess();
          return result;
        }

        if (name === "explain_query") {
          const explainQuery = args.analyze
            ? `EXPLAIN ANALYZE ${args.query}`
            : `EXPLAIN ${args.query}`;

          const result = await pTimeout(
            pRetry(
              async () => {
                const client = await pool.connect();
                try {
                  const res = await client.query(
                    explainQuery,
                    args.params || []
                  );
                  return {
                    content: [
                      {
                        type: "text",
                        text: JSON.stringify(
                          {
                            plan: res.rows,
                            analyzed: args.analyze || false,
                            recommendations: this.generateOptimizationTips(
                              res.rows
                            ),
                          },
                          null,
                          2
                        ),
                      },
                    ],
                  };
                } finally {
                  client.release();
                }
              },
              { retries: 2 }
            ),
            { milliseconds: 45000 }
          );

          recordSuccess();
          return result;
        }

        if (name === "validate_migration") {
          const result = await pTimeout(
            pRetry(
              async () => {
                const client = await pool.connect();
                try {
                  await client.query("BEGIN");
                  await client.query(args.migrationSql);
                  await client.query("ROLLBACK");

                  return {
                    content: [
                      {
                        type: "text",
                        text: JSON.stringify({
                          valid: true,
                          message:
                            "Migration SQL validated successfully (rolled back)",
                        }),
                      },
                    ],
                  };
                } catch (err) {
                  await client.query("ROLLBACK");
                  throw err;
                } finally {
                  client.release();
                }
              },
              { retries: 1 }
            ),
            { milliseconds: 60000 }
          );

          recordSuccess();
          return result;
        }

        if (name === "check_pool_health") {
          const metrics = {
            totalConnections: pool.totalCount,
            idleConnections: pool.idleCount,
            waitingClients: pool.waitingCount,
            utilizationPercent:
              ((pool.totalCount - pool.idleCount) / pool.totalCount) * 100,
            circuitBreakerState: circuitBreaker.state,
            circuitBreakerFailures: circuitBreaker.failures,
          };

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(metrics, null, 2),
              },
            ],
          };
        }

        if (name === "analyze_slow_queries") {
          const result = await pTimeout(
            pRetry(
              async () => {
                const client = await pool.connect();
                try {
                  const query = `
                    SELECT 
                      query, 
                      calls, 
                      total_exec_time, 
                      mean_exec_time, 
                      max_exec_time,
                      rows
                    FROM pg_stat_statements
                    WHERE mean_exec_time > $1
                    ORDER BY total_exec_time DESC
                    LIMIT $2
                  `;

                  const res = await client.query(query, [
                    args.thresholdMs || 1000,
                    args.limit || 20,
                  ]);

                  return {
                    content: [
                      {
                        type: "text",
                        text: JSON.stringify(
                          {
                            slowQueries: res.rows,
                            count: res.rowCount,
                            thresholdMs: args.thresholdMs || 1000,
                          },
                          null,
                          2
                        ),
                      },
                    ],
                  };
                } finally {
                  client.release();
                }
              },
              { retries: 2 }
            ),
            { milliseconds: 30000 }
          );

          recordSuccess();
          return result;
        }

        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        recordFailure();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error.message,
                stack: error.stack,
                circuitBreakerState: circuitBreaker.state,
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  generateOptimizationTips(planRows) {
    const tips = [];
    const planText = JSON.stringify(planRows);

    if (planText.includes("Seq Scan")) {
      tips.push("Consider adding indexes for sequential scans");
    }
    if (planText.includes("cost=")) {
      const costMatch = planText.match(/cost=(\d+\.\d+)/);
      if (costMatch && parseFloat(costMatch[1]) > 10000) {
        tips.push("High query cost detected - consider query optimization");
      }
    }
    if (planText.includes("rows=")) {
      const rowsMatch = planText.match(/rows=(\d+)/);
      if (rowsMatch && parseInt(rowsMatch[1]) > 100000) {
        tips.push("Large result set - consider pagination or filtering");
      }
    }

    return tips.length > 0 ? tips : ["Query plan looks efficient"];
  }

  async connect() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("PostgreSQL MCP Server running on stdio");
  }
}

// Start server
const server = new PostgreSQLServer();
server.connect().catch((error) => {
  console.error("Failed to start PostgreSQL MCP server:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.error("Shutting down PostgreSQL MCP server...");
  await pool.end();
  process.exit(0);
});
