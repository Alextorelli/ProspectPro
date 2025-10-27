#!/usr/bin/env node
// toolset-sync.js: Injects utility MCP tools into agent toolset.jsonc files
const fs = require("fs");
const path = require("path");

const AGENTS = [
  "development-workflow",
  "observability",
  "production-ops",
  "system-architect",
];
const UTILITY_TOOLS = [
  "utility.fetch",
  "utility.fs_read",
  "utility.fs_write",
  "utility.git_status",
  "utility.time_now",
  "utility.time_convert",
];
const WORKFLOWS_DIR = path.join(__dirname, "../workflows");

AGENTS.forEach((agent) => {
  const toolsetPath = path.join(WORKFLOWS_DIR, agent, "toolset.jsonc");
  if (!fs.existsSync(toolsetPath)) {
    console.warn(`No toolset.jsonc for agent: ${agent}`);
    return;
  }
  let toolset = fs.readFileSync(toolsetPath, "utf-8");
  let parsed;
  try {
    parsed = JSON.parse(toolset.replace(/\/\/.*$/gm, ""));
  } catch (e) {
    console.error(`Failed to parse ${toolsetPath}:`, e);
    return;
  }
  // Find the first key (agent toolset)
  const key = Object.keys(parsed)[0];
  if (!parsed[key]) parsed[key] = {};
  if (!parsed[key].tools) parsed[key].tools = [];
  // Add utility tools if not present
  UTILITY_TOOLS.forEach((tool) => {
    if (!parsed[key].tools.includes(tool)) {
      parsed[key].tools.push(tool);
    }
  });
  // Write back as pretty JSONC
  const newContent = JSON.stringify(parsed, null, 2) + "\n";
  fs.writeFileSync(toolsetPath, newContent, "utf-8");
  console.log(`Updated ${toolsetPath}`);
});
