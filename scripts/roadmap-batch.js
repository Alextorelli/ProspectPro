#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const OWNER = "Alextorelli";
const PROJECT_NUMBER = "5";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const defaultBatchPath = path.join(repoRoot, "docs", "roadmap", "batch.json");
const templatePath = path.join(
  repoRoot,
  "docs",
  "roadmap",
  "templates",
  "epic.md"
);
const epicsDir = path.join(repoRoot, "docs", "roadmap", "epics");

function resolveBatchPath(args) {
  const positional = args.find((arg) => !arg.startsWith("--"));
  return positional
    ? path.resolve(process.cwd(), positional)
    : defaultBatchPath;
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function formatChecklist(items, prefix) {
  const list = items.length > 0 ? items : ["TBD"];
  return list.map((item) => `${prefix} ${item}`).join("\n");
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  }
  return [];
}

async function loadTemplate() {
  return fs.readFile(templatePath, "utf8");
}

async function loadBatchFile(batchPath) {
  try {
    const raw = await fs.readFile(batchPath, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      throw new Error("Batch file must contain an array of epic definitions.");
    }
    return data;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(
        `No batch file found at ${path.relative(repoRoot, batchPath)}.`
      );
      return [];
    }
    throw error;
  }
}

function buildEpicData(entry) {
  const title = entry.title || "Untitled Epic";
  const slug = entry.slug ? slugify(entry.slug) : slugify(title);
  if (!slug) {
    return null;
  }

  const acceptance = normalizeArray(entry.acceptance);
  const requirements = normalizeArray(entry.requirements);

  return {
    slug,
    emoji: entry.emoji || "📌",
    title,
    problem: entry.problem || "TBD",
    solution: entry.solution || "TBD",
    acceptance,
    requirements,
    impact: entry.impact || "TBD",
    priority: entry.priority || "TBD",
    phase: entry.phase || "Backlog",
    points: entry.points ? String(entry.points) : "13",
    labels: Array.isArray(entry.labels)
      ? entry.labels
          .map((label) => label.trim())
          .filter(Boolean)
          .join(", ") || "planning"
      : String(entry.labels || "planning"),
    addToProject: Boolean(entry.addToProject),
  };
}

async function ensureOutputDir() {
  await fs.mkdir(epicsDir, { recursive: true });
}

async function epicAlreadyExists(slug) {
  try {
    await fs.access(path.join(epicsDir, `${slug}.md`));
    return true;
  } catch (error) {
    return false;
  }
}

function renderTemplate(template, epic) {
  const acceptanceList = formatChecklist(epic.acceptance, "- [ ]");
  const requirementsList = formatChecklist(epic.requirements, "-");

  return template
    .replace(/{EMOJI}/g, epic.emoji)
    .replace(/{TITLE}/g, epic.title)
    .replace(/{PROBLEM}/g, epic.problem)
    .replace(/{SOLUTION}/g, epic.solution)
    .replace(/{ACCEPTANCE_LIST}/g, acceptanceList)
    .replace(/{IMPACT}/g, epic.impact)
    .replace(/{REQUIREMENTS_LIST}/g, requirementsList)
    .replace(/{PRIORITY}/g, epic.priority)
    .replace(/{PHASE}/g, epic.phase)
    .replace(/{POINTS}/g, epic.points)
    .replace(/{LABELS}/g, epic.labels);
}

async function writeEpicFile(slug, contents) {
  const destination = path.join(epicsDir, `${slug}.md`);
  await fs.writeFile(destination, `${contents}\n`, "utf8");
  console.log(`Created epic: docs/roadmap/epics/${slug}.md`);
}

function maybeAddToProject(epic, flags) {
  if (!epic.addToProject || !hasFlag(flags, "--project")) {
    return;
  }

  const ghCheck = spawnSync("gh", ["--version"], { encoding: "utf8" });
  if (ghCheck.status !== 0) {
    console.warn("GitHub CLI not available; skipping project addition.");
    return;
  }

  const title = `${epic.emoji} Epic: ${epic.title}`.trim();
  const acceptanceItems =
    epic.acceptance.length > 0 ? epic.acceptance : ["TBD"];
  const bodyLines = [
    `Problem: ${epic.problem}`,
    `Solution: ${epic.solution}`,
    "Acceptance Criteria:",
  ].concat(acceptanceItems.map((item) => `- [ ] ${item}`));

  const result = spawnSync(
    "gh",
    [
      "project",
      "item-add",
      "--owner",
      OWNER,
      "--number",
      PROJECT_NUMBER,
      "--title",
      title,
      "--body",
      bodyLines.join("\n"),
    ],
    { stdio: "inherit" }
  );

  if (result.status !== 0) {
    console.warn(`Failed to add ${epic.slug} to Project ${PROJECT_NUMBER}.`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const batchPath = resolveBatchPath(args);
  const flags = args.filter((arg) => arg.startsWith("--"));
  const force = hasFlag(flags, "--force");

  const entries = await loadBatchFile(batchPath);
  if (entries.length === 0) {
    return;
  }

  const template = await loadTemplate();
  await ensureOutputDir();

  for (const entry of entries) {
    const epic = buildEpicData(entry);
    if (!epic) {
      console.warn("Skipping entry without slug/title.");
      continue;
    }

    if (!force && (await epicAlreadyExists(epic.slug))) {
      console.log(`Skipping existing epic: ${epic.slug}`);
      continue;
    }

    const contents = renderTemplate(template, epic);
    await writeEpicFile(epic.slug, contents);
    maybeAddToProject(epic, flags);
  }
}

main().catch((error) => {
  console.error("Batch epic generation failed.");
  console.error(error.message || error);
  process.exitCode = 1;
});
