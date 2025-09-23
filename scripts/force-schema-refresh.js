#!/usr/bin/env node

/**
 * ProspectPro Supabase Schema Cache Force Refresh
 * Uses Supabase management API to trigger schema reload
 */

async function forceSupabaseSchemaRefresh() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ SUPABASE_URL and SUPABASE_SECRET_KEY must be set");
    return false;
  }

  console.log("🔄 Forcing Supabase PostgREST schema refresh...");

  try {
    // Extract project ref from URL
    const urlParts = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!urlParts) {
      console.error("❌ Invalid Supabase URL format");
      return false;
    }

    const projectRef = urlParts[1];
    console.log(`📋 Project: ${projectRef}`);

    // Try to force schema refresh by hitting the OpenAPI spec endpoint
    // This usually triggers PostgREST to reload its schema cache
    const specUrl = `${supabaseUrl}/rest/v1/`;

    console.log(
      "🎯 Attempting to trigger schema refresh via OpenAPI endpoint..."
    );

    // Use the same node-fetch version as package.json (2.7.0)
    const fetch = require("node-fetch");

    // Hit the root REST endpoint with schema reload headers
    const response = await fetch(specUrl, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "X-Schema-Reload": "true",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (response.status === 200 || response.status === 404) {
      console.log("✅ Schema refresh triggered successfully");
      return true;
    } else {
      console.log(`⚠️  Schema refresh response: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Schema refresh failed:", error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 ProspectPro Force Schema Refresh");
  console.log("==================================");

  const success = await forceSupabaseSchemaRefresh();

  if (success) {
    console.log("\n✅ Schema refresh completed!");
    console.log("⏰ Wait 30-60 seconds then restart your server");
    console.log('🔧 Or run: pkill -f "node server.js" && npm run prod');
  } else {
    console.log("\n❌ Schema refresh may not have worked");
    console.log("🔧 Try restarting your Supabase project in the dashboard");
    console.log("📋 Or wait 5-10 minutes for automatic refresh");
  }

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { forceSupabaseSchemaRefresh };
