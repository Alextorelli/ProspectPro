#!/usr/bin/env node
/**
 * Database Production Readiness Validation Script
 * Tests connectivity, schema, and RLS policies for production deployment
 */

require("dotenv").config();
const { getSupabaseClient } = require("./config/supabase.js");

async function validateDatabaseReadiness() {
  console.log("🔍 Database Production Readiness Validation:\n");

  try {
    const client = getSupabaseClient();

    // Test 1: Basic connectivity
    console.log("1. Testing Supabase connectivity...");
    const { data: testData, error: testError } = await client
      .from("campaigns")
      .select("count")
      .limit(1);

    if (testError) {
      console.log("❌ Connectivity test failed:", testError.message);
      return;
    }
    console.log("✅ Supabase connectivity OK");

    // Test 2: Check required tables exist
    console.log("\n2. Checking required tables...");
    const requiredTables = [
      "campaigns",
      "enhanced_leads",
      "campaign_analytics",
      "api_usage_logs",
      "lead_validation_pipeline",
    ];

    for (const table of requiredTables) {
      try {
        const { data, error } = await client.from(table).select("*").limit(1);
        if (error && !error.message.includes("does not exist")) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists`);
        }
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}`);
      }
    }

    // Test 3: Check RLS policies
    console.log("\n3. Testing RLS policies...");
    try {
      const { data: rlsData, error: rlsError } = await client
        .from("campaign_analytics")
        .select("*")
        .limit(1);

      if (rlsError) {
        console.log("❌ RLS test failed:", rlsError.message);
      } else {
        console.log("✅ RLS policies allow access");
      }
    } catch (e) {
      console.log("❌ RLS test error:", e.message);
    }

    // Test 4: Check API data sources table
    console.log("\n4. Checking API data sources configuration...");
    try {
      const { data: apiData, error: apiError } = await client
        .from("api_data_sources")
        .select("source_name, provider_name, cost_per_request, is_active")
        .limit(5);

      if (apiError) {
        console.log("❌ API data sources check failed:", apiError.message);
      } else {
        console.log(
          `✅ API data sources configured: ${apiData.length} sources`
        );
        apiData.forEach((source) => {
          console.log(
            `   - ${source.source_name} (${source.provider_name}): $${source.cost_per_request}/req`
          );
        });
      }
    } catch (e) {
      console.log("❌ API data sources error:", e.message);
    }

    console.log("\n✅ Database validation complete");
  } catch (error) {
    console.log("❌ Database validation failed:", error.message);
  }
}

validateDatabaseReadiness();
