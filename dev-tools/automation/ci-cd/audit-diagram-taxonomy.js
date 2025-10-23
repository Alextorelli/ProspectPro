// Phase 6: Taxonomy and compliance audit for Mermaid diagrams
// Usage: node scripts/docs/audit-diagram-taxonomy.js

import fs from "fs";
import path from "path";

const DIAGRAM_DIRS = [
  "docs/app/diagrams",
  "docs/dev-tools/diagrams",
  "docs/integration/diagrams",
  "docs/shared/mermaid/templates",
];

const REQUIRED_TAGS = [
  "domain",
  "tags",
  "ZeroFakeData",
  "validation",
  "accTitle",
  "accDescr",
];

function auditDiagram(file) {
  const content = fs.readFileSync(file, "utf8");
  let missing = [];
  for (const tag of REQUIRED_TAGS) {
    if (!content.includes(tag)) missing.push(tag);
  }
  if (missing.length > 0) {
    console.warn(`❌ ${file}: missing ${missing.join(", ")}`);
    return { file, missing };
  }
  return null;
}

function main() {
  let failures = [];
  for (const dir of DIAGRAM_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".mmd") || file.endsWith(".mermaid")) {
        const result = auditDiagram(path.join(dir, file));
        if (result) failures.push(result);
      }
    }
  }
  if (failures.length > 0) {
    console.error(
      `\nDiagram taxonomy audit failed. ${failures.length} diagrams missing anchors/tags.`
    );
    process.exit(1);
  } else {
    console.log("✅ All diagrams passed taxonomy audit.");
  }
}

main();
