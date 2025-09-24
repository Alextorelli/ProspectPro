#!/usr/bin/env node
// Artifact Registry Repository Name Resolver for ProspectPro

console.log("🔍 ProspectPro Artifact Registry Repository Resolver");
console.log("===================================================");
console.log("");

console.log("🚨 ERROR ANALYSIS:");
console.log("==================");
console.log(
  'Error: name unknown: Repository "rmpcgab-prospectpro-us-central1-alextorelli-prospectpro--majuv" not found'
);
console.log("");
console.log("ROOT CAUSE:");
console.log(
  "   The repository name in cloudbuild.yaml doesn't match the actual Artifact Registry repository."
);
console.log(
  "   We need to find the correct repository name from your Google Cloud project."
);
console.log("");

console.log("🎯 SOLUTION APPROACH:");
console.log("=====================");
console.log("");

console.log("OPTION 1: Use Automatic Repository Detection");
console.log("   • Let Cloud Build auto-create the repository");
console.log("   • Simpler configuration");
console.log("   • Standard naming convention");
console.log("");

console.log("OPTION 2: Find Existing Repository Name");
console.log("   • Check Google Cloud Console > Artifact Registry");
console.log("   • Use exact repository name");
console.log("   • Manual configuration");
console.log("");

console.log("🔧 RECOMMENDED FIX - OPTION 1 (Auto-Detection):");
console.log("================================================");
console.log("");

console.log("UPDATED CLOUDBUILD.YAML:");
console.log("Use standard repository naming that auto-creates if needed:");
console.log("");

console.log("Repository URL Pattern:");
console.log(
  "   us-central1-docker.pkg.dev/$PROJECT_ID/[REPO_NAME]/[IMAGE_NAME]"
);
console.log("");

console.log("STANDARD NAMING OPTIONS:");
console.log("");
console.log("Option A - Simple Repository Name:");
console.log("   us-central1-docker.pkg.dev/$PROJECT_ID/prospectpro/app:latest");
console.log("");
console.log("Option B - Cloud Run Default Pattern:");
console.log(
  "   us-central1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/prospectpro:latest"
);
console.log("");
console.log("Option C - Project-Based Repository:");
console.log(
  "   us-central1-docker.pkg.dev/$PROJECT_ID/leadgen-471822/prospectpro:latest"
);
console.log("");

console.log("🚀 CORRECTED CLOUDBUILD.YAML SECTIONS:");
console.log("======================================");
console.log("");

console.log("# Build step with corrected repository name");
console.log('- name: "gcr.io/cloud-builders/docker"');
console.log("  args: [");
console.log('    "build",');
console.log(
  '    "-t", "us-central1-docker.pkg.dev/$PROJECT_ID/prospectpro/app:$COMMIT_SHA",'
);
console.log(
  '    "-t", "us-central1-docker.pkg.dev/$PROJECT_ID/prospectpro/app:latest",'
);
console.log('    "."');
console.log("  ]");
console.log("");

console.log("# Push step with corrected repository name");
console.log('- name: "gcr.io/cloud-builders/docker"');
console.log("  args: [");
console.log('    "push",');
console.log('    "--all-tags",');
console.log('    "us-central1-docker.pkg.dev/$PROJECT_ID/prospectpro/app"');
console.log("  ]");
console.log("");

console.log("# Deploy step with corrected image URL");
console.log('- name: "gcr.io/google.com/cloudsdktool/cloud-sdk"');
console.log('  entrypoint: "gcloud"');
console.log("  args:");
console.log('    - "run"');
console.log('    - "deploy"');
console.log('    - "prospectpro"');
console.log(
  '    - "--image=us-central1-docker.pkg.dev/$PROJECT_ID/prospectpro/app:latest"'
);
console.log('    - "--region=us-central1"');
console.log("    - # ... other args");
console.log("");

console.log("🔍 HOW TO VERIFY CORRECT REPOSITORY:");
console.log("====================================");
console.log("");
console.log("METHOD 1: Check Google Cloud Console");
console.log("   1. Go to: Google Cloud Console > Artifact Registry");
console.log("   2. Look for existing repositories in us-central1");
console.log("   3. Note the exact repository name");
console.log("   4. Update cloudbuild.yaml accordingly");
console.log("");

console.log("METHOD 2: Let Cloud Build Auto-Create");
console.log('   1. Use simple repository name like "prospectpro"');
console.log("   2. Cloud Build will create repository if it doesn't exist");
console.log(
  "   3. Ensure service account has Artifact Registry Admin permissions"
);
console.log("");

console.log("💡 IMMEDIATE ACTIONS:");
console.log("=====================");
console.log("");
console.log("1. Update cloudbuild.yaml with simplified repository name");
console.log(
  "2. Use pattern: us-central1-docker.pkg.dev/$PROJECT_ID/prospectpro/app"
);
console.log("3. Commit and push the corrected configuration");
console.log("4. Monitor build for successful repository creation/access");
console.log("");

console.log(
  "🎯 NEXT STEP: Update the cloudbuild.yaml file with correct repository naming!"
);
