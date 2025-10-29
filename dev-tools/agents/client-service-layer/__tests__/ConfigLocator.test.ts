import * as fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigLocator } from "../src/ConfigLocator";

vi.mock("fs");
const mockedFs = fs as unknown as {
  existsSync: ReturnType<typeof vi.fn>;
  readFileSync: ReturnType<typeof vi.fn>;
};

describe("ConfigLocator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadConfig", () => {
    it("should load config from primary location (.vscode/mcp_config.json)", () => {
      const configLocator = new ConfigLocator(
        "/workspace",
        ".vscode/mcp_config.json",
        "config/mcp-config.json"
      );
      const mockConfig = { mcpServers: { test: {} } };

      // fs mocked to report files exist and to return the JSON body
      mockedFs.existsSync.mockImplementation((p) => {
        return true;
      });
      mockedFs.readFileSync.mockImplementation((p) => {
        return JSON.stringify(mockConfig);
      });

      const result = configLocator.loadConfig();

      console.log("Result:", result);

      expect(result.config).toEqual(mockConfig);
      expect(result.source).toBe("/workspace/.vscode/mcp_config.json");
      expect(result.warnings).toHaveLength(0);
    });

    it("should fallback to secondary location (config/mcp-config.json) when primary fails", () => {
      const configLocator = new ConfigLocator(
        "/workspace",
        ".vscode/mcp_config.json",
        "config/mcp-config.json"
      );
      const mockConfig = { mcpServers: { test: {} } };

      mockedFs.existsSync
        .mockReturnValueOnce(false) // primary doesn't exist
        .mockReturnValueOnce(true); // fallback exists

      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configLocator.loadConfig();

      expect(result.config).toEqual(mockConfig);
      expect(result.source).toBe("/workspace/config/mcp-config.json");
      expect(result.warnings).toHaveLength(2); // primary not found + using fallback
    });

    it("should throw error when both locations fail", () => {
      const configLocator = new ConfigLocator(
        "/workspace",
        ".vscode/mcp_config.json",
        "config/mcp-config.json"
      );

      mockedFs.existsSync.mockReturnValue(false);

      expect(() => configLocator.loadConfig()).toThrow(
        "No valid MCP config found"
      );
    });

    it("should throw error for invalid JSON", () => {
      const configLocator = new ConfigLocator(
        "/workspace",
        ".vscode/mcp_config.json",
        "config/mcp-config.json"
      );

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue("invalid json");

      expect(() => configLocator.loadConfig()).toThrow(
        "No valid MCP config found"
      );
    });
  });
});
