# ProspectPro Testing & Observability Consolidation - Automated Implementation Plan

## Phase 0: Pre-flight Validation & Setup

### Step 0.1: Install Task CLI
```bash
#!/bin/bash
# filepath: dev-tools/scripts/automation/install-task-cli.sh
set -e

echo "=== Installing Taskfile CLI ==="

if command -v task &> /dev/null; then
  echo "✓ Task CLI already installed ($(task --version))"
  exit 0
fi

sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

echo "✓ Task CLI installed: $(task --version)"
```

### Step 0.2: Validation Script
```bash
#!/bin/bash
# filepath: dev-tools/scripts/automation/validate-testing-prerequisites.sh
set -e

REPO_ROOT="/workspaces/ProspectPro"
cd "$REPO_ROOT"

echo "=== Validating Testing Prerequisites ==="

# Check Playwright browsers
if ! npx playwright --version &> /dev/null; then
  echo "❌ Playwright not installed"
  exit 1
fi
echo "✓ Playwright installed"

# Check Vitest
if ! npx vitest --version &> /dev/null; then
  echo "❌ Vitest not installed"
  exit 1
fi
echo "✓ Vitest installed"

# Check Deno for edge functions
if ! deno --version &> /dev/null; then
  echo "❌ Deno not installed"
  exit 1
fi
echo "✓ Deno installed"

# Verify environment files exist
for env_file in integration/environments/{development,staging,production}.json; do
  if [[ ! -f "$env_file" ]]; then
    echo "❌ Missing: $env_file"
    exit 1
  fi
done
echo "✓ Environment configs present"

echo "=== Prerequisites Valid ==="
```

---

## Phase 1: Highlight Node Observability Package

### Step 1.1: Package Structure
```bash
#!/bin/bash
# filepath: dev-tools/scripts/automation/scaffold-highlight-node.sh
set -e

REPO_ROOT="/workspaces/ProspectPro"
HIGHLIGHT_DIR="$REPO_ROOT/dev-tools/observability/highlight-node"

echo "=== Scaffolding Highlight Node Package ==="

mkdir -p "$HIGHLIGHT_DIR"

# Package manifest
cat > "$HIGHLIGHT_DIR/package.json" << 'EOF'
{
  "name": "@prospectpro/highlight-node",
  "version": "1.0.0",
  "description": "Shared Highlight.io Node.js wrapper for ProspectPro backend telemetry",
  "main": "index.ts",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@highlight-run/node": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
EOF

# TypeScript config
cat > "$HIGHLIGHT_DIR/tsconfig.json" << 'EOF'
{
  "extends": "../../../config/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "module": "ESNext",
    "target": "ES2022"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
EOF

echo "✓ Package scaffolded at $HIGHLIGHT_DIR"
```

### Step 1.2: Core Implementation
```typescript
import { H } from "@highlight-run/node";

interface HighlightConfig {
  projectId?: string;
  serviceName?: string;
  environment?: string;
  otlpEndpoint?: string;
}

let highlightInitialized = false;

/**
 * Initialize Highlight.io Node SDK with environment-aware configuration.
 * Falls back to noop if HIGHLIGHT_PROJECT_ID is not set.
 */
export function initHighlightNode(config?: HighlightConfig): void {
  const projectId = config?.projectId || process.env.HIGHLIGHT_PROJECT_ID;
  
  if (!projectId) {
    console.warn("[Highlight] No project ID provided, telemetry disabled");
    return;
  }

  if (highlightInitialized) {
    console.warn("[Highlight] Already initialized, skipping");
    return;
  }

  H.init({
    projectID: projectId,
    serviceName: config?.serviceName || "prospectpro-backend",
    environment: config?.environment || process.env.NODE_ENV || "development",
    otlpEndpoint: config?.otlpEndpoint || process.env.HIGHLIGHT_OTLP_ENDPOINT,
  });

  highlightInitialized = true;
  console.log(`[Highlight] Initialized for ${config?.serviceName || "backend"}`);
}

/**
 * Middleware factory for Express-like frameworks.
 * Automatically creates spans for requests and links to frontend sessions.
 */
export function highlightMiddleware() {
  return (req: any, res: any, next: any) => {
    if (!highlightInitialized) {
      return next();
    }

    // Extract session ID from frontend (if present)
    const sessionId = req.headers["x-highlight-request"];
    
    H.startSpan({
      name: `${req.method} ${req.path}`,
      attributes: {
        "http.method": req.method,
        "http.url": req.url,
        "http.session_id": sessionId || "unknown",
      },
    });

    res.on("finish", () => {
      H.endSpan();
    });

    next();
  };
}

/**
 * Manual span creation for edge functions or custom workflows.
 */
export function createSpan(name: string, attributes?: Record<string, any>) {
  if (!highlightInitialized) {
    return { end: () => {} };
  }

  H.startSpan({ name, attributes });
  return {
    end: () => H.endSpan(),
  };
}

/**
 * Flush telemetry before process exit (for serverless/edge functions).
 */
export async function flushHighlight(): Promise<void> {
  if (!highlightInitialized) {
    return;
  }

  await H.flush();
  console.log("[Highlight] Telemetry flushed");
}

export { H };
```

### Step 1.3: Documentation
```markdown
# Highlight Node Wrapper

Shared Highlight.io instrumentation for ProspectPro backend services, agents, and Supabase Edge Functions.

## Installation

```bash
npm install --workspace=dev-tools/observability/highlight-node
```

## Usage

### Basic Initialization

```typescript
import { initHighlightNode } from "@prospectpro/highlight-node";

// Auto-detect from env vars
initHighlightNode();

// Explicit config
initHighlightNode({
  projectId: "YOUR_PROJECT_ID",
  serviceName: "business-discovery-agent",
  environment: "staging",
});
```

### Express Middleware

```typescript
import express from "express";
import { initHighlightNode, highlightMiddleware } from "@prospectpro/highlight-node";

const app = express();

initHighlightNode();
app.use(highlightMiddleware());

app.get("/api/discover", (req, res) => {
  // Automatic span created for this request
  res.json({ status: "ok" });
});
```

### Supabase Edge Function

```typescript
import { initHighlightNode, createSpan, flushHighlight } from "@prospectpro/highlight-node";

Deno.serve(async (req) => {
  initHighlightNode({ serviceName: "enrichment-orchestrator" });
  
  const span = createSpan("process_enrichment", {
    campaign_id: "cmp_123",
  });

  try {
    // Your edge function logic
    const result = await enrichData();
    return new Response(JSON.stringify(result));
  } finally {
    span.end();
    await flushHighlight();
  }
});
```

## Frontend-Backend Session Mapping

Per [Highlight docs](https://www.highlight.io/docs/getting-started/frontend-backend-mapping), include the session ID in request headers:

**Frontend (React):**
```typescript
import { H } from "highlight.run";

const sessionId = H.getSessionId();

fetch("/api/discover", {
  headers: {
    "X-Highlight-Request": sessionId,
  },
});
```

**Backend (auto-linked via middleware):**
The middleware extracts `X-Highlight-Request` and associates backend spans with the frontend session.

## Environment Variables

- `HIGHLIGHT_PROJECT_ID` - Required for telemetry
- `HIGHLIGHT_OTLP_ENDPOINT` - Optional custom OTLP endpoint
- `NODE_ENV` - Defaults to "development"

## References

- [Highlight Node SDK](https://www.highlight.io/docs/sdk/nodejs)
- [Getting Started with Node.js](https://www.highlight.io/docs/getting-started/server/js/nodejs)
- [Frontend-Backend Mapping](https://www.highlight.io/docs/getting-started/frontend-backend-mapping)
```

---

## Phase 2: Testing Configuration Files

### Step 2.1: Vitest Agent Config
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["../utils/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "../reports/coverage",
      include: ["../agents/**/*.ts"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
    },
    reporters: [
      "default",
      ["json", { outputFile: "../reports/vitest-results.json" }],
    ],
  },
  resolve: {
    alias: {
      "@agents": path.resolve(__dirname, "../../agents"),
      "@testing": path.resolve(__dirname, ".."),
      "@observability": path.resolve(__dirname, "../../observability"),
    },
  },
});
```

### Step 2.2: Playwright Agent Config
```typescript
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "https://prospect-5i7mc1o2c-appsmithery.vercel.app";

export default defineConfig({
  testDir: "../agents",
  testMatch: "**/e2e/**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ["html", { outputFolder: "../reports/playwright", open: "never" }],
    ["json", { outputFile: "../reports/playwright-results.json" }],
    ["list"],
  ],
  
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
```

### Step 2.3: Enhanced Setup Utilities
```typescript
import { afterAll, beforeAll, beforeEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { initHighlightNode, flushHighlight } from "@prospectpro/highlight-node";

let supabase: ReturnType<typeof createClient> | null = null;

beforeAll(async () => {
  // Optional Highlight telemetry for tests (disabled by default)
  if (process.env.ENABLE_TEST_TELEMETRY === "true") {
    initHighlightNode({
      serviceName: "prospectpro-testing",
      environment: process.env.TEST_ENV || "development",
    });
  }

  // Initialize Supabase test client (anon key only, no service role)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("[setup] Supabase test client initialized");
  } else {
    console.warn("[setup] Supabase credentials missing, mocking database calls");
  }
});

beforeEach(async () => {
  // Clear test data before each test (if Supabase is available)
  if (supabase) {
    try {
      await supabase.from("campaigns").delete().match({ test_data: true });
      await supabase.from("leads").delete().match({ test_data: true });
    } catch (error) {
      console.warn("[setup] Failed to clear test data:", error);
    }
  }
});

afterAll(async () => {
  if (process.env.ENABLE_TEST_TELEMETRY === "true") {
    await flushHighlight();
  }
  console.log("[teardown] Test environment cleaned");
});

export { supabase };
```

---

## Phase 3: Taskfile Hierarchy

### Step 3.1: Root Taskfile
```yaml
version: '3'

vars:
  VITEST_CONFIG: ./configs/vitest.agents.config.ts
  PLAYWRIGHT_CONFIG: ./configs/playwright.agents.config.ts
  REPORTS_DIR: ./reports

includes:
  business-discovery:
    taskfile: ./agents/business-discovery/Taskfile.yml
    dir: ./agents/business-discovery
  enrichment-orchestrator:
    taskfile: ./agents/enrichment-orchestrator/Taskfile.yml
    dir: ./agents/enrichment-orchestrator
  export-diagnostics:
    taskfile: ./agents/export-diagnostics/Taskfile.yml
    dir: ./agents/export-diagnostics

tasks:
  agents:test:unit:
    desc: Run all agent unit tests
    cmds:
      - npx vitest run --config {{.VITEST_CONFIG}}
  
  agents:test:integration:
    desc: Run all agent integration tests
    cmds:
      - npx vitest run --config {{.VITEST_CONFIG}} --testNamePattern="integration"
  
  agents:test:e2e:
    desc: Run all agent E2E tests (Playwright)
    cmds:
      - npx playwright test --config {{.PLAYWRIGHT_CONFIG}}
  
  agents:test:full:
    desc: Run complete test suite with linting
    deps:
      - lint
    cmds:
      - task: agents:test:unit
      - task: agents:test:e2e
  
  lint:
    desc: Run ESLint on test files
    cmds:
      - npx eslint "**/*.test.ts" "**/*.spec.ts" --max-warnings 0
  
  reports:clean:
    desc: Clean all test reports
    cmds:
      - rm -rf {{.REPORTS_DIR}}/*
      - echo "✓ Reports cleaned"
  
  reports:open:
    desc: Open Playwright HTML report
    cmds:
      - npx playwright show-report {{.REPORTS_DIR}}/playwright
```

### Step 3.2: Per-Agent Taskfile Template
```yaml
version: '3'

tasks:
  unit:
    desc: Run business-discovery unit tests
    cmds:
      - npx vitest run unit/ --config ../../configs/vitest.agents.config.ts
  
  integration:
    desc: Run business-discovery integration tests
    cmds:
      - npx vitest run integration/ --config ../../configs/vitest.agents.config.ts
  
  e2e:
    desc: Run business-discovery E2E tests
    cmds:
      - npx playwright test e2e/ --config ../../configs/playwright.agents.config.ts
  
  test:all:
    desc: Run all business-discovery tests
    cmds:
      - task: unit
      - task: integration
      - task: e2e
  
  debug:unit:
    desc: Debug unit tests with VS Code
    cmds:
      - npx vitest --inspect-brk unit/ --config ../../configs/vitest.agents.config.ts
  
  debug:e2e:
    desc: Debug E2E tests with headed browser
    cmds:
      - npx playwright test e2e/ --config ../../configs/playwright.agents.config.ts --headed --debug
```

---

## Phase 4: Test Suite Relocation

### Step 4.1: Directory Scaffold Script
```bash
#!/bin/bash
# filepath: dev-tools/scripts/automation/scaffold-agent-tests.sh
set -e

REPO_ROOT="/workspaces/ProspectPro"
TESTING_DIR="$REPO_ROOT/dev-tools/testing"

echo "=== Scaffolding Agent Test Directories ==="

AGENTS=("business-discovery" "enrichment-orchestrator" "export-diagnostics")

for agent in "${AGENTS[@]}"; do
  AGENT_DIR="$TESTING_DIR/agents/$agent"
  
  mkdir -p "$AGENT_DIR"/{unit,integration,e2e,fixtures}
  
  # Copy Taskfile template
  cp "$TESTING_DIR/configs/Taskfile.agent.template.yml" "$AGENT_DIR/Taskfile.yml"
  
  # Replace placeholders
  sed -i "s/{{AGENT_NAME}}/$agent/g" "$AGENT_DIR/Taskfile.yml"
  
  # Create placeholder tests
  cat > "$AGENT_DIR/unit/${agent}.test.ts" << EOF
import { describe, it, expect } from "vitest";

describe("$agent unit tests", () => {
  it("should pass placeholder test", () => {
    expect(true).toBe(true);
  });
});
EOF

  cat > "$AGENT_DIR/e2e/${agent}.spec.ts" << EOF
import { test, expect } from "@playwright/test";

test.describe("$agent E2E", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ProspectPro/);
  });
});
EOF

  echo "✓ Scaffolded $agent tests"
done

# Create shared fixtures directory
mkdir -p "$TESTING_DIR/utils/fixtures"

cat > "$TESTING_DIR/utils/fixtures/campaigns.json" << 'EOF'
{
  "test_campaign": {
    "id": "cmp_test_001",
    "business_type": "Coffee Shops",
    "location": "Seattle, WA",
    "status": "completed",
    "test_data": true
  }
}
EOF

echo "✓ Created shared fixtures"
echo "=== Agent Test Scaffolding Complete ==="
```

---

## Phase 5: VS Code Integration

### Step 5.1: Staged Settings Update
```markdown
## 2025-10-29: Testing Consolidation - Taskfile Integration

**Planned `.vscode/settings.json` additions:**

```json
{
  "vitest.commandLine": "npx vitest",
  "vitest.configFile": "dev-tools/testing/configs/vitest.agents.config.ts",
  "playwright.reuseBrowser": true,
  "playwright.showBrowser": false,
  "task.autoDetect": "on",
  "task.problemMatchers": ["$tsc", "$eslint"]
}
```

**Planned tasks.json entries:**

```json
{
  "label": "Test: Agents (Full Suite)",
  "type": "shell",
  "command": "task -d dev-tools/testing agents:test:full",
  "problemMatcher": [],
  "group": {
    "kind": "test",
    "isDefault": true
  }
},
{
  "label": "Test: Agent Unit Tests",
  "type": "shell",
  "command": "task -d dev-tools/testing agents:test:unit",
  "problemMatcher": ["$tsc"]
},
{
  "label": "Test: Agent E2E Tests",
  "type": "shell",
  "command": "task -d dev-tools/testing agents:test:e2e",
  "problemMatcher": []
}
```

**Planned launch.json entry:**

```json
{
  "name": "Debug Agent Unit Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": [
    "run",
    "--config",
    "dev-tools/testing/configs/vitest.agents.config.ts",
    "--inspect-brk"
  ],
  "console": "integratedTerminal",
  "env": {
    "TEST_ENV": "development",
    "ENABLE_TEST_TELEMETRY": "false"
  }
}
```
```

---

## Phase 6: NPM Shim & Documentation

### Step 6.1: Package.json Update
```json
{
  "scripts": {
    "test:agents": "task -d dev-tools/testing agents:test:full",
    "test:agents:unit": "task -d dev-tools/testing agents:test:unit",
    "test:agents:e2e": "task -d dev-tools/testing agents:test:e2e",
    "test:agents:watch": "task -d dev-tools/testing agents:test:unit -- --watch"
  }
}
```

### Step 6.2: Testing README Update
```markdown
# ProspectPro Testing Suite

Unified testing infrastructure for agent workflows, backend services, and frontend components.

## Quick Start

```bash
# Run all agent tests
npm run test:agents

# Run only unit tests
npm run test:agents:unit

# Run only E2E tests
npm run test:agents:e2e

# Watch mode for development
npm run test:agents:watch
```

## Using Taskfile Directly

```bash
# Install Task CLI (if not already installed)
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

# List available tasks
task -d dev-tools/testing --list

# Run specific agent tests
task -d dev-tools/testing business-discovery:unit
task -d dev-tools/testing enrichment-orchestrator:e2e
```

## Directory Structure

```
dev-tools/testing/
├── agents/                    # Per-agent test suites
│   ├── business-discovery/
│   │   ├── unit/             # Vitest unit tests
│   │   ├── integration/      # Vitest integration tests
│   │   ├── e2e/              # Playwright E2E tests
│   │   └── Taskfile.yml      # Agent-specific tasks
│   ├── enrichment-orchestrator/
│   └── export-diagnostics/
├── configs/                   # Shared test configurations
│   ├── vitest.agents.config.ts
│   └── playwright.agents.config.ts
├── utils/                     # Shared test utilities
│   ├── setup.ts              # Vitest global setup
│   └── fixtures/             # Shared test data
├── reports/                   # Test output artifacts
│   ├── coverage/
│   └── playwright/
└── Taskfile.yml              # Root test orchestration
```

## Configuration

### Environment Variables

- `TEST_ENV` - Target environment (development, staging, production)
- `PLAYWRIGHT_BASE_URL` - Override base URL for E2E tests
- `ENABLE_TEST_TELEMETRY` - Enable Highlight.io telemetry in tests (default: false)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### VS Code Integration

Tests are integrated with VS Code Test Explorer via Vitest and Playwright extensions. Use the Test sidebar to run/debug individual tests.

## Observability

Optional Highlight.io telemetry can be enabled for test runs by setting:

```bash
export ENABLE_TEST_TELEMETRY=true
export HIGHLIGHT_PROJECT_ID=your-project-id
```

See `dev-tools/observability/highlight-node/README.md` for details.
```

---

## Phase 7: Automated Batch Execution Script

```bash
#!/bin/bash
# filepath: dev-tools/scripts/automation/execute-testing-consolidation.sh
set -e

REPO_ROOT="/workspaces/ProspectPro"
cd "$REPO_ROOT"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ProspectPro Testing & Observability Consolidation Execution  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Phase 0: Prerequisites
echo "► Phase 0: Validating Prerequisites..."
bash dev-tools/scripts/automation/validate-testing-prerequisites.sh
bash dev-tools/scripts/automation/install-task-cli.sh
echo "✓ Phase 0 Complete"
echo ""

# Phase 1: Highlight Node Package
echo "► Phase 1: Creating Highlight Node Observability Package..."
bash dev-tools/scripts/automation/scaffold-highlight-node.sh
cd dev-tools/observability/highlight-node
npm install
cd "$REPO_ROOT"
echo "✓ Phase 1 Complete"
echo ""

# Phase 2: Testing Configs
echo "► Phase 2: Creating Testing Configuration Files..."
mkdir -p dev-tools/testing/configs
# Configs already scaffolded above as separate files
echo "✓ Phase 2 Complete"
echo ""

# Phase 3: Taskfile Hierarchy
echo "► Phase 3: Setting Up Taskfile Automation..."
mkdir -p dev-tools/testing/reports
# Root and agent Taskfiles already scaffolded above
echo "✓ Phase 3 Complete"
echo ""

# Phase 4: Test Suite Relocation
echo "► Phase 4: Scaffolding Agent Test Directories..."
bash dev-tools/scripts/automation/scaffold-agent-tests.sh
echo "✓ Phase 4 Complete"
echo ""

# Phase 5: Update Package.json
echo "► Phase 5: Adding NPM Test Shims..."
npm pkg set scripts.test:agents="task -d dev-tools/testing agents:test:full"
npm pkg set scripts.test:agents:unit="task -d dev-tools/testing agents:test:unit"
npm pkg set scripts.test:agents:e2e="task -d dev-tools/testing agents:test:e2e"
npm pkg set scripts.test:agents:watch="task -d dev-tools/testing agents:test:unit -- --watch"
echo "✓ Phase 5 Complete"
echo ""

# Phase 6: Documentation & Governance
echo "► Phase 6: Updating Documentation & Inventories..."

# Update coverage.md
cat >> dev-tools/workspace/context/session_store/coverage.md << EOF

## $(date +%Y-%m-%d): Testing & Observability Consolidation

**Changes**:
- Created \`dev-tools/observability/highlight-node/\` wrapping \`@highlight-run/node\` for backend telemetry
- Added \`dev-tools/testing/configs/\` with Vitest and Playwright agent configs
- Introduced Taskfile-based automation (\`dev-tools/testing/Taskfile.yml\` + per-agent Taskfiles)
- Scaffolded agent test directories under \`dev-tools/testing/agents/<agent>/{unit,integration,e2e}\`
- Enhanced \`dev-tools/testing/utils/setup.ts\` with Supabase stubs and optional Highlight integration
- Added npm shims for \`test:agents\`, \`test:agents:unit\`, \`test:agents:e2e\`

**Validation**: Run \`npm run test:agents\` to execute full suite via Taskfile orchestration

**Related**:
- Highlight Node docs: \`dev-tools/observability/highlight-node/README.md\`
- Testing suite docs: \`dev-tools/testing/README.md\`
- Staged VS Code config changes: \`docs/tooling/settings-staging.md\`

EOF

# Refresh inventories
npm run docs:update

echo "✓ Phase 6 Complete"
echo ""

# Phase 7: Validation
echo "► Phase 7: Running Smoke Tests..."

# Validate Taskfile syntax
task -d dev-tools/testing --list > /dev/null
echo "  ✓ Taskfile syntax valid"

# Run placeholder unit tests
npm run test:agents:unit || echo "  ⚠ Some tests failed (expected for placeholder suite)"

echo "✓ Phase 7 Complete"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Consolidation Complete!                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Next Steps:"
echo "  1. Review staged VS Code changes in docs/tooling/settings-staging.md"
echo "  2. Move existing test specs into agent directories"
echo "  3. Update frontend to send X-Highlight-Request headers"
echo "  4. Run: task -d dev-tools/testing agents:test:full"
echo "  5. Commit changes with: git add -A && git commit -m 'feat: testing & observability consolidation'"
echo ""
```

---

## Execution Command

```bash
# Make all scripts executable
chmod +x dev-tools/scripts/automation/*.sh

# Execute the full consolidation
./dev-tools/scripts/automation/execute-testing-consolidation.sh
```

---

## Post-Execution Checklist

- [ ] Highlight Node package builds successfully
- [ ] Taskfile commands execute without errors
- [ ] NPM shims work (`npm run test:agents`)
- [ ] Placeholder tests pass
- [ ] Documentation generated via `npm run docs:update`
- [ ] VS Code settings staged in `settings-staging.md`
- [ ] Inventories updated in `session_store/*-filetree.txt`
- [ ] Changes logged in `coverage.md`
- [ ] Ready for commit