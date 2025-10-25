// Differential Mermaid diagram generator for ProspectPro
// Usage: node dev-tools/scripts/docs/generate-diagrams.mjs

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const DIAGRAM_ROOT = "docs/diagrams";
const CACHE_DIR = ".docs-cache";
const MANIFEST = path.join(CACHE_DIR, "manifest.json");

function walk(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(walk(fullPath));
    } else if (entry.endsWith(".mmd") || entry.endsWith(".mermaid")) {
      files.push(fullPath);
    }
  }
  return files;
}

function getAllMermaidFiles() {
  return walk(DIAGRAM_ROOT);
}

function getChangedMermaidFiles() {
  const output = execSync("git diff --name-only HEAD", { encoding: "utf8" });
  return output
    .split("\n")
    .filter(
      (f) =>
        (f.endsWith(".mermaid") || f.endsWith(".mmd")) &&
        f.startsWith(`${DIAGRAM_ROOT}/`)
    );
}

import crypto from "crypto";
function hashFile(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

// No SVG rendering needed; workspace uses Mermaid Editor for preview.
function renderDiagram(src) {
  // No-op: preview handled by VS Code extension.
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST)) return {};
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  } catch {
    return {};
  }
}

function saveManifest(obj) {
  fs.writeFileSync(MANIFEST, JSON.stringify(obj, null, 2));
}

function main() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
  const args = process.argv.slice(2);
  const bootstrap = args.includes("--bootstrap");
  const currentFiles = new Set(getAllMermaidFiles());
  let files = bootstrap ? Array.from(currentFiles) : getChangedMermaidFiles();
  let manifest = loadManifest();
  for (const file of files) {
    const hash = hashFile(file);
    manifest[file] = hash;
    renderDiagram(file);
    console.log(`Tracked: ${file} [${hash}]`);
  }
  for (const entry of Object.keys(manifest)) {
    if (!currentFiles.has(entry)) {
      delete manifest[entry];
      console.log(`Removed stale entry: ${entry}`);
    }
  }
  saveManifest(manifest);
}

main();
