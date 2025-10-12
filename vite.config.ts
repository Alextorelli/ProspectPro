import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Allow environment variables with Vite and Vercel prefixes (NEXT_PUBLIC_/SUPABASE_)
  envPrefix: ["VITE_", "NEXT_PUBLIC_", "SUPABASE_", "PUBLIC_"],
  server: {
    port: 5173,
    host: true, // Allow external connections
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  define: {
    // Ensure environment variables are available at build time
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  test: {
    environment: "jsdom",
    globals: true,
    css: true,
  },
});
