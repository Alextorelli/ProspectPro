import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { parse } from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../..");

const ENVIRONMENTS_SOURCE = resolve(
  REPO_ROOT,
  "integration/environments/environments.yml"
);
const OUTPUT_DIR = resolve(REPO_ROOT, "integration/environments");
const MCP_CONFIG_PATH = resolve(REPO_ROOT, ".vscode/mcp_config.json");
const AGENTS_ENV_DIR = resolve(REPO_ROOT, "dev-tools/agents");

console.log("🔧 ProspectPro Environment Config Generator\n");

// Load master configuration
const masterConfig = parse(readFileSync(ENVIRONMENTS_SOURCE, "utf8"));

// Generate integration/environments/*.json
for (const [envName, config] of Object.entries(masterConfig.environments)) {
  const outputPath = resolve(OUTPUT_DIR, `${envName}.json`);
  writeFileSync(outputPath, JSON.stringify(config, null, 2));
  console.log(`✓ Generated ${envName}.json`);
}

// Generate .env files for agents
for (const [envName, config] of Object.entries(masterConfig.environments)) {
  const envContent = Object.entries(config.env || {})
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  if (envContent) {
    const envFilePath = resolve(AGENTS_ENV_DIR, `.env.${envName}`);
    writeFileSync(envFilePath, envContent);
    console.log(`✓ Generated .env.${envName}`);
  }
}

// Update MCP config with environment-specific servers
const existingMcpConfig = JSON.parse(readFileSync(MCP_CONFIG_PATH, "utf8"));
const mcpServers = existingMcpConfig.mcpServers || {};

for (const [envName, config] of Object.entries(masterConfig.environments)) {
  if (config.mcpServers) {
    mcpServers[`${envName}-mcp`] = config.mcpServers;
  }
}

existingMcpConfig.mcpServers = mcpServers;
writeFileSync(MCP_CONFIG_PATH, JSON.stringify(existingMcpConfig, null, 2));
console.log("✓ Updated .vscode/mcp_config.json");

console.log("\n✅ Environment configuration generation complete");
console.log("📝 Next: Run `npm run validate:contexts` to verify");
