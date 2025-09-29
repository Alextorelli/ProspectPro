# Cloud Build Environment Setup

## Required Substitution Variables

Configure these in your Cloud Build trigger in Google Cloud Console:

### Supabase Configuration

```
_SUPABASE_URL: your-project.supabase.co
_SUPABASE_SECRET_KEY: your-supabase-service-role-key
```

## Setting Up the Trigger

1. **Go to Google Cloud Console → Cloud Build → Triggers**
2. **Create New Trigger**:

   - **Name**: `prospectpro-main-deploy`
   - **Event**: Push to branch
   - **Repository**: Alextorelli/ProspectPro
   - **Branch**: `^main$`
   - **Configuration**: Cloud Build configuration file (cloudbuild.yaml)

3. **Add Substitution Variables**:

   - `_SUPABASE_URL` = `https://your-project.supabase.co`
   - `_SUPABASE_SECRET_KEY` = `your-service-role-key`

4. **Service Account**: Use `prospectpro-deployment@leadgen-471822.iam.gserviceaccount.com`

## Required Permissions

Ensure the Cloud Build service account has:

- Cloud Run Admin
- Artifact Registry Writer
- Service Account User

## Testing

After setup, push to main branch to trigger deployment:

```bash
git add .
git commit -m "test cloud build deployment"
git push origin main
```

Monitor at: https://console.cloud.google.com/cloud-build/builds
