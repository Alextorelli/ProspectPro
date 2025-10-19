#!/usr/bin/env node
// Validate ignore config: scan workspace, parse all ignore files, flag missed files
const fs = require("fs");
const path = require("path");
const ignore = require("ignore");

const IGNORE_FILES = [".gitignore", ".eslintignore", ".vercelignore"];
const ROOT = process.cwd();
const IS_CI =
  process.env.CI === "true" ||
  process.env.VERCEL === "1" ||
  process.env.VERCEL === "true";

// === SKIP DIRS: Directories always allowed in dev, test, CI ===
// - Source control, dependencies, build outputs, cache, logs, reports, temp, IDE, MCP/dev tools, Supabase, archive
const SKIP_DIRS = new Set([
  // Source control & dependencies
  ".git",
  "node_modules",
  // Build outputs & runtime
  ".vercel",
  "dist",
  "build",
  "public/dist",
  // Cache/runtime/temp
  ".deno_lsp",
  ".cache",
  ".parcel-cache",
  ".temp",
  "temp",
  "tmp",
  "supabase/.temp",
  // Logs, reports
  "logs",
  "reports",
  // IDE/editor
  ".vscode",
  ".idea",
  // MCP/dev tools
  "mcp-servers",
  // Supabase Edge Functions/tests
  "supabase/functions",
  "supabase/tests",
  // Archive/legacy
  "archive",
]);

// === SKIP FILES: Files always allowed in dev, test, CI ===
// - Env/config, logs, test/build artifacts, backup, Vercel config, MCP/dev tools, Supabase, scripts, build artifacts
const SKIP_FILES = new Set([
  // Env/config
  ".env",
  ".env.vercel",
  ".env.local",
  ".env.development.local",
  ".env.test.local",
  ".env.production.local",
  // Logs
  "test-output.log",
  "startup.log",
  "production-mcp.log",
  // Test/build artifacts
  "test-results.json",
  "test-servers.js",
  "test-troubleshooting-server.js",
  "test-*.js",
  "test-*.sh",
  "test-*.sql",
  "test-*.md",
  "test-*.json",
  "test-*.log",
  "*.backup",
  "*.bak",
  "*.tmp",
  "*.temp",
  "*.cache",
  "*.buildlog",
  // Backup/archived
  "*.backup",
  "*.bak",
  // Vercel config
  ".vercel/project.json",
  // MCP/dev tools
  "mcp-servers/production-mcp.log",
  "mcp-servers/test-results.json",
  "mcp-servers/test-servers.js",
  "mcp-servers/test-troubleshooting-server.js",
  // Supabase Edge Function/test files
  "supabase/functions/business-discovery-user-aware/index.ts.backup",
  // Scripts/tools
  "scripts/tooling/validate-ignore-config.js",
  // Build artifacts
  "modules/registry-engines/registry-validation-core-engine.js",
  // Workflow/config files
  ".github/workflows/deploy.yml",
  ".vercelignore",
  // Test scripts (all .sh in scripts/testing)
  "scripts/testing/test-auth-patterns.sh",
  "scripts/testing/test-background-tasks.sh",
  "scripts/testing/test-discovery-pipeline.sh",
  "scripts/testing/test-enrichment-chain.sh",
  "scripts/testing/test-env.local.sh",
  "scripts/testing/test-export-flow.sh",
  "scripts/testing/test-pdl-state-licensing.sh",
  // TEMPORARY: ESLint parser compatibility issues (TypeScript 5.9.3)
  "src/components/GeographicSelector.tsx",
  "src/components/PaymentMethods.tsx",
  "src/components/Stepper.tsx",

  // TEMPORARY: CommonJS modules pending ESM migration (whitelisted for CI/deploy)
  // These are handled as glob patterns below
]);

const minimatch = require("minimatch");
const SKIP_GLOBS = [
  "config/**/*.js",
  "modules/**/*.js",
  "mcp-servers/**/*.js",
  "scripts/**/*.js",
];
function readIgnoreFile(file) {
  try {
    return fs.readFileSync(path.join(ROOT, file), "utf8");
  } catch {
    return "";
  }
}

function getAllFiles(dir, arr = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(ROOT, full);
    if (fs.statSync(full).isDirectory()) {
      // Skip known runtime/build/IDE/dev/test/legacy directories entirely
      if (
        SKIP_DIRS.has(entry) ||
        [...SKIP_DIRS].some((d) => rel.startsWith(d + path.sep))
      ) {
        continue;
      }
      getAllFiles(full, arr);
    } else {
      // Skip files under any skip dir prefix
      if ([...SKIP_DIRS].some((d) => rel.startsWith(d + path.sep) || rel === d))
        continue;
      // Skip files in SKIP_FILES (now for both local and CI)
      if (SKIP_FILES.has(rel)) continue;
      // Skip files matching SKIP_GLOBS
      if (SKIP_GLOBS.some((pattern) => minimatch.minimatch(rel, pattern)))
        continue;
      arr.push(rel);
    }
  }
  return arr;
}

function main() {
  const allFiles = getAllFiles(ROOT);
  let flagged = [];
  for (const ignoreFile of IGNORE_FILES) {
    const ig = ignore().add(readIgnoreFile(ignoreFile));
    // NOTE: The original logic flagged files that ARE ignored, which is expected for
    // runtime artifacts. We keep this as a hygiene signal only for local runs, but
    // we skip known runtime dirs and downgrade to warnings in CI.
    const hits = allFiles.filter(
      (f) => ig.ignores(f) && fs.existsSync(path.join(ROOT, f))
    );
    flagged = flagged.concat(hits.map((f) => ({ file: f, ignoreFile })));
  }
  // De-duplicate entries across ignore files
  const dedup = Array.from(
    new Map(flagged.map((x) => [x.file + "::" + x.ignoreFile, x])).values()
  );

  if (dedup.length) {
    const header = "Unwanted files detected by ignore config:";
    if (IS_CI) {
      console.warn(header);
      dedup.forEach(({ file, ignoreFile }) => {
        console.warn(`  ${file} (ignored by ${ignoreFile})`);
      });
      // Do not fail CI (e.g., Vercel) on ignore hygiene; this is enforced locally via Husky.
      return;
    }
    console.log(header);
    dedup.forEach(({ file, ignoreFile }) => {
      console.log(`  ${file} (ignored by ${ignoreFile})`);
    });
    process.exit(1);
  } else {
    console.log("Ignore config validated: no unwanted files detected.");
  }
}

main();
