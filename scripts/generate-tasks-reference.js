#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const tasksJsonPath = path.join(repoRoot, ".vscode", "tasks.json");
const outputPath = path.join(repoRoot, ".vscode", "TASKS_REFERENCE.md");

const CATEGORY_MAP = {
  Supabase: "Supabase & Database",
  Database: "Supabase & Database",
  "Edge Functions": "Edge Functions",
  Logs: "Edge Functions",
  Test: "Testing & Diagnostics",
  Diagnostics: "Testing & Diagnostics",
  Build: "Build & Deployment",
  Deploy: "Build & Deployment",
  MCP: "Build & Deployment",
  Docs: "Documentation",
  "🚀": "Roadmap Management",
  "🗂️": "Roadmap Management",
  "🌐": "Roadmap Management",
  "🔍": "Roadmap Management",
  "🛠️": "Roadmap Management",
  "📋": "Roadmap Management",
  Workspace: "Miscellaneous",
};

function getCategoryFromLabel(label) {
  for (const [prefix, category] of Object.entries(CATEGORY_MAP)) {
    if (label.startsWith(prefix)) {
      return category;
    }
  }
  return "Miscellaneous";
}

function extractCommand(task) {
  if (task.command === "npm") {
    const args = task.args || [];
    return `npm ${args.join(" ")}`;
  }
  if (task.command === "bash") {
    const args = task.args || [];
    const bashCmd = args.find((arg) => !arg.startsWith("-"));
    return bashCmd ? `bash ${bashCmd}` : "bash (see args)";
  }
  if (task.type === "shell" && task.command) {
    return task.command;
  }
  return task.dependsOn ? "Sequential composite" : "N/A";
}

function extractScripts(task) {
  const scripts = [];
  if (task.command === "npm" && task.args && task.args[0] === "run") {
    scripts.push("[`package.json`](../package.json)");
  }
  if (task.command === "bash" && task.args) {
    const scriptArg = task.args.find(
      (arg) => arg.includes(".sh") || arg.includes("scripts/")
    );
    if (scriptArg) {
      const match = scriptArg.match(/([^\s]+\.sh)/);
      if (match) {
        const scriptPath = match[1].replace("${workspaceFolder}/", "");
        scripts.push(`[\`${scriptPath}\`](../${scriptPath})`);
      }
    }
  }
  if (task.dependsOn) {
    scripts.push("Multiple");
  }
  return scripts.length > 0 ? scripts.join(", ") : "CLI";
}

function extractInputs(task) {
  const inputs = [];
  if (task.args) {
    const argsStr = JSON.stringify(task.args);
    if (argsStr.includes("${input:")) {
      const matches = argsStr.match(/\$\{input:(\w+)\}/g);
      if (matches) {
        matches.forEach((m) => {
          const inputId = m.replace("${input:", "").replace("}", "");
          inputs.push(`\`${inputId}\``);
        });
      }
    }
  }
  if (task.options?.env) {
    Object.keys(task.options.env).forEach((key) => {
      if (task.options.env[key].includes("${input:")) {
        const match = task.options.env[key].match(/\$\{input:(\w+)\}/);
        if (match) {
          inputs.push(`\`${match[1]}\``);
        }
      }
    });
  }
  if (inputs.length === 0 && task.label.includes("(Guided)")) {
    return "Interactive prompts";
  }
  return inputs.length > 0 ? inputs.join(", ") : "None";
}

function sanitizeDescription(task) {
  const label = task.label;
  if (task.dependsOn) {
    const deps = Array.isArray(task.dependsOn)
      ? task.dependsOn
      : [task.dependsOn];
    return `Runs: ${deps
      .map((d) => d.replace(/^(Supabase|Edge Functions|Test): /, ""))
      .join(" → ")}`;
  }

  const descriptions = {
    "Supabase: Ensure Session":
      "Authenticates Supabase CLI session (prerequisite for most tasks)",
    "Supabase: Link Project":
      "Links workspace to Supabase project `sriycekxdqnesdsgwiuc`",
    "Supabase: List Migrations": "Lists all database migrations",
    "Supabase: Push Database":
      "Applies pending migrations to production database",
    "Supabase: Generate Types":
      "Generates TypeScript types from database schema → `src/types/supabase.ts`",
    "Supabase: Pull Public Schema":
      "Downloads current production schema to local migrations",
    "Database: Create Migration":
      "Creates a new migration file with descriptive name",
    "Edge Functions: Deploy Function":
      "Deploys a single Edge Function (select from dropdown)",
    "Edge Functions: Deploy Critical Set":
      "Deploys `business-discovery-background` + `enrichment-orchestrator`",
    "Edge Functions: Deploy Discovery Group":
      "Deploys all discovery functions (background, optimized, user-aware)",
    "Edge Functions: Deploy Enrichment Group":
      "Deploys all enrichment functions (hunter, neverbounce, orchestrator, etc.)",
    "Edge Functions: Deploy Export Functions":
      "Deploys `campaign-export-user-aware`",
    "Edge Functions: Deploy Diagnostics":
      "Deploys diagnostic functions (test-google-places, test-new-auth, auth-diagnostics)",
    "Edge Functions: List Functions": "Lists all deployed Edge Functions",
    "Edge Functions: Live Logs (All)":
      "Streams live logs from all Edge Functions (background task)",
    "Edge Functions: Error Logs Only":
      "Streams error logs only (background task)",
    "Logs: Edge Function":
      "Streams logs for a specific function (select from dropdown)",
    "Edge Functions: Test Business Discovery (Local)":
      "Tests local Edge Function against `localhost:54321`",
    "Supabase: Serve Local Functions":
      "Starts local Edge Functions server (background task)",
    "Test: Run Database Tests":
      "Runs pgTAP tests in `supabase/tests/database/`",
    "Test: Run Edge Function Tests":
      "Runs Deno tests in `supabase/functions/tests/`",
    "Test: Discovery Pipeline": "Tests full discovery workflow end-to-end",
    "Test: Enrichment Chain":
      "Tests enrichment providers (Hunter, NeverBounce, etc.)",
    "Test: Export Flow": "Tests campaign export to CSV with enrichment data",
    "Test: Campaign Validation":
      "Validates campaign creation and lead generation",
    "Test: Auth Patterns": "Tests authentication helpers and RLS policies",
    "Diagnostics: Full Campaign": "Comprehensive Edge Function health check",
    "Build: Frontend Production": "Builds React/Vite frontend to `/dist`",
    "Deploy: Vercel Production":
      "Deploys built frontend to Vercel (requires `Build: Frontend Production`)",
    "MCP: Start All Servers": "Starts all MCP servers (background task)",
    "Docs: Update All Documentation":
      "Regenerates `CODEBASE_INDEX.md`, `SYSTEM_REFERENCE.md`, and **TASKS_REFERENCE.md**",
    "Docs: Update System Reference (Legacy)":
      "Updates `SYSTEM_REFERENCE.md` only",
    "Docs: Update Codebase Index (Legacy)": "Updates `CODEBASE_INDEX.md` only",
    "🚀 Create Epic (Guided)":
      "Creates a new epic from template with guided prompts",
    "🗂️ Batch Generate Epics":
      "Generates epics from [`docs/roadmap/batch.json`](../docs/roadmap/batch.json)",
    "🗂️ Batch Generate Epics + Project":
      "Generates epics AND adds draft items to GitHub Project 5",
    "🌐 Open Project 5": "Opens GitHub Project 5 board in browser",
    "🔍 Project Dashboard":
      "Shows epic summary (priority, phase, points, labels)",
    "🛠️ Start Epic Scaffolding":
      "Scaffolds lib/, components/, Edge Function stubs for epic",
    "📋 Roadmap: Pull Open Items":
      "Pulls open items from Project 5 → [`docs/roadmap/project-open-items.md`](../docs/roadmap/project-open-items.md)",
    "Workspace: Validate Configuration":
      "Validates workspace config and environment setup",
    "Context: Fetch Repo Snapshot":
      "Captures current git branch, status, and diff summary to `.cache/agent/context/repo-context.json`",
    "Context: Fetch Supabase Snapshot":
      "Summarizes Edge Function directories and verify_jwt settings to `.cache/agent/context/supabase-functions.json`",
    "Context: Cache Session JWT":
      "Stores the provided session JWT locally at `.cache/agent/context/session.json`",
  };

  return descriptions[label] || "No description available";
}

async function parseTasksJson() {
  const raw = await fs.readFile(tasksJsonPath, "utf8");
  const cleanJson = raw.replace(/\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(cleanJson);
}

function groupTasksByCategory(tasks) {
  const groups = {};
  for (const task of tasks) {
    if (!task.label) continue;
    const category = getCategoryFromLabel(task.label);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(task);
  }
  return groups;
}

function generateMarkdownTable(tasks) {
  const rows = [
    "| Task Label | Command | Script/Config | Inputs | Description |",
  ];
  rows.push("|------------|---------|---------------|--------|-------------|");

  for (const task of tasks) {
    const label = `**${task.label}**`;
    const command = `\`${extractCommand(task)}\``;
    const scripts = extractScripts(task);
    const inputs = extractInputs(task);
    const description = sanitizeDescription(task);
    rows.push(
      `| ${label} | ${command} | ${scripts} | ${inputs} | ${description} |`
    );
  }

  return rows.join("\n");
}

function generateInputsTable(inputs) {
  if (!inputs || inputs.length === 0) return "";

  const rows = ["| Input ID | Type | Description | Options/Default |"];
  rows.push("|----------|------|-------------|-----------------|");

  for (const input of inputs) {
    const id = `\`${input.id}\``;
    const type = input.type === "pickString" ? "Dropdown" : "Text";
    const desc = input.description || "N/A";
    let opts = "Freeform text";
    if (input.type === "pickString") {
      const count = input.options?.length || 0;
      const def = input.default ? ` (default: \`${input.default}\`)` : "";
      opts = `${count} functions${def}`;
    } else if (input.id === "sessionJWT") {
      opts = "Freeform (obtain via `supabase.auth.getSession()`)";
    } else if (input.id === "epicKey") {
      opts = "Freeform kebab-case";
    }
    rows.push(`| ${id} | ${type} | ${desc} | ${opts} |`);
  }

  return rows.join("\n");
}

async function generateMarkdown(config) {
  const now = new Date().toISOString().split("T")[0];
  const groups = groupTasksByCategory(config.tasks);

  const lines = [
    "# ProspectPro VS Code Tasks Reference",
    "",
    `_Auto-generated from \`.vscode/tasks.json\` — Last updated: ${now}_`,
    "",
    '**Quick Access**: Press `Ctrl+Shift+P` → "Tasks: Run Task" → Select from list below',
    "",
    "---",
    "",
    "## 🗂️ Task Categories",
    "",
  ];

  const categoryOrder = [
    "Supabase & Database",
    "Edge Functions",
    "Testing & Diagnostics",
    "Build & Deployment",
    "Documentation",
    "Roadmap Management",
    "Miscellaneous",
  ];

  for (const category of categoryOrder) {
    lines.push(
      `- [${category}](#${category
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/&/g, "")})`
    );
  }

  lines.push("", "---", "");

  for (const category of categoryOrder) {
    if (!groups[category]) continue;
    lines.push(
      `## ${category}`,
      "",
      generateMarkdownTable(groups[category]),
      "",
      "---",
      ""
    );
  }

  lines.push(
    "## Input Prompts Reference",
    "",
    generateInputsTable(config.inputs),
    "",
    "---",
    ""
  );

  lines.push(
    "## Keyboard Shortcuts",
    "",
    "| Shortcut | Action |",
    "|----------|--------|",
    '| `Ctrl+Shift+P` → "Tasks: Run Task" | Opens task picker |',
    "| `Ctrl+Shift+B` | Runs default build task |",
    "| `Ctrl+Shift+T` | Runs default test task |",
    "",
    "---",
    ""
  );

  lines.push(
    "## Task Dependencies",
    "",
    "### Composite Workflows",
    "",
    "**Supabase: Full Workflow**",
    "1. Supabase: Ensure Session",
    "2. Supabase: Link Project",
    "3. Supabase: List Migrations",
    "",
    "**Edge Functions: Full Development Workflow**",
    "1. Supabase: Ensure Session",
    "2. Supabase: Link Project",
    "3. Edge Functions: List Functions",
    "4. Supabase: Serve Local Functions",
    "",
    "**Edge Functions: Production Deploy Workflow**",
    "1. Supabase: Ensure Session",
    "2. Edge Functions: Deploy Critical Set",
    "3. Edge Functions: Live Logs (All)",
    "",
    "**Edge Functions: Deploy All Functions**",
    "1. Edge Functions: Deploy Discovery Group",
    "2. Edge Functions: Deploy Enrichment Group",
    "3. Edge Functions: Deploy Export Functions",
    "4. Edge Functions: Deploy Diagnostics",
    "",
    "**Test: Full Stack Validation**",
    "1. Test: Discovery Pipeline",
    "2. Test: Enrichment Chain",
    "3. Test: Export Flow",
    "",
    "---",
    ""
  );

  lines.push(
    "## Related Documentation",
    "",
    "- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)",
    "- [Edge Functions Guide](../docs/SUPABASE_EDGE_FUNCTIONS.md)",
    "- [Testing Guide](../docs/QUICK_TESTING_GUIDE.md)",
    "- [Deployment Checklist](../docs/DEPLOYMENT_CHECKLIST.md)",
    "- [Roadmap Implementation](../docs/roadmap/)",
    "- [System Reference](../docs/technical/SYSTEM_REFERENCE.md)",
    "- [Codebase Index](../docs/technical/CODEBASE_INDEX.md)",
    "",
    "---",
    "",
    "**Maintenance**: This file is regenerated by `npm run docs:update`. Manual edits will be overwritten.",
    ""
  );

  return lines.join("\n");
}

async function main() {
  console.log("Generating TASKS_REFERENCE.md from .vscode/tasks.json...");
  const config = await parseTasksJson();
  const markdown = await generateMarkdown(config);
  await fs.writeFile(outputPath, markdown, "utf8");
  console.log(`✅ Generated ${path.relative(repoRoot, outputPath)}`);
}

main().catch((error) => {
  console.error("Failed to generate TASKS_REFERENCE.md");
  console.error(error);
  process.exitCode = 1;
});
