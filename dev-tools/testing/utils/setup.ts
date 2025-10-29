// Shared Vitest setup for dev tools test suite
import { afterAll, beforeAll } from "vitest";

// Deterministic seeding helper
export function seedRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return () => {
    x = Math.sin(x) * 10000;
    return x - Math.floor(x);
  };
}

// Optional Highlight Node bootstrapping (noop fallback)
let highlightInit = () => {};
try {
  // Dynamically import highlight-node if present
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { initHighlightNode } = require("../../observability/highlight-node");
  highlightInit = () => {
    if (process.env.HIGHLIGHT_PROJECT_ID) {
      initHighlightNode({ projectID: process.env.HIGHLIGHT_PROJECT_ID });
    }
  };
} catch (e) {
  // No highlight-node available, noop
}

beforeAll(async () => {
  // Setup logic for all dev tools tests (e.g., env vars, mocks)
  highlightInit();
});

afterAll(async () => {
  // Teardown logic for all dev tools tests
});
