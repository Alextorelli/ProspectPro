test.describe("business-discovery E2E", () => {
test.describe("business-discovery E2E", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ProspectPro/);
  });
});
