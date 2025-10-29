import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./utils/setup.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./reports/coverage",
      reporter: ["text", "html", "json"],
      include: [
        "agents/**/*.test.ts",
        "agents/**/*.spec.ts",
        "agents/**/*.integration.ts",
      ],
      exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    },
    reporters: [
      "default",
      ["json", { outputFile: "./reports/vitest-results.json" }],
    ],
  },
  resolve: {
    alias: {
      "@agents": path.resolve(__dirname, "../agents"),
      "@testing": path.resolve(__dirname, ".."),
      "@observability": path.resolve(__dirname, "../observability"),
      "@fixtures": path.resolve(__dirname, "../fixtures"),
    },
  },
});
