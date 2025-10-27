const { createHash } = require("crypto");
const fs = require("fs");

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

function updateChecksum(filePath) {
  const context = JSON.parse(fs.readFileSync(filePath, "utf8"));
  context.metadata.checksum = null;
  const checksum = computeChecksum(context);
  context.metadata.checksum = checksum;
  fs.writeFileSync(filePath, JSON.stringify(context, null, 2));
  console.log(`${filePath}: ${checksum}`);
}

updateChecksum(process.argv[2]);
