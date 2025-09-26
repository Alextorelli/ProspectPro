#!/usr/bin/env node

/**
 * ProspectPro Deployment Fix Script
 * Provides manual steps to fix service account permissions
 */

console.log("🔧 ProspectPro Deployment Fix Guide\n");

const PROJECT_ID = "leadgen-471822";
const SERVICE_ACCOUNT =
  "prospectpro-deployment@leadgen-471822.iam.gserviceaccount.com";

console.log("📋 Current Status:");
console.log("- Project ID:", PROJECT_ID);
console.log("- Service Account:", SERVICE_ACCOUNT);
console.log("- Region: us-central1");
console.log("- GitHub Secrets: ✅ Confirmed configured");
console.log("- Supabase OAuth: ❌ Disabled (intentional)\n");

console.log("🔐 Required Service Account Roles:");
const requiredRoles = [
  "roles/serviceusage.serviceUsageAdmin",
  "roles/cloudbuild.builds.builder",
  "roles/iam.serviceAccountUser",
  "roles/run.admin",
  "roles/storage.admin",
];

requiredRoles.forEach((role, index) => {
  console.log(`${index + 1}. ${role}`);
});

console.log("\n🛠️ Manual Fix Steps:");
console.log("\n1. Go to Google Cloud Console:");
console.log(
  "   https://console.cloud.google.com/iam-admin/iam?project=leadgen-471822"
);

console.log("\n2. Find service account:");
console.log("   prospectpro-deployment@leadgen-471822.iam.gserviceaccount.com");

console.log('\n3. Click "Edit" and add the following roles:');
requiredRoles.forEach((role, index) => {
  console.log(`   ${index + 1}. ${role}`);
});

console.log("\n4. Alternative: Use gcloud CLI (if available):");
requiredRoles.forEach((role) => {
  console.log(`gcloud projects add-iam-policy-binding ${PROJECT_ID} \\`);
  console.log(`  --member="serviceAccount:${SERVICE_ACCOUNT}" \\`);
  console.log(`  --role="${role}"\n`);
});

console.log("5. After fixing permissions, trigger deployment:");
console.log("   - Go to GitHub Actions in your repository");
console.log('   - Run "Deploy to Google Cloud Run (Simple)" workflow');
console.log("   - Or push a commit to main branch\n");

console.log("🧪 Test Commands After Deployment:");
console.log("curl https://prospectpro-[hash]-uc.a.run.app/health");
console.log("curl https://prospectpro-[hash]-uc.a.run.app/diag");

console.log("\n✅ Once fixed, your deployment should work automatically!");
