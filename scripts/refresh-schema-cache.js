#!/usr/bin/env node

/**
 * ProspectPro Schema Cache Refresh Utility
 * Forces Supabase PostgREST to refresh its schema cache
 */

const { getSupabaseClient, refreshSchemaCache } = require("../config/supabase");

async function main() {
  console.log("🔄 ProspectPro Schema Cache Refresh Utility");
  console.log("==========================================");

  try {
    const client = getSupabaseClient();
    if (!client) {
      console.error("❌ Failed to initialize Supabase client");
      process.exit(1);
    }

    console.log("📊 Current schema information:");

    // Check what tables exist
    const { data: tables, error: tablesError } = await client
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .order("table_name");

    if (tablesError) {
      console.error("❌ Failed to query schema:", tablesError.message);
    } else {
      console.log(
        "✅ Tables in public schema:",
        tables.map((t) => t.table_name).join(", ")
      );
    }

    console.log("\n🔄 Attempting schema cache refresh...");

    // Try to refresh schema cache
    await refreshSchemaCache();

    // Wait for cache propagation
    console.log("⏳ Waiting for cache propagation...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test campaigns table accessibility
    console.log("\n🧪 Testing table accessibility:");

    const { data: campaignsTest, error: campaignsError } = await client
      .from("campaigns")
      .select("count")
      .limit(1);

    if (campaignsError) {
      console.error("❌ Campaigns table test failed:", campaignsError.message);

      // Try alternative approach - direct RPC to force schema reload
      console.log("🔄 Trying alternative schema refresh...");

      try {
        await client.rpc("version"); // Simple RPC call to wake up PostgREST
        console.log("✅ PostgREST connection verified");

        // Wait and try again
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const { data: retryTest, error: retryError } = await client
          .from("campaigns")
          .select("count")
          .limit(1);

        if (retryError) {
          console.error("❌ Retry failed:", retryError.message);
          console.log("\n🔧 Manual steps required:");
          console.log("1. Restart your Supabase project in the dashboard");
          console.log("2. Or wait 5-10 minutes for automatic schema refresh");
          console.log("3. Check Supabase logs for any schema issues");
          process.exit(1);
        } else {
          console.log("✅ Campaigns table accessible after retry");
        }
      } catch (rpcError) {
        console.error("❌ RPC call failed:", rpcError.message);
      }
    } else {
      console.log("✅ Campaigns table accessible");
    }

    // Test enhanced_leads table
    const { data: leadsTest, error: leadsError } = await client
      .from("enhanced_leads")
      .select("count")
      .limit(1);

    if (leadsError) {
      console.error("❌ Enhanced leads table test failed:", leadsError.message);
    } else {
      console.log("✅ Enhanced leads table accessible");
    }

    console.log("\n🎉 Schema cache refresh completed!");
    console.log("🚀 You can now restart your ProspectPro server");
  } catch (error) {
    console.error("❌ Schema refresh failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

// Handle script termination
process.on("SIGINT", () => {
  console.log("\n🛑 Schema refresh interrupted");
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { main };
