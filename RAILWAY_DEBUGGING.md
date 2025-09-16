# Railway Deployment Debugging Guide

## For Deployment Issues (App Returns 404)

This guide helps debug Railway deployment issues when the app never comes online.

### Step 1: Enable Degraded Mode for Debugging

The app now includes `ALLOW_DEGRADED_START=true` by default in `railway.toml` for initial deployments.

### Step 2: Access Debugging Endpoints

Once your Railway app deploys (even in degraded mode), access these endpoints:

```bash
# Check basic connectivity (always responds)
curl https://your-app.railway.app/live

# Check detailed health status
curl https://your-app.railway.app/health

# Get comprehensive diagnostics
curl https://your-app.railway.app/diag

# Force fresh Supabase connection test  
curl https://your-app.railway.app/diag?force=true
```

### Step 3: Interpret Common Issues

#### App Won't Start (Container Exits)
- **Symptom**: Railway shows "Application not found" (404)
- **Debug**: Check Railway logs for startup errors
- **Solution**: Ensure `ALLOW_DEGRADED_START=true` is set

#### Missing Environment Variables
- **Symptom**: `/health` shows `"status": "degraded"`
- **Debug**: Check `/diag` → `supabase.startup.recommendations`
- **Solution**: Set missing variables in Railway dashboard

#### Database Connection Failed  
- **Symptom**: Supabase connection errors in diagnostics
- **Debug**: Check `/diag` → `supabase.startup.error`
- **Common fixes**:
  - Verify `SUPABASE_URL` format: `https://xyz.supabase.co`
  - Check `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
  - Test connection from Railway IP (firewall issues)

### Step 4: Interpreting Diagnostic Output

#### Healthy Deployment
```json
{
  "deployment": {
    "degradedMode": false,
    "allowDegraded": true
  },
  "supabase": {
    "startup": { "success": true },
    "current": { "success": true }
  }
}
```

#### Degraded but Serviceable
```json
{
  "deployment": {
    "degradedMode": true,
    "allowDegraded": true
  },
  "supabase": {
    "startup": { 
      "success": false,
      "error": "SUPABASE_URL missing",
      "recommendations": ["Set SUPABASE_URL=https://<ref>.supabase.co"]
    }
  }
}
```

### Step 5: Railway-Specific Environment Detection

The `/diag` endpoint includes Railway-specific fields:

```json
{
  "railwaySpecific": {
    "envDetected": true,
    "publicDomain": "your-app-name-production-abc123.up.railway.app",
    "serviceId": "service-abc123",
    "environmentId": "env-xyz789"
  }
}
```

### Step 6: Remove Degraded Mode Once Stable

After resolving connection issues:

1. **Option A**: Remove from `railway.toml`:
   ```toml
   [environment]
   NODE_ENV = "production"
   # ALLOW_DEGRADED_START = "true"  # Comment out or remove
   ```

2. **Option B**: Override in Railway Environment Variables:
   ```
   ALLOW_DEGRADED_START=false
   ```

### Emergency Recovery Commands

If the deployment is completely broken:

```bash
# Check if container is even responding
curl -I https://your-app.railway.app/live

# Get minimal diagnostics (no database required)
curl -s https://your-app.railway.app/health | jq .deployment

# Force connection retry
curl https://your-app.railway.app/diag?force=true
```

### Log Analysis Patterns

Look for these patterns in Railway logs:

**✅ Good Signs:**
- `🚀 ProspectPro server listening on port 3000`
- `✅ Supabase connectivity established`
- Boot success rate >80%

**🟠 Warning Signs (recoverable):**
- `🟠 Warning: Supabase connection failed. Continuing in degraded mode`
- `📊 Health: degraded mode`

**🔴 Critical Issues:**
- Process exits immediately
- `🔴 Critical: Supabase connection failed and degraded mode disabled`
- Module loading errors

### Production Readiness Checklist

- [ ] `/health` returns `"status": "ok"`
- [ ] `/diag` shows `"degradedMode": false`
- [ ] Supabase connection successful
- [ ] All required environment variables set
- [ ] `ALLOW_DEGRADED_START` removed or set to `false`