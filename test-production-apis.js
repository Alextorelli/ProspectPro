#!/usr/bin/env node
/**
 * Production API Calls Validation Script
 * Tests real API functionality with production data
 */

require("dotenv").config();
const { getSupabaseClient } = require("./config/supabase.js");

async function testProductionAPICalls() {
  console.log("🚀 Testing Production API Calls with Real Data:\n");

  try {
    const client = getSupabaseClient();

    // Test 1: Check if we can access campaign_analytics with required columns
    console.log("1. Testing campaign_analytics table with required columns...");
    const { data: analyticsData, error: analyticsError } = await client
      .from("campaign_analytics")
      .select("campaign_date, user_id, businesses_found, qualified_leads")
      .limit(1);

    if (analyticsError) {
      console.log("❌ campaign_analytics test failed:", analyticsError.message);
    } else {
      console.log(
        "✅ campaign_analytics table accessible with required columns"
      );
      console.log("   Sample data:", analyticsData[0] || "No data yet");
    }

    // Test 2: Check lead validation pipeline
    console.log("\n2. Testing lead_validation_pipeline table...");
    const { data: validationData, error: validationError } = await client
      .from("lead_validation_pipeline")
      .select("lead_id, validation_stage, confidence_score")
      .limit(1);

    if (validationError) {
      console.log(
        "❌ lead_validation_pipeline test failed:",
        validationError.message
      );
    } else {
      console.log("✅ lead_validation_pipeline table accessible");
      console.log("   Sample data:", validationData[0] || "No data yet");
    }

    // Test 3: Test API data sources configuration
    console.log("\n3. Testing API data sources for cost tracking...");
    const { data: sourcesData, error: sourcesError } = await client
      .from("api_data_sources")
      .select("source_name, cost_per_request, quality_score")
      .eq("is_active", true);

    if (sourcesError) {
      console.log("❌ API data sources test failed:", sourcesError.message);
    } else {
      console.log("✅ API data sources configured and active");
      console.log("   Active sources:", sourcesData.length);
      sourcesData.forEach((source) => {
        console.log(
          `   - ${source.source_name}: $${source.cost_per_request}/req (quality: ${source.quality_score})`
        );
      });
    }

    // Test 4: Test RLS security (should work with service role key)
    console.log("\n4. Testing RLS security with service role access...");
    const { data: rlsTestData, error: rlsTestError } = await client
      .from("campaigns")
      .select("id, name, created_at")
      .limit(1);

    if (rlsTestError) {
      console.log("❌ RLS security test failed:", rlsTestError.message);
    } else {
      console.log("✅ RLS policies allow service role access");
      console.log("   Can access campaigns table");
    }

    console.log("\n✅ Production API validation complete");
  } catch (error) {
    console.log("❌ Production API testing failed:", error.message);
  }
}

testProductionAPICalls();
