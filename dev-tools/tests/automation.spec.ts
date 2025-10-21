import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("Automation scripts", () => {
  it("should run sample-automation.sh in dry-run mode and log output", () => {
    const scriptPath = path.resolve(
      __dirname,
      "../../scripts/automation/sample-automation.sh"
    );
    const output = execSync(`bash ${scriptPath} --dry-run`).toString();
    expect(output).toMatch(/DRY RUN/);
  });

  it("should have regression test for path rewrites", () => {
    // Simulate a path rewrite and check result
    const testFile = path.resolve(
      __dirname,
      "../../scripts/automation/test-path-rewrite.txt"
    );
    fs.writeFileSync(testFile, "supabase/functions");
    const sedCmd = `sed -i 's|supabase/functions|app/backend/functions|g' ${testFile}`;
    execSync(sedCmd);
    const result = fs.readFileSync(testFile, "utf8");
    expect(result).toBe("app/backend/functions");
    fs.unlinkSync(testFile);
  });
});
