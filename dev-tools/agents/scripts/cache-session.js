#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
function getOptionAOutputDir(tag) {
  return path.join(repoRoot, "reports", "context", tag);
}

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
  const agentTag = process.env.AGENT_TAG || null; // Optionally set AGENT_TAG env var
  let destination;
  if (agentTag) {
    const outputDir = getOptionAOutputDir(agentTag);
    await fs.mkdir(outputDir, { recursive: true });
    destination = path.join(outputDir, "session.json");
  } else {
    destination = path.join(cacheDir, "session.json");
  }
  const payload = {
    storedAt: new Date().toISOString(),
    sessionJwt: token,
    agentTag,
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
