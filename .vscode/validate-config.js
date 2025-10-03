#!/usr/bin/env node

/**
 * VS Code Configuration Validator
 * Validates VS Code settings for ProspectPro development
 */

const fs = require("fs");
const path = require("path");

console.log("🔧 Validating VS Code Configuration...\n");

// Validate settings.json
try {
  const settingsPath = path.join(__dirname, "settings.json");
  const settingsContent = fs.readFileSync(settingsPath, "utf8");

  // Strip comments and parse JSON
  const cleanedContent = settingsContent
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  const settings = JSON.parse(cleanedContent);

  console.log("✅ settings.json is valid JSON");

  // Check Deno configuration
  if (settings["deno.enable"] === false) {
    console.log("✅ Deno disabled globally (Node.js project)");
  }

  if (
    settings["deno.enablePaths"] &&
    settings["deno.enablePaths"].includes("supabase/functions")
  ) {
    console.log("✅ Deno enabled only for Supabase functions");
  }

  // Check MCP configuration
  if (settings["mcp.enable"] === true) {
    console.log("✅ MCP enabled");

    const mcpServers = settings["mcp.servers"];
    if (
      mcpServers &&
      mcpServers["prospectpro-production"] &&
      mcpServers["prospectpro-development"]
    ) {
      console.log("✅ Both MCP servers configured");
    }
  }

  // Check TypeScript formatter
  if (
    settings["[typescript]"] &&
    settings["[typescript]"]["editor.defaultFormatter"] ===
      "esbenp.prettier-vscode"
  ) {
    console.log("✅ TypeScript formatter set to Prettier (not Deno)");
  }
} catch (error) {
  console.error("❌ settings.json validation failed:", error.message);
}

// Validate extensions.json
try {
  const extensionsPath = path.join(__dirname, "extensions.json");
  const extensionsContent = fs.readFileSync(extensionsPath, "utf8");
  const extensions = JSON.parse(extensionsContent);

  console.log("✅ extensions.json is valid JSON");

  if (extensions.recommendations.includes("denoland.vscode-deno")) {
    console.log("✅ Deno extension included for Supabase functions");
  }

  if (extensions.recommendations.includes("github.copilot")) {
    console.log("✅ GitHub Copilot extension included");
  }
} catch (error) {
  console.error("❌ extensions.json validation failed:", error.message);
}

// Validate launch.json
try {
  const launchPath = path.join(__dirname, "launch.json");
  const launchContent = fs.readFileSync(launchPath, "utf8");
  const launch = JSON.parse(launchContent);

  console.log("✅ launch.json is valid JSON");

  const mcpConfigs = launch.configurations.filter((config) =>
    config.name.includes("MCP")
  );

  if (mcpConfigs.length >= 2) {
    console.log("✅ MCP debug configurations included");
  }
} catch (error) {
  console.error("❌ launch.json validation failed:", error.message);
}

console.log("\n🎉 VS Code configuration validation complete!");
