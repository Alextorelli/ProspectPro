export interface ConfigResult {
    config: any;
    source: string;
    warnings: string[];
}
export declare class ConfigLocator {
    private readonly primaryPath;
    private readonly fallbackPath;
    constructor(workspaceRoot: string, primaryPath?: string, fallbackPath?: string);
    loadConfig(): ConfigResult;
}
//# sourceMappingURL=ConfigLocator.d.ts.map