#!/usr/bin/env node
// Simple CLI to get canonical timestamp from Utility MCP (localhost:8787/time/now)
const http = require("http");

function getCanonicalTimestamp(cb) {
  http
    .get("http://localhost:8787/time/now", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          cb(null, json.timestamp || json.now || data);
        } catch (e) {
          cb(new Error("Invalid response from Utility MCP: " + data));
        }
      });
    })
    .on("error", (err) => cb(err));
}

if (require.main === module) {
  getCanonicalTimestamp((err, ts) => {
    if (err) {
      console.error("Failed to get canonical timestamp:", err);
      process.exit(1);
    }
    console.log(ts);
  });
}
