#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";

const repoRoot = process.cwd();
const chatmodeDir = path.join(repoRoot, ".github", "chatmodes");
const manifestPath = path.join(chatmodeDir, "chatmode-manifest.json");

const TASK_LABELS = ["MCP: Run Chat Validation", "MCP: Sync Chat Participants"];

function slugify(fileName) {
  return fileName
    .replace(/\.chatmode\.md$/i, "")
    .replace(/\.md$/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function buildManifest() {
  const entries = await fs.readdir(chatmodeDir, { withFileTypes: true });
  const modes = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".chatmode.md"))
    .map((entry) => slugify(entry.name))
    .sort();

  if (modes.length === 0) {
    throw new Error("No .chatmode.md files found in .github/chatmodes");
  }

  // Compose manifest object
  const manifest = {
    version: "2.0.0",
    generatedAt: new Date().toISOString(),
    chatmodes: modes.map((id) => {
      // Try to find the .chatmode.md file for this id
      const file =
        entries.find((entry) => slugify(entry.name) === id)?.name ||
        `${id}.chatmode.md`;
      return {
        id,
        name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        file,
        workflows: [], // Optionally fill in workflows if needed
      };
    }),
  };
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Chatmode manifest generated: ${manifestPath}`);
}

async function main() {
  try {
    await buildManifest();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
