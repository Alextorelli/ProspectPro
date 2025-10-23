Looking at your VS Code file explorer and the build issue, here are the **best practices for hybrid mono-repo file organization** and **dependency management**:

## **Root-Level Files in Hybrid Mono-Repos**

### **Should Stay at Root:**

- **Build configuration**: `package.json`, `vite.config.ts`, `tsconfig.json`
- **Entry HTML**: `index.html` (Vite expects this at root)
- **Environment files**: `.env`, `.env.example`, `.env.local`
- **Tool configs**: `.eslintrc.*`, `.prettierrc`, `tailwind.config.js`
- **Git/CI files**: `.gitignore`, `.github/`, `README.md`, `LICENSE`
- **Lock files**: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`

### **Should Move to Subdirectories:**

- **Application source**: `src/` (components, pages, hooks, stores, etc.)
- **Static assets**: `public/` (images, favicon, etc.)
- **Tests**: `__tests__/`, `tests/`, or co-located with source

## **Fix Your Current Build Issue**

The error occurs because `index.html` references the old path. Here's the **correct fix**:

**Option 1: Update `index.html` (Recommended)**

```html
<!-- In index.html at root -->
<script type="module" src="/app/frontend/src/main.tsx"></script>
```

**Option 2: Update Vite Config (Better for mono-repo)**

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./app/frontend", // Set frontend as root for Vite
  build: {
    outDir: "../../dist", // Output to repo root
  },
  publicDir: "public", // Relative to root
});
```

## **Node Packages \& Dependencies in Hybrid Mono-Repos**

### **Current Structure Issues:**

From your screenshot, I see:

- `node_modules` at root ✅ (correct)
- Frontend source mixed with root files ❌ (needs organizing)

### **Recommended Dependency Strategy:**

**1. Root-Level Dependencies (Single Package.json)**

```json
{
  "name": "prospectpro-monorepo",
  "workspaces": ["app/frontend", "app/backend", "dev-tools/*", "integration/*"],
  "dependencies": {
    "shared-utilities": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**2. Domain-Specific Dependencies**

```bash
# Frontend-specific
app/frontend/package.json
{
  "name": "@prospectpro/frontend",
  "dependencies": {
    "react": "^18.2.0",
    "vite": "^5.0.0"
  }
}

# Backend-specific
app/backend/package.json
{
  "name": "@prospectpro/backend",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

**3. Shared Dependencies**

```bash
app/shared/package.json
{
  "name": "@prospectpro/shared",
  "dependencies": {
    "zod": "^3.22.0", # validation schemas
    "date-fns": "^2.30.0" # utilities
  }
}
```

## **Migration Strategy**

### **Phase 1: Organize Structure**

```bash
# Current problematic structure
ProspectPro/
├── index.html           # ✅ Keep at root
├── main.tsx            # ❌ Move to app/frontend/src/
├── App.tsx             # ❌ Move to app/frontend/src/
├── components/         # ❌ Move to app/frontend/src/
└── node_modules/       # ✅ Keep at root

# Target structure
ProspectPro/
├── index.html                    # Entry point
├── package.json                  # Root dependencies
├── vite.config.ts               # Build config
├── app/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── main.tsx         # Vite entry
│   │   │   ├── App.tsx
│   │   │   └── components/
│   │   └── package.json         # Frontend deps
│   └── backend/
└── node_modules/                # Shared deps
```

### **Phase 2: Update Configs**

**Update `vite.config.ts`:**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "./app/frontend",
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app/frontend/src"),
      "@shared": path.resolve(__dirname, "./app/shared"),
    },
  },
});
```

**Update `index.html`:**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ProspectPro</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Move `index.html` to `app/frontend/`:**

```bash
mv index.html app/frontend/index.html
```

## **Package Management Best Practices**

### **1. Use Workspace Pattern**

```bash
npm install --workspaces
# or
yarn install
# or
pnpm install --recursive
```

### **2. Dependency Categories**

- **Root**: Build tools, linting, testing frameworks
- **Frontend**: React, Vite, UI libraries
- **Backend**: Supabase, API clients, validation
- **Shared**: Common utilities, types, constants

### **3. Version Alignment**

```json
// Use exact versions for critical deps
{
  "dependencies": {
    "react": "18.2.0", // Exact version
    "typescript": "~5.2.0" // Patch updates only
  }
}
```

## **Immediate Action Plan**

1. **Fix Build Now:**

```bash
# Move index.html to frontend directory
mv index.html app/frontend/

# Update vite.config.ts root path
# Then run build
npm run build
```

2. **Organize Dependencies:**

```bash
# Create frontend package.json
cd app/frontend
npm init -y

# Move frontend deps from root
npm install react react-dom @types/react @types/react-dom
```

3. **Update Build Scripts:**

```json
// Root package.json
{
  "scripts": {
    "build": "cd app/frontend && vite build",
    "dev": "cd app/frontend && vite dev",
    "build:all": "npm run build && npm run build:backend"
  }
}
```

This approach maintains the **hybrid mono-repo benefits** while following **Vite/React conventions** and **enabling proper dependency isolation** between your app source, dev tools, and integration domains.
