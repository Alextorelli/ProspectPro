import { Tool } from "@modelcontextprotocol/sdk/types.js";
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
declare const SEQUENTIAL_THINKING_TOOL: Tool;
export declare class SequentialThinkingEngine {
    private readonly thoughtHistory;
    private readonly branches;
    private readonly disableThoughtLogging;
    private readonly logPath;
    private logPrepared;
    constructor(options?: SequentialThinkingOptions);
    get tool(): Tool;
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
    selfTest(): Promise<void>;
}
export declare function createSequentialThinkingEngine(options?: SequentialThinkingOptions): SequentialThinkingEngine;
export { SEQUENTIAL_THINKING_TOOL };
//# sourceMappingURL=sequential.d.ts.map