#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const cacheDir = path.join(repoRoot, ".cache", "agent", "context");

async function ensureCacheDir() {
  await fs.mkdir(cacheDir, { recursive: true });
}

async function main() {
  const [, , token] = process.argv;
  if (!token) {
    console.log("No SESSION_JWT provided. Skipping cache update.");
    // DEPRECATED: Use dev-tools/scripts/context/cache-session.js as the canonical version.
  }
