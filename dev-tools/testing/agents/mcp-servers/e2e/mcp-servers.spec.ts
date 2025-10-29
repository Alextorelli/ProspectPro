import { expect, test } from "@playwright/test";

test.describe("mcp-servers E2E", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("/");
    expect(await page.title()).toBeDefined();
  });
});
