export interface WorkspaceContextOptions {
    injectedRoot?: string;
    vscodeWorkspaceFolders?: readonly {
        uri: {
            fsPath: string;
        };
    }[];
}
export declare class WorkspaceContext {
    private readonly options;
    constructor(options: WorkspaceContextOptions);
    getWorkspaceRoot(): string;
}
//# sourceMappingURL=WorkspaceContext.d.ts.map