// Differential Mermaid diagram generator for ProspectPro
// Usage: node dev-tools/scripts/docs/generate-diagrams.mjs

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const DIAGRAM_SRC_DIRS = [
  "docs/diagrams/app",
  "docs/diagrams/tooling",
  "docs/diagrams/technical",
];
const CACHE_DIR = ".docs-cache";
const MANIFEST = path.join(CACHE_DIR, "manifest.json");

function getAllMermaidFiles() {
  let files = [];
  for (const dir of DIAGRAM_SRC_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith(".mmd") || f.endsWith(".mermaid"))
        files.push(path.join(dir, f));
    }
  }
  return files;
}

function getChangedMermaidFiles() {
  const output = execSync("git diff --name-only HEAD", { encoding: "utf8" });
  return output
    .split("\n")
    .filter(
      (f) =>
        (f.endsWith(".mermaid") || f.endsWith(".mmd")) &&
        DIAGRAM_SRC_DIRS.some((dir) => f.startsWith(dir))
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
  let files = bootstrap ? getAllMermaidFiles() : getChangedMermaidFiles();
  let manifest = loadManifest();
  for (const file of files) {
    const hash = hashFile(file);
    manifest[file] = hash;
    renderDiagram(file);
    console.log(`Tracked: ${file} [${hash}]`);
  }
  saveManifest(manifest);
}

main();
