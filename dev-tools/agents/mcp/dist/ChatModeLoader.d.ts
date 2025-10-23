export interface ChatModeManifest {
    name: string;
    content: string;
    path: string;
}
export declare class ChatModeLoader {
    private readonly basePath;
    constructor(basePath?: string);
    loadManifests(workspaceRoot: string): {
        manifests: ChatModeManifest[];
        warnings: string[];
    };
}
//# sourceMappingURL=ChatModeLoader.d.ts.map