#!/usr/bin/env node
/**
 * ProspectPro Real Campaign Setup & Launcher
 * This script helps configure and run a real lead generation campaign
 */

const { createClient } = require("@supabase/supabase-js");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

console.log("🚀 ProspectPro Real Campaign Setup");
console.log("==================================");
console.log();

async function main() {
  try {
    // Step 1: Check Supabase connection
    console.log("📡 Step 1: Checking Supabase Connection");
    console.log("----------------------------------------");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log("❌ Missing Supabase configuration in .env file");
      console.log("   Required:");
      console.log("   - SUPABASE_URL=https://your-project-ref.supabase.co");
      console.log("   - SUPABASE_SECRET_KEY=your_service_role_key");
      console.log();
      console.log("   Please update .env file and try again.");
      process.exit(1);
    }

    console.log(`✅ Supabase URL: ${supabaseUrl}`);
    console.log(`✅ Service Key: ${supabaseKey.substring(0, 20)}...`);

    // Test connection
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("count")
        .limit(1);
      if (error) {
        if (
          error.message.includes('relation "public.campaigns" does not exist')
        ) {
          console.log(
            "⚠️  Database tables not found. Need to run database setup first."
          );
          console.log(
            "   Please run the consolidated SQL file in your Supabase dashboard:"
          );
          console.log("   File: database/all-phases-consolidated.sql");
          console.log();
          process.exit(1);
        } else {
          throw error;
        }
      }
      console.log("✅ Database connection successful");
    } catch (connError) {
      console.log("❌ Database connection failed:", connError.message);
      process.exit(1);
    }

    // Step 2: Check API keys in Vault
    console.log();
    console.log("🔐 Step 2: Checking API Keys in Supabase Vault");
    console.log("----------------------------------------------");

    const requiredApiKeys = [
      "GOOGLE_PLACES_API_KEY",
      "HUNTER_IO_API_KEY",
      "NEVERBOUNCE_API_KEY",
      "FOURSQUARE_API_KEY",
    ];

    let apiKeysConfigured = 0;
    const missingKeys = [];

    try {
      const { data: vaultSecrets, error: vaultError } = await supabase
        .from("vault.decrypted_secrets")
        .select("name, decrypted_secret")
        .in("name", requiredApiKeys);

      if (vaultError) {
        console.log("⚠️  Vault not accessible:", vaultError.message);
        console.log("   Make sure Supabase Vault extension is enabled.");
        console.log("   Run: database/08-enable-supabase-vault.sql");
        console.log();
      } else {
        for (const keyName of requiredApiKeys) {
          const secret = vaultSecrets.find((s) => s.name === keyName);
          if (
            secret &&
            secret.decrypted_secret &&
            secret.decrypted_secret !== "PLACEHOLDER_VALUE_SET_VIA_DASHBOARD"
          ) {
            console.log(`✅ ${keyName}: configured`);
            apiKeysConfigured++;
          } else {
            console.log(`❌ ${keyName}: not configured`);
            missingKeys.push(keyName);
          }
        }
      }
    } catch (vaultCheckError) {
      console.log(
        "⚠️  Could not check vault secrets:",
        vaultCheckError.message
      );
    }

    if (missingKeys.length > 0) {
      console.log();
      console.log("🔑 Missing API Keys Setup Instructions:");
      console.log("--------------------------------------");
      console.log("1. Go to your Supabase Dashboard → Settings → Vault");
      console.log("2. Add the following API keys:");
      missingKeys.forEach((key) => {
        const instructions = getApiKeyInstructions(key);
        console.log(`   • ${key}: ${instructions}`);
      });
      console.log();

      const proceed = await question(
        "Do you want to proceed with partial API keys? (y/N): "
      );
      if (proceed.toLowerCase() !== "y") {
        console.log("Setup cancelled. Configure API keys and try again.");
        process.exit(1);
      }
    }

    // Step 3: Launch Real Campaign
    console.log();
    console.log("🎯 Step 3: Launch Real Campaign");
    console.log("-------------------------------");

    console.log("Campaign Configuration:");
    console.log(
      "• Industries: Plumbing companies, wellness studios, beauty services"
    );
    console.log("• Location: San Diego, CA + West Coast expansion");
    console.log("• Target: 5 qualified leads");
    console.log("• Budget: $2.50 max");
    console.log("• Quality: 80% confidence threshold");
    console.log();

    const confirm = await question(
      "Launch real campaign with API calls? (y/N): "
    );
    if (confirm.toLowerCase() !== "y") {
      console.log("Campaign cancelled.");
      process.exit(0);
    }

    console.log();
    console.log("🚀 Launching Real Campaign...");
    console.log("============================");

    // Make the real API call
    await launchRealCampaign();
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function getApiKeyInstructions(keyName) {
  const instructions = {
    GOOGLE_PLACES_API_KEY:
      "Get from Google Cloud Console → APIs & Services → Credentials",
    HUNTER_IO_API_KEY:
      "Get from https://hunter.io/api_keys (25 free searches/month)",
    NEVERBOUNCE_API_KEY:
      "Get from https://app.neverbounce.com/settings/api (1000 free/month)",
    FOURSQUARE_API_KEY:
      "Get from https://developer.foursquare.com/ (for location verification)",
  };
  return instructions[keyName] || "Check documentation for setup instructions";
}

async function launchRealCampaign() {
  const campaignData = {
    businessType: "plumbing company",
    location: "San Diego, CA",
    maxResults: 5,
    budgetLimit: 2.5,
    requireCompleteContacts: true,
    minConfidenceScore: 80,
    additionalQueries: ["wellness studio San Diego", "beauty salon San Diego"],
  };

  console.log("📊 Campaign Parameters:");
  console.log(JSON.stringify(campaignData, null, 2));
  console.log();

  try {
    const response = await fetch(
      "http://localhost:3000/api/business-discovery/discover-businesses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    console.log("✅ Campaign Completed Successfully!");
    console.log("==================================");
    console.log();
    console.log("📊 Results Summary:");
    console.log(`   Campaign ID: ${result.campaignId}`);
    console.log(`   Qualified Leads: ${result.results.qualified}`);
    console.log(`   Success Rate: ${result.results.qualificationRate}`);
    console.log(`   Average Confidence: ${result.results.averageConfidence}%`);
    console.log(`   Total Cost: $${result.costs.totalCost.toFixed(3)}`);
    console.log(`   Cost per Lead: $${result.costs.costPerLead.toFixed(3)}`);
    console.log(`   Processing Time: ${result.performance.processingTime}`);
    console.log();

    console.log("🎯 Qualified Leads Found:");
    console.log("========================");
    result.leads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.businessName}`);
      console.log(`   📧 Email: ${lead.email}`);
      console.log(`   📞 Phone: ${lead.phone}`);
      console.log(`   📍 Address: ${lead.address}`);
      console.log(`   🌐 Website: ${lead.website}`);
      console.log(`   📊 Confidence: ${lead.confidenceScore}%`);
      console.log();
    });

    console.log("💾 Export Options:");
    console.log(`   CSV: GET /api/campaigns/export/${result.campaignId}`);
    console.log(`   Dashboard: http://localhost:3000/admin-dashboard.html`);
  } catch (apiError) {
    if (apiError.message.includes("ECONNREFUSED")) {
      console.log("❌ ProspectPro server is not running");
      console.log("   Start server: npm start");
      console.log("   Then run this script again");
    } else {
      console.log("❌ Campaign failed:", apiError.message);
    }
  }
}

// Check if server is running first
if (require.main === module) {
  main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
}
