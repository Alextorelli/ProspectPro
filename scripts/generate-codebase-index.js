#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const allowedFunctionSlugs = new Set([
  "auth-diagnostics",
  "business-discovery-background",
  "business-discovery-optimized",
  "business-discovery-user-aware",
  "campaign-export",
  "campaign-export-user-aware",
  "enrichment-orchestrator",
  "enrichment-hunter",
  "enrichment-neverbounce",
  "enrichment-business-license",
  "enrichment-pdl",
  "test-google-places",
  "test-user-deduplication",
]);

const descriptionOverrides = new Map([
  [
    "supabase/functions/business-discovery-background/index.ts",
    "Primary asynchronous, tier-aware discovery pipeline",
  ],
  [
    "supabase/functions/business-discovery-optimized/index.ts",
    "Session-aware synchronous discovery path for validation campaigns",
  ],
  [
    "supabase/functions/business-discovery-user-aware/index.ts",
    "Legacy synchronous discovery retained for backward compatibility",
  ],
  [
    "supabase/functions/campaign-export-user-aware/index.ts",
    "Authenticated campaign export handler",
  ],
  [
    "supabase/functions/enrichment-orchestrator/index.ts",
    "Central enrichment coordinator calling Hunter, NeverBounce, licensing",
  ],
  [
    "supabase/functions/enrichment-hunter/index.ts",
    "Hunter.io email discovery wrapper with caching",
  ],
  [
    "supabase/functions/enrichment-neverbounce/index.ts",
    "NeverBounce verification helper",
  ],
  [
    "supabase/functions/enrichment-pdl/index.ts",
    "PDL enrichment logic for enterprise compliance",
  ],
  [
    "supabase/functions/enrichment-business-license/index.ts",
    "Professional licensing enrichment module",
  ],
  [
    "supabase/functions/test-google-places/index.ts",
    "Standalone Google Places API test harness",
  ],
  [
    "supabase/functions/_shared/edge-auth.ts",
    "Shared Supabase session validator for edge functions",
  ],
  [
    "supabase/functions/_shared/api-usage.ts",
    "Usage logging helper for third-party API consumption",
  ],
  [
    "src/lib/supabase.ts",
    "Frontend Supabase client + authenticated function invocation helper",
  ],
  [
    "src/hooks/useBusinessDiscovery.ts",
    "Primary frontend hook orchestrating discovery workflow",
  ],
  [
    "src/contexts/AuthContext.tsx",
    "React context handling Supabase auth state transitions",
  ],
  [
    "src/pages/Dashboard.tsx",
    "Dashboard page retrieving campaigns and showing status",
  ],
  [
    "src/pages/BusinessDiscovery.tsx",
    "Campaign launch UI orchestrating discovery workflow",
  ],
  [
    "src/components/GeographicSelector.tsx",
    "Location selector used in campaign creation",
  ],
  [
    "src/hooks/useJobProgress.tsx",
    "Hook tracking asynchronous discovery job progress",
  ],
  [
    "supabase/schema-sql/001_core_schema.sql",
    "Canonical campaigns/leads/exports tables with RLS and analytics view",
  ],
  [
    "supabase/schema-sql/002_user_functions.sql",
    "User-aware helper functions and security validators",
  ],
  [
    "supabase/schema-sql/003_deduplication.sql",
    "Deduplication ledger plus hash/filter routines",
  ],
  [
    "supabase/schema-sql/004_enrichment_cache.sql",
    "Enrichment cache tables, views, and maintenance helpers",
  ],
  ["CODEBASE_INDEX.md", "Auto-generated index consumed by #codebase command"],
  [
    ".github/copilot-instructions.md",
    "AI assistant operating instructions (keep in sync)",
  ],
  [
    ".vscode/settings.json",
    "Workspace defaults for Supabase + Copilot context",
  ],
  [
    ".vscode/prospectpro-supabase.code-workspace",
    "Workspace file bundling tasks and recommendations",
  ],
  [
    ".devcontainer/devcontainer.json",
    "Codespace image settings + post-create automation",
  ],
  ["mcp-config.json", "Global MCP server configuration"],
  [".vscode/mcp-config.json", "VS Code MCP wiring"],
]);

function defaultDescription(relPath) {
  if (relPath.startsWith("supabase/functions/")) {
    if (relPath.endsWith("function.toml")) {
      return "Supabase function configuration";
    }
    return "Supabase Edge Function module";
  }
  if (relPath.startsWith("src/")) {
    return "React frontend module";
  }
  if (relPath.startsWith("supabase/schema-sql/")) {
    return "Database schema artifact";
  }
  if (relPath.startsWith("database/")) {
    return "Database migration/utility";
  }
  if (relPath.startsWith("scripts/")) {
    return "Project maintenance script";
  }
  if (relPath.startsWith("public/")) {
    return "Static asset";
  }
  if (relPath.startsWith(".vscode/")) {
    return "Workspace configuration";
  }
  return "Project file";
}

async function pathExists(absPath) {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

async function collectEdgeFunctions() {
  const baseDir = path.join(repoRoot, "supabase", "functions");
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const items = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    if (!allowedFunctionSlugs.has(entry.name)) continue;
    const indexPath = path.join(baseDir, entry.name, "index.ts");
    if (!(await pathExists(indexPath))) continue;
    const rel = path.relative(repoRoot, indexPath).replace(/\\/g, "/");
    items.push(rel);
  }
  items.sort();
  return items;
}

async function collectFunctionConfigs() {
  const baseDir = path.join(repoRoot, "supabase", "functions");
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const items = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    if (!allowedFunctionSlugs.has(entry.name)) continue;
    const configPath = path.join(baseDir, entry.name, "function.toml");
    if (!(await pathExists(configPath))) continue;
    const rel = path.relative(repoRoot, configPath).replace(/\\/g, "/");
    items.push(rel);
  }
  items.sort();
  return items;
}

async function collectSharedModules() {
  const baseDir = path.join(repoRoot, "supabase", "functions", "_shared");
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) =>
      path
        .relative(repoRoot, path.join(baseDir, entry.name))
        .replace(/\\/g, "/")
    )
    .sort();
}

async function filterExisting(paths) {
  const results = [];
  for (const rel of paths) {
    const abs = path.join(repoRoot, rel);
    if (await pathExists(abs)) {
      results.push(rel);
    }
  }
  return results;
}

function formatList(relPaths) {
  return relPaths
    .map((rel) => {
      const desc = descriptionOverrides.get(rel) ?? defaultDescription(rel);
      return `- [${rel}](${rel}) — ${desc}`;
    })
    .join("\n");
}

async function main() {
  const timestamp = new Date().toISOString();

  const edgeFunctions = await collectEdgeFunctions();
  const sharedModules = await collectSharedModules();
  const functionConfigs = await collectFunctionConfigs();

  const frontendFiles = await filterExisting([
    "src/App.tsx",
    "src/main.tsx",
    "src/hooks/useBusinessDiscovery.ts",
    "src/hooks/useJobProgress.tsx",
    "src/contexts/AuthContext.tsx",
    "src/pages/Dashboard.tsx",
    "src/pages/BusinessDiscovery.tsx",
    "src/lib/supabase.ts",
    "src/components/GeographicSelector.tsx",
    "src/stores/campaignStore.ts",
    "src/utils/campaignHelpers.ts",
  ]);

  const staticAssets = await filterExisting([
    "index.html",
    "public/index-supabase.html",
  ]);

  const databaseFiles = await filterExisting([
    "supabase/schema-sql/001_core_schema.sql",
    "supabase/schema-sql/002_user_functions.sql",
    "supabase/schema-sql/003_deduplication.sql",
    "supabase/schema-sql/004_enrichment_cache.sql",
  ]);

  const automationFiles = await filterExisting([
    "scripts/generate-codebase-index.js",
    "scripts/campaign-validation.sh",
    "scripts/deploy-background-tasks.sh",
    "scripts/start-mcp.sh",
    "scripts/post-session.sh",
    "scripts/ensure-supabase-cli-session.sh",
    "scripts/setup-edge-auth-env.sh",
    "scripts/stop-mcp.sh",
  ]);

  const configFiles = await filterExisting([
    "CODEBASE_INDEX.md",
    ".github/copilot-instructions.md",
    ".vscode/settings.json",
    ".vscode/prospectpro-supabase.code-workspace",
    ".devcontainer/devcontainer.json",
    "mcp-config.json",
    ".vscode/mcp-config.json",
  ]);

  const sections = [
    {
      title: "Supabase Edge Functions",
      items: edgeFunctions,
    },
    {
      title: "Edge Function Configuration",
      items: functionConfigs,
    },
    {
      title: "Shared Edge Utilities",
      items: sharedModules,
    },
    {
      title: "Frontend Core",
      items: frontendFiles,
    },
    {
      title: "Static Entry Points",
      items: staticAssets,
    },
    {
      title: "Database & Security Artifacts",
      items: databaseFiles,
    },
    {
      title: "Automation & Scripts",
      items: automationFiles,
    },
    {
      title: "Configuration & Policies",
      items: configFiles,
    },
  ].filter((section) => section.items.length > 0);

  const lines = [];
  lines.push("# ProspectPro Codebase Index");
  lines.push("");
  lines.push(
    "> Primary #codebase reference. Regenerate with `npm run codebase:index` before audits or deployments."
  );
  lines.push("");
  lines.push(`_Last generated: ${timestamp}_`);
  lines.push("");

  for (const section of sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push(formatList(section.items));
    lines.push("");
  }

  lines.push("## Update Procedure");
  lines.push("");
  lines.push(
    "1. Run `npm run codebase:index` after modifying edge functions, frontend workflow, or security policies."
  );
  lines.push(
    "2. Commit the refreshed `CODEBASE_INDEX.md` alongside your changes so #codebase stays current."
  );
  lines.push(
    "3. Legacy documentation referencing the codebase is archived—treat this file as the single source of truth."
  );
  lines.push("");

  const destination = path.join(repoRoot, "CODEBASE_INDEX.md");
  await fs.writeFile(destination, lines.join("\n"));
}

main().catch((error) => {
  console.error("Failed to generate CODEBASE_INDEX.md", error);
  process.exitCode = 1;
});
