#!/usr/bin/env node
require("dotenv").config();
const { getSupabaseClient } = require("./config/supabase.js");

async function checkSchema() {
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "Set" : "Missing");
  console.log(
    "SUPABASE_SECRET_KEY:",
    process.env.SUPABASE_SECRET_KEY ? "Set" : "Missing"
  );

  const client = getSupabaseClient();
  console.log("Client created:", !!client);

  if (client) {
    try {
      const { data, error } = await client
        .from("campaign_analytics")
        .select("*")
        .limit(1);
      if (error) {
        console.log("Error:", error.message);
      } else {
        console.log("Columns:", Object.keys(data[0] || {}));
      }
    } catch (e) {
      console.log("Exception:", e.message);
    }
  }
}

checkSchema();
