**Targeted action plan**

1. **Normalize entry files**

   - `git mv app/frontend/main.tsx app/frontend/src/main.tsx`
   - `git mv app/frontend/App.tsx app/frontend/src/App.tsx`
   - `git mv app/frontend/index.css app/frontend/src/index.css`
   - Update import paths in the moved `main.tsx`/`App.tsx` to use `./lib/...`, `./components/...`, `./contexts/...`.

2. **Fix HTML entrypoint**

   - Edit index.html → `<script type="module" src="/src/main.tsx"></script>`.
   - Ensure `<div id="root"></div>` exists.

3. **Tidy directory duplication**

   - Remove empty shells: `rm -rf app/frontend/{components,constants,contexts,hooks,lib,pages,stores,types,utils}` (since real copies live under `src/`).
   - Verify `tree app/frontend -L 2` matches desired structure.

4. **Align Vite config**

   - In vite.config.ts confirm:
     ```ts
     root: path.resolve(__dirname, "app/frontend"),
     publicDir: path.resolve(__dirname, "app/frontend/public"),
     build: { outDir: path.resolve(__dirname, "dist"), emptyOutDir: true },
     resolve: { alias: { "@frontend": path.resolve(__dirname, "app/frontend/src") } }
     ```
   - Regenerate `.d.ts` if aliases changed (`npx tsc --noEmit`).

5. **Re-run validation**

   - `npm run build`
   - `npm test` (or project’s frontend test target, e.g. `npm run test:frontend`)
   - `npm run repo:scan`

6. **Document & log**
   - Append outcomes to coverage.md and workspace_status.md.
   - Note config adjustments in settings-staging.md.

This sequence resolves the Vite entrypoint errors, prevents duplicate directories, and verifies the frontend after restructuring.
