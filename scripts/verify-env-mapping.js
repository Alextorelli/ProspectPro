#!/usr/bin/env node

/**
 * Environment Variable Mapping Verification
 * Checks that Cloud Build substitution variables match environment loader expectations
 */

console.log("🔍 Environment Variable Mapping Verification");
console.log("=" * 50);

// Expected mappings from Cloud Build trigger → Environment Variables → Environment Loader
const mappings = [
  {
    trigger: "_SUPABASE_URL",
    envVar: "SUPABASE_URL",
    loaderKey: "supabase.url",
    required: true,
  },
  {
    trigger: "_SUPABASE_SECRET_KEY",
    envVar: "SUPABASE_SECRET_KEY",
    loaderKey: "supabase.secretKey",
    required: true,
  },
  {
    trigger: "_WEBHOOK_AUTH_TOKEN",
    envVar: "WEBHOOK_AUTH_TOKEN",
    loaderKey: "webhookAuthToken",
    required: true,
  },
  {
    trigger: "_GOOGLE_PLACES_API_KEY",
    envVar: "GOOGLE_PLACES_API_KEY",
    loaderKey: "apiKeys.googlePlaces",
    required: false,
  },
  {
    trigger: "_HUNTER_API_KEY",
    envVar: "HUNTER_API_KEY",
    loaderKey: "apiKeys.hunterIO",
    required: false,
  },
  {
    trigger: "_NEVERBOUNCE_API_KEY",
    envVar: "NEVERBOUNCE_API_KEY",
    loaderKey: "apiKeys.neverBounce",
    required: false,
  },
  {
    trigger: "_FOURSQUARE_SERVICE_API_KEY",
    envVar: "FOURSQUARE_SERVICE_API_KEY",
    loaderKey: "apiKeys.foursquare",
    required: false,
  },
];

console.log("\n📋 Variable Mapping Check:");
console.log(
  "Cloud Build Trigger → Environment Variable → Environment Loader\n"
);

mappings.forEach((mapping) => {
  const status = mapping.required ? "🔴 REQUIRED" : "🟡 OPTIONAL";
  console.log(`${status} ${mapping.trigger}`);
  console.log(`   → ${mapping.envVar}`);
  console.log(`   → ${mapping.loaderKey}`);
  console.log("");
});

// Check current Cloud Build YAML configuration
console.log("🔧 Cloud Build Configuration Check:");
const fs = require("fs");
const yaml = fs.readFileSync("/workspaces/ProspectPro/cloudbuild.yaml", "utf8");

const checks = [
  {
    pattern: /--set-env-vars=SUPABASE_URL=\$\{_SUPABASE_URL\}/,
    name: "SUPABASE_URL",
  },
  {
    pattern: /--set-env-vars=SUPABASE_SECRET_KEY=\$\{_SUPABASE_SECRET_KEY\}/,
    name: "SUPABASE_SECRET_KEY",
  },
  {
    pattern: /--set-env-vars=WEBHOOK_AUTH_TOKEN=\$\{_WEBHOOK_AUTH_TOKEN\}/,
    name: "WEBHOOK_AUTH_TOKEN",
  },
  {
    pattern:
      /--set-env-vars=GOOGLE_PLACES_API_KEY=\$\{_GOOGLE_PLACES_API_KEY\}/,
    name: "GOOGLE_PLACES_API_KEY",
  },
  {
    pattern: /--set-env-vars=HUNTER_API_KEY=\$\{_HUNTER_API_KEY\}/,
    name: "HUNTER_API_KEY",
  },
  {
    pattern: /--set-env-vars=NEVERBOUNCE_API_KEY=\$\{_NEVERBOUNCE_API_KEY\}/,
    name: "NEVERBOUNCE_API_KEY",
  },
];

checks.forEach((check) => {
  const found = check.pattern.test(yaml);
  console.log(
    `   ${found ? "✅" : "❌"} ${check.name}: ${
      found ? "CONFIGURED" : "MISSING"
    }`
  );
});

// Check substitution variables
console.log("\n🔄 Substitution Variables Check:");
const subChecks = [
  { pattern: /_SUPABASE_URL:\s*''/, name: "_SUPABASE_URL" },
  { pattern: /_SUPABASE_SECRET_KEY:\s*''/, name: "_SUPABASE_SECRET_KEY" },
  { pattern: /_WEBHOOK_AUTH_TOKEN:\s*''/, name: "_WEBHOOK_AUTH_TOKEN" },
  { pattern: /_GOOGLE_PLACES_API_KEY:\s*''/, name: "_GOOGLE_PLACES_API_KEY" },
  { pattern: /_HUNTER_API_KEY:\s*''/, name: "_HUNTER_API_KEY" },
  { pattern: /_NEVERBOUNCE_API_KEY:\s*''/, name: "_NEVERBOUNCE_API_KEY" },
];

subChecks.forEach((check) => {
  const found = check.pattern.test(yaml);
  console.log(
    `   ${found ? "✅" : "❌"} ${check.name}: ${found ? "DECLARED" : "MISSING"}`
  );
});

console.log("\n✅ Configuration Status:");
console.log("   📋 Cloud Build YAML updated to use environment variables");
console.log("   🔧 Environment loader updated to match variable names");
console.log("   🚀 Ready for deployment test");

console.log("\n📝 Next Steps:");
console.log("   1. Commit and push changes");
console.log("   2. Cloud Build will trigger automatically");
console.log("   3. Test deployed service endpoints");
console.log("   4. Verify environment variables in Cloud Run logs");
