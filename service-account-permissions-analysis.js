#!/usr/bin/env node
// Service Account Permissions Analysis for ProspectPro Cloud Build/Run

console.log("🔐 ProspectPro Service Account Permissions Analysis");
console.log("=================================================");
console.log("");

console.log("📋 CURRENT SERVICE ACCOUNT:");
console.log("---------------------------");
console.log(
  "Account: prospectpro-deployment@leadgen-471822.iam.gserviceaccount.com"
);
console.log("Status: Set as preferred service account ✅");
console.log("");

console.log("📊 PERMISSION ANALYSIS:");
console.log("=======================");
console.log("");

console.log("✅ CORRECTLY ENABLED (Keep These):");
console.log("   • Cloud Run Admin - ENABLED ✅");
console.log("     → Required: Deploy/update Cloud Run services");
console.log("   • Storage Admin - ENABLED ✅");
console.log("     → Required: Access Container Registry/Artifact Registry");
console.log("");

console.log("❌ CURRENTLY DISABLED (Consider Enabling):");
console.log("");

console.log("🔧 CRITICAL FOR PROSPECTPRO:");
console.log("   • Cloud Build WorkerPool User - DISABLED ❌");
console.log("     → Impact: May cause build failures");
console.log("     → Action: ENABLE for reliable builds");
console.log("");
console.log("   • Artifact Registry Writer - DISABLED ❌");
console.log("     → Impact: Cannot push container images");
console.log("     → Action: ENABLE (critical for deployment)");
console.log("");

console.log("🔧 RECOMMENDED FOR PRODUCTION:");
console.log("   • Cloud Functions Developer - DISABLED");
console.log("     → Impact: ProspectPro doesn't use Cloud Functions");
console.log("     → Action: KEEP DISABLED (security best practice)");
console.log("");
console.log("   • Secret Manager Secret Accessor - DISABLED");
console.log(
  "     → Impact: ProspectPro uses Supabase Vault, not Secret Manager"
);
console.log("     → Action: KEEP DISABLED (not needed)");
console.log("");
console.log("   • Service Account User - DISABLED");
console.log("     → Impact: May be needed for service-to-service calls");
console.log("     → Action: CONSIDER ENABLING if deployment issues occur");
console.log("");

console.log("🔧 OPTIONAL (Good to Have):");
console.log("   • Logs Configuration Writer - DISABLED");
console.log("     → Impact: Enhanced logging configuration");
console.log("     → Action: ENABLE for better monitoring");
console.log("");
console.log("   • Firebase Admin - DISABLED");
console.log("     → Impact: ProspectPro doesn't use Firebase");
console.log("     → Action: KEEP DISABLED");
console.log("");

console.log("🎯 RECOMMENDED ACTIONS:");
console.log("=======================");
console.log("");

console.log("ENABLE THESE (Critical):");
console.log("   1. ✅ Cloud Build WorkerPool User");
console.log("   2. ✅ Artifact Registry Writer");
console.log("   3. ✅ Logs Configuration Writer");
console.log("");

console.log("OPTIONALLY ENABLE:");
console.log("   4. 🤔 Service Account User (if deployment issues)");
console.log("");

console.log("KEEP DISABLED (Security):");
console.log("   • Cloud Functions Developer");
console.log("   • Secret Manager Secret Accessor");
console.log("   • Firebase Admin");
console.log("   • App Engine Admin");
console.log("   • Kubernetes Engine Developer");
console.log("   • Compute Instance Admin (v1)");
console.log("   • Cloud KMS CryptoKey Decrypter");
console.log("   • Storage Object Creator");
console.log("");

console.log("🚀 DEPLOYMENT WORKFLOW REQUIREMENTS:");
console.log("===================================");
console.log("");
console.log("For ProspectPro's deployment flow:");
console.log("Git Push → Cloud Build → Artifact Registry → Cloud Run");
console.log("");
console.log("Required permissions:");
console.log("1. Cloud Build WorkerPool User (build execution)");
console.log("2. Artifact Registry Writer (image storage)");
console.log("3. Cloud Run Admin (service deployment)");
console.log("4. Storage Admin (registry access)");
console.log("5. Logs Configuration Writer (monitoring)");
console.log("");

console.log("🔍 TROUBLESHOOTING PERMISSION ISSUES:");
console.log("====================================");
console.log("");
console.log("If builds fail with permission errors:");
console.log("   • Check Cloud Build WorkerPool User");
console.log("   • Verify Artifact Registry Writer");
console.log("   • Enable Service Account User");
console.log("");
console.log("If deployments fail:");
console.log("   • Verify Cloud Run Admin is enabled");
console.log("   • Check Storage Admin permissions");
console.log("");

console.log("🎯 FINAL RECOMMENDED CONFIGURATION:");
console.log("==================================");
console.log("");
console.log("ENABLED PERMISSIONS:");
console.log("✅ Cloud Run Admin");
console.log("✅ Storage Admin");
console.log("✅ Cloud Build WorkerPool User ← ENABLE THIS");
console.log("✅ Artifact Registry Writer ← ENABLE THIS");
console.log("✅ Logs Configuration Writer ← ENABLE THIS");
console.log("");
console.log("DISABLED PERMISSIONS (Security):");
console.log("❌ Cloud Functions Developer");
console.log("❌ Secret Manager Secret Accessor");
console.log("❌ Firebase Admin");
console.log("❌ All others not mentioned above");
console.log("");

console.log("💡 After enabling these permissions:");
console.log("   • Save the service account configuration");
console.log("   • Test the build trigger with a commit");
console.log("   • Monitor deployment success");

console.log("");
console.log("🚀 Ready to enable the critical permissions!");
