# 🚀 ProspectPro Cloud-Native Deployment Checklist

## 📋 **DEPLOYMENT FINALIZATION CHECKLIST**

### **Phase 1: Cloud Build Trigger Setup**
- [ ] **Go to Google Cloud Console → Cloud Build → Triggers**
- [ ] **Create New Trigger** with these settings:
  - Name: `prospectpro-main-deploy`
  - Event: Push to branch  
  - Repository: `Alextorelli/ProspectPro`
  - Branch: `^main$`
  - Configuration: Cloud Build configuration file (`cloudbuild.yaml`)

### **Phase 2: Configure Substitution Variables**
- [ ] **Add these substitution variables in the trigger:**
  ```
  _SUPABASE_URL = https://your-project.supabase.co
  _SUPABASE_SECRET_KEY = your-supabase-service-role-key
  _WEBHOOK_AUTH_TOKEN = your-secure-webhook-token (generate a strong token)
  ```

### **Phase 3: Verify Service Account Permissions**
- [ ] **Ensure Cloud Build service account has:**
  - Cloud Run Admin
  - Artifact Registry Writer
  - Service Account User

### **Phase 4: Initial Deployment**
- [ ] **Trigger deployment via git push:**
  ```bash
  git add .
  git commit -m "trigger initial cloud deployment"
  git push origin main
  ```

### **Phase 5: Monitor Deployment**
- [ ] **Check build progress**: https://console.cloud.google.com/cloud-build/builds
- [ ] **Verify Cloud Run service**: https://console.cloud.google.com/run
- [ ] **Note your Cloud Run URL**: `https://prospectpro-xxxxxx.us-central1.run.app`

### **Phase 6: Configure Webhooks (Post-Deployment)**
- [ ] **Update database configuration** (run in Supabase SQL Editor):
  ```sql
  -- Replace [YOUR_CLOUD_RUN_URL] with actual URL
  ALTER DATABASE SET app.campaign_lifecycle_webhook_url = 'https://[YOUR_CLOUD_RUN_URL]/api/webhooks/campaign-lifecycle';
  ALTER DATABASE SET app.cost_alert_webhook_url = 'https://[YOUR_CLOUD_RUN_URL]/api/webhooks/cost-alert';
  ALTER DATABASE SET app.lead_enrichment_webhook_url = 'https://[YOUR_CLOUD_RUN_URL]/api/webhooks/lead-enrichment';
  ALTER DATABASE SET app.webhook_token = '[YOUR_WEBHOOK_AUTH_TOKEN]';
  ```

### **Phase 7: Validation & Testing**
- [ ] **Test health endpoints:**
  ```bash
  curl https://[YOUR_CLOUD_RUN_URL]/health
  curl https://[YOUR_CLOUD_RUN_URL]/diag
  curl https://[YOUR_CLOUD_RUN_URL]/ready
  ```

- [ ] **Test webhook endpoints:**
  ```bash
  curl https://[YOUR_CLOUD_RUN_URL]/api/webhooks/campaign-lifecycle/health
  curl https://[YOUR_CLOUD_RUN_URL]/api/webhooks/cost-alert/health
  curl https://[YOUR_CLOUD_RUN_URL]/api/webhooks/lead-enrichment/health
  ```

- [ ] **Test main API:**
  ```bash
  curl -X POST https://[YOUR_CLOUD_RUN_URL]/api/business/discover-businesses \
    -H "Content-Type: application/json" \
    -d '{"businessType":"restaurant","location":"Austin, TX","maxResults":1}'
  ```

## 🎯 **Success Criteria**

### **✅ Deployment Successful When:**
- [ ] Cloud Build completes without errors
- [ ] Cloud Run service is running and accessible
- [ ] Health endpoints return 200 status
- [ ] Database connection is established (`/ready` endpoint)
- [ ] Webhook endpoints are accessible
- [ ] Main API returns valid business discovery results

### **✅ Webhooks Working When:**
- [ ] Database triggers execute without errors
- [ ] Webhook logs show successful HTTP 200 responses
- [ ] Real-time campaign updates are processed
- [ ] Cost alerts are triggered and handled
- [ ] Lead enrichment automation is functioning

## 📞 **Troubleshooting Guide**

### **Build Failures:**
- Check Cloud Build logs for specific error messages
- Verify substitution variables are correctly set
- Ensure service account permissions are configured

### **Runtime Errors:**
- Check Cloud Run logs for application errors
- Verify environment variables are injected correctly
- Test database connectivity via `/diag` endpoint

### **Webhook Issues:**
- Verify webhook URLs are correctly configured in database
- Check webhook authentication token matches
- Monitor webhook execution logs in database

## 🔗 **Quick Reference Links**

- **Cloud Build Console**: https://console.cloud.google.com/cloud-build/builds
- **Cloud Run Console**: https://console.cloud.google.com/run
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub Repository**: https://github.com/Alextorelli/ProspectPro

## 📚 **Documentation References**

- [`docs/CLOUD_BUILD_SETUP.md`](CLOUD_BUILD_SETUP.md) - Detailed setup guide
- [`docs/CLOUD_NATIVE_WEBHOOK_SETUP.md`](CLOUD_NATIVE_WEBHOOK_SETUP.md) - Webhook configuration
- [`docs/SUPABASE_ARCHITECTURE_VALIDATION.md`](SUPABASE_ARCHITECTURE_VALIDATION.md) - Architecture validation

---

**Remember**: Your cloud-native architecture is production-ready. This checklist ensures proper configuration and validates the deployment is working correctly.