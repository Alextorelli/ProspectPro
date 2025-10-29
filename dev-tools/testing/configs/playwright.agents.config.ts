import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  testDir: path.resolve(__dirname, "../agents"),
  outputDir: path.resolve(__dirname, "../reports/playwright"),
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: path.resolve(__dirname, "../reports/playwright/html"),
        open: "never",
      },
    ],
    [
      "json",
      {
        outputFile: path.resolve(
          __dirname,
          "../reports/playwright/playwright-report.json"
        ),
      },
    ],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
