#!/usr/bin/env node

/**
 * Quick Database Table Check
 * Tests if your existing ProspectPro tables are accessible
 */

const { getSupabaseClient } = require("../config/supabase");

async function quickTableCheck() {
  console.log("🔍 Quick Table Accessibility Check");
  console.log("=================================");

  try {
    const client = getSupabaseClient();

    if (!client) {
      throw new Error(
        "Failed to create Supabase client - check config/supabase.js"
      );
    }

    console.log("✅ Supabase client created successfully");
    console.log(`📍 Target URL: ${process.env.SUPABASE_URL}`);
    console.log("");

    // Test tables one by one with simple count queries
    const tablesToTest = [
      "campaigns",
      "enhanced_leads",
      "system_settings",
      "api_usage_log",
      "campaign_analytics",
      "service_health_metrics",
    ];

    let accessibleCount = 0;
    let inaccessibleCount = 0;

    for (const tableName of tablesToTest) {
      try {
        const { data, error, count } = await client
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
          inaccessibleCount++;
        } else {
          console.log(
            `✅ ${tableName}: accessible (${
              count !== null ? count + " rows" : "queryable"
            })`
          );
          accessibleCount++;
        }
      } catch (e) {
        console.log(`💥 ${tableName}: ${e.message}`);
        inaccessibleCount++;
      }
    }

    console.log("");
    console.log("📊 Summary:");
    console.log(`✅ Accessible tables: ${accessibleCount}`);
    console.log(`❌ Inaccessible tables: ${inaccessibleCount}`);

    if (accessibleCount > 0) {
      console.log("🎉 Your database is working! Tables are accessible.");
    } else {
      console.log(
        "⚠️ No tables accessible - check RLS policies or service role permissions"
      );
    }
  } catch (error) {
    console.error("💥 Test failed:", error.message);
    console.error("\nTroubleshooting:");
    console.error(
      "1. Check SUPABASE_URL and SUPABASE_SECRET_KEY in environment"
    );
    console.error("2. Verify service role key has proper permissions");
    console.error("3. Check RLS policies allow service role access");
  }
}

if (require.main === module) {
  quickTableCheck();
}

module.exports = { quickTableCheck };
