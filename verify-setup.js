#!/usr/bin/env node
/**
 * ProspectPro Setup Verification Script
 * Run this to verify your API keys and database are configured correctly
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log("🔍 ProspectPro Setup Verification");
console.log("================================");
console.log();

async function verifySetup() {
  let allGood = true;

  // Check 1: Environment Variables
  console.log("1. 📁 Environment Configuration");
  console.log("   ------------------------------");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (supabaseUrl && supabaseUrl !== "https://your-project-ref.supabase.co") {
    console.log("   ✅ SUPABASE_URL configured");
  } else {
    console.log("   ❌ SUPABASE_URL not configured in .env file");
    allGood = false;
  }

  if (supabaseKey && supabaseKey !== "your_supabase_service_role_key_here") {
    console.log("   ✅ SUPABASE_SECRET_KEY configured");
  } else {
    console.log("   ❌ SUPABASE_SECRET_KEY not configured in .env file");
    allGood = false;
  }

  if (!allGood) {
    console.log(
      "   ⚠️  Please update .env file with your Supabase credentials"
    );
    return false;
  }

  // Check 2: Supabase Connection
  console.log();
  console.log("2. 🗄️  Database Connection");
  console.log("   -----------------------");

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test basic connection
    const { data, error } = await supabase
      .from("campaigns")
      .select("count")
      .limit(1);
    if (error) {
      if (
        error.message.includes('relation "public.campaigns" does not exist')
      ) {
        console.log("   ❌ Database tables not found");
        console.log(
          "      Run: database/all-phases-consolidated.sql in Supabase SQL Editor"
        );
        allGood = false;
      } else {
        console.log("   ❌ Database connection failed:", error.message);
        allGood = false;
      }
    } else {
      console.log("   ✅ Database connection successful");
    }
  } catch (dbError) {
    console.log("   ❌ Database connection failed:", dbError.message);
    allGood = false;
  }

  // Check 3: Supabase Vault
  console.log();
  console.log("3. 🔐 Supabase Vault & API Keys");
  console.log("   -----------------------------");

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: vaultSecrets, error: vaultError } = await supabase
      .from("vault.decrypted_secrets")
      .select("name, decrypted_secret")
      .in("name", [
        "GOOGLE_PLACES_API_KEY",
        "HUNTER_IO_API_KEY",
        "NEVERBOUNCE_API_KEY",
        "FOURSQUARE_API_KEY",
      ]);

    if (vaultError) {
      console.log("   ❌ Vault not accessible:", vaultError.message);
      console.log("      Run: database/08-enable-supabase-vault.sql");
      allGood = false;
    } else {
      const apiKeys = [
        {
          name: "GOOGLE_PLACES_API_KEY",
          required: true,
          description: "Google Places API (Required for basic functionality)",
        },
        {
          name: "HUNTER_IO_API_KEY",
          required: false,
          description: "Hunter.io (Email discovery - 25 free/month)",
        },
        {
          name: "NEVERBOUNCE_API_KEY",
          required: false,
          description: "NeverBounce (Email verification - 1000 free/month)",
        },
        {
          name: "FOURSQUARE_API_KEY",
          required: false,
          description: "Foursquare (Location data)",
        },
      ];

      let requiredKeysConfigured = 0;
      let optionalKeysConfigured = 0;

      for (const apiKey of apiKeys) {
        const secret = vaultSecrets?.find((s) => s.name === apiKey.name);
        const isConfigured =
          secret &&
          secret.decrypted_secret &&
          secret.decrypted_secret !== "PLACEHOLDER_VALUE_SET_VIA_DASHBOARD" &&
          secret.decrypted_secret !== "CONFIGURE_IN_SUPABASE_DASHBOARD";

        if (isConfigured) {
          console.log(`   ✅ ${apiKey.name}: configured`);
          if (apiKey.required) requiredKeysConfigured++;
          else optionalKeysConfigured++;
        } else {
          const status = apiKey.required ? "❌" : "⚠️ ";
          console.log(
            `   ${status} ${apiKey.name}: not configured - ${apiKey.description}`
          );
          if (apiKey.required) allGood = false;
        }
      }

      console.log();
      console.log(
        `   📊 Summary: ${requiredKeysConfigured}/1 required keys, ${optionalKeysConfigured}/3 optional keys`
      );

      if (requiredKeysConfigured === 0) {
        console.log(
          "   ⚠️  You need at least Google Places API key for basic functionality"
        );
      }
    }
  } catch (vaultError) {
    console.log("   ❌ Could not check vault:", vaultError.message);
    allGood = false;
  }

  // Check 4: Server Status
  console.log();
  console.log("4. 🚀 Server Status");
  console.log("   ----------------");

  try {
    const response = await fetch("http://localhost:3000/health", {
      timeout: 5000,
    });

    if (response.ok) {
      const health = await response.json();
      if (health.status === "ok") {
        console.log("   ✅ ProspectPro server running and healthy");
      } else {
        console.log("   ⚠️  ProspectPro server running in degraded mode");
        console.log(
          "       This is normal if API keys are not fully configured"
        );
      }
    } else {
      console.log("   ❌ ProspectPro server responding with errors");
    }
  } catch (serverError) {
    console.log("   ⚠️  ProspectPro server not running");
    console.log("       Start with: npm start");
  }

  // Final Assessment
  console.log();
  console.log("🎯 Final Assessment");
  console.log("==================");

  if (allGood) {
    console.log("✅ Setup is complete! You can run real campaigns.");
    console.log();
    console.log("🚀 To run a campaign:");
    console.log("   npm start  # (if not already running)");
    console.log(
      "   Then make API calls to: http://localhost:3000/api/business-discovery/discover-businesses"
    );
    return true;
  } else {
    console.log("❌ Setup incomplete. Please fix the issues above.");
    console.log();
    console.log("📋 Quick fix checklist:");
    console.log("   1. Update .env with Supabase URL and service role key");
    console.log("   2. Run database/all-phases-consolidated.sql in Supabase");
    console.log("   3. Run database/08-enable-supabase-vault.sql in Supabase");
    console.log("   4. Add Google Places API key to Supabase Vault");
    console.log("   5. Re-run this verification script");
    return false;
  }
}

// Run verification
verifySetup()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  });
