import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

const frontendRoot = path.resolve(__dirname, "app/frontend");

// https://vitejs.dev/config/
export default defineConfig({
  root: frontendRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@frontend": path.resolve(__dirname, "app/frontend/src"),
      "@backend": path.resolve(__dirname, "app/backend"),
      "@shared": path.resolve(__dirname, "app/shared"),
    },
  },
  publicDir: path.resolve(frontendRoot, "public"),
  envPrefix: ["VITE_", "NEXT_PUBLIC_", "SUPABASE_", "PUBLIC_"],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    sourcemap: true,
    emptyOutDir: true,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  test: {
    root: path.resolve(__dirname, "app/frontend"),
    environment: "jsdom",
    globals: true,
    css: true,
  },
});
