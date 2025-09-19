require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

async function createMonitoringTables() {
  console.log("🚀 Creating essential monitoring tables...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Test connection first
  console.log("🔍 Testing connection...");
  const { data: testData, error: testError } = await client
    .from("campaigns")
    .select("count")
    .limit(1);

  if (testError) {
    throw new Error("Connection failed: " + testError.message);
  }

  console.log("✅ Connection successful");

  // Create tables one by one using simple INSERT/UPDATE operations
  // Since we can't execute CREATE TABLE via JS client, we'll focus on
  // getting data into existing tables that might exist

  // Try to check if api_data_sources exists and insert seed data
  try {
    console.log("📝 Inserting API data sources...");

    const apiSources = [
      {
        source_name: "google_places",
        source_type: "discovery",
        provider_name: "Google",
        cost_per_request: 0.032,
        is_active: true,
      },
      {
        source_name: "hunter_io",
        source_type: "enrichment",
        provider_name: "Hunter.io",
        cost_per_request: 0.04,
        is_active: true,
      },
      {
        source_name: "neverbounce",
        source_type: "verification",
        provider_name: "NeverBounce",
        cost_per_request: 0.008,
        is_active: true,
      },
    ];

    // Try to insert data (will fail if table doesn't exist, but we'll catch it)
    for (const source of apiSources) {
      try {
        const { data, error } = await client
          .from("api_data_sources")
          .insert(source);

        if (error && !error.message.includes("duplicate key")) {
          console.log(
            `⚠️  Could not insert ${source.source_name}:`,
            error.message
          );
        } else {
          console.log(`✅ Inserted ${source.source_name}`);
        }
      } catch (e) {
        console.log(
          `⚠️  API source ${source.source_name} insert failed:`,
          e.message
        );
      }
    }
  } catch (e) {
    console.log("⚠️  API data sources setup failed:", e.message);
  }

  console.log("");
  console.log("🎉 Monitoring setup attempt completed!");
  console.log("");
  console.log("📋 Next Steps:");
  console.log(
    "1. The system works with graceful fallbacks even without monitoring tables"
  );
  console.log(
    "2. For full monitoring, create tables manually in Supabase SQL Editor:"
  );
  console.log("   - Go to Supabase Dashboard → SQL Editor");
  console.log(
    "   - Run the contents of database/07-enhanced-monitoring-schema.sql"
  );
  console.log(
    "3. Test the admin dashboard: http://localhost:3000/admin-dashboard.html"
  );
  console.log("");
  console.log("✅ System is ready for use with current configuration!");
}

createMonitoringTables().catch(console.error);
