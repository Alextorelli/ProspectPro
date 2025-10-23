export class WorkspaceContext {
    constructor(options) {
        this.options = options;
    }
    getWorkspaceRoot() {
        // Prefer injected root for portability/testing
        if (this.options.injectedRoot) {
            return this.options.injectedRoot;
        }
        // Fallback to VS Code API if available
        if (this.options.vscodeWorkspaceFolders &&
            this.options.vscodeWorkspaceFolders.length > 0) {
            return this.options.vscodeWorkspaceFolders[0].uri.fsPath;
        }
        throw new Error("Workspace root cannot be resolved. " +
            "Either provide an injected root path or ensure vscode.workspace.workspaceFolders is available. " +
            "This may indicate the workspace is not properly initialized or the extension is not running in a valid VS Code context.");
    }
}
//# sourceMappingURL=WorkspaceContext.js.map