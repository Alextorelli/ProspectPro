/**
 * Environment selection loader (v2)
 * Prompts user for environment on workspace init, falls back to config file or env vars
 */
const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");

const ENVIRONMENTS = ["production", "development", "troubleshooting"];
const CONFIG_PATH = path.join(process.cwd(), "config", "environment.v2.json");

async function promptEnvironment() {
  const { env } = await inquirer.prompt([
    {
      type: "list",
      name: "env",
      message: "Select your target environment:",
      choices: ENVIRONMENTS,
      default: "development",
    },
  ]);
  return env;
}

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    } catch (e) {
      console.warn("Failed to parse environment config:", e);
    }
  }
  return null;
}

async function selectEnvironment() {
  let config = loadConfig();
  let env = config?.environment || process.env.MCP_ENVIRONMENT;
  if (!env) {
    env = await promptEnvironment();
    fs.writeFileSync(
      CONFIG_PATH,
      JSON.stringify({ environment: env }, null, 2)
    );
  }
  console.log(`Selected environment: ${env}`);
  return env;
}

module.exports = { selectEnvironment };
