// Scaffold missing MCP tool modules
const fs = require("fs");
const path = require("path");

const servers = [
  "production-server.js",
  "development-server.js",
  "integration-hub-server.js",
  "postgresql-server.js",
  "supabase-troubleshooting-server.js",
];

const toolsDir = path.join(__dirname, "../../mcp-servers/tools");
if (!fs.existsSync(toolsDir)) fs.mkdirSync(toolsDir);

servers.forEach((server) => {
  const toolFile = path.join(toolsDir, server.replace(".js", "-tools.js"));
  if (!fs.existsSync(toolFile)) {
    fs.writeFileSync(
      toolFile,
      `// Tool module for ${server}\nmodule.exports = {};\n`
    );
    console.log(`Scaffolded: ${toolFile}`);
  }
});
console.log("MCP tool modules scaffolded.");
