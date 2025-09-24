#!/usr/bin/env node
// GitHub Secrets validation for Google Cloud Run deployment
// Usage: Run this to verify your GitHub secrets are configured correctly

console.log("🔍 GitHub Secrets Validation for Google Cloud Run");
console.log("================================================");
console.log("");

console.log("📋 Required GitHub Repository Secrets:");
console.log("");

const requiredSecrets = [
  {
    name: "GCP_PROJECT_ID",
    description: 'Your Google Cloud Project ID (e.g., "my-project-123456")',
    example: "prospectpro-production-2024",
  },
  {
    name: "GCP_SA_KEY",
    description: "Service Account JSON key (complete JSON object as string)",
    example:
      '{"type": "service_account", "project_id": "...", "private_key_id": "...", ...}',
  },
  {
    name: "GCP_REGION",
    description:
      "Google Cloud region for deployment (optional, defaults to us-central1)",
    example: "us-central1",
  },
  {
    name: "SUPABASE_URL",
    description: "Your Supabase project URL",
    example: "https://abc123.supabase.co",
  },
  {
    name: "SUPABASE_SECRET_KEY",
    description: "Supabase service role key (secret/anon key)",
    example: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  },
];

requiredSecrets.forEach((secret, index) => {
  console.log(`${index + 1}. ${secret.name}`);
  console.log(`   Purpose: ${secret.description}`);
  console.log(`   Example: ${secret.example}`);
  console.log("");
});

console.log("🔧 How to configure GitHub secrets:");
console.log("");
console.log("1. Go to your GitHub repository");
console.log("2. Click Settings → Secrets and variables → Actions");
console.log('3. Click "New repository secret" for each required secret');
console.log("4. Copy the exact secret name and paste the value");
console.log("");

console.log("⚠️  Common Issues:");
console.log("");
console.log("• GCP_SA_KEY must be the complete JSON service account key");
console.log("• Do not base64 encode the service account key");
console.log(
  "• Make sure the service account has required Cloud Run permissions"
);
console.log("• Project ID should match your Google Cloud project exactly");
console.log("");

console.log("🔍 To verify your service account key format:");
console.log("");
console.log("The GCP_SA_KEY should start with:");
console.log('{"type": "service_account", "project_id": "your-project-id",...}');
console.log("");

console.log("🚀 After configuring secrets, re-run the deployment:");
console.log("");
console.log(
  'git add . && git commit -m "fix: Configure GitHub secrets for Cloud Run deployment" && git push'
);
console.log("");

console.log("✅ Deployment will automatically trigger on push to main branch");
