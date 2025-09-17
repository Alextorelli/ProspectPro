#!/usr/bin/env node
/**
 * Simple Database Setup Script
 * Creates ProspectPro tables directly using Supabase client
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔧 Creating ProspectPro Database Tables");
console.log("======================================");

const client = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log("📋 Creating essential tables...");

  // Create campaigns table first (referenced by other tables)
  try {
    console.log("Creating campaigns table...");
    const { error: campaignError } = await client.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS campaigns (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          search_query TEXT,
          location TEXT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
          budget_limit DECIMAL(10,2),
          lead_limit INTEGER,
          quality_threshold INTEGER DEFAULT 70 CHECK (quality_threshold >= 0 AND quality_threshold <= 100),
          leads_discovered INTEGER DEFAULT 0,
          leads_qualified INTEGER DEFAULT 0,
          total_cost DECIMAL(10,2) DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          completed_at TIMESTAMP WITH TIME ZONE,
          CONSTRAINT positive_budget CHECK (budget_limit IS NULL OR budget_limit > 0),
          CONSTRAINT positive_lead_limit CHECK (lead_limit IS NULL OR lead_limit > 0)
        );
      `,
    });

    if (campaignError) {
      console.log(
        "Note: campaigns table may already exist or need manual creation"
      );
    } else {
      console.log("✅ Campaigns table created");
    }
  } catch (err) {
    console.log("Note: Using alternative table creation method...");
  }

  // Test if we can query the tables
  console.log("\n🧪 Testing table access...");

  try {
    const { data, error } = await client
      .from("campaigns")
      .select("count", { count: "exact", head: true });

    if (!error) {
      console.log("✅ Campaigns table accessible");
    } else {
      console.log(
        "⚠️  Campaigns table needs manual creation in Supabase dashboard"
      );
      console.log("Error:", error.message);
    }
  } catch (err) {
    console.log("⚠️  Table test failed:", err.message);
  }

  console.log("\n📋 Manual Setup Instructions:");
  console.log("==============================");
  console.log(
    "1. Go to https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc"
  );
  console.log("2. Navigate to SQL Editor");
  console.log("3. Run the enhanced-supabase-schema.sql file");
  console.log("4. Run the rls-security-hardening.sql file");
  console.log("5. Return here to test the connection");
}

createTables().catch((err) => {
  console.error("Setup error:", err);
  process.exit(1);
});
