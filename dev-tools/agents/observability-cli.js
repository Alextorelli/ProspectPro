#!/usr/bin/env node
// CLI wrapper for observability-server.js to accept JSON-RPC from stdin and dispatch commands
import { spawn } from "child_process";

function main() {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });
  process.stdin.on("end", () => {
    try {
      const json = JSON.parse(input);
      // Spawn the actual server as a child process and send the JSON-RPC
      const child = spawn("node", ["mcp-servers/observability-server.js"], {
        stdio: ["pipe", "pipe", "inherit"],
      });
      child.stdin.write(JSON.stringify(json));
      child.stdin.end();
      child.stdout.pipe(process.stdout);
      child.on("exit", (code) => process.exit(code));
    } catch (err) {
      console.error("Invalid JSON input:", err.message);
      process.exit(1);
    }
  });
}

main();
