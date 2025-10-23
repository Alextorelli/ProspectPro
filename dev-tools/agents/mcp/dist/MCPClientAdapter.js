/**
 * Mock MCP Client implementation for development and testing
 * In production, this would be replaced with actual MCP SDK integration
 */
export class MockMCPClient {
    constructor(serverName, config) {
        this.serverName = serverName;
        this.config = config;
        this.isConnected = false;
        this.connectionTimeout = config.timeout || 5000;
    }
    async connect() {
        // Simulate connection time
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.isConnected = true;
    }
    async disconnect() {
        this.isConnected = false;
    }
    async listTools() {
        if (!this.isConnected) {
            throw new Error(`MCP client for ${this.serverName} is not connected`);
        }
        // Mock tools based on server name
        return [`${this.serverName}_tool_1`, `${this.serverName}_tool_2`];
    }
    async callTool(name, args) {
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
export class MockMCPClientAdapter {
    constructor() {
        this.clients = new Map();
    }
    async createClient(serverName, config) {
        const client = new MockMCPClient(serverName, config);
        this.clients.set(serverName, client);
        return client;
    }
    async dispose() {
        for (const client of this.clients.values()) {
            if (client.isConnected) {
                await client.disconnect();
            }
        }
        this.clients.clear();
    }
}
//# sourceMappingURL=MCPClientAdapter.js.map