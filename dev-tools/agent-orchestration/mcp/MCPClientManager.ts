import { ConfigLocator, ConfigResult } from "./ConfigLocator";
import {
  MCPClient,
  MCPClientAdapter,
  MCPServerConfig,
  MockMCPClientAdapter,
} from "./MCPClientAdapter";
import { TelemetrySink } from "./TelemetrySink";
import { WorkspaceContext } from "./WorkspaceContext";

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface MCPClientManagerOptions {
  configLocator: ConfigLocator;
  workspaceContext: WorkspaceContext;
  telemetrySink: TelemetrySink;
  retryOptions?: Partial<RetryOptions>;
  clientAdapter?: MCPClientAdapter;
}

export class MCPClientManager {
  private configResult?: ConfigResult;
  private readonly options: MCPClientManagerOptions;
  private readonly clientAdapter: MCPClientAdapter;
  private readonly activeClients = new Map<string, MCPClient>();
  private readonly pendingConnections = new Map<string, Promise<MCPClient>>();
  private readonly defaultRetryOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitter: true,
  };

  constructor(options: MCPClientManagerOptions) {
    this.options = {
      ...options,
      retryOptions: { ...this.defaultRetryOptions, ...options.retryOptions },
    };
    this.clientAdapter = options.clientAdapter || new MockMCPClientAdapter();
  }

  async initialize(): Promise<void> {
    try {
      this.configResult = this.options.configLocator.loadConfig();

      // Log warnings
      for (const warning of this.configResult.warnings) {
        this.options.telemetrySink.warn(warning);
      }

      this.options.telemetrySink.info("MCP Client Manager initialized", {
        configSource: this.configResult.source,
      });
    } catch (error) {
      this.options.telemetrySink.error(
        "Failed to initialize MCP Client Manager",
        error
      );
      throw error;
    }
  }

  async getClient(serverName: string): Promise<MCPClient> {
    if (!this.configResult) {
      throw new Error(
        "MCP Client Manager not initialized. Call initialize() first."
      );
    }

    // Return cached client if already connected
    const existingClient = this.activeClients.get(serverName);
    if (existingClient && existingClient.isConnected) {
      this.options.telemetrySink.info(
        `Returning cached MCP client for ${serverName}`
      );
      return existingClient;
    }

    // Return pending connection if one is in progress
    const pendingConnection = this.pendingConnections.get(serverName);
    if (pendingConnection) {
      this.options.telemetrySink.info(
        `Waiting for pending MCP client connection for ${serverName}`
      );
      return pendingConnection;
    }

    const serverConfig = this.configResult.config.mcpServers?.[
      serverName
    ] as MCPServerConfig;
    if (!serverConfig) {
      throw new Error(`MCP server '${serverName}' not found in config`);
    }

    // Create a promise for this connection and cache it
    const connectionPromise = this.withRetry(async () => {
      // Create and connect the client
      const client = await this.clientAdapter.createClient(
        serverName,
        serverConfig
      );
      await client.connect();

      // Cache the connected client
      this.activeClients.set(serverName, client);

      this.options.telemetrySink.info(
        `MCP client connected for ${serverName}`,
        {
          serverName,
          isConnected: client.isConnected,
        }
      );

      return client;
    }, `Failed to create MCP client for ${serverName}`);

    // Cache the promise while connection is pending
    this.pendingConnections.set(serverName, connectionPromise);

    try {
      const client = await connectionPromise;
      return client;
    } finally {
      // Clean up the pending promise regardless of success/failure
      this.pendingConnections.delete(serverName);
    }
  }

  async dispose(client: MCPClient): Promise<void> {
    try {
      if (client.isConnected) {
        await client.disconnect();
      }

      // Remove from active clients cache
      this.activeClients.delete(client.serverName);

      this.options.telemetrySink.info("MCP client disposed", {
        serverName: client.serverName,
      });
    } catch (error) {
      this.options.telemetrySink.error("Failed to dispose MCP client", error);
    }
  }

  async destroyAll(): Promise<void> {
    const serverNames = Array.from(this.activeClients.keys());
    const disposePromises = Array.from(this.activeClients.values()).map(
      (client) => this.dispose(client)
    );

    await Promise.allSettled(disposePromises);

    // Dispose the client adapter
    await this.clientAdapter.dispose();

    this.options.telemetrySink.info("All MCP clients destroyed", {
      disposedCount: serverNames.length,
      serverNames,
    });
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> {
    const opts = {
      ...this.options.retryOptions,
      ...customOptions,
    } as RetryOptions;
    let lastError: Error;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.options.telemetrySink.warn(
          `${operationName} failed (attempt ${attempt}/${opts.maxAttempts})`,
          {
            error: error.message,
            attempt,
          }
        );

        if (attempt < opts.maxAttempts) {
          const delay = this.calculateDelay(attempt, opts);
          await this.sleep(delay);
        }
      }
    }

    this.options.telemetrySink.error(
      `${operationName} failed after ${opts.maxAttempts} attempts`,
      lastError
    );
    throw lastError;
  }

  private calculateDelay(attempt: number, opts: RetryOptions): number {
    const exponentialDelay =
      opts.baseDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
    const delay = Math.min(exponentialDelay, opts.maxDelayMs);

    if (opts.jitter) {
      // Add random jitter (±25%)
      const jitterRange = delay * 0.25;
      return delay + (Math.random() * 2 - 1) * jitterRange;
    }

    return delay;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
