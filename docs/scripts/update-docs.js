#!/usr/bin/env node

/**
 * ProspectPro Documentation Update Script
 * Unified script that generates both codebase index and system reference
 * Replaces separate generate-codebase-index.js and generate-system-reference.js calls
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = "/workspaces/ProspectPro";
const baseDir = path.resolve(repoRoot, "app/backend/functions");

// ...[rest of the file content as above]...
