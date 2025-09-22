/**
 * Test Email Filtering Optimization - Pattern vs Verified Sources
 *
 * This script validates the new email qualification logic that requires
 * verified emails (Hunter/Apollo/website scraped) for qualification,
 * treating pattern-generated emails as unverified candidates only.
 *
 * Test scenarios:
 * 1. Business with pattern-generated email only -> Should NOT qualify
 * 2. Business with Hunter.io verified email -> Should qualify
 * 3. Business with Apollo verified email -> Should qualify
 * 4. Business with website-scraped email -> Should qualify
 * 5. Business with NeverBounce deliverable email -> Should qualify
 * 6. Mixed source business (pattern + verified) -> Should qualify with verified
 */

require("dotenv").config();
const EnhancedDiscoveryEngine = require("./modules/enhanced-discovery-engine");

// Create test business samples with different email sources
const testBusinesses = [
  {
    name: "Pattern Email Only Business",
    address: "123 Test St, San Diego, CA",
    phone: "(619) 555-0001",
    website: "https://patternonlytest.com",
    email: "info@patternonlytest.com",
    emailSource: "pattern_generation (60% confidence)",
    emailConfidence: 60,
    companyEmailSource: "pattern_generation",
    websiteValidation: { accessible: true }, // Add website validation so only email source is the differentiator
    finalConfidenceScore: 85,
  },
  {
    name: "Hunter Verified Business",
    address: "456 Verified Ave, San Diego, CA",
    phone: "(619) 555-0002",
    website: "https://hunterverified.com",
    email: "contact@hunterverified.com",
    emailSource: "hunter_io (85% confidence)",
    emailConfidence: 85,
    companyEmailSource: "hunter_io",
    websiteValidation: { accessible: true }, // Add website validation
    finalConfidenceScore: 90,
  },
  {
    name: "Apollo Verified Business",
    address: "789 Apollo St, San Diego, CA",
    phone: "(619) 555-0003",
    website: "https://apolloverified.com",
    email: "hello@apolloverified.com",
    emailSource: "apollo (80% confidence)",
    emailConfidence: 80,
    companyEmailSource: "apollo",
    websiteValidation: { accessible: true }, // Add website validation
    finalConfidenceScore: 88,
  },
  {
    name: "Website Scraped Business",
    address: "321 Scraped Blvd, San Diego, CA",
    phone: "(619) 555-0004",
    website: "https://websitescraped.com",
    email: "sales@websitescraped.com",
    emailSource: "website_scrape (HTTP 200)",
    emailConfidence: 75,
    companyEmailSource: "website_scrape",
    websiteValidation: { accessible: true },
    finalConfidenceScore: 82,
  },
  {
    name: "NeverBounce Deliverable Business",
    address: "654 Deliverable Way, San Diego, CA",
    phone: "(619) 555-0005",
    website: "https://neverbouncetest.com",
    email: "admin@neverbouncetest.com",
    emailSource: "pattern_generation, neverbounce_verified",
    emailConfidence: 70,
    companyEmailSource: "pattern_generation",
    websiteValidation: { accessible: true }, // Add website validation
    emailValidation: {
      bestEmail: {
        isDeliverable: true,
        confidence: 95,
      },
    },
    finalConfidenceScore: 86,
  },
  {
    name: "Mixed Sources Business",
    address: "987 Mixed Sources Dr, San Diego, CA",
    phone: "(619) 555-0006",
    website: "https://mixedsources.com",
    email: "owner@mixedsources.com", // This would be from Hunter
    emailSource: "pattern_generation, hunter_io (90% confidence)",
    emailConfidence: 90,
    companyEmailSource: "hunter_io", // Verified source should take precedence
    websiteValidation: { accessible: true }, // Add website validation
    finalConfidenceScore: 92,
  },
];

async function testEmailFiltering() {
  console.log("🧪 Testing Email Filtering Optimization");
  console.log("=".repeat(60));

  // Initialize engine (no API keys needed for filtering test)
  const engine = new EnhancedDiscoveryEngine();

  // Test quality filtering with email requirements
  const filterRequirements = {
    requireEmail: true,
    requirePhone: true,
    requireWebsite: true,
    minimumConfidence: 70,
    industry: null, // No industry filtering for this test
  };

  console.log("📊 Filter Requirements:");
  console.log("   - Require Email: ✅ (Must be from verified source)");
  console.log("   - Require Phone: ✅");
  console.log("   - Require Website: ✅");
  console.log("   - Minimum Confidence: 70%");
  console.log("");

  // Apply quality filter to test businesses
  const qualifiedLeads = engine.applyQualityFilter(
    testBusinesses,
    filterRequirements
  );

  console.log("📈 EMAIL FILTERING RESULTS:");
  console.log("=".repeat(60));

  testBusinesses.forEach((business, index) => {
    const isQualified = qualifiedLeads.includes(business);
    const status = isQualified ? "✅ QUALIFIED" : "❌ REJECTED";
    const icon = isQualified ? "✅" : "❌";

    console.log(`${icon} ${business.name}`);
    console.log(`   Email: ${business.email}`);
    console.log(
      `   Source: ${business.companyEmailSource || business.emailSource}`
    );
    console.log(`   Confidence: ${business.emailConfidence}%`);
    console.log(`   Result: ${status}`);
    console.log("");
  });

  console.log("📊 SUMMARY:");
  console.log(`   Total Businesses: ${testBusinesses.length}`);
  console.log(`   Qualified: ${qualifiedLeads.length}`);
  console.log(
    `   Rejection Rate: ${(
      ((testBusinesses.length - qualifiedLeads.length) /
        testBusinesses.length) *
      100
    ).toFixed(1)}%`
  );
  console.log("");

  // Expected results analysis
  console.log("🎯 EXPECTED vs ACTUAL:");
  console.log(
    "   Pattern Email Only -> REJECT:",
    qualifiedLeads.some((b) => b.name === "Pattern Email Only Business")
      ? "❌ FAIL"
      : "✅ PASS"
  );
  console.log(
    "   Hunter Verified -> QUALIFY:",
    qualifiedLeads.some((b) => b.name === "Hunter Verified Business")
      ? "✅ PASS"
      : "❌ FAIL"
  );
  console.log(
    "   Apollo Verified -> QUALIFY:",
    qualifiedLeads.some((b) => b.name === "Apollo Verified Business")
      ? "✅ PASS"
      : "❌ FAIL"
  );
  console.log(
    "   Website Scraped -> QUALIFY:",
    qualifiedLeads.some((b) => b.name === "Website Scraped Business")
      ? "✅ PASS"
      : "❌ FAIL"
  );
  console.log(
    "   NeverBounce Deliverable -> QUALIFY:",
    qualifiedLeads.some((b) => b.name === "NeverBounce Deliverable Business")
      ? "✅ PASS"
      : "❌ FAIL"
  );
  console.log(
    "   Mixed Sources -> QUALIFY:",
    qualifiedLeads.some((b) => b.name === "Mixed Sources Business")
      ? "✅ PASS"
      : "❌ FAIL"
  );
  console.log("");

  // Quality assessment
  const patternOnlyRejected = !qualifiedLeads.some(
    (b) => b.name === "Pattern Email Only Business"
  );
  const verifiedAccepted = [
    "Hunter Verified Business",
    "Apollo Verified Business",
    "Website Scraped Business",
    "NeverBounce Deliverable Business",
    "Mixed Sources Business",
  ].every((name) => qualifiedLeads.some((b) => b.name === name));

  const overallSuccess = patternOnlyRejected && verifiedAccepted;

  console.log(
    "🏆 OPTIMIZATION STATUS:",
    overallSuccess ? "✅ SUCCESS" : "❌ NEEDS ADJUSTMENT"
  );

  if (overallSuccess) {
    console.log("✅ Email filtering optimization working correctly!");
    console.log("   - Pattern-generated emails are properly rejected");
    console.log(
      "   - Verified sources (Hunter, Apollo, website, NeverBounce) are accepted"
    );
    console.log(
      "   - Quality threshold maintained while eliminating unverified contacts"
    );
  } else {
    console.log("❌ Email filtering needs adjustment:");
    if (!patternOnlyRejected) {
      console.log("   - Pattern-only emails are incorrectly qualifying");
    }
    if (!verifiedAccepted) {
      console.log("   - Some verified emails are incorrectly rejected");
    }
  }

  return {
    totalTested: testBusinesses.length,
    qualified: qualifiedLeads.length,
    optimizationWorking: overallSuccess,
    patternEmailsRejected: patternOnlyRejected,
    verifiedEmailsAccepted: verifiedAccepted,
  };
}

// Run the test if called directly
if (require.main === module) {
  testEmailFiltering()
    .then((results) => {
      console.log("\n📋 Test Results:", results);
      process.exit(results.optimizationWorking ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Test failed:", error);
      process.exit(1);
    });
}

module.exports = { testEmailFiltering };
