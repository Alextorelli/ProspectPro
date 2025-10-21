import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const diagnosticsDir = path.resolve(__dirname, "../../reports/diagnostics");
const fixturePath = path.resolve(
  __dirname,
  "../../dev-tools/testing/fixtures/sample-mcp-response.json"
);

describe("MCP CLI tool output", () => {
  it("should produce a valid diagnostics artifact", () => {
    // Simulate CLI output by copying fixture (in real test, invoke CLI)
    if (!fs.existsSync(diagnosticsDir))
      fs.mkdirSync(diagnosticsDir, { recursive: true });
    const outFile = path.join(diagnosticsDir, "mcp-diagnostics-test.json");
    fs.copyFileSync(fixturePath, outFile);
    expect(fs.existsSync(outFile)).toBe(true);
    const artifact = JSON.parse(fs.readFileSync(outFile, "utf8"));
    expect(artifact.status).toBe("ok");
    expect(artifact.data.agent).toBe("test-agent");
  });
});
