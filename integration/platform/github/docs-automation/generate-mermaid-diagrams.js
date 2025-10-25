// Generate Mermaid diagrams from GraphQL and repo metadata
import fs from "fs";
import path from "path";
import registry from "./mermaid-template-registry.js";

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
