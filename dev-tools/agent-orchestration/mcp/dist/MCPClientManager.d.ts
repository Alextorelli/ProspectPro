import { ConfigLocator } from "./ConfigLocator";
import { MCPClient, MCPClientAdapter } from "./MCPClientAdapter";
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
export declare class MCPClientManager {
    private configResult?;
    private readonly options;
    private readonly clientAdapter;
    private readonly activeClients;
    private readonly pendingConnections;
    private readonly defaultRetryOptions;
    constructor(options: MCPClientManagerOptions);
    initialize(): Promise<void>;
    getClient(serverName: string): Promise<MCPClient>;
    dispose(client: MCPClient): Promise<void>;
    destroyAll(): Promise<void>;
    private withRetry;
    private calculateDelay;
    private sleep;
}
//# sourceMappingURL=MCPClientManager.d.ts.map