#!/usr/bin/env node

import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const cacheDir = path.join(repoRoot, ".cache", "agent", "context");

function runGit(args) {
  try {
    const output = execSync(`git ${args}`, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.trim();
  } catch {
    return "";
  }
}

function collectGitSummary() {
  const branch = runGit("rev-parse --abbrev-ref HEAD");
  const commit = runGit("rev-parse --short HEAD");
  const statusShort = runGit("status --short");
  const upstream = runGit("rev-parse --abbrev-ref --symbolic-full-name @{u}");
  const diffSummary = runGit("diff --stat");
  const staged = runGit("diff --cached --name-status");
  const unstaged = runGit("diff --name-status");

  return {
    branch,
    commit,
    upstream: upstream || null,
    status: statusShort ? statusShort.split("\n") : [],
    staged: staged ? staged.split("\n") : [],
    unstaged: unstaged ? unstaged.split("\n") : [],
    diffSummary: diffSummary || null,
  };
}

async function ensureCacheDir() {
  await fs.mkdir(cacheDir, { recursive: true });
}

async function writeJson(filename, payload) {
  const destination = path.join(cacheDir, filename);
  const data = JSON.stringify(payload, null, 2);
  await fs.writeFile(destination, data, "utf8");
  return destination;
}

async function main() {
  await ensureCacheDir();
  const snapshot = {
    generatedAt: new Date().toISOString(),
    repositoryRoot: repoRoot,
    git: collectGitSummary(),
    node: process.version,
    workspace: process.cwd(),
  };

  const outputPath = await writeJson("repo-context.json", snapshot);
  console.log(
    `📦 Repo context written to ${path.relative(repoRoot, outputPath)}`
  );
}

main().catch((error) => {
  console.error("Failed to capture repository context:", error.message);
  process.exit(1);
});
