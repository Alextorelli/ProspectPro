# ProspectPro CI/CD Deployment Guide - Custom Domain Consistency

## 🎯 **Primary Producti### **Vercel Configuration** (`vercel.json`)
- **Framework**: `"vite"` (native detection)
- **outputDirectory**: `"dist"` (React build output)
- **buildCommand**: `"npm run build"`
- **Node.js**: 22.x (Vercel requirement)
- **Custom domain**: Configured in Vercel dashboardURL**

**https://prospectpro.appsmithery.co/** (ALWAYS ACCESSIBLE)

This custom domain always points to the latest deployment, regardless of the underlying Vercel URL.

## 🚀 **CI/CD Deployment Process**

### **1. Frontend Deployment**

```bash
# Standard deployment process (always use this)
npm run build                    # Build React/Vite app
cd dist                         # Navigate to build output
vercel --prod                   # Deploy to production

# Or use automated script
./scripts/deploy.sh             # Auto-detects and deploys correctly

# Or use npm shortcut
npm run frontend:deploy         # Build and deploy in one command
```

### **2. Backend Deployment**

```bash
# Deploy Edge Functions
supabase functions deploy business-discovery-optimized
supabase functions deploy enrichment-orchestrator
supabase functions deploy campaign-export

# Or deploy all critical functions
npm run deploy:critical
```

## 📋 **Deployment Architecture**

```
GitHub Repository (main branch)
        ↓
    Manual/Automated Build
        ↓
    React/Vite Build → /dist/
        ↓
    Vercel Deployment
        ↓
Custom Domain: prospectpro.appsmithery.co
        ↓
    Supabase Edge Functions
        ↓
    External APIs (Google Places, Hunter.io, etc.)
```

## ✅ **Verification Checklist**

After each deployment, verify:

1. **Custom Domain Accessible**

   ```bash
   curl -I https://prospectpro.appsmithery.co/
   # Should return 200 OK
   ```

2. **React App Loading**

   ```bash
   curl -s https://prospectpro.appsmithery.co/ | grep -i "ProspectPro"
   # Should find title and app content
   ```

3. **Edge Functions Working**

   ```bash
   # Test from browser console or with proper auth
   fetch('/api/business-discovery-optimized', {method: 'POST', ...})
   ```

4. **MCP Server Status**
   ```bash
   ps aux | grep production-server
   # Should show running MCP server
   ```

## 🔧 **Key Configuration Files**

### **Vercel Configuration** (`vercel.json`)

- **outputDirectory**: `"dist"` (React build output)
- **buildCommand**: `"npm run build"`
- **Custom domain**: Configured in Vercel dashboard

### **Package.json Scripts**

- `npm run build` - Build React app (Node.js 22.x)
- `npm run frontend:deploy` - Build and deploy
- `npm run deploy:critical` - Deploy core Edge Functions
- `npm run health:check` - Test custom domain

### **Smart Deployment Script** (`scripts/deploy.sh`)

- Auto-detects React/Vite vs static frontend
- Builds if necessary
- Deploys from correct directory
- Handles errors gracefully

## 🎛️ **CI/CD Integration Points**

### **GitHub Actions (Future)**

```yaml
# Example workflow for automated deployment
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    steps:
      - name: Build React App
        run: npm run build
      - name: Deploy to Vercel
        run: cd dist && vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### **Manual Deployment (Current)**

```bash
# Complete deployment process
git push origin main           # Push code changes
npm run build                  # Build React app
cd dist && vercel --prod      # Deploy to production
npm run health:check          # Verify deployment
```

## 🚨 **Common Issues & Solutions**

### **Issue: Blank Page**

**Cause**: Deploying source files instead of built app
**Solution**: Always deploy from `/dist` after `npm run build`

### **Issue: 404 on Custom Domain**

**Cause**: Domain not properly linked or build failed
**Solution**: Check Vercel dashboard domain settings

### **Issue: Old Vercel URL References**

**Cause**: Documentation or configs pointing to temporary URLs
**Solution**: All references should use `prospectpro.appsmithery.co`

## 📊 **Monitoring & Maintenance**

### **Health Checks**

```bash
# Automated health check
npm run health:check

# Manual verification
curl -I https://prospectpro.appsmithery.co/
curl -I https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-optimized
```

### **Performance Monitoring**

- Custom domain should always resolve to latest deployment
- Edge Functions should respond within 100ms
- React app should load within 2 seconds

## 🎯 **Key Principles**

1. **Domain Consistency**: Always use `prospectpro.appsmithery.co` in documentation
2. **Build Before Deploy**: Never deploy source files, always build React app first
3. **Vercel as Platform**: Vercel URLs are temporary, custom domain is permanent
4. **Edge Function Separation**: Backend deployment is independent of frontend
5. **Documentation Sync**: All docs reflect custom domain as primary access point

---

**Status**: ✅ Documentation updated for custom domain consistency
**Next**: Set up automated deployment pipeline (optional)
**Primary URL**: https://prospectpro.appsmithery.co/ (ALWAYS USE THIS)
