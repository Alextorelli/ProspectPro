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
export declare class MockMCPClient implements MCPClient {
    serverName: string;
    config: MCPServerConfig;
    isConnected: boolean;
    private connectionTimeout;
    constructor(serverName: string, config: MCPServerConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    listTools(): Promise<string[]>;
    callTool(name: string, args: Record<string, any>): Promise<any>;
}
/**
 * Mock MCP Client Adapter for development and testing
 */
export declare class MockMCPClientAdapter implements MCPClientAdapter {
    private clients;
    createClient(serverName: string, config: MCPServerConfig): Promise<MCPClient>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=MCPClientAdapter.d.ts.map