#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const batchSource = path.join(repoRoot, "docs", "roadmap", "batch.json");
const templatePath = path.join(
  repoRoot,
  "docs",
  "roadmap",
  "templates",
  "epic.md"
);
const epicsDir = path.join(repoRoot, "docs", "roadmap", "epics");

function padAcceptanceCriteria(entries) {
  const padded = entries.slice(0, 3);
  while (padded.length < 3) {
    padded.push("TBD");
  }
  return padded;
}

function fillTemplate(template, epic) {
  return template
    .replace(/{EMOJI}/g, epic.emoji || "📌")
    .replace(/{TITLE}/g, epic.title || "Untitled Epic")
    .replace(/{PROBLEM}/g, epic.problem || "TBD")
    .replace(/{SOLUTION}/g, epic.solution || "TBD")
    .replace(/{AC1}/g, epic.acceptance[0])
    .replace(/{AC2}/g, epic.acceptance[1])
    .replace(/{AC3}/g, epic.acceptance[2])
    .replace(/{IMPACT}/g, epic.impact || "TBD")
    .replace(/{REQ1}/g, epic.requirements[0])
    .replace(/{REQ2}/g, epic.requirements[1])
    .replace(/{PRIORITY}/g, epic.priority || "TBD")
    .replace(/{PHASE}/g, epic.phase || "Backlog")
    .replace(/{POINTS}/g, epic.points || "13")
    .replace(/{LABELS}/g, epic.labels || "planning");
}

async function loadBatch() {
  try {
    const raw = await fs.readFile(batchSource, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Batch file must export an array of epic definitions.");
    }
    return parsed;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(
        "No batch file found at docs/roadmap/batch.json. Create one with an array of epic definitions."
      );
      return [];
    }
    throw error;
  }
}

function normalizeEpic(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const slug = typeof entry.slug === "string" ? entry.slug.trim() : "";
  if (!slug) {
    return null;
  }
  const acceptance = Array.isArray(entry.acceptance)
    ? entry.acceptance.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const requirements = Array.isArray(entry.requirements)
    ? entry.requirements
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : [];
  while (requirements.length < 2) {
    requirements.push("TBD");
  }
  return {
    slug,
    emoji: entry.emoji,
    title: entry.title,
    problem: entry.problem,
    solution: entry.solution,
    acceptance: padAcceptanceCriteria(acceptance),
    impact: entry.impact,
    requirements,
    priority: entry.priority,
    phase: entry.phase,
    points: entry.points,
    labels: Array.isArray(entry.labels)
      ? entry.labels.join(", ")
      : entry.labels,
  };
}

async function ensureDirectories() {
  await fs.mkdir(epicsDir, { recursive: true });
}

async function epicExists(slug) {
  try {
    await fs.access(path.join(epicsDir, `${slug}.md`));
    return true;
  } catch (error) {
    return false;
  }
}

async function createEpicFile(template, epic) {
  const content = fillTemplate(template, epic);
  const destination = path.join(epicsDir, `${epic.slug}.md`);
  await fs.writeFile(destination, content, "utf8");
  console.log(`Created epic: docs/roadmap/epics/${epic.slug}.md`);
}

async function main() {
  const batch = await loadBatch();
  if (batch.length === 0) {
    return;
  }
  const template = await fs.readFile(templatePath, "utf8");
  await ensureDirectories();

  for (const entry of batch) {
    const epic = normalizeEpic(entry);
    if (!epic) {
      console.warn("Skipping invalid epic entry in batch definition.");
      continue;
    }
    if (await epicExists(epic.slug)) {
      console.log(`Skipping existing epic: ${epic.slug}`);
      continue;
    }
    await createEpicFile(template, epic);
  }
}

main().catch((error) => {
  console.error("Batch epic generation failed.");
  console.error(error);
  process.exitCode = 1;
});
