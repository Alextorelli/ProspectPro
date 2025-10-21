import * as fs from "fs";
import * as path from "path";
import { ConfigLocator } from "../ConfigLocator";

// Mock dependencies
jest.mock("fs");
jest.mock("path");
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe("ConfigLocator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadConfig", () => {
    it("should load config from primary location (.vscode/mcp_config.json)", () => {
      const configLocator = new ConfigLocator("/workspace");
      const mockConfig = { mcpServers: { test: {} } };

      mockedPath.join
        .mockReturnValueOnce("/workspace/.vscode/mcp_config.json") // primary path
        .mockReturnValueOnce("/workspace/config/mcp-config.json"); // fallback path
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configLocator.loadConfig();

      console.log("Result:", result);
      console.log("Expected source:", "/workspace/.vscode/mcp_config.json");

      expect(result.config).toEqual(mockConfig);
      expect(result.source).toBe("/workspace/.vscode/mcp_config.json");
      expect(result.warnings).toHaveLength(0);
    });

    it("should fallback to secondary location (config/mcp-config.json) when primary fails", () => {
      const configLocator = new ConfigLocator("/workspace");
      const mockConfig = { mcpServers: { test: {} } };

      mockedPath.join
        .mockReturnValueOnce("/workspace/.vscode/mcp_config.json") // primary path
        .mockReturnValueOnce("/workspace/config/mcp-config.json"); // fallback path

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
      const configLocator = new ConfigLocator("/workspace");

      mockedPath.join
        .mockReturnValueOnce("/workspace/.vscode/mcp_config.json")
        .mockReturnValueOnce("/workspace/config/mcp-config.json");

      mockedFs.existsSync.mockReturnValue(false);

      expect(() => configLocator.loadConfig()).toThrow(
        "No valid MCP config found"
      );
    });

    it("should throw error for invalid JSON", () => {
      const configLocator = new ConfigLocator("/workspace");

      mockedPath.join
        .mockReturnValueOnce("/workspace/.vscode/mcp_config.json")
        .mockReturnValueOnce("/workspace/config/mcp-config.json");
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue("invalid json");

      expect(() => configLocator.loadConfig()).toThrow(
        "No valid MCP config found"
      );
    });
  });
});
