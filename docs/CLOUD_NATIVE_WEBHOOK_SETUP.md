# ProspectPro Cloud-Native Webhook Configuration

## Webhook URLs to Configure

Once your Cloud Run deployment is live, configure these webhook URLs in your Supabase project:

### 1. Supabase Dashboard Configuration

**Settings → Database → Webhooks**

```
Campaign Lifecycle Webhook:
URL: https://[YOUR_CLOUD_RUN_URL]/api/webhooks/campaign-lifecycle
Events: Database triggers from campaigns table
Authentication: Bearer token (use your WEBHOOK_AUTH_TOKEN)

Cost Alert Webhook:
URL: https://[YOUR_CLOUD_RUN_URL]/api/webhooks/cost-alert
Events: Database triggers from cost monitoring
Authentication: Bearer token (use your WEBHOOK_AUTH_TOKEN)

Lead Enrichment Webhook:
URL: https://[YOUR_CLOUD_RUN_URL]/api/webhooks/lead-enrichment
Events: Database triggers from enhanced_leads table
Authentication: Bearer token (use your WEBHOOK_AUTH_TOKEN)
```

### 2. Database Configuration Settings

Execute in Supabase SQL Editor:

```sql
-- Configure webhook URLs for database functions
ALTER DATABASE SET app.campaign_lifecycle_webhook_url = 'https://[YOUR_CLOUD_RUN_URL]/api/webhooks/campaign-lifecycle';
ALTER DATABASE SET app.cost_alert_webhook_url = 'https://[YOUR_CLOUD_RUN_URL]/api/webhooks/cost-alert';
ALTER DATABASE SET app.lead_enrichment_webhook_url = 'https://[YOUR_CLOUD_RUN_URL]/api/webhooks/lead-enrichment';

-- Configure webhook authentication token
ALTER DATABASE SET app.webhook_token = '[YOUR_WEBHOOK_AUTH_TOKEN]';
```

### 3. Environment Variables for Cloud Build

Add to your Cloud Build trigger substitution variables:

```
_WEBHOOK_AUTH_TOKEN: your-secure-webhook-token
_PERSONAL_ACCESS_TOKEN: your-admin-access-token (optional)
```

## Webhook Flow Architecture

```
Database Event → PostgreSQL Trigger → HTTP POST → Cloud Run Webhook → Business Logic
```

## Benefits Already Implemented

✅ **Real-time Processing**: Instant lead enrichment and campaign updates
✅ **Cost Protection**: Automatic budget alerts and spend monitoring  
✅ **Progress Tracking**: Live campaign progress updates
✅ **Error Handling**: Webhook retry logic and failure logging
✅ **Authentication**: Secure Bearer token authentication
✅ **Monitoring**: Comprehensive webhook execution logging

## No Additional Webhooks Needed

Your current webhook infrastructure is **production-ready** and comprehensive. The cloud-native deployment will inherit all existing webhook functionality once the URLs are configured.

## Testing Webhooks

After deployment, test webhooks:

```bash
# Test campaign lifecycle webhook
curl -X POST https://[YOUR_CLOUD_RUN_URL]/api/webhooks/campaign-lifecycle/health

# Test cost alert webhook
curl -X POST https://[YOUR_CLOUD_RUN_URL]/api/webhooks/cost-alert/health

# Test lead enrichment webhook
curl -X POST https://[YOUR_CLOUD_RUN_URL]/api/webhooks/lead-enrichment/health
```
