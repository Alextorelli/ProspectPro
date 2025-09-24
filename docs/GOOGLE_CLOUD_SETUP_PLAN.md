# Google Cloud Setup Plan for ProspectPro Production Deployment

## 🎯 **Phase 1: Google Cloud Console Setup**

### **Step 1: Project Setup**

1. **Navigate to Google Cloud Console**: <https://console.cloud.google.com>
2. **Create New Project** (or use existing):
   - Project Name: `ProspectPro Production`
   - Project ID: `prospectpro-prod` (must be globally unique)
   - Organization: Your organization (if applicable)

### **Step 2: Enable Required APIs**

Navigate to **APIs & Services** → **Library** and enable these APIs:

```text
# Core APIs for deployment
✅ Cloud Run API
✅ Cloud Build API
✅ Container Registry API
✅ Cloud Resource Manager API
✅ Cloud SQL Admin API (for future scaling)
✅ Cloud Monitoring API
✅ Cloud Logging API

# Optional but recommended
✅ Secret Manager API (for additional security)
✅ Cloud Domains API (for custom domain management)
```

**Quick Enable via Cloud Shell:**

```bash
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  cloudresourcemanager.googleapis.com \
  sqladmin.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  secretmanager.googleapis.com
```

### **Step 3: IAM & Service Accounts**

#### **Create Deployment Service Account**

1. **Navigate to**: IAM & Admin → Service Accounts
2. **Create Service Account**:
   - Name: `prospectpro-deployment`
   - Description: `Service account for ProspectPro Cloud Run deployment`
3. **Grant Roles**:

   ```text
   ✅ Cloud Run Admin
   ✅ Cloud Build Service Account
   ✅ Storage Admin
   ✅ Container Registry Service Agent
   ✅ Cloud SQL Client (for future)
   ```

#### **Generate Service Account Key**

1. Click on your new service account
2. **Keys** tab → **Add Key** → **Create New Key**
3. **JSON format** → Download
4. **IMPORTANT**: Save this file securely - you'll add it to GitHub Secrets

## 🎯 **Phase 2: GitHub Repository Secrets Setup**

### **Required GitHub Secrets**

Navigate to your GitHub repo: **Settings** → **Secrets and Variables** → **Actions**

Add these **Repository Secrets**:

```bash
# Google Cloud Configuration
GCP_PROJECT_ID=prospectpro-prod
GCP_SA_KEY=[Contents of the JSON service account key file]
GCP_REGION=us-central1

# ProspectPro Application Secrets (copy from your current .env)
SUPABASE_URL=[Your Supabase project URL]
SUPABASE_SECRET_KEY=[Your Supabase service role key]
NODE_ENV=production

# Optional: Custom Domain
DOMAIN_NAME=prospectpro.appsmithery.co
```

### **How to Set GCP_SA_KEY Secret**

1. Open the downloaded JSON service account key file
2. Copy the **entire contents** (it should look like this):

```json
{
  "type": "service_account",
  "project_id": "prospectpro-prod",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "prospectpro-deployment@prospectpro-prod.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

3. Paste the entire JSON content as the value for `GCP_SA_KEY`

## 🎯 **Phase 3: Cloud Run Configuration**

### **Initial Service Setup**

1. **Navigate to**: Cloud Run in Google Cloud Console
2. **Create Service**:
   - Service name: `prospectpro`
   - Region: `us-central1` (recommended for US East Coast performance)
   - CPU allocation: `CPU is only allocated during request processing`
   - Authentication: `Allow unauthenticated invocations`

### **Container Configuration**

```yaml
# These will be configured via GitHub Actions deployment
Container Image: gcr.io/prospectpro-prod/prospectpro:latest
Port: 3100
Memory: 2 GiB
CPU: 2
Maximum requests per container: 100
Request timeout: 300 seconds
```

### **Environment Variables**

These will be set automatically via GitHub Actions:

```bash
NODE_ENV=production
SUPABASE_URL=[From GitHub Secrets]
SUPABASE_SECRET_KEY=[From GitHub Secrets]
PORT=3100
```

## 🎯 **Phase 4: Domain & DNS Setup**

### **Option A: Google Cloud Domains (Easiest)**

1. **Navigate to**: Network Services → Cloud Domains
2. **Register or Transfer** your domain to Google Cloud
3. **Automatic SSL** and DNS management

### **Option B: External DNS (Your Current Setup)**

1. **Deploy ProspectPro** to Cloud Run (you'll get a URL like `https://prospectpro-xyz.run.app`)
2. **Add CNAME Record** in your DNS provider:
   ```dns
   Type: CNAME
   Name: prospectpro
   Value: ghs.googlehosted.com
   TTL: 3600
   ```
3. **Map Custom Domain** in Cloud Run:
   - Cloud Run Console → Your service → **Manage Custom Domains**
   - Add: `prospectpro.appsmithery.co`
   - Verify domain ownership

## 🎯 **Phase 5: Monitoring & Logging Setup**

### **Cloud Monitoring (Automatic)**

Cloud Run automatically provides:

- ✅ Request latency metrics
- ✅ Error rate tracking
- ✅ CPU/Memory utilization
- ✅ Request count and traffic

### **Custom Alerts (Recommended)**

Set up alerts for:

```bash
- Response time > 10 seconds
- Error rate > 5%
- Memory usage > 80%
- Request failures > 10/hour
```

## 📋 **Pre-Deployment Checklist**

### **Google Cloud Console Verified:**

- [ ] Project created with proper billing account
- [ ] All required APIs enabled
- [ ] Service account created with proper roles
- [ ] Service account JSON key downloaded

### **GitHub Repository Configured:**

- [ ] All secrets added to GitHub repository
- [ ] GitHub Actions workflow file committed
- [ ] Cloud Build configuration committed

### **DNS Ready:**

- [ ] Domain ownership verified
- [ ] DNS provider access confirmed
- [ ] CNAME record ready to create

## 🚀 **Estimated Costs**

### **Monthly Cost Breakdown (1000 business discovery requests)**

```javascript
const monthlyCosts = {
  cloudRun: {
    requests: "1000 × $0.0000004 = $0.40",
    cpu: "2 vCPU × 30s avg × 1000 requests × $0.00002400 = $1.44",
    memory: "2GB × 30s × 1000 requests × $0.00000250 = $0.15",
    subtotal: "$1.99",
  },

  cloudBuild: {
    buildMinutes: "10 builds × 2 min × $0.003 = $0.06",
  },

  storage: {
    containerImages: "~$0.50",
  },

  networking: {
    dataTransfer: "~$1.00",
  },

  totalMonthly: "$3.55 + your API costs",
  freeTrierCoverage: "First 6 months likely FREE with $300 credit",
};
```

## ⚠️ **Security Recommendations**

### **Before Going Live:**

1. **Enable VPC Security** (optional but recommended for production)
2. **Set up Cloud Armor** for DDoS protection
3. **Configure Cloud IAM** for team access
4. **Enable Audit Logging** for compliance
5. **Set up Backup Strategy** for Supabase data

## 🎯 **Next Steps**

Once you complete Phase 1-2, let me know and I'll help you with:

1. **Testing the GitHub Actions deployment**
2. **Verifying Cloud Run service configuration**
3. **Setting up custom domain mapping**
4. **Configuring monitoring and alerts**

**Ready to start with Phase 1? Let me know when you have the Google Cloud project and APIs set up!**
