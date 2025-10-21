export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  timeout?: number;
}

export interface MCPClient {
  serverName: string;
  config: MCPServerConfig;
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  listTools(): Promise<string[]>;
  callTool(name: string, args: Record<string, any>): Promise<any>;
}

export interface MCPClientAdapter {
  createClient(serverName: string, config: MCPServerConfig): Promise<MCPClient>;
  dispose(): Promise<void>;
}

/**
 * Mock MCP Client implementation for development and testing
 * In production, this would be replaced with actual MCP SDK integration
 */
export class MockMCPClient implements MCPClient {
  public isConnected = false;
  private connectionTimeout: number;

  constructor(public serverName: string, public config: MCPServerConfig) {
    this.connectionTimeout = config.timeout || 5000;
  }

  async connect(): Promise<void> {
    // Simulate connection time
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  async listTools(): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error(`MCP client for ${this.serverName} is not connected`);
    }
    // Mock tools based on server name
    return [`${this.serverName}_tool_1`, `${this.serverName}_tool_2`];
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error(`MCP client for ${this.serverName} is not connected`);
    }
    // Mock tool response
    return {
      tool: name,
      args,
      result: `Mock result from ${this.serverName}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Mock MCP Client Adapter for development and testing
 */
export class MockMCPClientAdapter implements MCPClientAdapter {
  private clients = new Map<string, MockMCPClient>();

  async createClient(
    serverName: string,
    config: MCPServerConfig
  ): Promise<MCPClient> {
    const client = new MockMCPClient(serverName, config);
    this.clients.set(serverName, client);
    return client;
  }

  async dispose(): Promise<void> {
    for (const client of this.clients.values()) {
      if (client.isConnected) {
        await client.disconnect();
      }
    }
    this.clients.clear();
  }
}
