const { createHash } = require("crypto");
const fs = require("fs");
const { execSync } = require("child_process");

function computeChecksum(context) {
  const payload = {
    ...context,
    metadata: {
      ...context.metadata,
      checksum: null,
    },
  };
  const json = JSON.stringify(payload);
  return createHash("sha256").update(json).digest("hex");
}

function getCanonicalTimestamp() {
  try {
    // Calls the local Utility MCP time tool via helper script
    return execSync(
      "node ./dev-tools/agents/context/get-canonical-timestamp.js"
    )
      .toString()
      .trim();
  } catch (e) {
    // fallback to system time if Utility MCP is unavailable
    return new Date().toISOString();
  }
}

function updateChecksum(filePath) {
  const context = JSON.parse(fs.readFileSync(filePath, "utf8"));
  context.metadata.lastChecksumUpdate = getCanonicalTimestamp();
  context.metadata.checksum = null;
  const checksum = computeChecksum(context);
  context.metadata.checksum = checksum;
  fs.writeFileSync(filePath, JSON.stringify(context, null, 2));
  console.log(`${filePath}: ${checksum}`);
}

updateChecksum(process.argv[2]);
