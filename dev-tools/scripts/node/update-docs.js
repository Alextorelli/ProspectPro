#!/usr/bin/env node

/**
 * ProspectPro Documentation Update Script
 * Unified script that generates both codebase index and system reference
 * Replaces separate generate-codebase-index.js and generate-system-reference.js calls
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = "/workspaces/ProspectPro";
const baseDir = path.resolve(repoRoot, "app/backend/functions");

// ============================================================================
// CODEBASE INDEX CONFIGURATION
// ============================================================================

const allowedFunctionSlugs = new Set([
  "auth-diagnostics",
  "business-discovery-background",
  "business-discovery-optimized",
  "business-discovery-user-aware",
  "business-discovery-deduplication",
  "campaign-export",
  "campaign-export-user-aware",
  "enrichment-orchestrator",
  "enrichment-hunter",
  "enrichment-neverbounce",
  "enrichment-business-license",
  "enrichment-pdl",
  "enrichment-cobalt",
  "test-google-places",
  "test-new-auth",
  "test-user-deduplication",
]);

const descriptionOverrides = new Map([
  [
    "app/backend/functions/business-discovery-background/index.ts",
    "Primary asynchronous, tier-aware discovery pipeline",
  ],
  [
    "app/backend/functions/business-discovery-optimized/index.ts",
    "Session-aware synchronous discovery path for validation campaigns",
  ],
  [
    "app/backend/functions/business-discovery-user-aware/index.ts",
    "Legacy synchronous discovery retained for backward compatibility",
  ],
  [
    "app/backend/functions/campaign-export-user-aware/index.ts",
    "Authenticated campaign export handler",
  ],
  [
    "app/backend/functions/enrichment-orchestrator/index.ts",
    "Central enrichment coordinator calling Hunter, NeverBounce, licensing",
  ],
  [
    "app/backend/functions/enrichment-hunter/index.ts",
    "Hunter.io email discovery wrapper with caching",
  ],
  [
    "app/backend/functions/enrichment-neverbounce/index.ts",
    "NeverBounce verification helper",
  ],
  [
    "app/backend/functions/enrichment-pdl/index.ts",
    "PDL enrichment logic for enterprise compliance",
  ],
  [
    "app/backend/functions/enrichment-business-license/index.ts",
    "Professional licensing enrichment module",
  ],
  [
    "app/backend/functions/test-google-places/index.ts",
    "Standalone Google Places API test harness",
  ],
  [
    "app/backend/functions/_shared/edge-auth.ts",
    "Shared Supabase session validator for edge functions",
  ],
  [
    "app/backend/functions/_shared/api-usage.ts",
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
  [
    "docs/technical/CODEBASE_INDEX.md",
    "Auto-generated index consumed by #codebase command",
  ],
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

// ============================================================================
// SYSTEM REFERENCE CONFIGURATION
// ============================================================================

const SYSTEM_CONFIG = {
  outputFile: "docs/technical/SYSTEM_REFERENCE.md",
  version: "4.3",
  projectName: "ProspectPro",
};

const MODULES = {
  discovery: {
    name: "Discovery Module",
    description: "Tier-aware async discovery with user authentication",
    primaryFunction: "business-discovery-background",
    businessLogic:
      "Multi-source business discovery → Background processing → Quality scoring",
    technicalFlow:
      "Google Places API → Foursquare Places API → Census targeting → User-aware database storage",
    coreFunctions: [
      "business-discovery-background",
      "business-discovery-optimized",
      "business-discovery-user-aware",
      "test-business-discovery",
      "test-google-places",
    ],
    sharedServices: [
      "authenticateRequest.ts",
      "business-taxonomy.ts",
      "google-places-service.ts",
      "foursquare-service.ts",
      "census-targeting.ts",
    ],
    testCommands: [
      'curl -X POST "$SUPABASE_URL/functions/v1/business-discovery-background"',
      "source scripts/ensure-supabase-cli-session.sh",
      "./scripts/campaign-validation.sh",
    ],
  },
  enrichment: {
    name: "Enrichment Module",
    description:
      "Budget-controlled multi-service coordination with tier awareness",
    primaryFunction: "enrichment-orchestrator",
    businessLogic:
      "Tier-based enrichment pipeline with 24-hour caching and circuit breakers",
    technicalFlow:
      "Hunter.io (email discovery) → NeverBounce (verification) → Cobalt SOS (filings) → Quality scoring",
    coreFunctions: [
      "enrichment-orchestrator",
      "enrichment-hunter",
      "enrichment-neverbounce",
      "enrichment-business-license",
      "enrichment-pdl",
    ],
    sharedServices: [
      "hunter-service.ts",
      "neverbounce-service.ts",
      "cobalt-sos-service.ts",
      "budget-controls.ts",
      "enrichment-cache.ts",
    ],
    testCommands: [
      'curl -X POST "$SUPABASE_URL/functions/v1/enrichment-orchestrator"',
      "./scripts/test-enrichment-pipeline.sh",
    ],
  },
  validation: {
    name: "Validation Module",
    description:
      "Session JWT enforcement across all functions with RLS policies",
    primaryFunction: "test-new-auth",
    businessLogic:
      "Contact verification with 95% email accuracy and zero fake patterns",
    technicalFlow:
      "Supabase Auth → RLS policies → Session validation → Quality scoring → Data isolation",
    coreFunctions: ["test-new-auth", "test-official-auth", "auth-diagnostics"],
    sharedServices: [
      "quality-scoring.ts",
      "data-validation.ts",
      "email-validation.ts",
      "rls-helpers.ts",
    ],
    testCommands: [
      './scripts/test-auth-patterns.sh "$SUPABASE_SESSION_JWT"',
      'curl -X POST "$SUPABASE_URL/functions/v1/test-new-auth"',
    ],
  },
};

// ============================================================================
// SHARED UTILITIES
// ============================================================================

function defaultDescription(relPath) {
  if (relPath.startsWith("app/backend/functions/")) {
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

// ============================================================================
// CODEBASE INDEX GENERATION
// ============================================================================

async function collectEdgeFunctions() {
  const baseDir = path.resolve(repoRoot, "app/backend/functions");
  console.log("[DEBUG] repoRoot:", repoRoot);
  console.log("[DEBUG] baseDir:", baseDir);
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
  const baseDir = path.join(
    repoRoot,
    "app",
    "backend",
    "supabase",
    "functions"
  );
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
  const baseDir = path.join(
    repoRoot,
    "app",
    "backend",
    "supabase",
    "functions",
    "_shared"
  );
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

function formatList(relPaths) {
  return relPaths
    .map((rel) => {
      const desc = descriptionOverrides.get(rel) ?? defaultDescription(rel);
      return `- [${rel}](${rel}) — ${desc}`;
    })
    .join("\n");
}

async function generateCodebaseIndex() {
  console.log("📝 Generating codebase index...");
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
    "scripts/update-docs.js",
    "scripts/generate-codebase-index.js",
    "scripts/generate-system-reference.js",
    "scripts/campaign-validation.sh",
    "scripts/deploy-background-tasks.sh",
    "scripts/start-mcp.sh",
    "scripts/post-session.sh",
    "scripts/ensure-supabase-cli-session.sh",
    "scripts/setup-edge-auth-env.sh",
    "scripts/stop-mcp.sh",
  ]);

  const configFiles = await filterExisting([
    "docs/technical/CODEBASE_INDEX.md",
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
    "> Primary #codebase reference. Regenerate with `npm run docs:update` before audits or deployments."
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
    "1. Run `npm run docs:update` after modifying edge functions, frontend workflow, or security policies."
  );
  lines.push(
    "2. Commit the refreshed `docs/technical/CODEBASE_INDEX.md` alongside your changes so #codebase stays current."
  );
  lines.push(
    "3. Legacy documentation referencing the codebase is archived—treat this file as the single source of truth."
  );
  lines.push("");

  const destination = path.join(repoRoot, "docs/technical/CODEBASE_INDEX.md");
  await fs.writeFile(destination, lines.join("\n"));
  console.log(`   ✅ docs/technical/CODEBASE_INDEX.md updated`);
}

// ============================================================================
// SYSTEM REFERENCE GENERATION
// ============================================================================

function getDisplayName(filename) {
  const displayNames = {
    "business-discovery-background": "Tier-aware async discovery",
    "business-discovery-optimized": "Session-aware sync discovery",
    "business-discovery-user-aware": "Legacy compatibility discovery",
    "test-business-discovery": "Discovery smoke tests",
    "test-google-places": "Google Places API testing",
    "enrichment-orchestrator": "Multi-service coordination",
    "enrichment-hunter": "Hunter.io email discovery + 24hr caching",
    "enrichment-neverbounce": "NeverBounce email verification",
    "enrichment-business-license": "Professional licensing data (Enterprise)",
    "enrichment-pdl": "People Data Labs integration (Enterprise)",
    "test-new-auth": "Session diagnostics & RLS validation",
    "test-official-auth": "Supabase reference auth implementation",
    "auth-diagnostics": "Authentication testing suite",
    "authenticateRequest.ts": "Session JWT validation",
    "business-taxonomy.ts": "MECE business categories (300+ types)",
    "google-places-service.ts": "Google Places API integration",
    "foursquare-service.ts": "Foursquare Places API integration",
    "census-targeting.ts": "Geographic targeting logic",
    "hunter-service.ts": "Hunter.io API client with caching",
    "neverbounce-service.ts": "NeverBounce verification client",
    "cobalt-sos-service.ts": "Secretary of State filings (cache-first)",
    "budget-controls.ts": "Tier-based cost management",
    "enrichment-cache.ts": "24-hour result caching system",
    "quality-scoring.ts": "Lead confidence scoring (0-100)",
    "data-validation.ts": "Contact data verification",
    "email-validation.ts": "Email pattern validation (rejects fake emails)",
    "rls-helpers.ts": "Row Level Security validation helpers",
  };
  return displayNames[filename] || filename;
}

function generateModuleSection(moduleName, module) {
  return `
## ${module.name}

### Core Architecture
- **Primary Function**: \`${module.primaryFunction}\` - ${module.description}
- **Business Logic**: ${module.businessLogic}
- **Technical Flow**: ${module.technicalFlow}

### Key Files
\`\`\`typescript
// Core ${module.name} Functions
${module.coreFunctions
  .map(
    (func) =>
      `/app/backend/functions/${func}/                    # ${
        func === module.primaryFunction ? "PRIMARY: " : ""
      }${getDisplayName(func)}`
  )
  .join("\n")}

// Supporting Services
${module.sharedServices
  .map(
    (service) =>
      `/app/backend/functions/_shared/${service}         # ${getDisplayName(
        service
      )}`
  )
  .join("\n")}
\`\`\`

### Quick Commands
\`\`\`bash
${module.testCommands.map((cmd) => `# Test ${moduleName}\n${cmd}`).join("\n\n")}
\`\`\`
`;
}

async function generateSystemReference() {
  console.log("📚 Generating system reference...");
  const timestamp = new Date().toISOString().split("T")[0];

  const content = `# ${SYSTEM_CONFIG.projectName} v${
    SYSTEM_CONFIG.version
  } System Reference Guide

*Auto-generated: ${timestamp} - Tier-Aware Background Discovery & Verification System*

**Quick Navigation**: [Discovery](#discovery-module) | [Enrichment](#enrichment-module) | [Validation](#validation-module) | [Maintenance](#maintenance-commands)

---
${generateModuleSection("discovery", MODULES.discovery)}
---
${generateModuleSection("enrichment", MODULES.enrichment)}
---
${generateModuleSection("validation", MODULES.validation)}
---

## Cross-Module Integration

### Export System (User-Aware)
\`\`\`typescript
// User-authorized exports with enrichment metadata
app/backend/functions/campaign-export-user-aware/       # PRIMARY: User-authorized exports
app/backend/functions/campaign-export/                  # Internal automation export

// Export features
- User ownership validation
- Enrichment metadata inclusion
- Confidence score reporting
- Source attribution
- Data isolation enforcement
\`\`\`

### Shared Authentication Infrastructure
\`\`\`typescript
app/backend/functions/_shared/authenticateRequest.ts    # Session JWT validation
app/backend/functions/_shared/rls-helpers.ts             # RLS policy helpers
app/backend/functions/_shared/user-context.ts           # User session management

// Authentication pattern (all functions)
const user = await authenticateRequest(request);
// Enforces session JWT + RLS policies
\`\`\`

## Maintenance Commands

### Keep System Reference Current
\`\`\`bash
# Full documentation update (codebase index + system reference)
npm run docs:update

# Update after deployments (automatic via postdeploy hook)
npm run postdeploy
\`\`\`

### Deployment & Testing Workflow
\`\`\`bash
# 1. Ensure Supabase CLI session
source scripts/ensure-supabase-cli-session.sh

# 2. Deploy all core functions
cd /workspaces/ProspectPro/supabase && \\
npx --yes supabase@latest functions deploy business-discovery-background && \\
npx --yes supabase@latest functions deploy enrichment-orchestrator && \\
npx --yes supabase@latest functions deploy campaign-export-user-aware

# 3. Test core functionality
./scripts/test-auth-patterns.sh "$SUPABASE_SESSION_JWT"
./scripts/campaign-validation.sh

# 4. Update documentation
npm run docs:update
\`\`\`

### Environment Verification Checklist
- [ ] Frontend publishable key (\`sb_publishable_*\`) matches Supabase dashboard
- [ ] Frontend/services forward Supabase session JWTs on authenticated requests
- [ ] RLS policies active for campaigns, leads, dashboard_exports tables
- [ ] Edge Function secrets configured: GOOGLE_PLACES_API_KEY, HUNTER_IO_API_KEY, NEVERBOUNCE_API_KEY, FOURSQUARE_API_KEY, COBALT_INTELLIGENCE_API_KEY
- [ ] Database tables exist with user columns: campaigns, leads, dashboard_exports, campaign_analytics view
- [ ] Production URL accessible: https://prospect-fyhedobh1-appsmithery.vercel.app
- [ ] User authentication system working (signup/signin/session management)

---

## Current Production Status

### Deployment URLs
- **Production Frontend**: https://prospectpro.appsmithery.co
- **Edge Functions**: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/
- **Database**: Supabase project \`sriycekxdqnesdsgwiuc\`

### System Health
- ✅ **Edge Functions**: All deployed and operational with user authentication
- ✅ **Database**: RLS policies active, user-aware schema implemented  
- ✅ **Frontend**: Static deployment with session management
- ✅ **API Integrations**: Google Places, Hunter.io, NeverBounce, Cobalt Intelligence configured
- ✅ **User Authentication**: Complete signup/signin with session JWT enforcement
- ✅ **Data Quality**: 95% email accuracy, zero fake data tolerance maintained

### Architecture Benefits
- **90% Cost Reduction**: Serverless functions vs. container infrastructure
- **<100ms Cold Starts**: Global edge deployment via Supabase
- **Auto-Scaling**: Native Supabase Edge Function scaling
- **Zero Infrastructure Management**: Platform-managed serverless architecture
- **Enterprise Security**: RLS policies + session JWT authentication

---

*Last Updated: ${timestamp} | Auto-generated from ${
    SYSTEM_CONFIG.projectName
  } v${SYSTEM_CONFIG.version} codebase analysis*
*Run \`npm run docs:update\` to regenerate this reference*`;

  const outputPath = path.join(repoRoot, SYSTEM_CONFIG.outputFile);
  await fs.writeFile(outputPath, content, "utf8");
  console.log(`   ✅ ${SYSTEM_CONFIG.outputFile} updated`);
}

// ============================================================================
// TASKS REFERENCE GENERATION
// ============================================================================

async function generateTasksReference() {
  console.log("📋 Generating VS Code Tasks Reference...");

  const tasksPath = path.join(repoRoot, ".vscode", "tasks.json");
  const tasksContent = await fs.readFile(tasksPath, "utf8");
  const tasksConfig = JSON.parse(tasksContent);

  const timestamp = new Date().toISOString();
  const lines = [];

  lines.push("# ProspectPro VS Code Tasks Reference");
  lines.push("");
  lines.push(
    `_Auto-generated from \`.vscode/tasks.json\` — Last updated: ${
      timestamp.split("T")[0]
    }_`
  );
  lines.push("");
  lines.push(
    '**Quick Access**: Press `Ctrl+Shift+P` → "Tasks: Run Task" → Select from list below'
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // Group tasks by category
  const categories = {
    "Supabase & Database": [],
    "Edge Functions": [],
    "Testing & Diagnostics": [],
    "Build & Deployment": [],
    Documentation: [],
    "Roadmap Management": [],
    Miscellaneous: [],
  };

  // Categorize tasks
  for (const task of tasksConfig.tasks) {
    if (!task.label) continue;

    let category = "Miscellaneous";
    if (task.label.includes("Supabase") || task.label.includes("Database")) {
      category = "Supabase & Database";
    } else if (
      task.label.includes("Edge Function") ||
      task.label.includes("Function")
    ) {
      category = "Edge Functions";
    } else if (
      task.label.includes("Test") ||
      task.label.includes("Diagnostic")
    ) {
      category = "Testing & Diagnostics";
    } else if (task.label.includes("Build") || task.label.includes("Deploy")) {
      category = "Build & Deployment";
    } else if (task.label.includes("Doc")) {
      category = "Documentation";
    } else if (task.label.includes("Roadmap") || task.label.includes("Epic")) {
      category = "Roadmap Management";
    }

    categories[category].push(task);
  }

  // Generate navigation
  lines.push("## 🗂️ Task Categories");
  lines.push("");
  const navItems = [];
  for (const cat of Object.keys(categories)) {
    if (categories[cat].length > 0) {
      navItems.push(
        `- [${cat}](#${cat.toLowerCase().replace(/[^a-z0-9]+/g, "-")})`
      );
    }
  }
  lines.push(navItems.join("\n"));
  lines.push("");
  lines.push("---");
  lines.push("");

  // Generate each category section
  for (const [categoryName, tasks] of Object.entries(categories)) {
    if (tasks.length === 0) continue;

    lines.push(`## ${categoryName}`);
    lines.push("");
    lines.push(
      "| Task Label | Command | Script/Config | Inputs | Description |"
    );
    lines.push(
      "|------------|---------|---------------|--------|-------------|"
    );

    for (const task of tasks) {
      const label = `**${task.label}**`;

      let command = "";
      if (task.type === "shell") {
        if (task.command) {
          command = `\`${task.command}${
            task.args ? " " + task.args.join(" ") : ""
          }\``;
        } else if (task.args) {
          command = `\`${task.args.join(" ")}\``;
        }
      } else if (task.type === "npm") {
        command = `\`npm run ${task.script}\``;
      } else if (task.dependsOn) {
        command =
          task.dependsOrder === "sequence"
            ? "`Sequential composite`"
            : "`Parallel composite`";
      }

      let scriptConfig = "";
      const scripts = [];
      if (task.options?.cwd && task.options.cwd !== "${workspaceFolder}") {
        scripts.push(`\`${task.options.cwd}\``);
      }
      if (task.dependsOn) {
        scripts.push("Multiple");
      } else if (task.type === "npm") {
        scripts.push(`[\`package.json\`](../package.json)`);
        if (task.dependsOn) scripts.push("Multiple");
      } else if (task.args) {
        for (const arg of task.args) {
          if (arg.includes("scripts/")) {
            const scriptPath = arg.replace("../", "").replace("./", "");
            scripts.push(
              `[\`${scriptPath}\`](${
                scriptPath.startsWith("scripts/")
                  ? `../${scriptPath}`
                  : `../scripts/${scriptPath}`
              })`
            );
          }
        }
        if (scripts.length === 0) scripts.push("Multiple");
      }
      scriptConfig = scripts.join(", ");

      const inputs = task.dependsOn
        ? "None"
        : task.args && task.args.some((arg) => arg.includes("${input:"))
        ? task.args
            .find((arg) => arg.includes("${input:"))
            ?.match(/\$\{input:([^}]+)\}/)?.[1] || "None"
        : "None";

      const description = task.dependsOn
        ? `Runs: ${
            Array.isArray(task.dependsOn)
              ? task.dependsOn.join(" → ")
              : task.dependsOn
          }`
        : task.problemMatcher
        ? "No description available"
        : "No description available";

      lines.push(
        `| ${label} | ${command} | ${scriptConfig} | ${inputs} | ${description} |`
      );
    }

    lines.push("");
  }

  const outputPath = path.join(repoRoot, ".vscode", "TASKS_REFERENCE.md");
  await fs.writeFile(outputPath, lines.join("\n"));
  console.log(`   ✅ .vscode/TASKS_REFERENCE.md updated`);
}

async function noteTaxonomyStaging() {
  const troubleshootingDir = path.join(repoRoot, "docs/tooling/troubleshooting");
  if (!(await pathExists(troubleshootingDir))) {
    return;
  }

  const entries = await fs.readdir(troubleshootingDir);
  const usefulEntries = entries.filter((name) => name !== ".gitkeep");
  if (usefulEntries.length === 0) {
    return;
  }

  const coveragePath = path.join(repoRoot, "reports/context/coverage.md");
  if (!(await pathExists(coveragePath))) {
    return;
  }

  const marker =
    "- Taxonomy troubleshooting artifacts detected in `docs/tooling/troubleshooting/` (review before promotion).";
  let coverage = await fs.readFile(coveragePath, "utf8");
  if (coverage.includes(marker)) {
    return;
  }

  const sectionHeader = "## Key Changes Since Last Report";
  const headerIndex = coverage.indexOf(sectionHeader);
  if (headerIndex === -1) {
    return;
  }

  const sectionEnd = coverage.indexOf("\n\n---", headerIndex);
  const insertionIndex = sectionEnd === -1 ? coverage.length : sectionEnd;

  let prefix = coverage.slice(0, insertionIndex);
  const suffix = coverage.slice(insertionIndex);
  if (!prefix.endsWith("\n")) {
    prefix += "\n";
  }
  coverage = `${prefix}${marker}\n${suffix}`;
  await fs.writeFile(coveragePath, coverage, "utf8");
  console.log(
    "   ℹ️ reports/context/coverage.md annotated with taxonomy troubleshooting reminder"
  );
}

async function main() {
  console.log("🔄 ProspectPro Documentation Update");
  console.log("=====================================");
  console.time("docs:update");

  try {
    await generateCodebaseIndex();
    await generateSystemReference();
    await generateTasksReference();
    await noteTaxonomyStaging();

    console.log("");
    console.log("✅ Documentation updated successfully");
    console.log(
      `   📊 ${Object.keys(MODULES).length} modules + ${
        allowedFunctionSlugs.size
      } functions documented`
    );
    console.timeEnd("docs:update");
  } catch (error) {
    console.error("❌ Documentation update failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
