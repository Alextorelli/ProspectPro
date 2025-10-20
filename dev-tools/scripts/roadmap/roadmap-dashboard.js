#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const epicsDir = path.join(repoRoot, "docs", "roadmap", "epics");

async function readEpicFile(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  return contents.split(/\r?\n/);
}

function extractMetadata(lines) {
  const data = {
    title: null,
    priority: null,
    phase: null,
    points: null,
    labels: null,
  };

  for (const line of lines) {
    if (!data.title && line.startsWith("# ")) {
      data.title = line.slice(2).trim();
    }
    if (line.startsWith("- Priority:")) {
      data.priority = line.replace("- Priority:", "").trim();
    }
    if (line.startsWith("- Phase:")) {
      data.phase = line.replace("- Phase:", "").trim();
    }
    if (line.startsWith("- Story Points:")) {
      data.points = line.replace("- Story Points:", "").trim();
    }
    if (line.startsWith("- Labels:")) {
      data.labels = line.replace("- Labels:", "").trim();
    }
  }

  return data;
}

async function loadEpics() {
  let files;
  try {
    files = await fs.readdir(epicsDir);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(
        "No epics directory found. Run npm run roadmap:epic to create one."
      );
      return [];
    }
    throw error;
  }

  const summaries = [];
  for (const file of files) {
    if (!file.endsWith(".md")) {
      continue;
    }
    const fullPath = path.join(epicsDir, file);
    const lines = await readEpicFile(fullPath);
    const meta = extractMetadata(lines);
    const slug = file.replace(/\.md$/, "");
    summaries.push({ slug, ...meta });
  }
  return summaries;
}

function printSummary(list) {
  if (list.length === 0) {
    console.log("No epics available.");
    return;
  }

  console.log("ProspectPro Roadmap Dashboard");
  console.log("--------------------------------");
  for (const epic of list) {
    const priority = epic.priority || "Unprioritized";
    const phase = epic.phase || "Unscheduled";
    const points = epic.points || "?";
    const labels = epic.labels || "epic, roadmap";
    console.log(
      `• ${epic.slug} → ${
        epic.title || "Untitled"
      } | ${priority} | ${phase} | ${points} pts | Labels: ${labels}`
    );
  }
}

loadEpics()
  .then(printSummary)
  .catch((error) => {
    console.error("Failed to generate roadmap dashboard.");
    console.error(error);
    process.exitCode = 1;
  });
