#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const OWNER = "@me"; // Use current user by default
const PROJECT_NUMBER = "5";

// Use project-scoped token if available, fallback to GITHUB_TOKEN
const GITHUB_TOKEN = process.env.GH_PROJECT_TOKEN || process.env.GITHUB_TOKEN;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(
  repoRoot,
  "docs",
  "roadmap",
  "project-open-items.md"
);

function ensureGhAvailable() {
  const result = spawnSync("gh", ["--version"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error("GitHub CLI (gh) is required but not available in PATH.");
  }

  if (!GITHUB_TOKEN) {
    console.error(
      "⚠️  No GitHub token found (GH_PROJECT_TOKEN or GITHUB_TOKEN)."
    );
    console.error(
      "   Generate PAT: https://github.com/settings/tokens?type=beta"
    );
    console.error("   Required scopes: repo, project (account permissions)");
    throw new Error("GitHub token required for project access");
  }
}

function fetchProjectItems() {
  const result = spawnSync(
    "gh",
    [
      "project",
      "item-list",
      PROJECT_NUMBER, // positional project number per gh CLI
      "--owner",
      OWNER,
      "--format",
      "json",
      "-L",
      "100",
    ],
    {
      encoding: "utf8",
      env: { ...process.env, GITHUB_TOKEN },
    }
  );

  if (result.status !== 0) {
    const errorOutput =
      result.stderr ||
      result.stdout ||
      "Unknown error retrieving project items.";

    if (errorOutput.includes("Resource not accessible by integration")) {
      throw new Error(
        "Token lacks 'project' scope.\n" +
          "   Generate PAT with account-level project permissions:\n" +
          "   https://github.com/settings/tokens?type=beta\n" +
          "   Set as: export GH_PROJECT_TOKEN=github_pat_..."
      );
    }

    throw new Error(errorOutput.trim());
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error("Unable to parse GitHub CLI response as JSON.");
  }
}

function extractOpenItems(raw) {
  if (!raw || !Array.isArray(raw.items)) {
    return [];
  }

  return raw.items
    .filter((item) => item.archived === false)
    .map((item) => {
      const fieldValues = Array.isArray(item.fieldValues)
        ? item.fieldValues
        : Array.isArray(item.fields)
        ? item.fields
        : [];

      const statusField = fieldValues.find((field) => {
        const fieldName = field.field?.name || field.name || "";
        return fieldName.toLowerCase() === "status";
      });

      const status =
        statusField?.name ??
        statusField?.value ??
        statusField?.optionName ??
        statusField?.status ??
        null;

      return {
        title: item.title || item.content?.title || "Draft item",
        url: item.content?.url || null,
        status: status || "Unassigned",
      };
    })
    .filter(
      (item) => !["Done", "Completed", "Cancelled"].includes(item.status)
    );
}

function formatConsoleOutput(items) {
  if (items.length === 0) {
    return "No open items found.";
  }

  const lines = ["Open items for Project 5:"];
  for (const item of items) {
    const url = item.url ? item.url : "(draft item)";
    lines.push(`- ${item.title} | Status: ${item.status} | ${url}`);
  }
  return lines.join("\n");
}

async function writeMarkdown(items) {
  const now = new Date().toISOString();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const lines = ["# Project 5 Open Items", "", `_Last updated: ${now}_`, ""];

  if (items.length === 0) {
    lines.push("No open items found.");
  } else {
    for (const item of items) {
      const url = item.url ? item.url : "(draft item)";
      lines.push(`- **${item.title}** — Status: ${item.status} — ${url}`);
    }
  }

  await fs.writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  try {
    ensureGhAvailable();
    const raw = fetchProjectItems();
    const items = extractOpenItems(raw);
    const output = formatConsoleOutput(items);
    console.log(output);
    await writeMarkdown(items);
    console.log(`\nSaved summary to ${path.relative(repoRoot, outputPath)}`);
  } catch (error) {
    console.error("Failed to pull Project 5 items.");
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

main();

#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const OWNER = "@me"; // Use current user by default
const PROJECT_NUMBER = "5";

// Use project-scoped token if available, fallback to GITHUB_TOKEN
const GITHUB_TOKEN = process.env.GH_PROJECT_TOKEN || process.env.GITHUB_TOKEN;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(
  repoRoot,
  "docs",
  "roadmap",
  "project-open-items.md"
);

function ensureGhAvailable() {
  const result = spawnSync("gh", ["--version"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error("GitHub CLI (gh) is required but not available in PATH.");
  }

  if (!GITHUB_TOKEN) {
    console.error(
      "⚠️  No GitHub token found (GH_PROJECT_TOKEN or GITHUB_TOKEN)."
    );
    console.error(
      "   Generate PAT: https://github.com/settings/tokens?type=beta"
    );
    console.error("   Required scopes: repo, project (account permissions)");
    throw new Error("GitHub token required for project access");
  }
}

function fetchProjectItems() {
  const result = spawnSync(
    "gh",
    [
      "project",
      "item-list",
      PROJECT_NUMBER, // positional project number per gh CLI
      "--owner",
      OWNER,
      "--format",
      "json",
      "-L",
      "100",
    ],
    {
      encoding: "utf8",
      env: { ...process.env, GITHUB_TOKEN },
    }
  );

  if (result.status !== 0) {
    const errorOutput =
      result.stderr ||
      result.stdout ||
      "Unknown error retrieving project items.";

    if (errorOutput.includes("Resource not accessible by integration")) {
      throw new Error(
        "Token lacks 'project' scope.\n" +
          "   Generate PAT with account-level project permissions:\n" +
          "   https://github.com/settings/tokens?type=beta\n" +
          "   Set as: export GH_PROJECT_TOKEN=github_pat_..."
      );
    }

    throw new Error(errorOutput.trim());
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error("Unable to parse GitHub CLI response as JSON.");
  }
}

function extractOpenItems(raw) {
  if (!raw || !Array.isArray(raw.items)) {
    return [];
  }

  return raw.items
    .filter((item) => item.archived === false)
    .map((item) => {
      const fieldValues = Array.isArray(item.fieldValues)
        ? item.fieldValues
        : Array.isArray(item.fields)
        ? item.fields
        : [];

      const statusField = fieldValues.find((field) => {
        const fieldName = field.field?.name || field.name || "";
        return fieldName.toLowerCase() === "status";
      });

      const status =
        statusField?.name ??
        statusField?.value ??
        statusField?.optionName ??
        statusField?.status ??
        null;

      return {
        title: item.title || item.content?.title || "Draft item",
        url: item.content?.url || null,
        status: status || "Unassigned",
      };
    })
    .filter(
      (item) => !["Done", "Completed", "Cancelled"].includes(item.status)
    );
}

function formatConsoleOutput(items) {
  if (items.length === 0) {
    return "No open items found.";
  }

  const lines = ["Open items for Project 5:"];
  for (const item of items) {
    const url = item.url ? item.url : "(draft item)";
    lines.push(`- ${item.title} | Status: ${item.status} | ${url}`);
  }
  return lines.join("\n");
}

async function writeMarkdown(items) {
  const now = new Date().toISOString();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const lines = ["# Project 5 Open Items", "", `_Last updated: ${now}_`, ""];

  if (items.length === 0) {
    lines.push("No open items found.");
  } else {
    for (const item of items) {
      const url = item.url ? item.url : "(draft item)";
      lines.push(`- **${item.title}** — Status: ${item.status} — ${url}`);
    }
  }

  await fs.writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  try {
    ensureGhAvailable();
    const raw = fetchProjectItems();
    const items = extractOpenItems(raw);
    const output = formatConsoleOutput(items);
    console.log(output);
    await writeMarkdown(items);
    console.log(`\nSaved summary to ${path.relative(repoRoot, outputPath)}`);
  } catch (error) {
    console.error("Failed to pull Project 5 items.");
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

main();
