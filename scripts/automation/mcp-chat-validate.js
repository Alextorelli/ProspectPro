#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";

const repoRoot = process.cwd();
const chatmodeDir = path.join(repoRoot, ".github", "chatmodes");
const manifestPath = path.join(chatmodeDir, "chatmode-manifest.json");
const tasksPath = path.join(repoRoot, ".vscode", "tasks.json");

function extractFrontmatter(content) {
  const match = content.match(/^---\s*([\s\S]*?)\n---/);
  if (!match) {
    throw new Error("Missing frontmatter section");
  }
  return match[1];
}

function slugify(fileName) {
  return fileName
    .replace(/\.chatmode\.md$/i, "")
    .replace(/\.md$/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function loadJson(filePath) {
  const data = await fs.readFile(filePath, "utf-8");
  try {
    return JSON.parse(data);
  } catch (err) {
    throw new Error(
      `Invalid JSON in ${path.relative(repoRoot, filePath)}: ${err.message}`
    );
  }
}

async function validateManifest(manifest, modeFiles) {
  if (!manifest.mcpIntegration) {
    throw new Error("Manifest must set mcpIntegration: true");
  }

  if (!Array.isArray(manifest.modes) || manifest.modes.length === 0) {
    throw new Error("Manifest must include non-empty modes array");
  }

  const missing = manifest.modes.filter((slug) => !modeFiles.includes(slug));
  if (missing.length > 0) {
    throw new Error(`Manifest references missing modes: ${missing.join(", ")}`);
  }

  const tasks = manifest.tasks ?? [];
  const requiredTasks = [
    "MCP: Run Chat Validation",
    "MCP: Sync Chat Participants",
  ];
  const missingTasks = requiredTasks.filter((label) => !tasks.includes(label));
  if (missingTasks.length > 0) {
    throw new Error(
      `Manifest missing required task label(s): ${missingTasks.join(", ")}`
    );
  }
}

async function validateTasks(manifest) {
  const tasksJson = await loadJson(tasksPath);
  const labelsInFile = new Set(tasksJson.tasks?.map((task) => task.label));
  for (const label of manifest.tasks) {
    if (!labelsInFile.has(label)) {
      throw new Error(
        `VS Code task '${label}' not found in .vscode/tasks.json`
      );
    }
  }
}

async function validateModeFiles(expectedSlugs) {
  const entries = await fs.readdir(chatmodeDir, { withFileTypes: true });
  const modeFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".chatmode.md")
  );
  const problems = [];

  for (const entry of modeFiles) {
    const filePath = path.join(chatmodeDir, entry.name);
    const content = await fs.readFile(filePath, "utf-8");
    try {
      const frontmatter = extractFrontmatter(content);
      if (!/^description\s*:/m.test(frontmatter)) {
        throw new Error("Frontmatter missing description");
      }
      if (!/^tools\s*:/m.test(frontmatter)) {
        throw new Error("Frontmatter missing tools list");
      }
    } catch (err) {
      problems.push(`${entry.name}: ${err.message}`);
    }
  }

  const slugsFromFiles = modeFiles.map((entry) => slugify(entry.name));
  const extras = slugsFromFiles.filter((slug) => !expectedSlugs.includes(slug));
  if (extras.length > 0) {
    problems.push(`Untracked modes (not in manifest): ${extras.join(", ")}`);
  }

  if (problems.length > 0) {
    throw new Error(problems.join("\n"));
  }
}

async function main() {
  const manifest = await loadJson(manifestPath);
  const entries = await fs.readdir(chatmodeDir, { withFileTypes: true });
  const modeSlugs = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".chatmode.md"))
    .map((entry) => slugify(entry.name));

  await validateManifest(manifest, modeSlugs);
  await validateTasks(manifest);
  await validateModeFiles(manifest.modes.map((mode) => mode.trim()));

  console.log("✅ MCP chatmode validation passed.");
}

main().catch((err) => {
  console.error("❌ MCP chatmode validation failed:", err.message);
  process.exitCode = 1;
});
