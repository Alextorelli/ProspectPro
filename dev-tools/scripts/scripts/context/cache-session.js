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
    return;
  }

  await ensureCacheDir();
  const destination = path.join(cacheDir, "session.json");
  const payload = {
    storedAt: new Date().toISOString(),
    sessionJwt: token,
  };

  await fs.writeFile(destination, JSON.stringify(payload, null, 2), "utf8");
  console.log(
    `🔐 Cached session JWT at ${path.relative(repoRoot, destination)}`
  );
}

main().catch((error) => {
  console.error("Failed to cache session JWT:", error.message);
  process.exit(1);
});
