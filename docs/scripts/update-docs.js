#!/usr/bin/env node

/**
 * ProspectPro Documentation Update Script
 * Unified script that generates both codebase index and system reference
 * Replaces separate generate-codebase-index.js and generate-system-reference.js calls
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const functionsRoot = path.join(repoRoot, "app/backend/functions");
const sharedRoot = path.join(functionsRoot, "_shared");
const sessionStoreDir = path.join(
  repoRoot,
  "dev-tools/workspace/context/session_store"
);

const functionDescriptions = {
  "auth-diagnostics": "Authentication diagnostics and JWT validation helpers",
  "business-discovery-background": "Tier-aware asynchronous discovery pipeline",
  "business-discovery-optimized":
    "Session-aware synchronous discovery workflow",
  "business-discovery-user-aware":
    "Legacy synchronous discovery maintained for compatibility",
  "campaign-export": "Internal automation export handler",
  "campaign-export-user-aware": "User-authorised campaign export function",
  "enrichment-business-license": "Professional licensing enrichment module",
  "enrichment-cobalt": "Cobalt SOS enrichment connector",
  "enrichment-hunter": "Hunter.io discovery and caching wrapper",
  "enrichment-neverbounce": "NeverBounce verification helper",
  "enrichment-orchestrator":
    "Primary enrichment coordinator orchestrating downstream providers",
  "enrichment-pdl": "People Data Labs enrichment integration",
};

const sharedDescriptions = {
  "api-usage.ts": "Usage logging helper for third-party APIs",
  "cache-manager.ts": "Cache utilities for Supabase Edge functions",
  "cobalt-cache.ts": "Cobalt Intelligence cache controller",
  "edge-auth-simplified.ts": "Simplified session verification helper",
  "edge-auth.ts": "Shared Supabase edge authentication",
  "vault-client.ts": "Vault client utilities for secret access",
};

const systemModules = [
  {
    id: "discovery-module",
    title: "Discovery Module",
    primary: "business-discovery-background",
    summary:
      "Tier-aware async discovery that sources business prospects and persists campaign-ready records.",
    flow: "Google Places → Foursquare Places → Census targeting → Lead persistence",
    keyFiles: [
      "app/backend/functions/business-discovery-background/",
      "app/backend/functions/business-discovery-optimized/",
      "app/backend/functions/business-discovery-user-aware/",
      "app/backend/functions/tests/business-discovery.test.ts",
      "app/backend/functions/tests/test-google-places/",
    ],
    supporting: [
      "app/backend/functions/_shared/edge-auth.ts",
      "app/backend/functions/_shared/edge-auth-simplified.ts",
      "app/backend/functions/_shared/vault-client.ts",
      "app/backend/functions/_shared/api-usage.ts",
      "app/backend/functions/_shared/cache-manager.ts",
    ],
    commands: [
      'curl -X POST "$SUPABASE_URL/functions/v1/business-discovery-background"',
      "npm run supabase:test:functions",
      "npm run validate:contexts",
    ],
  },
  {
    id: "enrichment-module",
    title: "Enrichment Module",
    primary: "enrichment-orchestrator",
    summary:
      "Budget-controlled enrichment that coordinates Hunter, NeverBounce, and licensing providers.",
    flow: "Hunter.io → NeverBounce → Cobalt SOS → Quality scoring",
    keyFiles: [
      "app/backend/functions/enrichment-orchestrator/",
      "app/backend/functions/enrichment-hunter/",
      "app/backend/functions/enrichment-neverbounce/",
      "app/backend/functions/enrichment-business-license/",
      "app/backend/functions/enrichment-pdl/",
    ],
    supporting: [
      "app/backend/functions/_shared/api-usage.ts",
      "app/backend/functions/_shared/cache-manager.ts",
      "app/backend/functions/_shared/cobalt-cache.ts",
      "app/backend/functions/_shared/vault-client.ts",
      "app/backend/functions/_shared/edge-auth.ts",
    ],
    commands: [
      'curl -X POST "$SUPABASE_URL/functions/v1/enrichment-orchestrator"',
      "npm run supabase:test:functions",
    ],
  },
  {
    id: "validation-module",
    title: "Validation Module",
    primary: "test-new-auth",
    summary:
      "Session diagnostics ensuring all edge functions enforce RLS and zero fake data policies.",
    flow: "Supabase Auth → RLS enforcement → Validation diagnostics",
    keyFiles: [
      "app/backend/functions/test-new-auth/",
      "app/backend/functions/auth-diagnostics/",
      "app/backend/functions/tests/test-new-auth/",
    ],
    supporting: [
      "app/backend/functions/_shared/edge-auth.ts",
      "app/backend/functions/_shared/edge-auth-simplified.ts",
      "app/backend/functions/_shared/vault-client.ts",
      "app/backend/functions/_shared/api-usage.ts",
    ],
    commands: [
      "npm run supabase:test:db",
      'curl -X POST "$SUPABASE_URL/functions/v1/test-new-auth"',
    ],
  },
];

const crossModule = {
  exportFiles: [
    "app/backend/functions/campaign-export-user-aware/",
    "app/backend/functions/campaign-export/",
  ],
  authFiles: [
    "app/backend/functions/_shared/edge-auth.ts",
    "app/backend/functions/_shared/edge-auth-simplified.ts",
    "app/backend/functions/_shared/vault-client.ts",
  ],
};

const envChecklist = [
  "Frontend publishable key matches Supabase dashboard",
  "Session JWTs forwarded on authenticated requests",
  "RLS policies active for campaigns, leads, and exports",
  "Edge Function secrets configured for Google Places, Hunter.io, NeverBounce, Foursquare, Cobalt",
  "User-owned tables populated: campaigns, leads, dashboard_exports",
  "Production URL reachable: https://prospectpro.appsmithery.co",
  "Authentication flows (signup, signin, session persist) operational",
];

const deploymentUrls = [
  "Production Frontend: https://prospectpro.appsmithery.co",
  "Edge Functions: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/",
  "Database: Supabase project sriycekxdqnesdsgwiuc",
];

function formatList(items, indent = "") {
  return items.map((item) => `${indent}- ${item}`).join("\n");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readEdgeFunctions() {
  const entries = await fs.readdir(functionsRoot, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared")
    .map((entry) => entry.name)
    .sort();

  const results = [];
  for (const name of dirs) {
    const relPath = `app/backend/functions/${name}/index.ts`;
    const absPath = path.join(functionsRoot, name, "index.ts");
    if (!(await fileExists(absPath))) {
      continue;
    }
    results.push({
      name,
      relPath,
      description:
        functionDescriptions[name] || "Supabase Edge Function module",
    });
  }
  return results;
}

async function listSharedUtilities() {
  const files = await fs.readdir(sharedRoot);
  return files
    .filter((file) => file.endsWith(".ts"))
    .sort()
    .map((file) => ({
      relPath: `app/backend/functions/_shared/${file}`,
      description: sharedDescriptions[file] || "Shared Supabase utility",
    }));
}

function buildCodebaseIndex(edgeFunctions, sharedUtilities) {
  const now = new Date().toISOString();
  const sections = [];
  sections.push(
    `# ProspectPro Codebase Index\n\n> Primary #codebase reference. Regenerate with \`npm run docs:update\` before audits or deployments.\n\n_Last generated: ${now}_\n`
  );

  sections.push("## Supabase Edge Functions\n");
  sections.push(
    edgeFunctions
      .map((fn) => `- [${fn.relPath}](${fn.relPath}) — ${fn.description}`)
      .join("\n")
  );

  sections.push("\n## Shared Edge Utilities\n");
  sections.push(
    sharedUtilities
      .map(
        (util) => `- [${util.relPath}](${util.relPath}) — ${util.description}`
      )
      .join("\n")
  );

  sections.push(
    `\n## Configuration & Policies\n\n${formatList([
      "[docs/technical/CODEBASE_INDEX.md](docs/technical/CODEBASE_INDEX.md) — Auto-generated index consumed by #codebase",
      "[.github/copilot-instructions.md](.github/copilot-instructions.md) — AI assistant operating instructions",
      "[.vscode/settings.json](.vscode/settings.json) — Workspace defaults for Supabase and MCP tooling",
      "[.vscode/prospectpro-supabase.code-workspace](.vscode/prospectpro-supabase.code-workspace) — Task and workspace orchestration",
      "[.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) — Codespace image settings and automation",
    ])}\n`
  );

  sections.push(
    `\n## Update Procedure\n\n${formatList([
      "Run `npm run docs:update` after modifying edge functions, tooling, or security policies.",
      "Commit the refreshed documentation so chat participants stay aligned.",
      "Archive prior indexes in `dev-tools/workspace/context/archive/` when performing major restructures.",
    ])}\n`
  );

  return sections.join("\n");
}

function buildSystemReference(edgeFunctions) {
  const generatedOn = new Date().toISOString().split("T")[0];
  const lines = [];
  lines.push(
    `# ProspectPro v4.3 System Reference Guide\n\n*Auto-generated: ${generatedOn} - Tier-Aware Background Discovery & Verification System*\n`
  );
  lines.push(
    "**Quick Navigation**: " +
      systemModules.map((mod) => `[${mod.title}](#${mod.id})`).join(" | ")
  );
  lines.push("\n---\n");

  for (const mod of systemModules) {
    lines.push(`\n## ${mod.title}\n`);
    lines.push(`- **Primary Function**: \`${mod.primary}\` — ${mod.summary}`);
    lines.push(`- **Technical Flow**: ${mod.flow}\n`);

    lines.push("### Key Files\n");
    lines.push("```typescript");
    for (const file of mod.keyFiles) {
      lines.push(`${file}`);
    }
    lines.push("```");

    lines.push("\n### Supporting Services\n");
    lines.push("```typescript");
    for (const file of mod.supporting) {
      lines.push(`${file}`);
    }
    lines.push("```");

    lines.push("\n### Quick Commands\n");
    lines.push("```bash");
    for (const cmd of mod.commands) {
      lines.push(cmd);
    }
    lines.push("```");
    lines.push("\n---\n");
  }

  lines.push("\n## Cross-Module Integration\n");
  lines.push("### Export System (User-Aware)\n");
  lines.push("```typescript");
  for (const file of crossModule.exportFiles) {
    lines.push(file);
  }
  lines.push("```");

  lines.push("\n### Shared Authentication Infrastructure\n");
  lines.push("```typescript");
  for (const file of crossModule.authFiles) {
    lines.push(file);
  }
  lines.push("```");

  lines.push(
    `\n## Maintenance Commands\n\n\`\`\`bash\n# Full documentation update\nnpm run docs:update\n\n# Validate MCP and Supabase contexts\nnpm run validate:contexts\nsource dev-tools/scripts/operations/ensure-supabase-cli-session.sh\n\`\`\`\n`
  );

  lines.push("### Deployment & Testing Workflow\n");
  lines.push("```bash");
  lines.push("# Ensure Supabase session");
  lines.push(
    "source dev-tools/scripts/operations/ensure-supabase-cli-session.sh"
  );
  lines.push("\n# Deploy core functions");
  lines.push("cd /workspaces/ProspectPro/supabase");
  for (const fn of edgeFunctions.slice(0, 5)) {
    lines.push(
      `npx --yes supabase@latest functions deploy ${fn.name} --no-verify-jwt`
    );
  }
  lines.push("\n# Run validation suites");
  lines.push("npm run docs:update");
  lines.push("npm run lint");
  lines.push("npm test");
  lines.push("```");

  lines.push("\n### Environment Verification Checklist\n");
  lines.push(formatList(envChecklist));

  lines.push("\n## Current Production Status\n");
  lines.push("### Deployment URLs\n");
  lines.push(formatList(deploymentUrls));

  lines.push("\n### System Health\n");
  lines.push(
    formatList([
      "Edge Functions deployed and authenticated",
      "Database RLS policies enforced",
      "Frontend session management active",
      "API integrations validated (Google Places, Hunter.io, NeverBounce, Cobalt)",
      "Zero fake data policy enforced",
    ])
  );

  lines.push(
    "\n### Architecture Benefits\n" +
      formatList([
        "Cost reduction via serverless edge functions",
        "Global edge cold starts under 100ms",
        "Platform-managed auto scaling",
        "No container orchestration overhead",
      ])
  );

  return lines.join("\n");
}

function buildLiveToolingList(edgeFunctions) {
  const header = [
    "#discovery-module",
    "#enrichment-module",
    "#validation-module",
    "#maintenance-commands",
    ".devcontainer/devcontainer.json",
    ".github/copilot-instructions.md",
    ".vscode/settings.json",
  ];

  const functionPaths = edgeFunctions
    .map((fn) => fn.relPath)
    .sort((a, b) => a.localeCompare(b));

  const sharedPaths = Object.keys(sharedDescriptions)
    .map((key) => `app/backend/functions/_shared/${key}`)
    .sort();

  return [...header, "", ...functionPaths, "", ...sharedPaths].join("\n");
}

async function writeFileEnsured(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${content.trim()}\n`);
}

async function main() {
  const edgeFunctions = await readEdgeFunctions();
  const sharedUtilities = await listSharedUtilities();

  const codebaseIndex = buildCodebaseIndex(edgeFunctions, sharedUtilities);
  const systemReference = buildSystemReference(edgeFunctions);
  const liveTooling = buildLiveToolingList(edgeFunctions);

  await writeFileEnsured(
    path.join(repoRoot, "docs/technical/CODEBASE_INDEX.md"),
    codebaseIndex
  );
  await writeFileEnsured(
    path.join(repoRoot, "docs/technical/SYSTEM_REFERENCE.md"),
    systemReference
  );
  await writeFileEnsured(
    path.join(sessionStoreDir, "live-tooling-list.txt"),
    liveTooling
  );

  console.log("Documentation assets refreshed.");
}

main().catch((error) => {
  console.error("Failed to update documentation", error);
  process.exitCode = 1;
});
