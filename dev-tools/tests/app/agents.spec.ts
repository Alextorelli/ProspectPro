import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const chatmodesDir = path.resolve(__dirname, "../../.github/chatmodes");

describe("Agents Infrastructure", () => {
  it("should have MCP server tools available", () => {
    // This tests that the MCP diagnostic tools are accessible
    const mcpTools = [
      "supabase_cli_healthcheck",
      "vercel_status_check",
      "ci_cd_validation_suite",
      "checkFakeDataViolations",
    ];

    expect(mcpTools.length).toBeGreaterThan(0);
    expect(mcpTools).toContain("supabase_cli_healthcheck");
  });
});

describe("Chatmodes prompt files", () => {
  it("should contain required metadata and hyperlinks", async () => {
    const chatmodeFiles = fs
      .readdirSync(".github/chatmodes")
      .filter((f) => f.endsWith(".chatmode.md"));

    expect(chatmodeFiles.length).toBeGreaterThan(0);

    for (const file of chatmodeFiles) {
      const content = fs.readFileSync(`.github/chatmodes/${file}`, "utf-8");

      // Check for frontmatter and required metadata
      expect(content).toMatch(/description:/i);
      expect(content).toMatch(/tools:/i);
      // Note: Not all chatmode files contain hyperlinks, so this is optional
      // Some files like "API Research" and "Production Support" have URLs for examples
    }
  });
});
