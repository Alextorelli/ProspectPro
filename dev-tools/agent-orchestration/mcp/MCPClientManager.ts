import { ConfigLocator, ConfigResult } from "./ConfigLocator";
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
}

export class MCPClientManager {
  private configResult?: ConfigResult;
  private readonly options: MCPClientManagerOptions;
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

  async getClient(serverName: string): Promise<any> {
    if (!this.configResult) {
      throw new Error(
        "MCP Client Manager not initialized. Call initialize() first."
      );
    }

    const serverConfig = this.configResult.config.mcpServers?.[serverName];
    if (!serverConfig) {
      throw new Error(`MCP server '${serverName}' not found in config`);
    }

    return this.withRetry(async () => {
      // Placeholder: Implement actual MCP client creation
      // This would use the MCP SDK to create a client based on serverConfig
      return { serverName, config: serverConfig };
    }, `Failed to create MCP client for ${serverName}`);
  }

  async dispose(client: any): Promise<void> {
    try {
      // Placeholder: Implement actual client disposal
      this.options.telemetrySink.info("MCP client disposed", {
        serverName: client.serverName,
      });
    } catch (error) {
      this.options.telemetrySink.error("Failed to dispose MCP client", error);
    }
  }

  async destroyAll(): Promise<void> {
    // Placeholder: Dispose all active clients
    this.options.telemetrySink.info("All MCP clients destroyed");
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> {
    const opts = { ...this.options.retryOptions, ...customOptions } as RetryOptions;
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
