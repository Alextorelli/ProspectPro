import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["../utils/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "../reports/coverage",
      include: ["../agents/**/*.ts"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
    },
    reporters: [
      "default",
      ["json", { outputFile: "../reports/vitest-results.json" }],
    ],
  },
  resolve: {
    alias: {
      "@agents": path.resolve(__dirname, "../../agents"),
      "@testing": path.resolve(__dirname, ".."),
      "@observability": path.resolve(__dirname, "../../observability"),
    },
  },
});
