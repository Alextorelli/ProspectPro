#!/bin/bash
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