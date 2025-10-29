import * as fs from "fs";
import * as path from "path";
import { ConfigLocator } from "../src/ConfigLocator";
import { MockMCPClientAdapter } from "../src/MCPClientAdapter";
import { MCPClientManager } from "../src/MCPClientManager";
import { TelemetrySink } from "../src/TelemetrySink";
import { WorkspaceContext } from "../src/WorkspaceContext";

// Mock fs for creating temporary config files
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe("MCPClientManager Integration Tests", () => {
  let tempDir: string;
  let configLocator: ConfigLocator;
  let workspaceContext: WorkspaceContext;
  let telemetrySink: TelemetrySink;
  let clientManager: MCPClientManager;
  let clientAdapter: MockMCPClientAdapter;

  const mockConfig = {
    mcpServers: {
      "test-server": {
        command: "node",
        args: ["./test-server.js"],
        timeout: 5000,
      },
      "production-server": {
        command: "python",
        args: ["-m", "production_server"],
        env: { NODE_ENV: "production" },
        timeout: 10000,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup temporary directory and config
    tempDir = "/tmp/mcp-test";
    configLocator = new ConfigLocator(tempDir);
    workspaceContext = new WorkspaceContext({ injectedRoot: tempDir });

    // Setup telemetry sink with spies
    telemetrySink = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      event: jest.fn(),
    };

    // Mock fs to return our test config
    mockedFs.existsSync.mockImplementation((filePath) => {
      return filePath === path.join(tempDir, ".vscode/mcp_config.json");
    });

    mockedFs.readFileSync.mockImplementation((filePath) => {
      if (filePath === path.join(tempDir, ".vscode/mcp_config.json")) {
        return JSON.stringify(mockConfig);
      }
      throw new Error(`File not found: ${filePath}`);
    });

    // Create client adapter and manager
    clientAdapter = new MockMCPClientAdapter();
    clientManager = new MCPClientManager({
      configLocator,
      workspaceContext,
      telemetrySink,
      clientAdapter,
    });
  });

  afterEach(async () => {
    // Clean up any active clients
    try {
      await clientManager.destroyAll();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe("Full Lifecycle Integration", () => {
    it("should initialize, create clients, and dispose properly", async () => {
      // Initialize the manager
      await clientManager.initialize();

      expect(telemetrySink.info).toHaveBeenCalledWith(
        "MCP Client Manager initialized",
        expect.objectContaining({
          configSource: path.join(tempDir, ".vscode/mcp_config.json"),
        })
      );

      // Get clients for both servers
      const testClient = await clientManager.getClient("test-server");
      const prodClient = await clientManager.getClient("production-server");

      expect(testClient.serverName).toBe("test-server");
      expect(testClient.isConnected).toBe(true);
      expect(prodClient.serverName).toBe("production-server");
      expect(prodClient.isConnected).toBe(true);

      // Test client caching - should return same instance
      const cachedClient = await clientManager.getClient("test-server");
      expect(cachedClient).toBe(testClient);
      expect(telemetrySink.info).toHaveBeenCalledWith(
        "Returning cached MCP client for test-server"
      );

      // Test client functionality
      const tools = await testClient.listTools();
      expect(tools).toEqual(["test-server_tool_1", "test-server_tool_2"]);

      const toolResult = await testClient.callTool("test_tool", {
        arg1: "value1",
      });
      expect(toolResult).toMatchObject({
        tool: "test_tool",
        args: { arg1: "value1" },
        result: "Mock result from test-server",
      });

      // Dispose individual client
      await clientManager.dispose(testClient);
      expect(testClient.isConnected).toBe(false);
      expect(telemetrySink.info).toHaveBeenCalledWith("MCP client disposed", {
        serverName: "test-server",
      });

      // Destroy all remaining clients
      await clientManager.destroyAll();
      expect(prodClient.isConnected).toBe(false);
      expect(telemetrySink.info).toHaveBeenCalledWith(
        "All MCP clients destroyed",
        expect.objectContaining({
          disposedCount: 1,
          serverNames: ["production-server"],
        })
      );
    });

    it("should handle retry logic on connection failures", async () => {
      // Mock adapter to fail first connection attempt
      let connectionAttempts = 0;
      const flakyAdapter = {
        createClient: jest
          .fn()
          .mockImplementation(async (serverName, config) => {
            connectionAttempts++;
            if (connectionAttempts === 1) {
              throw new Error("Connection failed");
            }
            return clientAdapter.createClient(serverName, config);
          }),
        dispose: jest.fn(),
      };

      const flakyManager = new MCPClientManager({
        configLocator,
        workspaceContext,
        telemetrySink,
        clientAdapter: flakyAdapter,
        retryOptions: { maxAttempts: 2, baseDelayMs: 10 },
      });

      await flakyManager.initialize();

      // Should succeed on second attempt
      const client = await flakyManager.getClient("test-server");
      expect(client.serverName).toBe("test-server");
      expect(connectionAttempts).toBe(2);

      // Should have logged the retry warning
      expect(telemetrySink.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "Failed to create MCP client for test-server failed (attempt 1/2)"
        ),
        expect.objectContaining({
          error: "Connection failed",
          attempt: 1,
        })
      );

      await flakyManager.destroyAll();
    });

    it("should handle configuration errors gracefully", async () => {
      // Test with missing server config
      await clientManager.initialize();

      await expect(
        clientManager.getClient("nonexistent-server")
      ).rejects.toThrow("MCP server 'nonexistent-server' not found in config");

      // Test uninitialized manager
      const uninitializedManager = new MCPClientManager({
        configLocator,
        workspaceContext,
        telemetrySink,
        clientAdapter,
      });

      await expect(
        uninitializedManager.getClient("test-server")
      ).rejects.toThrow("MCP Client Manager not initialized");
    });

    it("should handle client operation errors gracefully", async () => {
      await clientManager.initialize();
      const client = await clientManager.getClient("test-server");

      // Disconnect the client to simulate errors
      await client.disconnect();

      // Tool operations should fail when disconnected
      await expect(client.listTools()).rejects.toThrow(
        "MCP client for test-server is not connected"
      );

      await expect(client.callTool("test_tool", {})).rejects.toThrow(
        "MCP client for test-server is not connected"
      );
    });
  });

  describe("Stress Testing", () => {
    it("should handle multiple concurrent client requests", async () => {
      await clientManager.initialize();

      // Create multiple concurrent requests for the same server
      const clientPromise1 = clientManager.getClient("test-server");
      const clientPromise2 = clientManager.getClient("test-server");
      const clientPromise3 = clientManager.getClient("production-server");

      const [client1, client2, client3] = await Promise.all([
        clientPromise1,
        clientPromise2,
        clientPromise3,
      ]);

      // First two should be the same cached instance
      expect(client1).toBe(client2);
      expect(client1.serverName).toBe("test-server");
      expect(client3.serverName).toBe("production-server");

      // All should be connected
      expect(client1.isConnected).toBe(true);
      expect(client3.isConnected).toBe(true);

      await clientManager.destroyAll();
    });

    it("should handle rapid create/dispose cycles", async () => {
      await clientManager.initialize();

      for (let i = 0; i < 5; i++) {
        const client = await clientManager.getClient("test-server");
        expect(client.isConnected).toBe(true);

        await clientManager.dispose(client);
        expect(client.isConnected).toBe(false);
      }

      // Final cleanup
      await clientManager.destroyAll();
    });
  });
});
