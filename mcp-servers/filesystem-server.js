#!/usr/bin/env node

/**
 * ProspectPro Filesystem MCP Server
 * Provides AI access to codebase analysis and file management
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const fs = require("fs").promises;
const path = require("path");

class ProspectProFilesystemServer {
  constructor() {
    this.server = new Server(
      {
        name: "prospectpro-filesystem",
        version: "1.0.0",
        description:
          "ProspectPro Filesystem MCP Server - AI access to codebase analysis",
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
          name: "analyze_project_structure",
          description: "Analyze the overall project structure and architecture",
          inputSchema: {
            type: "object",
            properties: {
              includeFiles: {
                type: "boolean",
                description: "Include file counts and sizes",
                default: true,
              },
            },
          },
        },
        {
          name: "find_code_patterns",
          description: "Search for specific code patterns across the project",
          inputSchema: {
            type: "object",
            properties: {
              pattern: {
                type: "string",
                description: "Regex pattern or string to search for",
              },
              fileExtensions: {
                type: "array",
                items: { type: "string" },
                description: "File extensions to search in",
                default: [".js", ".json", ".md", ".sql"],
              },
              excludeDirectories: {
                type: "array",
                items: { type: "string" },
                description: "Directories to exclude from search",
                default: ["node_modules", ".git", "archive"],
              },
            },
            required: ["pattern"],
          },
        },
        {
          name: "analyze_api_clients",
          description: "Analyze API client implementations and patterns",
          inputSchema: {
            type: "object",
            properties: {
              detailed: {
                type: "boolean",
                description: "Include detailed method analysis",
                default: false,
              },
            },
          },
        },
        {
          name: "check_fake_data_violations",
          description: "Check for potential fake data generation patterns",
          inputSchema: {
            type: "object",
            properties: {
              strict: {
                type: "boolean",
                description: "Enable strict checking for suspicious patterns",
                default: true,
              },
            },
          },
        },
        {
          name: "analyze_error_handling",
          description: "Analyze error handling patterns across the codebase",
          inputSchema: {
            type: "object",
            properties: {
              includeSuggestions: {
                type: "boolean",
                description: "Include improvement suggestions",
                default: true,
              },
            },
          },
        },
        {
          name: "get_configuration_overview",
          description:
            "Get an overview of all configuration files and settings",
          inputSchema: {
            type: "object",
            properties: {
              includeSecrets: {
                type: "boolean",
                description: "Include information about secret management",
                default: false,
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
          case "analyze_project_structure":
            return await this.analyzeProjectStructure(args);
          case "find_code_patterns":
            return await this.findCodePatterns(args);
          case "analyze_api_clients":
            return await this.analyzeAPIClients(args);
          case "check_fake_data_violations":
            return await this.checkFakeDataViolations(args);
          case "analyze_error_handling":
            return await this.analyzeErrorHandling(args);
          case "get_configuration_overview":
            return await this.getConfigurationOverview(args);
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
          uri: "filesystem://project-structure",
          name: "Project Structure Analysis",
          description: "Complete analysis of project directory structure",
          mimeType: "application/json",
        },
        {
          uri: "filesystem://api-clients",
          name: "API Clients Directory",
          description: "Analysis of API client implementations",
          mimeType: "application/json",
        },
        {
          uri: "filesystem://core-modules",
          name: "Core Modules Directory",
          description: "Analysis of core business logic modules",
          mimeType: "application/json",
        },
      ],
    }));
  }

  async analyzeProjectStructure(args) {
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

  async walkDirectory(dirPath, includeFiles, currentDepth = 0, maxDepth = 4) {
    if (currentDepth > maxDepth) return null;

    const result = {
      name: path.basename(dirPath),
      type: "directory",
      children: [],
    };

    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        if (item.startsWith(".") && !item.includes("vscode")) continue;
        if (["node_modules", "archive"].includes(item)) continue;

        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

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
      largest_files: [],
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

        if (node.size > 10000) {
          // Files larger than 10KB
          analysis.largest_files.push({
            name: node.name,
            size: node.size,
            extension: ext,
          });
        }
      }
    };

    analyzeNode(structure);

    // Sort largest files by size
    analysis.largest_files.sort((a, b) => b.size - a.size);
    analysis.largest_files = analysis.largest_files.slice(0, 10);

    return analysis;
  }

  async findCodePatterns(args) {
    const {
      pattern,
      fileExtensions = [".js", ".json", ".md", ".sql"],
      excludeDirectories = ["node_modules", ".git", "archive"],
    } = args;

    const results = [];
    const regex = new RegExp(pattern, "gi");

    const searchInDirectory = async (dirPath) => {
      try {
        const items = await fs.readdir(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = await fs.stat(itemPath);

          if (stats.isDirectory()) {
            if (!excludeDirectories.includes(item) && !item.startsWith(".")) {
              await searchInDirectory(itemPath);
            }
          } else if (fileExtensions.includes(path.extname(item))) {
            try {
              const content = await fs.readFile(itemPath, "utf8");
              const matches = [...content.matchAll(regex)];

              if (matches.length > 0) {
                const lines = content.split("\n");
                const matchDetails = matches.map((match) => {
                  const lineIndex =
                    content.substring(0, match.index).split("\n").length - 1;
                  return {
                    match: match[0],
                    line_number: lineIndex + 1,
                    line_content: lines[lineIndex]?.trim(),
                  };
                });

                results.push({
                  file: path.relative(this.workspaceRoot, itemPath),
                  matches: matchDetails.length,
                  details: matchDetails,
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
              search_config: { fileExtensions, excludeDirectories },
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

  async analyzeAPIClients(args) {
    const { detailed = false } = args;
    const apiClientsPath = path.join(
      this.workspaceRoot,
      "modules",
      "api-clients"
    );

    try {
      const files = await fs.readdir(apiClientsPath);
      const analysis = { clients: [], summary: {} };

      for (const file of files) {
        if (path.extname(file) === ".js") {
          const filePath = path.join(apiClientsPath, file);
          const content = await fs.readFile(filePath, "utf8");

          const clientAnalysis = {
            name: file,
            size: content.length,
            class_count: (content.match(/class\s+\w+/g) || []).length,
            method_count: (content.match(/async\s+\w+\(|^\s*\w+\s*\(/gm) || [])
              .length,
            error_handling: (content.match(/try\s*{|catch\s*\(/g) || []).length,
            caching_implemented:
              content.includes("cache") || content.includes("Cache"),
            usage_tracking:
              content.includes("usageStats") || content.includes("usage"),
            api_key_required:
              content.includes("apiKey") || content.includes("API_KEY"),
          };

          if (detailed) {
            clientAnalysis.methods = this.extractMethods(content);
            clientAnalysis.dependencies = this.extractDependencies(content);
          }

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
        clients_with_usage_tracking: analysis.clients.filter(
          (c) => c.usage_tracking
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

  async checkFakeDataViolations(args) {
    const { strict = true } = args;

    const suspiciousPatterns = [
      // Fake business names
      /["']Artisan\s+Bistro["']/gi,
      /["']Downtown\s+Café?["']/gi,
      /["']Business\s+LLC["']/gi,
      /["']Company\s+Inc\.?["']/gi,

      // Sequential addresses
      /["']\d+\s+Main\s+St["']/gi,
      /["']\d+\s+First\s+Ave["']/gi,

      // Fake phone numbers
      /\(555\)\s*\d{3}-\d{4}/gi,
      /\(000\)\s*\d{3}-\d{4}/gi,

      // Example domains
      /["']https?:\/\/example\.com["']/gi,
      /["']https?:\/\/business\.com["']/gi,

      // Fake data generation functions
      /generateFake\w*/gi,
      /createFake\w*/gi,
      /mockData/gi,
    ];

    if (strict) {
      suspiciousPatterns.push(
        /const\s+\w*businesses\w*\s*=\s*\[/gi, // Hardcoded business arrays
        /const\s+\w*leads\w*\s*=\s*\[/gi, // Hardcoded lead arrays
        /return\s*\[.*".*business.*".*\]/gi // Return hardcoded business data
      );
    }

    const violations = [];

    for (const pattern of suspiciousPatterns) {
      const patternResults = await this.findCodePatterns({
        pattern: pattern.source,
        fileExtensions: [".js", ".json"],
        excludeDirectories: ["node_modules", ".git", "archive", "tests"],
      });

      if (patternResults.content[0].text) {
        const data = JSON.parse(patternResults.content[0].text);
        if (data.results.length > 0) {
          violations.push({
            pattern: pattern.source,
            severity: strict ? "HIGH" : "MEDIUM",
            matches: data.results,
          });
        }
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

  async analyzeErrorHandling(args) {
    const { includeSuggestions = true } = args;

    const errorPatterns = await this.findCodePatterns({
      pattern: "try\\s*{|catch\\s*\\(|throw\\s+new|console\\.error",
      fileExtensions: [".js"],
      excludeDirectories: ["node_modules", ".git", "archive"],
    });

    const analysisData = JSON.parse(errorPatterns.content[0].text);

    const analysis = {
      error_handling_coverage: {
        files_with_error_handling: analysisData.results.length,
        total_error_patterns: analysisData.total_matches,
        files_by_error_density: analysisData.results
          .map((r) => ({
            file: r.file,
            error_patterns: r.matches,
            density: r.matches, // Could calculate per line
          }))
          .sort((a, b) => b.error_patterns - a.error_patterns),
      },
    };

    if (includeSuggestions) {
      analysis.suggestions = [
        "Ensure all async operations have try-catch blocks",
        "Use structured error responses in API endpoints",
        "Implement global error handlers for unhandled exceptions",
        "Add error logging with appropriate severity levels",
        "Consider implementing circuit breakers for external API calls",
      ];
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  async getConfigurationOverview(args) {
    const { includeSecrets = false } = args;

    const configFiles = [
      "package.json",
      "docker-compose.yml",
      "docker-compose.dev.yml",
      "Dockerfile",
      ".vscode/settings.json",
      ".vscode/launch.json",
      ".vscode/mcp-config.json",
    ];

    const overview = { configurations: [], summary: {} };

    for (const configFile of configFiles) {
      try {
        const filePath = path.join(this.workspaceRoot, configFile);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, "utf8");

        const config = {
          file: configFile,
          size: stats.size,
          last_modified: stats.mtime,
          type: path.extname(configFile) || "config",
        };

        if (includeSecrets) {
          config.potential_secrets = this.findPotentialSecrets(content);
        }

        // Basic content analysis
        if (configFile.endsWith(".json")) {
          try {
            const parsed = JSON.parse(content);
            config.json_keys = Object.keys(parsed).length;
          } catch (e) {
            config.parse_error = e.message;
          }
        }

        overview.configurations.push(config);
      } catch (error) {
        overview.configurations.push({
          file: configFile,
          error: `File not found or inaccessible: ${error.message}`,
        });
      }
    }

    overview.summary = {
      total_config_files: overview.configurations.filter((c) => !c.error)
        .length,
      missing_files: overview.configurations.filter((c) => c.error).length,
      total_size: overview.configurations
        .filter((c) => c.size)
        .reduce((sum, c) => sum + c.size, 0),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(overview, null, 2),
        },
      ],
    };
  }

  extractMethods(content) {
    const methods = [];
    const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g;
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      methods.push({
        name: match[1],
        is_async: match[0].includes("async"),
      });
    }

    return methods;
  }

  extractDependencies(content) {
    const deps = [];
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    let match;

    while ((match = requireRegex.exec(content)) !== null) {
      deps.push(match[1]);
    }

    return [...new Set(deps)];
  }

  findPotentialSecrets(content) {
    const secretPatterns = [
      /\bAPI_KEY\b/gi,
      /\bSECRET\b/gi,
      /\bTOKEN\b/gi,
      /\bPASSWORD\b/gi,
      /\b[A-Z0-9]{32,}\b/g, // Long strings that might be keys
    ];

    const findings = [];
    secretPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern) || [];
      if (matches.length > 0) {
        findings.push({
          pattern_type: [
            "api_key",
            "secret",
            "token",
            "password",
            "long_string",
          ][index],
          count: matches.length,
        });
      }
    });

    return findings;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("ProspectPro Filesystem MCP Server running...");
  }
}

// Start the server
if (require.main === module) {
  const server = new ProspectProFilesystemServer();
  server.run().catch((error) => {
    console.error("Failed to start filesystem server:", error);
    process.exit(1);
  });
}

module.exports = ProspectProFilesystemServer;
