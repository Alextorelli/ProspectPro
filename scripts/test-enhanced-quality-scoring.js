#!/usr/bin/env node
/**
 * TEST: Enhanced Quality Scoring v3.0
 * Validates the new cost-efficient quality scoring system
 */

const EnhancedQualityScorer = require("./modules/validators/enhanced-quality-scorer");

// Test data - realistic business examples
const testBusinesses = [
  {
    name: "Starbucks Coffee",
    address: "1234 Main St, Denver, CO 80202",
    phone: "(303) 555-0123",
    website: "https://starbucks.com",
    emails: [
      { email: "manager@starbucks.com", confidence: 85 },
      { email: "info@starbucks.com", confidence: 70 },
    ],
    place_id: "ChIJ123abc",
    rating: 4.2,
    user_ratings_total: 150,
  },
  {
    name: "Local Coffee Co",
    address: "567 Oak Ave, Denver, CO",
    phone: "3035550199",
    website: "localcoffee.com",
    emails: [{ email: "owner@localcoffee.com", confidence: 90 }],
  },
  {
    name: "Generic Coffee Shop",
    address: "123 Street",
    phone: "555-1234",
    website: "facebook.com/genericcoffee",
    emails: [],
  },
  {
    name: "Business LLC",
    address: "",
    phone: "",
    website: "",
    emails: [],
  },
];

async function testEnhancedQualityScoring() {
  console.log("🎯 Testing Enhanced Quality Scoring v3.0");
  console.log("=".repeat(60));

  const scorer = new EnhancedQualityScorer({
    maxCostPerBusiness: 2.0,
  });

  console.log("\n📊 INDIVIDUAL BUSINESS SCORING:");
  console.log("-".repeat(60));

  const scoredBusinesses = [];

  for (let i = 0; i < testBusinesses.length; i++) {
    const business = testBusinesses[i];
    console.log(`\n🏢 ${i + 1}. ${business.name}`);

    const result = await scorer.calculateOptimizedScore(business);

    console.log(`   📈 Score: ${result.score}% (${result.recommendation})`);
    console.log(
      `   💰 Cost: $${result.totalCost.toFixed(3)} (${
        result.costEfficient ? "Efficient" : "Over Budget"
      })`
    );
    console.log(
      `   🔍 Breakdown: Name=${result.breakdown.businessName}% | Address=${result.breakdown.address}% | Phone=${result.breakdown.phone}% | Website=${result.breakdown.website}%`
    );

    scoredBusinesses.push({
      ...business,
      optimizedScore: result.score,
      totalCost: result.totalCost,
      ...result,
    });
  }

  console.log("\n📊 DYNAMIC THRESHOLD OPTIMIZATION:");
  console.log("-".repeat(60));

  const thresholds = [30, 35, 40, 45];

  for (const targetRate of thresholds) {
    const analysis = scorer.calculateOptimalThreshold(
      scoredBusinesses,
      targetRate
    );
    const qualified = scoredBusinesses.filter(
      (b) => b.optimizedScore >= analysis.suggested
    ).length;
    const actualRate = Math.round((qualified / scoredBusinesses.length) * 100);

    console.log(
      `🎯 Target: ${targetRate}% | Threshold: ${analysis.suggested}% | Actual: ${actualRate}% | Qualified: ${qualified}/${scoredBusinesses.length}`
    );
  }

  console.log("\n💰 COST EFFICIENCY ANALYSIS:");
  console.log("-".repeat(60));

  const performance = scorer.getPerformanceSummary();
  const totalCost = scoredBusinesses.reduce((sum, b) => sum + b.totalCost, 0);
  const bestScored = scoredBusinesses.filter((b) => b.optimizedScore >= 60);

  console.log(`📈 Businesses Processed: ${performance.businessesProcessed}`);
  console.log(`💰 Total Validation Cost: $${totalCost.toFixed(3)}`);
  console.log(`📊 Average Score: ${performance.averageScore}%`);
  console.log(
    `🎯 High Quality (60%+): ${bestScored.length}/${
      scoredBusinesses.length
    } (${Math.round((bestScored.length / scoredBusinesses.length) * 100)}%)`
  );
  console.log(
    `💸 Cost Savings vs Traditional: $${performance.totalCostSavings.toFixed(
      3
    )}`
  );
  console.log(
    `📉 Cost per Business: $${(totalCost / scoredBusinesses.length).toFixed(
      3
    )} (vs $1.50 traditional)`
  );

  console.log("\n🏆 QUALIFICATION RATE COMPARISON:");
  console.log("-".repeat(60));

  // Simulate old system (70% threshold, no optimization)
  const oldSystemQualified = scoredBusinesses.filter(
    (b) => b.optimizedScore >= 70
  ).length;
  const oldRate = Math.round(
    (oldSystemQualified / scoredBusinesses.length) * 100
  );

  // New system (optimized threshold)
  const optimalThreshold = scorer.calculateOptimalThreshold(
    scoredBusinesses,
    35
  ).suggested;
  const newSystemQualified = scoredBusinesses.filter(
    (b) => b.optimizedScore >= optimalThreshold
  ).length;
  const newRate = Math.round(
    (newSystemQualified / scoredBusinesses.length) * 100
  );

  console.log(
    `❌ Old System (70% threshold): ${oldSystemQualified}/${scoredBusinesses.length} = ${oldRate}% qualified`
  );
  console.log(
    `✅ New System (${optimalThreshold}% threshold): ${newSystemQualified}/${scoredBusinesses.length} = ${newRate}% qualified`
  );
  console.log(
    `📈 Improvement: ${newRate - oldRate}% points (${Math.round(
      (newRate / oldRate || 1) * 100
    )}% relative increase)`
  );

  console.log("\n🎉 ENHANCED QUALITY SCORING v3.0 TEST COMPLETE!");

  return {
    oldQualificationRate: oldRate,
    newQualificationRate: newRate,
    improvement: newRate - oldRate,
    costSavings: performance.totalCostSavings,
    avgCostPerBusiness: totalCost / scoredBusinesses.length,
  };
}

// Run the test
testEnhancedQualityScoring()
  .then((results) => {
    console.log(
      `\n✅ Test Results: ${
        results.improvement
      }% improvement, $${results.costSavings.toFixed(3)} savings`
    );
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
  });
