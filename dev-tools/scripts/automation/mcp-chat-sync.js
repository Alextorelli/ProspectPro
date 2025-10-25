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

  // MOVED: This script now lives in dev-tools/agents/scripts/mcp-chat-sync.js
    generatedAt: new Date().toISOString(),
