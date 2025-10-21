import { ConfigLocator } from "../ConfigLocator";
import { MCPClientManager } from "../MCPClientManager";
import { TelemetrySink } from "../TelemetrySink";
import { WorkspaceContext } from "../WorkspaceContext";

// Mock dependencies
const mockConfigLocator = new ConfigLocator("/workspace");

const mockWorkspaceContext = new WorkspaceContext({
  injectedRoot: "/workspace",
});

const mockTelemetrySink = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  event: jest.fn(),
} as jest.Mocked<TelemetrySink>;

describe("MCPClientManager", () => {
  let clientManager: MCPClientManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(mockConfigLocator, "loadConfig");
    // Reset telemetry sink mocks
    mockTelemetrySink.info.mockReset();
    mockTelemetrySink.warn.mockReset();
    mockTelemetrySink.error.mockReset();
    mockTelemetrySink.event.mockReset();
    clientManager = new MCPClientManager({
      configLocator: mockConfigLocator,
      workspaceContext: mockWorkspaceContext,
      telemetrySink: mockTelemetrySink,
    });
  });

  describe("initialize", () => {
    it("should initialize successfully with valid config", async () => {
      const mockConfigResult = {
        config: { mcpServers: { test: {} } },
        source: "/workspace/.vscode/mcp_config.json",
        warnings: [],
      };

      (mockConfigLocator.loadConfig as jest.Mock).mockReturnValue(
        mockConfigResult
      );

      await clientManager.initialize();

      expect(mockConfigLocator.loadConfig).toHaveBeenCalled();
      expect(mockTelemetrySink.info).toHaveBeenCalledWith(
        "MCP Client Manager initialized",
        {
          configSource: mockConfigResult.source,
        }
      );
    });

    it("should handle config warnings", async () => {
      const mockConfigResult = {
        config: { mcpServers: { test: {} } },
        source: "/workspace/config/mcp-config.json",
        warnings: ["Primary config not found"],
      };

      (mockConfigLocator.loadConfig as jest.Mock).mockReturnValue(
        mockConfigResult
      );

      await clientManager.initialize();

      expect(mockTelemetrySink.warn).toHaveBeenCalledWith(
        "Primary config not found"
      );
    });

    it("should throw error on config load failure", async () => {
      const error = new Error("Config load failed");
      (mockConfigLocator.loadConfig as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(clientManager.initialize()).rejects.toThrow(
        "Config load failed"
      );
      expect(mockTelemetrySink.error).toHaveBeenCalledWith(
        "Failed to initialize MCP Client Manager",
        error
      );
    });
  });

  describe("getClient", () => {
    beforeEach(async () => {
      const mockConfigResult = {
        config: { mcpServers: { test: { command: "test" } } },
        source: "/workspace/.vscode/mcp_config.json",
        warnings: [],
      };
      (mockConfigLocator.loadConfig as jest.Mock).mockReturnValue(
        mockConfigResult
      );
      await clientManager.initialize();
    });

    it("should throw error if not initialized", async () => {
      const uninitializedManager = new MCPClientManager({
        configLocator: mockConfigLocator,
        workspaceContext: mockWorkspaceContext,
        telemetrySink: mockTelemetrySink,
      });

      await expect(uninitializedManager.getClient("test")).rejects.toThrow(
        "not initialized"
      );
    });

    it("should return client for valid server", async () => {
      const result = await clientManager.getClient("test");

      expect(result).toEqual({
        serverName: "test",
        config: { command: "test" },
      });
    });

    it("should throw error for unknown server", async () => {
      await expect(clientManager.getClient("unknown")).rejects.toThrow(
        "MCP server 'unknown' not found"
      );
    });
  });

  describe("retry logic", () => {
    it("should retry on failure and succeed", async () => {
      const mockConfigResult = {
        config: { mcpServers: { test: {} } },
        source: "/workspace/.vscode/mcp_config.json",
        warnings: [],
      };
      (mockConfigLocator.loadConfig as jest.Mock).mockReturnValue(
        mockConfigResult
      );
      await clientManager.initialize();

      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error("Temporary failure");
        }
        return Promise.resolve("success");
      });

      const result = await (clientManager as any).withRetry(
        operation,
        "test operation"
      );

      expect(result).toBe("success");
      expect(attempts).toBe(2);
      expect(mockTelemetrySink.warn).toHaveBeenCalledTimes(1);
    });

    it("should fail after max attempts", async () => {
      const mockConfigResult = {
        config: { mcpServers: { test: {} } },
        source: "/workspace/.vscode/mcp_config.json",
        warnings: [],
      };
      (mockConfigLocator.loadConfig as jest.Mock).mockReturnValue(
        mockConfigResult
      );
      await clientManager.initialize();

      const operation = jest
        .fn()
        .mockRejectedValue(new Error("Persistent failure"));

      await expect(
        (clientManager as any).withRetry(operation, "test operation")
      ).rejects.toThrow("Persistent failure");
      expect(operation).toHaveBeenCalledTimes(3); // maxAttempts
      expect(mockTelemetrySink.error).toHaveBeenCalledWith(
        "test operation failed after 3 attempts",
        expect.any(Error)
      );
    });
  });

  describe("dispose and destroyAll", () => {
    it("should dispose client successfully", async () => {
      const mockClient = { serverName: "test" };
      await clientManager.dispose(mockClient);

      expect(mockTelemetrySink.info).toHaveBeenCalledWith(
        "MCP client disposed",
        { serverName: "test" }
      );
    });

    it("should handle dispose errors gracefully", async () => {
      const mockClient = { serverName: "test" };
      // Mock the telemetry sink info call to throw only once
      let called = false;
      mockTelemetrySink.info.mockImplementation(() => {
        if (!called) {
          called = true;
          throw new Error("Dispose failed");
        }
        return undefined;
      });

      await expect(clientManager.dispose(mockClient)).resolves.toBeUndefined();
      expect(mockTelemetrySink.error).toHaveBeenCalledWith(
        "Failed to dispose MCP client",
        expect.any(Error)
      );
    });

    it("should destroy all clients", async () => {
      await clientManager.destroyAll();

      expect(mockTelemetrySink.info).toHaveBeenCalledWith(
        "All MCP clients destroyed"
      );
    });
  });
});
