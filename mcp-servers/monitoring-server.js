#!/usr/bin/env node

/**
 * ProspectPro Monitoring MCP Server
 * Provides AI access to real-time monitoring, diagnostics, and performance metrics
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const fs = require("fs").promises;
const path = require("path");

class ProspectProMonitoringServer {
  constructor() {
    this.server = new Server(
      {
        name: "prospectpro-monitoring",
        version: "1.0.0",
        description:
          "ProspectPro Monitoring MCP Server - AI access to system diagnostics and performance",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.workspaceRoot = process.env.WORKSPACE_ROOT || process.cwd();
    this.setupHandlers();
  }

  setupHandlers() {
    // Tool definitions
    this.server.setRequestHandler("tools/list", async () => ({
      tools: [
        {
          name: "get_system_health",
          description: "Get comprehensive system health status",
          inputSchema: {
            type: "object",
            properties: {
              includeDetailedMetrics: {
                type: "boolean",
                description: "Include detailed performance metrics",
                default: false,
              },
            },
          },
        },
        {
          name: "read_diagnostics",
          description: "Read and analyze diagnostics.json file",
          inputSchema: {
            type: "object",
            properties: {
              includeHistory: {
                type: "boolean",
                description: "Include historical diagnostic data if available",
                default: true,
              },
            },
          },
        },
        {
          name: "analyze_logs",
          description: "Analyze application logs for patterns and issues",
          inputSchema: {
            type: "object",
            properties: {
              logType: {
                type: "string",
                description: "Type of logs to analyze",
                enum: ["startup", "error", "api", "all"],
                default: "all",
              },
              timeRange: {
                type: "string",
                description: "Time range for log analysis",
                enum: ["1h", "24h", "7d"],
                default: "24h",
              },
            },
          },
        },
        {
          name: "check_docker_status",
          description: "Check Docker container and service status",
          inputSchema: {
            type: "object",
            properties: {
              includeResourceUsage: {
                type: "boolean",
                description: "Include resource usage statistics",
                default: true,
              },
            },
          },
        },
        {
          name: "validate_configuration",
          description: "Validate system configuration and detect issues",
          inputSchema: {
            type: "object",
            properties: {
              strict: {
                type: "boolean",
                description: "Enable strict validation mode",
                default: true,
              },
            },
          },
        },
        {
          name: "generate_performance_report",
          description: "Generate comprehensive performance analysis report",
          inputSchema: {
            type: "object",
            properties: {
              includeRecommendations: {
                type: "boolean",
                description: "Include performance optimization recommendations",
                default: true,
              },
            },
          },
        },
        {
          name: "monitor_api_quotas",
          description: "Monitor API usage quotas and budget limits",
          inputSchema: {
            type: "object",
            properties: {
              alertThreshold: {
                type: "number",
                description: "Alert when usage exceeds this percentage",
                default: 80,
              },
            },
          },
        },
      ],
    }));

    // Tool execution handlers
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_system_health":
            return await this.getSystemHealth(args);
          case "read_diagnostics":
            return await this.readDiagnostics(args);
          case "analyze_logs":
            return await this.analyzeLogs(args);
          case "check_docker_status":
            return await this.checkDockerStatus(args);
          case "validate_configuration":
            return await this.validateConfiguration(args);
          case "generate_performance_report":
            return await this.generatePerformanceReport(args);
          case "monitor_api_quotas":
            return await this.monitorAPIQuotas(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Resource handlers
    this.server.setRequestHandler("resources/list", async () => ({
      resources: [
        {
          uri: "monitoring://system-health",
          name: "System Health Status",
          description: "Real-time system health and performance metrics",
          mimeType: "application/json",
        },
        {
          uri: "monitoring://diagnostics",
          name: "Diagnostics Data",
          description: "System diagnostic information and error reports",
          mimeType: "application/json",
        },
        {
          uri: "monitoring://logs",
          name: "Application Logs",
          description: "Application logs and error tracking",
          mimeType: "text/plain",
        },
      ],
    }));
  }

  async getSystemHealth(args) {
    const { includeDetailedMetrics = false } = args;

    const health = {
      timestamp: new Date().toISOString(),
      status: "unknown",
      components: {},
      metrics: {},
    };

    try {
      // Check basic file system health
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
        const diagnosticsContent = await fs.readFile(diagnosticsPath, "utf8");
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

      // Check VS Code configuration
      const vscodeSettings = await this.checkFile(".vscode/settings.json");
      const vscodeExtensions = await this.checkFile(".vscode/extensions.json");
      const mcpConfig = await this.checkFile(".vscode/mcp-config.json");

      health.components.vscode = {
        status: vscodeSettings.exists ? "configured" : "missing",
        settings: vscodeSettings.exists,
        extensions: vscodeExtensions.exists,
        mcp_config: mcpConfig.exists,
      };

      // Overall health determination
      const criticalComponents = ["filesystem", "vscode"];
      const healthyComponents = criticalComponents.filter(
        (comp) =>
          health.components[comp]?.status === "healthy" ||
          health.components[comp]?.status === "configured"
      );

      if (healthyComponents.length === criticalComponents.length) {
        health.status = "healthy";
      } else if (healthyComponents.length > 0) {
        health.status = "degraded";
      } else {
        health.status = "unhealthy";
      }

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

  async checkFile(relativePath) {
    try {
      const filePath = path.join(this.workspaceRoot, relativePath);
      const stats = await fs.stat(filePath);
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
      memory_estimates: {},
    };

    try {
      // Calculate directory sizes
      const directories = ["modules", "api", "database", "docs", "mcp-servers"];

      for (const dir of directories) {
        try {
          const dirPath = path.join(this.workspaceRoot, dir);
          const size = await this.getDirectorySize(dirPath);
          metrics.disk_usage[dir] = size;
        } catch (error) {
          metrics.disk_usage[dir] = { error: error.message };
        }
      }

      // Count files by type
      const fileExtensions = await this.countFilesByExtension();
      metrics.file_counts = fileExtensions;

      // Estimate memory usage based on file sizes
      const totalSize = Object.values(metrics.disk_usage)
        .filter((item) => typeof item === "number")
        .reduce((sum, size) => sum + size, 0);

      metrics.memory_estimates = {
        total_disk_usage: totalSize,
        estimated_memory_footprint: Math.round(totalSize * 0.1), // Rough estimate
      };
    } catch (error) {
      metrics.error = error.message;
    }

    return metrics;
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

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

  async countFilesByExtension() {
    const counts = {};

    const countInDirectory = async (dirPath) => {
      try {
        const items = await fs.readdir(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = await fs.stat(itemPath);

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

  async readDiagnostics(args) {
    const { includeHistory = true } = args;

    try {
      const diagnosticsPath = path.join(this.workspaceRoot, "diagnostics.json");
      const content = await fs.readFile(diagnosticsPath, "utf8");
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

      if (diagnostics.environment) {
        const missingVars = diagnostics.environment.missing_variables || [];
        if (missingVars.length > 0) {
          analysis.analysis.warnings.push(
            `Missing environment variables: ${missingVars.join(", ")}`
          );
        }
      }

      // Generate recommendations
      if (analysis.analysis.critical_issues.length > 0) {
        analysis.analysis.recommendations.push(
          "Resolve database connection issues immediately"
        );
      }
      if (analysis.analysis.warnings.length > 0) {
        analysis.analysis.recommendations.push(
          "Configure missing environment variables"
        );
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

  async analyzeLogs(args) {
    const { logType = "all", timeRange = "24h" } = args;

    const logFiles = [
      "startup.log",
      "production.log",
      "database-validation.log",
      "server-test.log",
    ];

    const analysis = {
      log_type: logType,
      time_range: timeRange,
      log_files_checked: [],
      patterns_found: {
        errors: [],
        warnings: [],
        info: [],
      },
      summary: {},
    };

    for (const logFile of logFiles) {
      try {
        const logPath = path.join(this.workspaceRoot, logFile);
        const content = await fs.readFile(logPath, "utf8");
        const stats = await fs.stat(logPath);

        analysis.log_files_checked.push({
          file: logFile,
          size: stats.size,
          last_modified: stats.mtime,
          line_count: content.split("\n").length,
        });

        // Pattern matching for different log levels
        const errorPatterns = content.match(/ERROR|Error:|error:/gi) || [];
        const warningPatterns = content.match(/WARN|Warning:|warning:/gi) || [];
        const infoPatterns = content.match(/INFO|info:/gi) || [];

        if (errorPatterns.length > 0) {
          analysis.patterns_found.errors.push({
            file: logFile,
            count: errorPatterns.length,
            recent_errors: this.extractRecentLogEntries(content, "error", 5),
          });
        }

        if (warningPatterns.length > 0) {
          analysis.patterns_found.warnings.push({
            file: logFile,
            count: warningPatterns.length,
            recent_warnings: this.extractRecentLogEntries(
              content,
              "warning",
              3
            ),
          });
        }

        analysis.patterns_found.info.push({
          file: logFile,
          count: infoPatterns.length,
        });
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
      total_warnings: analysis.patterns_found.warnings.reduce(
        (sum, w) => sum + w.count,
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

  extractRecentLogEntries(content, level, limit) {
    const lines = content.split("\n");
    const pattern = new RegExp(level, "i");
    const matches = lines
      .filter((line) => pattern.test(line))
      .slice(-limit)
      .map((line) => line.trim());

    return matches;
  }

  async checkDockerStatus(args) {
    const { includeResourceUsage = true } = args;

    const dockerStatus = {
      docker_available: false,
      containers: [],
      compose_files: [],
      resource_usage: {},
    };

    // Check for Docker Compose files
    const composeFiles = [
      "docker-compose.yml",
      "docker-compose.dev.yml",
      "docker-compose.secrets.yml",
    ];

    for (const file of composeFiles) {
      const fileInfo = await this.checkFile(file);
      dockerStatus.compose_files.push({
        name: file,
        exists: fileInfo.exists,
        size: fileInfo.size,
      });
    }

    // Check Dockerfile
    const dockerfile = await this.checkFile("Dockerfile");
    const dockerfileDev = await this.checkFile("Dockerfile.dev");

    dockerStatus.docker_files = {
      dockerfile: dockerfile.exists,
      dockerfile_dev: dockerfileDev.exists,
    };

    // Note: We can't actually check running containers without docker CLI
    dockerStatus.note =
      "Container status requires Docker CLI access. Use terminal commands to check running containers.";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(dockerStatus, null, 2),
        },
      ],
    };
  }

  async validateConfiguration(args) {
    const { strict = true } = args;

    const validation = {
      validation_mode: strict ? "strict" : "standard",
      results: {},
      issues: [],
      recommendations: [],
    };

    // Check critical files
    const criticalFiles = [
      "package.json",
      "server.js",
      "docker-compose.yml",
      ".vscode/settings.json",
      ".vscode/mcp-config.json",
    ];

    validation.results.critical_files = {};

    for (const file of criticalFiles) {
      const fileInfo = await this.checkFile(file);
      validation.results.critical_files[file] = fileInfo;

      if (!fileInfo.exists) {
        validation.issues.push(`Missing critical file: ${file}`);
      }
    }

    // Check directory structure
    const requiredDirectories = ["api", "modules", "config", "mcp-servers"];
    validation.results.directory_structure = {};

    for (const dir of requiredDirectories) {
      const dirInfo = await this.checkFile(dir);
      validation.results.directory_structure[dir] = dirInfo;

      if (!dirInfo.exists) {
        validation.issues.push(`Missing required directory: ${dir}`);
      }
    }

    // Validate VS Code configuration
    try {
      const settingsPath = path.join(
        this.workspaceRoot,
        ".vscode",
        "settings.json"
      );
      const settingsContent = await fs.readFile(settingsPath, "utf8");
      const settings = JSON.parse(settingsContent);

      validation.results.vscode_config = {
        copilot_enabled: !!settings["github.copilot.enable"],
        mcp_enabled: !!settings["mcp.enable"],
        performance_optimized: !!settings["editor.minimap.enabled"] === false,
      };

      if (!settings["mcp.enable"]) {
        validation.issues.push("MCP is not enabled in VS Code settings");
        validation.recommendations.push(
          "Enable MCP in VS Code settings for AI-powered development"
        );
      }
    } catch (error) {
      validation.issues.push("Could not validate VS Code configuration");
    }

    // Generate recommendations based on issues
    if (validation.issues.length > 0) {
      validation.recommendations.push(
        "Address all configuration issues before proceeding with development"
      );
    } else {
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

  async generatePerformanceReport(args) {
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

    // Analyze performance characteristics
    const totalFiles = Object.values(metrics.file_counts || {}).reduce(
      (sum, count) => sum + count,
      0
    );
    const jsFiles = metrics.file_counts?.[".js"] || 0;
    const jsonFiles = metrics.file_counts?.[".json"] || 0;

    report.analysis = {
      total_files: totalFiles,
      javascript_files: jsFiles,
      configuration_files: jsonFiles,
      code_to_config_ratio:
        jsFiles > 0 ? (jsFiles / (jsonFiles + 1)).toFixed(2) : "N/A",
      estimated_complexity: this.estimateProjectComplexity(metrics, totalFiles),
    };

    if (includeRecommendations) {
      // Performance recommendations based on analysis
      if (totalFiles > 1000) {
        report.recommendations.push(
          "Consider implementing file watching exclusions for better VS Code performance"
        );
      }

      if (report.performance_metrics.total_disk_usage > 100000000) {
        // > 100MB
        report.recommendations.push(
          "Project size is large - consider archiving unused files"
        );
      }

      report.recommendations.push(
        "Enable VS Code performance optimizations as configured"
      );
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

  estimateProjectComplexity(metrics, totalFiles) {
    const jsFiles = metrics.file_counts?.[".js"] || 0;
    const sqlFiles = metrics.file_counts?.[".sql"] || 0;
    const configFiles =
      (metrics.file_counts?.[".json"] || 0) +
      (metrics.file_counts?.[".yml"] || 0);

    let complexity = "simple";

    if (jsFiles > 50 || sqlFiles > 10 || configFiles > 15) {
      complexity = "complex";
    } else if (jsFiles > 20 || sqlFiles > 5 || configFiles > 8) {
      complexity = "moderate";
    }

    return {
      level: complexity,
      factors: {
        javascript_files: jsFiles,
        sql_files: sqlFiles,
        config_files: configFiles,
        total_files: totalFiles,
      },
    };
  }

  async monitorAPIQuotas(args) {
    const { alertThreshold = 80 } = args;

    const quotaMonitoring = {
      alert_threshold: alertThreshold,
      api_services: {},
      alerts: [],
      recommendations: [],
    };

    // Mock API quota data (in real implementation, this would connect to actual APIs)
    const apiServices = [
      {
        name: "Google Places",
        quota: 1000,
        used: 250,
        cost_per_request: 0.032,
      },
      { name: "Foursquare Places", quota: 950, used: 150, cost_per_request: 0 },
      { name: "Hunter.io", quota: 100, used: 45, cost_per_request: 0.04 },
      { name: "NeverBounce", quota: 1000, used: 320, cost_per_request: 0.008 },
    ];

    apiServices.forEach((service) => {
      const usagePercent = (service.used / service.quota) * 100;
      const remainingRequests = service.quota - service.used;
      const estimatedCost = service.used * service.cost_per_request;

      quotaMonitoring.api_services[service.name] = {
        quota_limit: service.quota,
        requests_used: service.used,
        usage_percentage: Math.round(usagePercent),
        remaining_requests: remainingRequests,
        estimated_cost: estimatedCost.toFixed(3),
        status: usagePercent >= alertThreshold ? "alert" : "ok",
      };

      if (usagePercent >= alertThreshold) {
        quotaMonitoring.alerts.push({
          service: service.name,
          usage_percent: Math.round(usagePercent),
          remaining: remainingRequests,
          severity: usagePercent >= 95 ? "critical" : "warning",
        });
      }
    });

    // Generate recommendations
    if (quotaMonitoring.alerts.length > 0) {
      quotaMonitoring.recommendations.push(
        "Monitor API usage closely - approaching quota limits"
      );
      quotaMonitoring.recommendations.push(
        "Consider implementing more aggressive caching strategies"
      );
    }

    const totalCost = Object.values(quotaMonitoring.api_services).reduce(
      (sum, service) => sum + parseFloat(service.estimated_cost),
      0
    );

    quotaMonitoring.budget_summary = {
      total_estimated_cost: totalCost.toFixed(3),
      most_expensive_service: Object.entries(quotaMonitoring.api_services).sort(
        ([, a], [, b]) =>
          parseFloat(b.estimated_cost) - parseFloat(a.estimated_cost)
      )[0]?.[0],
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(quotaMonitoring, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("ProspectPro Monitoring MCP Server running...");
  }
}

// Start the server
if (require.main === module) {
  const server = new ProspectProMonitoringServer();
  server.run().catch((error) => {
    console.error("Failed to start monitoring server:", error);
    process.exit(1);
  });
}

module.exports = ProspectProMonitoringServer;
