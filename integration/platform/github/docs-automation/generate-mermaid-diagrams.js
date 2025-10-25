// Generate Mermaid diagrams from GraphQL and repo metadata
import fs from "fs";
import path from "path";
import manifest from "../../../../docs/mmd-shared/scripts/diagrams.manifest.json" assert { type: "json" };
import registry from "./mermaid-template-registry.js";

// Copy the main index.md to all manifest locations
const indexSrc = path.resolve("../../../../docs/mmd-shared/config/index.md");
let indexContent = "";
try {
  indexContent = fs.readFileSync(indexSrc, "utf8");
} catch (e) {
  console.error("Could not read index.md:", e);
}

Object.values(manifest)
  .flat()
  .forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, "index.md");
    try {
      fs.writeFileSync(dest, indexContent);
      console.log(`Index written to ${dest}`);
    } catch (e) {
      console.error(`Failed to write index to ${dest}:`, e);
    }
  });

// Placeholder: fetch metadata, generate diagrams, write to registry paths
Object.entries(registry).forEach(([domain, outDir]) => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  // Example: write a dummy diagram
  fs.writeFileSync(
    path.join(outDir, `example-${domain}.mmd`),
    `graph TD; A-->B; B-->C; C-->A;`
  );
});
console.log("Mermaid diagrams generated.");
