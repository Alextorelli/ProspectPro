name: Documentation Automation

on:
push:
branches: [main]
paths: - 'docs/**' - 'dev-tools/agents/**' - '.github/workflows/docs-automation.yml'
pull_request:
branches: [main]

jobs:
docs-update:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Update documentation
        run: npm run docs:update

      - name: Dry-run env pull
        run: npm run env:pull -- --environment=preview || true

      - name: Collect artifacts
        run: |
          mkdir -p dev-tools/reports/docs-automation/${{ github.run_number }}
          cp -r docs dev-tools/reports/docs-automation/${{ github.run_number }}/
          cp dev-tools/workspace/context/session_store/*-filetree.txt \
            dev-tools/reports/docs-automation/${{ github.run_number }}/

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: docs-automation-${{ github.run_number }}
          path: dev-tools/reports/docs-automation/${{ github.run_number }}
          retention-days: 30

name: Playwright Tests

on:
push:
branches: [main]
pull_request:
branches: [main]

jobs:
test:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - name: Collect test artifacts
        if: always()
        run: |
          mkdir -p dev-tools/reports/ci/playwright/${{ github.run_number }}
          cp -r playwright-report dev-tools/reports/ci/playwright/${{ github.run_number }}/
          cp -r test-results dev-tools/reports/ci/playwright/${{ github.run_number }}/ || true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results-${{ github.run_number }}
          path: dev-tools/reports/ci/playwright/${{ github.run_number }}
          retention-days: 30

      - name: Deploy to staging on success
        if: success() && github.ref == 'refs/heads/main'
        run: |
          npm run deploy:preview
          npm run deploy:staging:alias
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

name: MCP Agent Validation

on:
push:
branches: [main]
paths: - 'dev-tools/agents/\*\*' - '.vscode/mcp_config.json'
pull_request:
branches: [main]

jobs:
validate:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate agent contexts
        run: npm run validate:contexts

      - name: MCP troubleshooting
        run: npm run mcp:troubleshoot || true

      - name: Collect validation artifacts
        run: |
          mkdir -p dev-tools/reports/ci/mcp-validation/${{ github.run_number }}
          cp dev-tools/agents/context/store/*.json \
            dev-tools/reports/ci/mcp-validation/${{ github.run_number }}/

      - name: Upload validation results
        uses: actions/upload-artifact@v4
        with:
          name: mcp-validation-${{ github.run_number }}
          path: dev-tools/reports/ci/mcp-validation/${{ github.run_number }}
          retention-days: 30
