// update-indexes.mjs
// Node script to regenerate diagram index and live-tooling-list
// Usage: node docs/mmd-shared/scripts/update-indexes.mjs

import fs from "fs";
import path from "path";

const DIAGRAM_ROOT = "docs/diagrams";
const REPO_GPS_DIR = "dev-tools/context/repo-GPS";
const CODEBASE_INDEX = "docs/technical/CODEBASE_INDEX.md";
const SYSTEM_REFERENCE = "docs/technical/SYSTEM_REFERENCE.md";
const DIAGRAM_INDEX = "docs/mmd-shared/config/index.md";
const TOOLING_LIST =
  "dev-tools/workspace/context/session_store/live-tooling-list.txt";

function walk(dir, ext) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(walk(fullPath, ext));
    } else if (entry.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseRepoGps() {
  let assets = new Set();
  if (!fs.existsSync(REPO_GPS_DIR)) return assets;
  for (const file of fs.readdirSync(REPO_GPS_DIR)) {
    if (!file.endsWith(".txt")) continue;
    const lines = fs
      .readFileSync(path.join(REPO_GPS_DIR, file), "utf8")
      .split("\n");
    for (const line of lines) {
      if (line.trim() && !line.startsWith("#")) assets.add(line.trim());
    }
  }
  return assets;
}

function parseMarkdownLinks(file) {
  if (!fs.existsSync(file)) return [];
  const content = fs.readFileSync(file, "utf8");
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match,
    links = [];
  while ((match = regex.exec(content))) {
    links.push(match[2]);
  }
  return links;
}

function buildDiagramIndex(diagrams) {
  // For brevity, just group by top-level folder under diagrams
  const groups = {};
  for (const file of diagrams) {
    const rel = file.replace(/\\/g, "/");
    const parts = rel.split("/");
    const domain = parts[2] || "Other";
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(rel);
  }
  let out = `# MECE Diagram Index\n\n`;
  for (const domain of Object.keys(groups).sort()) {
    out += `## ${domain}\n\n| Diagram | Path |\n| ------- | ---- |\n`;
    for (const file of groups[domain].sort()) {
      const name = path.basename(file, ".mmd").replace(/-/g, " ");
      out += `| [${name}](${file}) | \
\
\`${file}\` |\n`;
    }
    out += "\n";
  }
  return out;
}

function main() {
  // 1. Find all .mmd files
  const diagrams = walk(DIAGRAM_ROOT, ".mmd");
  // 2. Parse inventories
  const gpsAssets = parseRepoGps();
  const codebaseLinks = new Set(parseMarkdownLinks(CODEBASE_INDEX));
  const sysrefLinks = new Set(parseMarkdownLinks(SYSTEM_REFERENCE));
  // 3. Build diagram index
  const indexContent = buildDiagramIndex(diagrams);
  fs.writeFileSync(DIAGRAM_INDEX, indexContent);
  // 4. Build live-tooling-list.txt
  const allAssets = new Set([
    ...gpsAssets,
    ...codebaseLinks,
    ...sysrefLinks,
    ...diagrams,
  ]);
  const sorted = Array.from(allAssets).filter(Boolean).sort();
  fs.writeFileSync(TOOLING_LIST, sorted.join("\n") + "\n");
  console.log("Updated diagram index and live-tooling-list.");
}

main();
