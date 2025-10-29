import { WorkspaceContext } from "../src/WorkspaceContext";

describe("WorkspaceContext", () => {
  describe("getWorkspaceRoot", () => {
    it("should return injected root when provided", () => {
      const workspaceContext = new WorkspaceContext({
        injectedRoot: "/injected/workspace",
      });

      const result = workspaceContext.getWorkspaceRoot();

      expect(result).toBe("/injected/workspace");
    });

    it("should return VS Code workspace folder when available", () => {
      const mockFolders = [{ uri: { fsPath: "/vscode/workspace" } }];
      const workspaceContext = new WorkspaceContext({
        vscodeWorkspaceFolders: mockFolders,
      });

      const result = workspaceContext.getWorkspaceRoot();

      expect(result).toBe("/vscode/workspace");
    });

    it("should prioritize injected root over VS Code folders", () => {
      const mockFolders = [{ uri: { fsPath: "/vscode/workspace" } }];
      const workspaceContext = new WorkspaceContext({
        injectedRoot: "/injected/workspace",
        vscodeWorkspaceFolders: mockFolders,
      });

      const result = workspaceContext.getWorkspaceRoot();

      expect(result).toBe("/injected/workspace");
    });

    it("should throw error when no workspace root available", () => {
      const workspaceContext = new WorkspaceContext({});

      expect(() => workspaceContext.getWorkspaceRoot()).toThrow(
        "Workspace root cannot be resolved"
      );
    });
  });
});
