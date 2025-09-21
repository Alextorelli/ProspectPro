// Quick test of MCP SDK import
try {
  const { Server } = require("@modelcontextprotocol/sdk/server");
  const {
    StdioServerTransport,
  } = require("@modelcontextprotocol/sdk/server/stdio");
  const { z } = require("zod"); // Use zod directly since it's included in the SDK
  console.log("✅ MCP SDK imported successfully");
  console.log("Server:", !!Server);
  console.log("StdioServerTransport:", !!StdioServerTransport);
  console.log("Zod:", !!z);
} catch (error) {
  console.error("❌ MCP SDK import failed:", error.message);
  console.error("Trying direct CJS imports...");

  try {
    const serverModule = require("./node_modules/@modelcontextprotocol/sdk/dist/cjs/server/index.js");
    const stdioModule = require("./node_modules/@modelcontextprotocol/sdk/dist/cjs/server/stdio.js");
    console.log("✅ Direct CJS imports work");
    console.log("Server module:", Object.keys(serverModule));
    console.log("Stdio module:", Object.keys(stdioModule));
  } catch (directError) {
    console.error("❌ Direct CJS imports also failed:", directError.message);
  }
}
