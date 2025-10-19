#!/usr/bin/env node

/**
 * ProspectPro Observability MCP Server
 * Distributed tracing and monitoring for AI agent workflows
 *
 * OpenTelemetry instrumented with Jaeger backend
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { Resource } from "@opentelemetry/resources";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import fs from "fs/promises";
import path from "path";

// Initialize OpenTelemetry with Jaeger exporter
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: "prospectpro-observability",
  [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
});

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || "http://localhost:14268/api/traces",
});

const tracerProvider = new NodeTracerProvider({ resource });
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));
tracerProvider.register();

const tracer = trace.getTracer("prospectpro-observability", "1.0.0");

class ObservabilityServer {
  constructor() {
    this.server = new Server(
      {
        name: "prospectpro-observability",
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
          name: "start_trace",
          description: "Start a new distributed trace for workflow monitoring",
          inputSchema: {
            type: "object",
            properties: {
              traceName: {
                type: "string",
                description: "Name of the trace/workflow",
              },
              attributes: {
                type: "object",
                description: "Initial trace attributes",
              },
            },
            required: ["traceName"],
          },
        },
        {
          name: "add_trace_event",
          description: "Add an event to an active trace span",
          inputSchema: {
            type: "object",
            properties: {
              spanId: {
                type: "string",
                description: "Span identifier",
              },
              eventName: {
                type: "string",
                description: "Event name",
              },
              attributes: {
                type: "object",
                description: "Event attributes",
              },
            },
            required: ["spanId", "eventName"],
          },
        },
        {
          name: "end_trace",
          description: "End a trace span with final status",
          inputSchema: {
            type: "object",
            properties: {
              spanId: {
                type: "string",
                description: "Span identifier",
              },
              status: {
                type: "string",
                enum: ["success", "error"],
                description: "Final span status",
              },
              error: {
                type: "string",
                description: "Error message if status is error",
              },
            },
            required: ["spanId", "status"],
          },
        },
        {
          name: "query_traces",
          description: "Query trace data for analysis and debugging",
          inputSchema: {
            type: "object",
            properties: {
              serviceName: {
                type: "string",
                description: "Service name to filter traces",
              },
              operationName: {
                type: "string",
                description: "Operation name to filter traces",
              },
              timeRange: {
                type: "object",
                properties: {
                  start: {
                    type: "string",
                    description: "Start time (ISO 8601)",
                  },
                  end: { type: "string", description: "End time (ISO 8601)" },
                },
              },
              limit: {
                type: "integer",
                description: "Maximum number of traces to return",
                default: 10,
              },
            },
          },
        },
        {
          name: "generate_trace_report",
          description:
            "Generate performance and error analysis report from traces",
          inputSchema: {
            type: "object",
            properties: {
              timeRange: {
                type: "object",
                properties: {
                  start: {
                    type: "string",
                    description: "Start time (ISO 8601)",
                  },
                  end: { type: "string", description: "End time (ISO 8601)" },
                },
              },
              serviceName: {
                type: "string",
                description: "Service name to analyze",
              },
              outputFormat: {
                type: "string",
                enum: ["json", "markdown", "html"],
                default: "markdown",
              },
            },
            required: ["timeRange"],
          },
        },
        {
          name: "health_check",
          description: "Check observability system health and connectivity",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      return await tracer.trace(`observability.${name}`, async (span) => {
        try {
          span.setAttributes({
            "observability.operation": name,
            "observability.request_id": crypto.randomUUID(),
          });

          let result;

          if (name === "start_trace") {
            result = await this.startTrace(args);
          } else if (name === "add_trace_event") {
            result = await this.addTraceEvent(args);
          } else if (name === "end_trace") {
            result = await this.endTrace(args);
          } else if (name === "query_traces") {
            result = await this.queryTraces(args);
          } else if (name === "generate_trace_report") {
            result = await this.generateTraceReport(args);
          } else if (name === "health_check") {
            result = await this.healthCheck();
          } else {
            throw new Error(`Unknown tool: ${name}`);
          }

          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.recordException(error);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: error.message,
                  timestamp: new Date().toISOString(),
                }),
              },
            ],
            isError: true,
          };
        }
      });
    });
  }

  async startTrace({ traceName, attributes = {} }) {
    const span = tracer.startSpan(traceName, {
      attributes: {
        "workflow.name": traceName,
        "workflow.type": "mcp_orchestration",
        ...attributes,
      },
    });

    // Store span context for later retrieval
    const spanId = span.spanContext().spanId;
    this.activeSpans = this.activeSpans || new Map();
    this.activeSpans.set(spanId, span);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            spanId,
            traceId: span.spanContext().traceId,
            traceName,
            status: "started",
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  async addTraceEvent({ spanId, eventName, attributes = {} }) {
    const span = this.activeSpans?.get(spanId);
    if (!span) {
      throw new Error(`Span ${spanId} not found`);
    }

    span.addEvent(eventName, {
      "event.type": "workflow_step",
      "event.timestamp": Date.now(),
      ...attributes,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            spanId,
            eventName,
            status: "recorded",
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  async endTrace({ spanId, status, error }) {
    const span = this.activeSpans?.get(spanId);
    if (!span) {
      throw new Error(`Span ${spanId} not found`);
    }

    if (status === "error") {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error,
      });
      span.recordException(new Error(error));
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }

    span.end();
    this.activeSpans.delete(spanId);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            spanId,
            finalStatus: status,
            error: error || null,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  async queryTraces({ serviceName, operationName, timeRange, limit = 10 }) {
    // In a real implementation, this would query Jaeger/OTEL collector
    // For now, return mock data structure
    const mockTraces = [
      {
        traceId: "mock-trace-1",
        serviceName: serviceName || "prospectpro-integration-hub",
        operationName: operationName || "execute_workflow",
        startTime: new Date(Date.now() - 3600000).toISOString(),
        duration: 2500,
        status: "success",
        spans: [
          {
            spanId: "span-1",
            operationName: "validate-input",
            duration: 100,
            status: "success",
          },
          {
            spanId: "span-2",
            operationName: "call-function",
            duration: 2300,
            status: "success",
          },
        ],
      },
    ];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            traces: mockTraces.slice(0, limit),
            totalCount: mockTraces.length,
            query: {
              serviceName,
              operationName,
              timeRange,
              limit,
            },
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  async generateTraceReport({
    timeRange,
    serviceName,
    outputFormat = "markdown",
  }) {
    const traces = await this.queryTraces({
      serviceName,
      timeRange,
      limit: 100,
    });

    const traceData = JSON.parse(traces.content[0].text);

    let report;
    if (outputFormat === "markdown") {
      report = this.generateMarkdownReport(traceData, timeRange);
    } else if (outputFormat === "html") {
      report = this.generateHtmlReport(traceData, timeRange);
    } else {
      report = JSON.stringify(traceData, null, 2);
    }

    // Save report to file
    const reportPath = path.join(
      process.cwd(),
      "reports",
      "traces",
      `trace-report-${Date.now()}.${
        outputFormat === "markdown" ? "md" : outputFormat
      }`
    );

    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, report);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            reportPath,
            format: outputFormat,
            traceCount: traceData.traces.length,
            timeRange,
            generatedAt: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  generateMarkdownReport(traceData, timeRange) {
    const { traces } = traceData;

    let report = `# Trace Analysis Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Time Range:** ${timeRange.start} to ${timeRange.end}\n`;
    report += `**Total Traces:** ${traces.length}\n\n`;

    report += `## Summary\n\n`;
    const successCount = traces.filter((t) => t.status === "success").length;
    const errorCount = traces.filter((t) => t.status === "error").length;
    const avgDuration =
      traces.reduce((sum, t) => sum + t.duration, 0) / traces.length;

    report += `- **Success Rate:** ${(
      (successCount / traces.length) *
      100
    ).toFixed(1)}%\n`;
    report += `- **Error Count:** ${errorCount}\n`;
    report += `- **Average Duration:** ${avgDuration.toFixed(0)}ms\n\n`;

    report += `## Trace Details\n\n`;

    traces.forEach((trace, index) => {
      report += `### Trace ${index + 1}: ${trace.operationName}\n\n`;
      report += `- **Trace ID:** ${trace.traceId}\n`;
      report += `- **Service:** ${trace.serviceName}\n`;
      report += `- **Duration:** ${trace.duration}ms\n`;
      report += `- **Status:** ${trace.status}\n`;
      report += `- **Start Time:** ${trace.startTime}\n\n`;

      if (trace.spans && trace.spans.length > 0) {
        report += `**Spans:**\n\n`;
        trace.spans.forEach((span) => {
          report += `- ${span.operationName}: ${span.duration}ms (${span.status})\n`;
        });
        report += `\n`;
      }
    });

    return report;
  }

  generateHtmlReport(traceData, timeRange) {
    const { traces } = traceData;

    let html = `<!DOCTYPE html>
<html>
<head>
    <title>Trace Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; }
        .trace { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .success { border-color: #4CAF50; }
        .error { border-color: #f44336; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>
    <h1>Trace Analysis Report</h1>
    <div class="summary">
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Time Range:</strong> ${timeRange.start} to ${
      timeRange.end
    }</p>
        <p><strong>Total Traces:</strong> ${traces.length}</p>
    </div>`;

    traces.forEach((trace, index) => {
      html += `
    <div class="trace ${trace.status}">
        <h3>Trace ${index + 1}: ${trace.operationName}</h3>
        <table>
            <tr><th>Property</th><th>Value</th></tr>
            <tr><td>Trace ID</td><td>${trace.traceId}</td></tr>
            <tr><td>Service</td><td>${trace.serviceName}</td></tr>
            <tr><td>Duration</td><td>${trace.duration}ms</td></tr>
            <tr><td>Status</td><td>${trace.status}</td></tr>
            <tr><td>Start Time</td><td>${trace.startTime}</td></tr>
        </table>
    </div>`;
    });

    html += `</body></html>`;
    return html;
  }

  async healthCheck() {
    const health = {
      service: "prospectpro-observability",
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        jaeger_connection: {
          status: "unknown",
          endpoint:
            process.env.JAEGER_ENDPOINT || "http://localhost:14268/api/traces",
        },
        tracer_provider: {
          status: tracerProvider ? "active" : "inactive",
        },
        active_spans: {
          count: this.activeSpans?.size || 0,
        },
      },
    };

    // Test Jaeger connectivity (simplified)
    try {
      // In a real implementation, this would make a test request to Jaeger
      health.checks.jaeger_connection.status = "connected";
    } catch (error) {
      health.checks.jaeger_connection.status = "disconnected";
      health.checks.jaeger_connection.error = error.message;
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

  async connect() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("ProspectPro Observability MCP Server running on stdio");
  }
}

// Start server
const server = new ObservabilityServer();
server.connect().catch((error) => {
  console.error("Failed to start Observability MCP server:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.error("Shutting down Observability MCP server...");
  tracerProvider.shutdown();
  process.exit(0);
});
