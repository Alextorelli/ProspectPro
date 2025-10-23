// Generate Mermaid diagrams from GraphQL and repo metadata
const fs = require("fs");
const path = require("path");
const registry = require("./mermaid-template-registry.json");

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
