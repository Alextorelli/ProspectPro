#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const functionsRoot = path.join(repoRoot, "supabase", "functions");
function getOptionAOutputDir(tag) {
  return path.join(repoRoot, "reports", "context", tag);
}

const cacheDir = path.join(repoRoot, ".cache", "agent", "context");

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readFunctionMetadata() {
  const entries = await fs.readdir(functionsRoot, { withFileTypes: true });
  const functions = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "_shared" || entry.name === "tests") continue;

    const slug = entry.name;
    const functionDir = path.join(functionsRoot, slug);
    const indexPath = path.join(functionDir, "index.ts");
    const configPath = path.join(functionDir, "function.toml");
    const hasIndex = await pathExists(indexPath);
    const hasConfig = await pathExists(configPath);

    let verifyJwt = null;
    if (hasConfig) {
      const config = await fs.readFile(configPath, "utf8");
      const match = config.match(/verify_jwt\s*=\s*(true|false)/);
      verifyJwt = match ? match[1] === "true" : null;
    }

    functions.push({
      slug,
      hasIndex,
      hasConfig,
      verifyJwt,
    });
  }

  functions.sort((a, b) => a.slug.localeCompare(b.slug));
  return functions;
}

async function ensureCacheDir() {
  await fs.mkdir(cacheDir, { recursive: true });
}

async function writeJson(filename, payload, agentTag) {
  let destination;
  if (agentTag) {
    const outputDir = getOptionAOutputDir(agentTag);
    await fs.mkdir(outputDir, { recursive: true });
    destination = path.join(outputDir, filename);
  } else {
    destination = path.join(cacheDir, filename);
  }
  await fs.writeFile(destination, JSON.stringify(payload, null, 2), "utf8");
  return destination;
}

async function main() {
  await ensureCacheDir();
  const agentTag = process.env.AGENT_TAG || null; // Optionally set AGENT_TAG env var

  const functions = await readFunctionMetadata();
  const summary = {
    generatedAt: new Date().toISOString(),
    totalFunctions: functions.length,
    functions,
    agentTag,
  };

  const outputPath = await writeJson(
    "supabase-functions.json",
    summary,
    agentTag
  );
  console.log(
    `🗂️ Supabase function context written to ${path.relative(
      repoRoot,
      outputPath
    )}`
  );
}

main().catch((error) => {
  console.error("Failed to capture Supabase context:", error.message);
  process.exit(1);
});
