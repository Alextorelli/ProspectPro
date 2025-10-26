export interface ThoughtData {
    thought: string;
    thoughtNumber: number;
    totalThoughts: number;
    nextThoughtNeeded: boolean;
    isRevision?: boolean;
    revisesThought?: number;
    branchFromThought?: number;
    branchId?: string;
    needsMoreThoughts?: boolean;
}
export interface SequentialThinkingOptions {
    disableThoughtLogging?: boolean;
    logPath?: string;
}
export declare class SequentialThinkingServer {
    private readonly thoughtHistory;
    private readonly branches;
    private readonly disableThoughtLogging;
    private readonly logPath;
    private logPrepared;
    constructor(options?: SequentialThinkingOptions);
    private prepareLogFile;
    private appendThought;
    private validateThoughtData;
    private formatThought;
    processThought(input: unknown): Promise<{
        content: Array<{
            type: "text";
            text: string;
        }>;
        isError?: boolean;
    }>;
    reset(): void;
}
export declare function createSequentialThinkingServer(options?: SequentialThinkingOptions): SequentialThinkingServer;
//# sourceMappingURL=lib.d.ts.map