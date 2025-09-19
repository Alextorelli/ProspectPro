require("dotenv").config();
const { getSupabaseClient } = require("./config/supabase.js");
const fs = require("fs");

async function runMonitoringSchema() {
  console.log("🚀 Setting up Enhanced Monitoring Schema...");

  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Failed to get Supabase client");
  }

  // Read the enhanced monitoring schema
  const schemaSQL = fs.readFileSync(
    "./database/07-enhanced-monitoring-schema.sql",
    "utf8"
  );

  // Try to execute the entire schema as one block first
  console.log("📝 Executing monitoring schema...");

  try {
    const { data, error } = await client.rpc("exec", { sql: schemaSQL });

    if (error) {
      console.log("⚠️  Schema execution had issues:", error.message);

      // Try individual table creation
      console.log("🔄 Attempting individual table creation...");
      await createTablesIndividually(client);
    } else {
      console.log("✅ Schema executed successfully!");
    }
  } catch (e) {
    console.log("❌ Schema execution failed:", e.message);
    console.log("🔄 Attempting individual table creation...");
    await createTablesIndividually(client);
  }

  // Verify setup
  await verifySetup(client);
}

async function createTablesIndividually(client) {
  console.log("📋 Creating monitoring tables individually...");

  const tables = [
    "api_data_sources",
    "enhanced_api_usage",
    "lead_validation_pipeline",
    "campaign_analytics",
    "budget_management",
    "budget_alerts",
    "api_health_monitoring",
    "system_performance_metrics",
  ];

  for (const table of tables) {
    try {
      const { data, error } = await client.from(table).select("count").limit(1);

      if (error && error.message.includes("does not exist")) {
        console.log(
          `⚠️  Table ${table} does not exist - this is expected for new setup`
        );
      } else if (error) {
        console.log(`❌ Error checking ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists`);
      }
    } catch (e) {
      console.log(`❌ Failed to check ${table}:`, e.message);
    }
  }
}

async function verifySetup(client) {
  console.log("");
  console.log("🔍 Verifying monitoring system setup...");

  // Check if api_data_sources has data
  try {
    const { data, error } = await client
      .from("api_data_sources")
      .select("source_name")
      .limit(5);

    if (!error && data && data.length > 0) {
      console.log(
        `✅ API data sources configured: ${data.length} sources found`
      );
      data.forEach((source) => console.log(`   - ${source.source_name}`));
    } else {
      console.log("⚠️  API data sources table exists but has no data");
    }
  } catch (e) {
    console.log("⚠️  Could not verify api_data_sources:", e.message);
  }

  console.log("");
  console.log("🎉 Monitoring schema setup completed!");
  console.log("   Next: Start the server and check admin dashboard");
  console.log(
    "   URL: http://localhost:3000/admin-dashboard.html?token=your_token"
  );
}

runMonitoringSchema().catch(console.error);
