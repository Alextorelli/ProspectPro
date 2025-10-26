// Mermaid diagram tag checker for ProspectPro
// Scans all .mmd files and reports missing required YAML frontmatter fields
import fs from "fs";
import path from "path";

const ROOT = path.resolve("docs");
const REQUIRED_FIELDS = [
  "accTitle",
  "accDescr",
  "domain",
  "type",
  "title",
  "index",
];

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
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

function checkYAMLFrontmatter(file) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  // Check for YAML frontmatter
  if (lines[0] !== "---") {
    return { missing: REQUIRED_FIELDS, error: "No YAML frontmatter found" };
  }

  // Extract YAML frontmatter
  let yamlEnd = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      yamlEnd = i;
      break;
    }
  }

  if (yamlEnd === -1) {
    return { missing: REQUIRED_FIELDS, error: "YAML frontmatter not closed" };
  }

  const yamlContent = lines.slice(1, yamlEnd).join("\n");
  const missing = REQUIRED_FIELDS.filter(
    (field) => !yamlContent.includes(`${field}:`)
  );

  return { missing, error: null };
}

const files = walk(ROOT);
let hasMissing = false;
for (const file of files) {
  const result = checkYAMLFrontmatter(file);
  if (result.error) {
    hasMissing = true;
    console.log(`${file}: ERROR - ${result.error}`);
  } else if (result.missing.length) {
    hasMissing = true;
    console.log(`${file}: MISSING ${result.missing.join(", ")}`);
  }
}
if (!hasMissing) {
  console.log("✓ All .mmd files have required YAML frontmatter fields.");
}
