import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@frontend": path.resolve(__dirname, "src"),
      "@backend": path.resolve(__dirname, "../../backend"),
      "@shared": path.resolve(__dirname, "../../shared"),
    },
  },
  publicDir: path.resolve(__dirname, "public"),
  envPrefix: ["VITE_", "NEXT_PUBLIC_", "SUPABASE_", "PUBLIC_"],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
