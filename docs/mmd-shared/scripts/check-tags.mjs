// Mermaid diagram tag checker for ProspectPro
// Scans all .mmd files and reports missing required tags
import fs from "fs";
import path from "path";

const ROOT = path.resolve("docs/diagrams");
const REQUIRED_TAGS = [
  "%% domain:",
  "%% reciprocal:",
  "%% type:",
  "%% title:",
  "%% index:",
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith(".mmd")) {
      results.push(filePath);
    }
  }
  return results;
}

function checkTags(file) {
  const content = fs.readFileSync(file, "utf8");
  const missing = REQUIRED_TAGS.filter((tag) => !content.includes(tag));
  return missing;
}

const files = walk(ROOT);
let hasMissing = false;
for (const file of files) {
  const missing = checkTags(file);
  if (missing.length) {
    hasMissing = true;
    console.log(`${file}: MISSING ${missing.join(", ")}`);
  }
}
if (!hasMissing) {
  console.log("All .mmd files have required tags.");
}
