#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const path = require("path");

console.log("🚀 ProspectPro MCP Server - Memory Optimized Startup");

// Kill existing servers to prevent conflicts
try {
  console.log("🧹 Cleaning up existing MCP servers...");
  execSync(
    'pkill -f "production-server.js development-server.js troubleshooting-server.js"',
    { stdio: "ignore" }
  );
} catch (e) {
  // Servers weren't running, that's fine
}

// Memory optimized environment
const optimizedEnv = {
  ...process.env,
  NODE_OPTIONS: "--max-old-space-size=128",
  MCP_LOG_LEVEL: "error", // Reduce logging overhead
};

// Start only production server by default (smart loading)
const mcpServersPath = path.join(__dirname, "mcp-servers");
const server = spawn("node", ["production-server.js"], {
  cwd: mcpServersPath,
  env: optimizedEnv,
  stdio: ["inherit", "pipe", "pipe"],
});

console.log("✅ Started ProspectPro Production MCP Server (Memory Optimized)");
console.log("📊 Memory limit: 128MB | Log level: Error only");
console.log("🔧 Other servers will load on-demand when needed");

// Handle server output
server.stdout.on("data", (data) => {
  console.log(`[MCP] ${data.toString().trim()}`);
});

server.stderr.on("data", (data) => {
  console.error(`[MCP Error] ${data.toString().trim()}`);
});

server.on("error", (error) => {
  console.error("❌ MCP Server Error:", error.message);
});

server.on("close", (code) => {
  if (code !== 0) {
    console.error(`❌ MCP Server exited with code ${code}`);
  } else {
    console.log("✅ MCP Server shut down gracefully");
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down MCP Server...");
  server.kill("SIGTERM");
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.kill("SIGTERM");
  process.exit(0);
});
