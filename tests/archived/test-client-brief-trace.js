/**
 * Client Brief Candidate Trace - Small Service Businesses
 * Target: 25 owner-operated businesses < 5 employees
 * Industries: Plumbing, Wellness Studios, Beauty, Trades
 * Requirements: Business name, owner name, email, address, website/social
 */

const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");

async function runClientBriefTrace() {
  console.log("🎯 CLIENT BRIEF CANDIDATE TRACE");
  console.log("=====================================");
  console.log("Target: Small service businesses (<5 employees)");
  console.log("Industries: Plumbing, Wellness Studios, Beauty, Trades");
  console.log("Location: San Diego area (based on example URL)");
  console.log("");

  const discovery = new EnhancedLeadDiscovery({
    budgetLimit: 10.0, // Conservative budget for trace
    // API keys would normally be loaded from environment
  });

  // Client brief search parameters
  const searchParams = {
    query: "plumbing contractors San Diego",
    location: "San Diego, CA",
    businessType: "plumber",
    maxResults: 5, // Small sample for detailed trace
    budget: 5.0,
  };

  console.log("📋 SEARCH PARAMETERS:");
  console.log(JSON.stringify(searchParams, null, 2));
  console.log("");

  try {
    console.log("🔍 STAGE 1: BUSINESS DISCOVERY");
    console.log("--------------------------------");

    const startTime = Date.now();

    // Simulate what would happen in real discovery
    console.log("⚡ Initializing API clients...");
    console.log("   - Google Places: Ready");
    console.log("   - Foursquare Places: Ready");
    console.log("   - Hunter.io: Ready (email discovery)");
    console.log("   - NeverBounce: Ready (email validation)");
    console.log("");

    console.log("🌐 API DISCOVERY SIMULATION:");
    console.log("--------------------------------");

    // REAL API INTEGRATION REQUIRED
    // This trace is now removed to prevent confusion with production data
    console.log("❌ FAKE DATA TRACE REMOVED");
    console.log(
      "This simulation has been disabled to prevent fake data generation."
    );
    console.log("Use the production API endpoint: /api/business-discovery");
    console.log(
      "This ensures only real business data from Google Places, Foursquare, etc."
    );
    return;

    console.log("✅ Google Places API response: 1 result");
    console.log("   Cost: ~$0.032 (text search)");
    console.log("✅ Foursquare Places API response: 1 result");
    console.log("   Cost: ~$0.00 (within quota)");
    console.log("");

    console.log("🔄 DATA NORMALIZATION & DEDUPLICATION:");
    console.log("--------------------------------------");

    const candidateBusiness = {
      // Merged from Google + Foursquare
      name: "Priority Plumbing & Drain", // Algorithm expects 'name' field
      business_name: "Priority Plumbing & Drain", // Keep for display
      address: "1234 Miramar Rd, San Diego, CA 92126",
      location_coordinates: { lat: 32.9083, lng: -117.139 },
      phone: "+16195550123", // Normalized to E.164
      website: "https://priorityplumbingsd.com",
      business_type: ["plumber", "home_services"],
      rating: 4.8, // Add Google rating for pre-validation
      user_ratings_total: 127, // Add review count

      // Source attribution
      discovery_source: "google_places,foursquare",
      google_place_id: "ChIJK1234567890abcdef",
      foursquare_fsq_id: "abc123def456ghi789",

      // Initial metrics
      google_rating: 4.8,
      google_reviews: 127,
      foursquare_data: {
        fsq_id: "abc123def456ghi789",
        categories: [{ name: "Plumber" }],
      },
    };

    console.log("📊 NORMALIZED CANDIDATE:");
    console.log(JSON.stringify(candidateBusiness, null, 2));
    console.log("");

    console.log("⚖️  PRE-VALIDATION SCORING:");
    console.log("----------------------------");

    const preValidationScore =
      discovery.calculatePreValidationScore(candidateBusiness);
    console.log(`✅ Pre-validation score: ${preValidationScore}/100`);

    // Break down the scoring
    const nameScore = discovery.scoreBusinessName(candidateBusiness);
    const addressScore = discovery.scoreAddress(candidateBusiness);
    const phoneScore = discovery.scorePhone(candidateBusiness);
    const websiteScore = discovery.scoreWebsite(candidateBusiness);
    const foursquareScore = discovery.scoreFoursquare(candidateBusiness);

    console.log("   Scoring breakdown:");
    console.log(`   - Business name: ${nameScore}/20 (specific, non-generic)`);
    console.log(`   - Address: ${addressScore}/20 (complete with coordinates)`);
    console.log(`   - Phone: ${phoneScore}/25 (valid US format)`);
    console.log(`   - Website: ${websiteScore}/15 (HTTPS URL present)`);
    console.log(`   - Foursquare: ${foursquareScore}/20 (verified place)`);
    console.log("");

    if (preValidationScore < 70) {
      console.log("❌ CANDIDATE REJECTED: Pre-validation score too low");
      console.log("   Minimum required: 70/100");
      return;
    }

    console.log("✅ CANDIDATE APPROVED for enrichment (score ≥70)");
    console.log("");

    console.log("💎 STAGE 2: ENRICHMENT");
    console.log("----------------------");

    // Simulate website scraping
    console.log("🌐 Website Analysis: https://priorityplumbingsd.com");
    console.log("   - DNS Resolution: ✅ Valid");
    console.log("   - HTTP Status: ✅ 200 OK");
    console.log("   - SSL Certificate: ✅ Valid");
    console.log("   - Cost: ~$0.05 (scraping)");

    const simulatedWebsiteData = {
      title: "Priority Plumbing & Drain - San Diego Plumbers",
      description:
        "Family-owned plumbing company serving San Diego since 2015. Emergency repairs, drain cleaning, water heaters.",
      contact_page: true,
      owner_info: {
        name: "Mike Rodriguez",
        title: "Owner & Master Plumber",
      },
      contact_info: {
        phone: "(619) 555-0123",
        email: "mike@priorityplumbingsd.com",
        address: "1234 Miramar Rd, San Diego, CA 92126",
      },
      social_links: [
        "https://www.facebook.com/PriorityPlumbingSD",
        "https://nextdoor.com/pages/priority-plumbing-drain-san-diego-ca/",
      ],
      employee_indicators: [
        "family-owned",
        "owner-operated",
        "licensed master plumber",
      ],
    };

    console.log("✅ Website scraping successful");
    console.log(
      `   - Owner identified: ${simulatedWebsiteData.owner_info.name}`
    );
    console.log(`   - Email found: ${simulatedWebsiteData.contact_info.email}`);
    console.log(
      `   - Employee indicators: ${simulatedWebsiteData.employee_indicators.join(
        ", "
      )}`
    );
    console.log("");

    // Simulate email discovery via Hunter.io
    console.log("📧 Email Discovery (Hunter.io):");
    console.log("   - Domain: priorityplumbingsd.com");
    console.log("   - Pattern detected: {first}@domain.com");
    console.log("   - Cost: ~$0.04 (domain search)");

    const simulatedEmailResults = [
      {
        email: "mike@priorityplumbingsd.com",
        first_name: "Mike",
        last_name: "Rodriguez",
        position: "Owner",
        confidence: 95,
        sources: ["website_contact", "hunter_domain_search"],
      },
      {
        email: "info@priorityplumbingsd.com",
        confidence: 85,
        sources: ["hunter_domain_search"],
        type: "generic",
      },
    ];

    console.log("✅ Email discovery results:");
    simulatedEmailResults.forEach((email, i) => {
      console.log(
        `   ${i + 1}. ${email.email} (confidence: ${email.confidence}%)`
      );
    });
    console.log("");

    console.log("🔍 STAGE 3: VALIDATION");
    console.log("----------------------");

    // Website validation
    console.log("🌐 Website Validation:");
    console.log("   - Accessibility: ✅ PASS (200 OK)");
    console.log("   - SSL Security: ✅ PASS");
    console.log("   - Content Match: ✅ PASS (business name matches)");

    // Address validation
    console.log("📍 Address Validation:");
    console.log("   - Geocoding: ✅ PASS (exact coordinates match)");
    console.log("   - Format: ✅ PASS (complete US address)");
    console.log("   - Reality Check: ✅ PASS (not sequential pattern)");

    // Phone validation
    console.log("📞 Phone Validation:");
    console.log("   - Format: ✅ PASS (valid US number)");
    console.log("   - Pattern: ✅ PASS (not 555/000 fake)");
    console.log("   - Cross-verification: ✅ PASS (matches website)");

    // Email validation
    console.log("📧 Email Validation (NeverBounce):");
    console.log(
      "   - mike@priorityplumbingsd.com: ✅ DELIVERABLE (95% confidence)"
    );
    console.log("   - Cost: ~$0.008 (verification)");
    console.log("");

    console.log("🏆 FINAL SCORING & QUALIFICATION");
    console.log("--------------------------------");

    const finalCandidate = {
      ...candidateBusiness,
      // Enriched data
      owner_name: simulatedWebsiteData.owner_info.name,
      owner_title: simulatedWebsiteData.owner_info.title,
      email: simulatedEmailResults[0].email,
      email_confidence: simulatedEmailResults[0].confidence,
      website_status: 200,
      employee_count: 2, // Estimated from 'family-owned' indicators

      // Social presence
      social_profiles: simulatedWebsiteData.social_links,

      // Validation results
      validation_results: {
        website: { valid: true, status: 200 },
        address: { valid: true, geocoded: true },
        phone: { valid: true, format: "US" },
        email: { valid: true, deliverable: true, confidence: 95 },
      },

      // Cost tracking
      discovery_cost: 0.032, // Google Places
      enrichment_cost: 0.098, // Website scraping + Hunter.io + NeverBounce
      total_cost: 0.13,
    };

    // Calculate final confidence score manually (simulated)
    const qualityScores = {
      businessNameScore: 90, // Specific, non-generic name
      addressScore: 80, // Complete address with coordinates
      phoneScore: 85, // Valid US phone number
      websiteScore: 95, // Website accessible and validated
      emailScore: 95, // High-confidence email found and validated
      registrationScore: 50, // Default - not validated in trace
      propertyScore: 50, // Default property score
      foursquareScore: 60, // Foursquare data found
      nonprofitScore: 50, // Default nonprofit score
    };

    // Calculate weighted final confidence score (matches algorithm)
    const weights = {
      businessNameScore: 0.12,
      addressScore: 0.12,
      phoneScore: 0.15,
      websiteScore: 0.12,
      emailScore: 0.15,
      registrationScore: 0.12,
      propertyScore: 0.05,
      foursquareScore: 0.1,
      nonprofitScore: 0.07,
    };

    let weightedSum = 0;
    let totalWeight = 0;
    for (const [metric, score] of Object.entries(qualityScores)) {
      if (score > 0) {
        weightedSum += score * weights[metric];
        totalWeight += weights[metric];
      }
    }
    const finalConfidenceScore =
      totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    console.log(`🎯 Final Confidence Score: ${finalConfidenceScore}/100`);

    console.log("   Detailed scoring:");
    console.log(
      `   - Business Name (12%): ${qualityScores.businessNameScore}/100`
    );
    console.log(`   - Address (12%): ${qualityScores.addressScore}/100`);
    console.log(`   - Phone (15%): ${qualityScores.phoneScore}/100`);
    console.log(`   - Website (12%): ${qualityScores.websiteScore}/100`);
    console.log(`   - Email (15%): ${qualityScores.emailScore}/100`);
    console.log("");

    const isQualified = finalConfidenceScore >= 80;
    console.log(
      `📊 QUALIFICATION STATUS: ${
        isQualified ? "✅ QUALIFIED" : "❌ NOT QUALIFIED"
      }`
    );
    console.log(`   Required threshold: 80/100`);
    console.log(`   Achieved score: ${finalConfidenceScore}/100`);
    console.log("");

    if (isQualified) {
      console.log("🎉 CLIENT BRIEF REQUIREMENTS CHECK:");
      console.log("-----------------------------------");
      console.log(`✅ Business name: ${finalCandidate.business_name}`);
      console.log(`✅ Owner name: ${finalCandidate.owner_name}`);
      console.log(`✅ Email: ${finalCandidate.email}`);
      console.log(`✅ Address: ${finalCandidate.address}`);
      console.log(`✅ Website: ${finalCandidate.website}`);
      console.log(`✅ Industry: ${finalCandidate.business_type.join(", ")}`);
      console.log(`✅ Size: ~${finalCandidate.employee_count} employees`);
      console.log(`✅ Owner-operated: ${finalCandidate.owner_title}`);
      console.log("");
    }

    console.log("💰 COST ANALYSIS:");
    console.log("-----------------");
    console.log(`Discovery: $${finalCandidate.discovery_cost.toFixed(3)}`);
    console.log(`Enrichment: $${finalCandidate.enrichment_cost.toFixed(3)}`);
    console.log(`Total per lead: $${finalCandidate.total_cost.toFixed(3)}`);
    console.log(
      `Projected cost for 25 leads: $${(finalCandidate.total_cost * 25).toFixed(
        2
      )}`
    );
    console.log("");

    const totalTime = Date.now() - startTime;
    console.log(`⏱️  PROCESSING TIME: ${totalTime}ms`);
    console.log("");

    console.log("🎯 PIPELINE PERFORMANCE SUMMARY:");
    console.log("================================");
    console.log(`✅ Candidate processed successfully`);
    console.log(`✅ All client requirements met`);
    console.log(`✅ High confidence score (${finalConfidenceScore}/100)`);
    console.log(
      `✅ Cost-effective ($${finalCandidate.total_cost.toFixed(
        3
      )} per qualified lead)`
    );
    console.log(`✅ Fast processing (${totalTime}ms total)`);
  } catch (error) {
    console.error("❌ Error in candidate trace:", error.message);
    console.error("Stack:", error.stack);
  }
}

// Run the trace
if (require.main === module) {
  runClientBriefTrace();
}

module.exports = { runClientBriefTrace };
