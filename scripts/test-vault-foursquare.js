#!/usr/bin/env node

/**
 * ProspectPro Foursquare API Key Verification
 * Debug the key naming mismatch
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log("🔍 Foursquare API Key Configuration Debug\n");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Supabase credentials not found");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFoursquareKeys() {
  console.log("🔑 Checking Foursquare key variations in Supabase Vault...\n");

  const keyVariations = [
    "FOURSQUARE_API_KEY",
    "FOURSQUARE_SERVICE_API_KEY",
    "FOURSQUARE_PLACES_API_KEY",
  ];

  for (const keyName of keyVariations) {
    try {
      const { data, error } = await supabase.rpc("get_secret", {
        secret_name: keyName,
      });

      if (error) {
        console.log(`❌ ${keyName}: ${error.message}`);
      } else if (data) {
        console.log(`✅ ${keyName}: Found (${data.substring(0, 8)}...)`);
      } else {
        console.log(`⚠️ ${keyName}: Not found`);
      }
    } catch (err) {
      console.log(`❌ ${keyName}: Error - ${err.message}`);
    }
  }

  console.log("\n📋 Environment Variables:");
  console.log(
    `FOURSQUARE_API_KEY: ${process.env.FOURSQUARE_API_KEY ? "Set" : "Not set"}`
  );
  console.log(
    `FOURSQUARE_SERVICE_API_KEY: ${
      process.env.FOURSQUARE_SERVICE_API_KEY ? "Set" : "Not set"
    }`
  );
  console.log(
    `FOURSQUARE_PLACES_API_KEY: ${
      process.env.FOURSQUARE_PLACES_API_KEY ? "Set" : "Not set"
    }`
  );

  console.log("\n💡 Solution:");
  console.log("If FOURSQUARE_API_KEY is found in vault but others are not,");
  console.log("we need to either:");
  console.log("1. Add FOURSQUARE_SERVICE_API_KEY with same value, OR");
  console.log("2. Update code to use FOURSQUARE_API_KEY consistently");
}

checkFoursquareKeys().catch(console.error);
