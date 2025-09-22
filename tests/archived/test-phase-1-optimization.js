/**
 * Phase 1 Optimization Validation Test
 *
 * Tests the optimized San Diego wellness campaign with:
 * - Dynamic API routing (should skip NY/CT registry APIs)
 * - Enhanced email filtering (only verified sources)
 * - Improved logging (less terminal noise)
 * - Performance improvements (faster validation)
 */

require("dotenv").config();
const EnhancedDiscoveryEngine = require("./modules/enhanced-discovery-engine");

async function testOptimizedAlgorithm() {
  console.log("🧪 PHASE 1 OPTIMIZATION VALIDATION TEST");
  console.log("=".repeat(60));
  console.log("🎯 Testing San Diego Wellness Campaign with Optimizations");
  console.log("📊 Expected Improvements:");
  console.log("   - Skip NY/CT registry APIs (geographic routing)");
  console.log("   - Reject pattern-generated emails");
  console.log("   - Accept only verified email sources");
  console.log("   - Reduced terminal logging noise");
  console.log("   - 40-60% faster validation pipeline");
  console.log("");

  // Initialize engine with API keys
  const apiKeys = {
    googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
    hunterIO: process.env.HUNTER_IO_API_KEY,
    apollo: process.env.APOLLO_API_KEY,
    neverBounce: process.env.NEVERBOUNCE_API_KEY,
    foursquare: process.env.FOURSQUARE_SERVICE_API_KEY,
  };

  const engine = new EnhancedDiscoveryEngine(apiKeys);

  // Campaign configuration - optimized for performance testing
  const campaignConfig = {
    businessType: "wellness center",
    location: "San Diego, CA",
    targetCount: 3,
    budgetLimit: 8.0,
    requireCompleteContacts: true,
    minConfidenceScore: 70,
    additionalQueries: ["wellness spa San Diego", "holistic health San Diego"],
  };

  console.log("⏱️ Starting optimized discovery...");
  const startTime = Date.now();

  try {
    // Execute optimized discovery
    const results = await engine.discoverQualifiedLeads(campaignConfig);
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    console.log("");
    console.log("📊 OPTIMIZATION VALIDATION RESULTS:");
    console.log("=".repeat(60));
    console.log(`⏱️  Total Processing Time: ${totalTime.toFixed(2)}s`);
    console.log(`💰 Total Cost: $${results.totalCost.toFixed(3)}`);
    console.log(`🎯 Leads Found: ${results.totalFound}`);
    console.log(
      `✅ Qualified: ${results.exported}/${campaignConfig.targetCount}`
    );
    console.log(
      `📈 Success Rate: ${results.sessionStats.successRate.toFixed(1)}%`
    );
    console.log(`💡 Cost Per Lead: $${results.costPerLead.toFixed(3)}`);
    console.log("");

    // Analyze optimization effectiveness
    console.log("🔍 OPTIMIZATION ANALYSIS:");
    console.log("-".repeat(40));

    // Check for geographic optimization indicators
    if (results.totalCost < 2.0) {
      console.log("✅ Low API cost suggests effective routing optimization");
    } else {
      console.log(
        "⚠️  Higher than expected cost - may need further optimization"
      );
    }

    // Check processing speed
    if (totalTime < 30) {
      console.log("✅ Fast processing time indicates effective optimizations");
    } else {
      console.log("⚠️  Processing took longer than expected");
    }

    // Check lead quality
    if (
      results.qualityMetrics.allHaveEmail &&
      results.qualityMetrics.allHavePhone
    ) {
      console.log("✅ All leads have verified contact information");
    } else {
      console.log("⚠️  Some leads missing complete contact info");
    }

    // Display qualified leads with email source analysis
    if (results.leads && results.leads.length > 0) {
      console.log("");
      console.log("📧 EMAIL SOURCE ANALYSIS:");
      console.log("-".repeat(40));

      results.leads.forEach((lead, index) => {
        const emailSource =
          lead.companyEmailSource || lead.emailSource || "Unknown";
        const isVerified = !/(pattern_generation|pattern)/.test(emailSource);
        const sourceIcon = isVerified ? "✅" : "❌";

        console.log(`${index + 1}. ${lead.name || lead.businessName}`);
        console.log(`   📧 ${lead.email || lead.companyEmail}`);
        console.log(`   📍 Source: ${emailSource} ${sourceIcon}`);
        console.log(
          `   📊 Confidence: ${(
            lead.finalConfidenceScore ||
            lead.confidenceScore ||
            0
          ).toFixed(1)}%`
        );
        console.log("");
      });
    }

    // Overall optimization assessment
    console.log("🏆 PHASE 1 OPTIMIZATION ASSESSMENT:");
    console.log("=".repeat(60));

    const optimizationScore = calculateOptimizationScore(results, totalTime);
    console.log(`📊 Optimization Score: ${optimizationScore.score}/100`);
    console.log(`📈 Performance Grade: ${optimizationScore.grade}`);
    console.log("");

    optimizationScore.recommendations.forEach((rec) => {
      console.log(`💡 ${rec}`);
    });

    return {
      success: results.success,
      processingTime: totalTime,
      totalCost: results.totalCost,
      leadsFound: results.totalFound,
      qualified: results.exported,
      optimizationScore: optimizationScore.score,
      recommendations: optimizationScore.recommendations,
    };
  } catch (error) {
    console.error("❌ Optimization test failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

function calculateOptimizationScore(results, processingTime) {
  let score = 0;
  const recommendations = [];

  // Performance metrics (40 points)
  if (processingTime < 20) {
    score += 20; // Excellent speed
  } else if (processingTime < 40) {
    score += 15; // Good speed
  } else {
    score += 10; // Needs improvement
    recommendations.push(
      "Consider further API routing optimization for better speed"
    );
  }

  if (results.totalCost < 1.5) {
    score += 20; // Excellent cost efficiency
  } else if (results.totalCost < 3.0) {
    score += 15; // Good cost efficiency
  } else {
    score += 10; // Needs improvement
    recommendations.push(
      "High API costs detected - review routing effectiveness"
    );
  }

  // Quality metrics (40 points)
  if (results.qualityMetrics.allHaveEmail) score += 15;
  if (results.qualityMetrics.allHavePhone) score += 15;
  if (results.qualityMetrics.avgConfidence >= 80) score += 10;

  // Success metrics (20 points)
  if (results.targetMet) {
    score += 20;
  } else if (results.exported > 0) {
    score += 10;
    recommendations.push(
      "Target not fully met - consider expanding search queries"
    );
  }

  // Determine grade
  let grade;
  if (score >= 90) grade = "A+ (Excellent)";
  else if (score >= 80) grade = "A (Very Good)";
  else if (score >= 70) grade = "B (Good)";
  else if (score >= 60) grade = "C (Fair)";
  else grade = "D (Needs Work)";

  if (recommendations.length === 0) {
    recommendations.push("✅ All optimization targets achieved successfully!");
  }

  return {
    score,
    grade,
    recommendations,
  };
}

// Run the test if called directly
if (require.main === module) {
  testOptimizedAlgorithm()
    .then((results) => {
      console.log("\n📋 Final Test Results:", JSON.stringify(results, null, 2));
      process.exit(results.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Test execution failed:", error);
      process.exit(1);
    });
}

module.exports = { testOptimizedAlgorithm };
