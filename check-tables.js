require("dotenv").config();
const { getSupabaseClient } = require("./config/supabase.js");

async function checkTables() {
  console.log("🔍 Checking existing table structure...");

  const client = getSupabaseClient();
  if (!client) {
    console.log("❌ Failed to get Supabase client");
    return;
  }

  // Check campaigns table
  try {
    const { data, error } = await client
      .from("campaigns")
      .select("count")
      .limit(1);

    if (!error) {
      console.log("✅ campaigns table exists");
    } else {
      console.log("⚠️ campaigns table missing:", error.message);
    }
  } catch (e) {
    console.log("⚠️ campaigns table check failed:", e.message);
  }

  // Check enhanced_leads table
  try {
    const { data, error } = await client
      .from("enhanced_leads")
      .select("count")
      .limit(1);

    if (!error) {
      console.log("✅ enhanced_leads table exists");
    } else {
      console.log("⚠️ enhanced_leads table missing:", error.message);
    }
  } catch (e) {
    console.log("⚠️ enhanced_leads table check failed:", e.message);
  }
}

checkTables().catch(console.error);
