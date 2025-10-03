# Vercel Project Configuration

This file configures Vercel to properly build and deploy the ProspectPro React/Vite application.

## Key Optimizations:

1. **Framework Detection**: Explicitly set to "vite" for optimal build process
2. **Native Build Commands**: Leverages Vercel's native Vite support
3. **Output Directory**: Points to `dist/` where Vite builds the app
4. **SPA Routing**: Rewrites all routes to `/index.html` for React Router
5. **Security Headers**: Includes essential security headers
6. **Asset Caching**: Long-term caching for `/assets/` with immutable flag

## Build Process:

1. `npm ci` - Clean install dependencies
2. `npm run build` - Build React app with Vite
3. Deploy `dist/` directory contents
4. Configure routing and headers

## Custom Domain:

The deployment automatically serves at:

- Primary: https://prospectpro.appsmithery.co/
- Fallback: https://[deployment-url].vercel.app/

## Framework Settings:

If using Vercel dashboard, ensure:

- Framework Preset: "Vite" (not "Other")
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`
