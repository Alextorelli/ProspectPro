#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const epicsDir = path.join(repoRoot, "docs", "roadmap", "epics");

// ...[rest of the file content as above]...
