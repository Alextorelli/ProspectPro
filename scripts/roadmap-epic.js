#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process, { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const templatesDir = path.join(repoRoot, "docs", "roadmap", "templates");
const epicsDir = path.join(repoRoot, "docs", "roadmap", "epics");
const templatePath = path.join(templatesDir, "epic.md");

async function loadTemplate() {
  try {
    return await fs.readFile(templatePath, "utf8");
  } catch (error) {
    console.error("Epic template not found at docs/roadmap/templates/epic.md");
    throw error;
  }
}

function sanitizeSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|[-]+$/g, "");
}

function toTitleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function promptForEpic() {
  const rl = createInterface({ input, output });
  try {
    const rawSlug = await rl.question("Epic key (kebab-case): ");
    const slug = sanitizeSlug(rawSlug);
    if (!slug) {
      throw new Error("Epic key is required.");
    }

    const emoji = (await rl.question("Emoji (default 📌): ")).trim() || "📌";
    const defaultTitle = toTitleFromSlug(slug);
    const title =
      (await rl.question(`Title (${defaultTitle}): `)).trim() || defaultTitle;
    const problem = (await rl.question("Problem statement: ")).trim() || "TBD";
    const solution = (await rl.question("Solution summary: ")).trim() || "TBD";

    const acRaw = (
      await rl.question("Acceptance criteria (semicolon separated): ")
    ).trim();
    const acceptance = acRaw
      ? acRaw
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const reqRaw = (
      await rl.question("Technical requirements (semicolon separated): ")
    ).trim();
    const requirements = reqRaw
      ? reqRaw
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const impact = (await rl.question("Business impact: ")).trim() || "TBD";
    const priority =
      (await rl.question("Priority (e.g., High): ")).trim() || "TBD";
    const phase =
      (await rl.question("Phase (e.g., Q1 2026): ")).trim() || "Backlog";
    const points = (await rl.question("Story points: ")).trim() || "13";
    const labels =
      (await rl.question("Additional labels (comma separated): ")).trim() ||
      "planning";

    return {
      slug,
      emoji,
      title,
      problem,
      solution,
      acceptance,
      requirements,
      impact,
      priority,
      phase,
      points,
      labels: labels
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(", "),
    };
  } finally {
    await rl.close();
  }
}

function applyTemplate(template, data) {
  const acceptanceList = (
    data.acceptance.length > 0 ? data.acceptance : ["TBD"]
  )
    .map((item) => `- [ ] ${item}`)
    .join("\n");

  const requirementList = (
    data.requirements.length > 0 ? data.requirements : ["TBD", "TBD"]
  )
    .map((item) => `- ${item}`)
    .join("\n");

  return template
    .replace(/{EMOJI}/g, data.emoji)
    .replace(/{TITLE}/g, data.title)
    .replace(/{PROBLEM}/g, data.problem)
    .replace(/{SOLUTION}/g, data.solution)
    .replace(/{ACCEPTANCE_LIST}/g, acceptanceList)
    .replace(/{IMPACT}/g, data.impact)
    .replace(/{REQUIREMENTS_LIST}/g, requirementList)
    .replace(/{PRIORITY}/g, data.priority)
    .replace(/{PHASE}/g, data.phase)
    .replace(/{POINTS}/g, data.points)
    .replace(/{LABELS}/g, data.labels || "planning");
}

async function writeEpic(slug, contents) {
  await fs.mkdir(epicsDir, { recursive: true });
  const targetPath = path.join(epicsDir, `${slug}.md`);
  try {
    await fs.access(targetPath);
    console.error(`Epic ${slug} already exists at ${targetPath}`);
    process.exitCode = 1;
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    await fs.writeFile(targetPath, contents, "utf8");
    console.log(`Created epic: docs/roadmap/epics/${slug}.md`);
  }
}

async function main() {
  const template = await loadTemplate();
  const data = await promptForEpic();
  const filled = applyTemplate(template, data);
  await writeEpic(data.slug, filled);
}

main().catch((error) => {
  console.error("Failed to generate epic file.");
  console.error(error);
  process.exitCode = 1;
});
