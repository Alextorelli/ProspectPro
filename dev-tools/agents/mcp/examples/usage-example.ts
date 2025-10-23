import {
  ConfigLocator,
  MCPClientManager,
  MockMCPClientAdapter,
  NoOpTelemetrySink,
  WorkspaceContext,
} from "../index";

/**
 * Simple usage example and manual test harness for the MCP Service Layer
 */
async function basicUsageExample() {
  console.log("🚀 MCP Service Layer - Basic Usage Example\n");

  // 1. Setup components with dependency injection
  const workspaceContext = new WorkspaceContext({
    injectedRoot: "/workspace",
  });

  const configLocator = new ConfigLocator(
    workspaceContext.getWorkspaceRoot(),
    ".vscode/mcp_config.json",
    "config/mcp-config.json"
  );

  const telemetrySink = new NoOpTelemetrySink();
  const clientAdapter = new MockMCPClientAdapter();

  // 2. Create and initialize the manager
  const manager = new MCPClientManager({
    configLocator,
    workspaceContext,
    telemetrySink,
    clientAdapter,
    retryOptions: {
      maxAttempts: 3,
      baseDelayMs: 1000,
    },
  });

  try {
    console.log("📋 Initializing MCP Client Manager...");

    // Mock a config file for this example
    import fs from "fs";
    const mockFs = fs;
    jest.spyOn(mockFs, "existsSync").mockReturnValue(true);
    jest.spyOn(mockFs, "readFileSync").mockReturnValue(
      JSON.stringify({
        mcpServers: {
          development: {
            command: "node",
            args: ["./dev-server.js"],
            timeout: 5000,
          },
          production: {
            command: "python",
            args: ["-m", "prod_server"],
            env: { NODE_ENV: "production" },
            timeout: 10000,
          },
        },
      })
    );

    await manager.initialize();
    console.log("✅ Manager initialized successfully\n");

    // 3. Get and use MCP clients
    console.log("🔌 Connecting to development server...");
    const devClient = await manager.getClient("development");
    console.log(
      `✅ Connected to ${devClient.serverName} (Connected: ${devClient.isConnected})\n`
    );

    // 4. Use client functionality
    console.log("🛠️  Listing available tools...");
    const tools = await devClient.listTools();
    console.log(`Available tools: ${tools.join(", ")}\n`);

    console.log("⚡ Calling a tool...");
    const result = await devClient.callTool("example_tool", {
      action: "test",
      params: { value: 42 },
    });
    console.log("Tool result:", JSON.stringify(result, null, 2), "\n");

    // 5. Get another client (should use caching)
    console.log("🔄 Getting cached client...");
    const cachedClient = await manager.getClient("development");
    console.log(`Same instance: ${cachedClient === devClient}\n`);

    // 6. Connect to production server
    console.log("🏭 Connecting to production server...");
    const prodClient = await manager.getClient("production");
    console.log(
      `✅ Connected to ${prodClient.serverName} (Connected: ${prodClient.isConnected})\n`
    );

    // 7. Cleanup individual client
    console.log("🧹 Disposing development client...");
    await manager.dispose(devClient);
    console.log(`Development client connected: ${devClient.isConnected}\n`);

    // 8. Cleanup all remaining clients
    console.log("🧹 Destroying all clients...");
    await manager.destroyAll();
    console.log(`Production client connected: ${prodClient.isConnected}\n`);

    console.log("🎉 Example completed successfully!");
  } catch (error) {
    console.error("❌ Error during example:", error);
  }
}

/**
 * Error handling and retry example
 */
async function errorHandlingExample() {
  console.log("\n🚨 MCP Service Layer - Error Handling Example\n");

  const manager = new MCPClientManager({
    configLocator: new ConfigLocator("/nonexistent"),
    workspaceContext: new WorkspaceContext({ injectedRoot: "/nonexistent" }),
    telemetrySink: new NoOpTelemetrySink(),
  });

  try {
    // This should fail - no config file exists
    console.log("📋 Attempting to initialize with missing config...");
    await manager.initialize();
  } catch (error) {
    console.log("✅ Expected error caught:", error.message);
    console.log("   This demonstrates graceful config error handling\n");
  }

  // Test uninitialized client access
  try {
    console.log("🔌 Attempting to get client without initialization...");
    await manager.getClient("test-server");
  } catch (error) {
    console.log("✅ Expected error caught:", error.message);
    console.log("   This demonstrates lifecycle validation\n");
  }

  console.log("🎉 Error handling example completed!");
}

// Main execution
async function main() {
  try {
    await basicUsageExample();
    await errorHandlingExample();
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  }
}

// Export for testing or direct execution
export { basicUsageExample, errorHandlingExample };

// Run if called directly
if (require.main === module) {
  main();
}
