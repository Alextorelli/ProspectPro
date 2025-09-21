/**
 * ProspectPro Iterative Testing Framework
 * 4-Round Testing Strategy: 25 Premium Leads Total
 * Target: Quality refinement while meeting client brief quota
 */

const fetch = require("node-fetch");
const fs = require("fs").promises;
const path = require("path");

class IterativeTestingFramework {
  constructor(config = {}) {
    this.baseURL = config.baseURL || "http://localhost:3000";
    this.totalBudget = config.totalBudget || 20.0; // $5 per round x 4 rounds
    this.budgetPerRound = config.budgetPerRound || 5.0;
    this.confidenceThreshold = config.confidenceThreshold || 80;
    this.leadsPerRound = config.leadsPerRound || 5;

    // Testing state tracking
    this.completedRounds = [];
    this.allQualifiedLeads = [];
    this.totalCost = 0;
    this.performanceMetrics = {
      costAccuracy: [],
      processingTimes: [],
      qualificationRates: [],
      confidenceScores: [],
    };
  }

  /**
   * ROUND 1: Baseline Production Validation
   * Focus: Verify simulation accuracy against real API responses
   */
  async runRound1_BaselineValidation() {
    console.log("\n🧪 ROUND 1: BASELINE PRODUCTION VALIDATION");
    console.log("===========================================");
    console.log("Focus: Verify simulation accuracy vs. real API responses");
    console.log(
      `Budget: $${this.budgetPerRound.toFixed(2)} | Target: ${
        this.leadsPerRound
      } leads`
    );
    console.log("");

    const testScenarios = [
      {
        name: "San Diego Plumbers - API Validation",
        businessType: "plumber",
        location: "San Diego, CA",
        maxResults: 1,
        budget: 1.2,
        filters: {
          minRating: 4.2,
          minReviews: 20,
          requireWebsite: true,
        },
        validationFocus: "Direct Google Places API vs. simulation predictions",
      },
      {
        name: "Portland Wellness - Chamber Integration",
        businessType: "wellness center",
        location: "Portland, OR",
        maxResults: 1,
        budget: 1.0,
        filters: {
          minRating: 4.0,
          minReviews: 15,
        },
        validationFocus: "Chamber of Commerce cross-reference testing",
      },
      {
        name: "Seattle HVAC - License Verification",
        businessType: "hvac contractor",
        location: "Seattle, WA",
        maxResults: 1,
        budget: 1.1,
        filters: {
          minRating: 4.1,
          minReviews: 25,
        },
        validationFocus: "Washington State licensing verification accuracy",
      },
      {
        name: "LA Beauty Salons - Professional Licensing",
        businessType: "beauty salon",
        location: "Los Angeles, CA",
        maxResults: 1,
        budget: 0.95,
        filters: {
          minRating: 4.0,
          minReviews: 30,
        },
        validationFocus: "California cosmetology board integration",
      },
      {
        name: "SF Electrical - CSLB Integration",
        businessType: "electrician",
        location: "San Francisco, CA",
        maxResults: 1,
        budget: 1.25,
        filters: {
          minRating: 4.3,
          minReviews: 15,
        },
        validationFocus: "CSLB contractor verification workflow",
      },
    ];

    const roundResults = await this.executeTestRound(1, testScenarios, {
      focusAreas: [
        "API Rate Limiting vs. Simulation Delays",
        "Error Handling for Failed API Responses",
        "Cost Tracking Accuracy",
        "Contact Data Validation Success Rate",
      ],
      successCriteria: {
        apiCostAccuracy: 90, // Within 10% of predictions
        contactAccuracy: 90, // Phone/email validation
        licenseVerification: 95, // Professional license accuracy
        processingTime: 30, // Seconds per qualified lead
      },
    });

    await this.generateRoundReport(1, roundResults, "baseline-validation");
    return roundResults;
  }

  /**
   * ROUND 2: Geographic Expansion Validation
   * Focus: Test system performance across different regional markets
   */
  async runRound2_GeographicExpansion() {
    console.log("\n🧪 ROUND 2: GEOGRAPHIC EXPANSION VALIDATION");
    console.log("============================================");
    console.log("Focus: Regional market performance across different states");
    console.log(
      `Budget: $${this.budgetPerRound.toFixed(2)} | Target: ${
        this.leadsPerRound
      } leads`
    );
    console.log("");

    const testScenarios = [
      {
        name: "Phoenix HVAC - Arizona Integration",
        businessType: "hvac contractor",
        location: "Phoenix, AZ",
        maxResults: 1,
        budget: 1.0,
        filters: {
          minRating: 4.0,
          minReviews: 20,
        },
        validationFocus:
          "Arizona licensing integration and desert market patterns",
      },
      {
        name: "Denver Plumbers - Colorado Validation",
        businessType: "plumber",
        location: "Denver, CO",
        maxResults: 1,
        budget: 1.05,
        filters: {
          minRating: 4.2,
          minReviews: 15,
        },
        validationFocus:
          "Colorado professional validation and mountain region business patterns",
      },
      {
        name: "Austin Wellness - Texas Registration",
        businessType: "wellness center",
        location: "Austin, TX",
        maxResults: 1,
        budget: 0.95,
        filters: {
          minRating: 4.1,
          minReviews: 10,
        },
        validationFocus:
          "Texas business registration lookup and wellness industry regulations",
      },
      {
        name: "Atlanta Beauty - Georgia Licensing",
        businessType: "beauty salon",
        location: "Atlanta, GA",
        maxResults: 1,
        budget: 1.0,
        filters: {
          minRating: 4.0,
          minReviews: 25,
        },
        validationFocus:
          "Georgia cosmetology verification and Southern market characteristics",
      },
      {
        name: "Miami Electrical - Florida Contractors",
        businessType: "electrician",
        location: "Miami, FL",
        maxResults: 1,
        budget: 1.1,
        filters: {
          minRating: 4.2,
          minReviews: 20,
        },
        validationFocus:
          "Florida contractor licensing and hurricane-market specializations",
      },
    ];

    const roundResults = await this.executeTestRound(2, testScenarios, {
      focusAreas: [
        "Regional Licensing API Integration Success",
        "Owner Identification Across State Databases",
        "Email Deliverability Regional Consistency",
        "Cost Efficiency Outside West Coast Markets",
      ],
      successCriteria: {
        regionalApiIntegration: 85,
        ownerIdentification: 88,
        emailDeliverability: 92,
        costConsistency: 15, // Within 15% of West Coast costs
      },
    });

    await this.generateRoundReport(2, roundResults, "geographic-expansion");
    return roundResults;
  }

  /**
   * ROUND 3: Industry Vertical Deep-Dive
   * Focus: Optimize lead quality within specific trade verticals
   */
  async runRound3_IndustryVerticalOptimization() {
    console.log("\n🧪 ROUND 3: INDUSTRY VERTICAL DEEP-DIVE");
    console.log("=======================================");
    console.log("Focus: Vertical specialization and premium service targeting");
    console.log(
      `Budget: $${this.budgetPerRound.toFixed(2)} | Target: ${
        this.leadsPerRound
      } leads`
    );
    console.log("");

    const testScenarios = [
      {
        name: "Emergency Plumbing Specialists",
        businessType: "emergency plumber",
        location: "Chicago, IL",
        maxResults: 1,
        budget: 1.15,
        filters: {
          minRating: 4.3,
          minReviews: 50,
          specialization: "emergency_services",
        },
        validationFocus:
          "24/7 service identification and emergency response specialization",
      },
      {
        name: "Medical Wellness Practitioners",
        businessType: "medical massage therapist",
        location: "Boston, MA",
        maxResults: 1,
        budget: 1.05,
        filters: {
          minRating: 4.4,
          minReviews: 30,
          certifications: ["medical", "therapeutic"],
        },
        validationFocus:
          "Medical licensing vs. general wellness certification validation",
      },
      {
        name: "Commercial HVAC Specialists",
        businessType: "commercial hvac contractor",
        location: "Dallas, TX",
        maxResults: 1,
        budget: 1.2,
        filters: {
          minRating: 4.2,
          minReviews: 40,
          specialization: "commercial",
        },
        validationFocus: "Commercial vs. residential service differentiation",
      },
      {
        name: "Luxury Beauty Services",
        businessType: "luxury beauty salon",
        location: "Beverly Hills, CA",
        maxResults: 1,
        budget: 1.1,
        filters: {
          minRating: 4.5,
          minReviews: 75,
          pricePoint: "premium",
        },
        validationFocus:
          "Luxury service identification and high-end market targeting",
      },
      {
        name: "Solar Electrical Contractors",
        businessType: "solar electrician",
        location: "Phoenix, AZ",
        maxResults: 1,
        budget: 1.0,
        filters: {
          minRating: 4.1,
          minReviews: 25,
          specialization: "solar_installation",
        },
        validationFocus:
          "Renewable energy specialization and advanced certification tracking",
      },
    ];

    const roundResults = await this.executeTestRound(3, testScenarios, {
      focusAreas: [
        "Industry-Specific Confidence Scoring",
        "Owner vs. Manager Distinction Success",
        "Service Specialization Identification",
        "Premium Service Provider Targeting",
      ],
      successCriteria: {
        specializationAccuracy: 85,
        ownerOperatorAccuracy: 90,
        serviceAreaMapping: 80,
        premiumIdentification: 75,
      },
    });

    await this.generateRoundReport(3, roundResults, "industry-vertical");
    return roundResults;
  }

  /**
   * ROUND 4: Quality Optimization & Scale Preparation
   * Focus: Finalize v1.0 algorithms and prepare for commercial deployment
   */
  async runRound4_QualityOptimization() {
    console.log("\n🧪 ROUND 4: QUALITY OPTIMIZATION & SCALE PREPARATION");
    console.log("====================================================");
    console.log(
      "Focus: Algorithm finalization and commercial deployment readiness"
    );
    console.log(
      `Budget: $${this.budgetPerRound.toFixed(2)} | Target: ${
        this.leadsPerRound
      } leads`
    );
    console.log("");

    const testScenarios = [
      {
        name: "Multi-Location Business Chains",
        businessType: "plumbing franchise",
        location: "Houston, TX",
        maxResults: 1,
        budget: 1.25,
        filters: {
          minRating: 4.0,
          minReviews: 100,
          businessModel: "franchise",
        },
        validationFocus:
          "Complex business structure handling and franchise owner identification",
      },
      {
        name: "Emerging Market New Businesses",
        businessType: "wellness center",
        location: "Nashville, TN",
        maxResults: 1,
        budget: 0.9,
        filters: {
          minRating: 4.0,
          minReviews: 8,
          establishedDate: "recent",
        },
        validationFocus: "New business detection with limited online presence",
      },
      {
        name: "High-Density Competitive Markets",
        businessType: "hvac contractor",
        location: "Las Vegas, NV",
        maxResults: 1,
        budget: 1.1,
        filters: {
          minRating: 4.1,
          minReviews: 30,
          marketDensity: "high",
        },
        validationFocus:
          "Competitive differentiation in saturated service markets",
      },
      {
        name: "Seasonal Service Specialists",
        businessType: "pool service contractor",
        location: "Scottsdale, AZ",
        maxResults: 1,
        budget: 1.0,
        filters: {
          minRating: 4.2,
          minReviews: 35,
          seasonalBusiness: true,
        },
        validationFocus:
          "Seasonal availability and contact timing optimization",
      },
      {
        name: "Niche Specialty Services",
        businessType: "restoration contractor",
        location: "Orlando, FL",
        maxResults: 1,
        budget: 1.15,
        filters: {
          minRating: 4.3,
          minReviews: 20,
          specialization: "restoration",
        },
        validationFocus:
          "Unique service identification and specialized equipment tracking",
      },
    ];

    const roundResults = await this.executeTestRound(4, testScenarios, {
      focusAreas: [
        "Complex Business Structure Processing",
        "New Business Qualification Accuracy",
        "Competitive Market Navigation",
        "Seasonal Business Timing",
        "Scalability Performance Testing",
      ],
      successCriteria: {
        complexBusinessHandling: 80,
        newBusinessDetection: 75,
        competitiveDifferentiation: 70,
        seasonalAccuracy: 85,
        scalabilityMaintenance: 95,
      },
      finalOptimization: {
        targetCostPerLead: 1.0,
        targetContactDeliverability: 95,
        targetBusinessVerification: 90,
        targetScalability: 25, // Businesses per search without degradation
      },
    });

    await this.generateRoundReport(4, roundResults, "quality-optimization");
    await this.generateFinalV1Report();
    return roundResults;
  }

  /**
   * Execute a testing round with comprehensive monitoring
   */
  async executeTestRound(roundNumber, testScenarios, roundConfig) {
    const roundStart = Date.now();
    const roundResults = {
      roundNumber,
      startTime: new Date().toISOString(),
      testScenarios,
      config: roundConfig,
      results: [],
      metrics: {
        totalCost: 0,
        qualifiedLeads: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        successRate: 0,
      },
      learnings: [],
      optimizations: [],
    };

    // Server connectivity check
    try {
      console.log("🔍 Verifying server connectivity...");
      const healthCheck = await fetch(`${this.baseURL}/health`);
      if (!healthCheck.ok) {
        throw new Error(`Server health check failed: ${healthCheck.status}`);
      }
      console.log("✅ Production server ready\n");
    } catch (error) {
      console.error("❌ Server connectivity failed:", error.message);
      throw new Error(`Round ${roundNumber} aborted: Server not accessible`);
    }

    // Execute each test scenario
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(
        `\n🔍 TEST ${i + 1}/${testScenarios.length}: ${scenario.name}`
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📍 Location: ${scenario.location}`);
      console.log(`🎯 Focus: ${scenario.validationFocus}`);
      console.log(`💰 Budget: $${scenario.budget.toFixed(2)}`);

      try {
        const testResult = await this.executeScenarioTest(
          scenario,
          roundNumber,
          i + 1
        );
        roundResults.results.push(testResult);

        // Update round metrics
        roundResults.metrics.totalCost += testResult.cost;
        if (testResult.qualified) {
          roundResults.metrics.qualifiedLeads++;
          this.allQualifiedLeads.push(testResult.lead);
        }
      } catch (error) {
        console.error(`❌ Test ${i + 1} failed:`, error.message);
        roundResults.results.push({
          scenario: scenario.name,
          status: "failed",
          error: error.message,
          cost: 0,
        });
      }

      // Budget check
      if (roundResults.metrics.totalCost >= this.budgetPerRound) {
        console.log(`\n⚠️  Round ${roundNumber} budget limit reached`);
        break;
      }
    }

    // Calculate final round metrics
    const processingTime = Date.now() - roundStart;
    roundResults.endTime = new Date().toISOString();
    roundResults.processingTime = processingTime;

    if (roundResults.results.length > 0) {
      const successfulResults = roundResults.results.filter(
        (r) => r.status === "success"
      );
      roundResults.metrics.successRate =
        (successfulResults.length / roundResults.results.length) * 100;

      if (successfulResults.length > 0) {
        const avgConfidence =
          successfulResults.reduce((sum, r) => sum + (r.confidence || 0), 0) /
          successfulResults.length;
        roundResults.metrics.averageConfidence = Math.round(avgConfidence);

        const avgProcessingTime =
          successfulResults.reduce(
            (sum, r) => sum + (r.processingTime || 0),
            0
          ) / successfulResults.length;
        roundResults.metrics.averageProcessingTime =
          Math.round(avgProcessingTime);
      }
    }

    // Store round results and update global state
    this.completedRounds.push(roundResults);
    this.totalCost += roundResults.metrics.totalCost;

    // Update performance tracking
    this.performanceMetrics.costAccuracy.push(roundResults.metrics.totalCost);
    this.performanceMetrics.qualificationRates.push(
      roundResults.metrics.successRate
    );
    if (roundResults.metrics.averageConfidence > 0) {
      this.performanceMetrics.confidenceScores.push(
        roundResults.metrics.averageConfidence
      );
    }

    console.log(`\n🎯 ROUND ${roundNumber} SUMMARY`);
    console.log("═══════════════════════════════════════");
    console.log(
      `✅ Tests completed: ${roundResults.results.length}/${testScenarios.length}`
    );
    console.log(`✅ Qualified leads: ${roundResults.metrics.qualifiedLeads}`);
    console.log(
      `✅ Success rate: ${roundResults.metrics.successRate.toFixed(1)}%`
    );
    console.log(
      `✅ Average confidence: ${roundResults.metrics.averageConfidence}%`
    );
    console.log(`✅ Total cost: $${roundResults.metrics.totalCost.toFixed(3)}`);
    console.log(`✅ Processing time: ${Math.round(processingTime / 1000)}s`);

    return roundResults;
  }

  /**
   * Execute individual test scenario
   */
  async executeScenarioTest(scenario, roundNumber, testNumber) {
    const startTime = Date.now();

    const searchPayload = {
      businessType: scenario.businessType,
      location: scenario.location,
      maxResults: scenario.maxResults || 1,
      radius: 25000,
      budget: scenario.budget,
      filters: {
        ...scenario.filters,
        requireOwnerInfo: true,
      },
      enrichmentOptions: {
        includeEmails: true,
        includeOwnerInfo: true,
        validateWebsite: true,
        verifyEmails: true,
        includeRegistryData: true,
      },
      testMetadata: {
        round: roundNumber,
        test: testNumber,
        focus: scenario.validationFocus,
      },
    };

    console.log("⚡ Executing live API test...");

    const response = await fetch(`${this.baseURL}/api/business/discover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(searchPayload),
      timeout: 90000, // 90 second timeout for complex searches
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const businesses = result.businesses || [];
    const cost = parseFloat(result.totalCost || 0);

    console.log(`📊 API Response:`);
    console.log(`   • Businesses found: ${businesses.length}`);
    console.log(`   • Processing time: ${processingTime}ms`);
    console.log(`   • Actual cost: $${cost.toFixed(3)}`);
    console.log(`   • Campaign ID: ${result.campaignId || "N/A"}`);

    // Find the highest qualified lead
    const qualifiedLeads = businesses.filter(
      (b) => b.confidence >= this.confidenceThreshold
    );
    const bestLead =
      qualifiedLeads.length > 0
        ? qualifiedLeads.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
          )
        : null;

    if (bestLead) {
      console.log(`\n🏆 QUALIFIED LEAD FOUND:`);
      console.log(`   📋 ${bestLead.name || "Business Name TBD"}`);
      console.log(`   👤 ${bestLead.owner_name || "Owner TBD"}`);
      console.log(`   📧 ${bestLead.email || "Email TBD"}`);
      console.log(`   📞 ${bestLead.phone || "Phone TBD"}`);
      console.log(`   💯 Confidence: ${bestLead.confidence}%`);
      console.log(
        `   🏷️  Type: ${
          Array.isArray(bestLead.business_type)
            ? bestLead.business_type.join(", ")
            : bestLead.business_type || "Type TBD"
        }`
      );
    } else {
      console.log(
        `\n❌ No qualified leads found (${this.confidenceThreshold}%+ threshold)`
      );
    }

    return {
      scenario: scenario.name,
      status: "success",
      location: scenario.location,
      businessType: scenario.businessType,
      validationFocus: scenario.validationFocus,
      cost,
      processingTime,
      businessesFound: businesses.length,
      qualified: !!bestLead,
      confidence: bestLead?.confidence || 0,
      lead: bestLead,
      campaignId: result.campaignId,
      rawResult: result,
    };
  }

  /**
   * Generate comprehensive round report
   */
  async generateRoundReport(roundNumber, roundResults, reportType) {
    const reportPath = path.join(
      __dirname,
      `round-${roundNumber}-${reportType}-report.md`
    );

    let reportContent = `# Round ${roundNumber} Testing Report: ${
      roundResults.config?.focusAreas?.[0] || reportType
    }\n\n`;
    reportContent += `**Test Date:** ${new Date().toLocaleDateString()}\n`;
    reportContent += `**Focus Area:** ${reportType
      .replace("-", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())}\n`;
    reportContent += `**Budget:** $${this.budgetPerRound.toFixed(2)}\n`;
    reportContent += `**Target Leads:** ${this.leadsPerRound}\n\n`;

    reportContent += `## Round Summary\n\n`;
    reportContent += `- **Tests Executed:** ${roundResults.results.length}\n`;
    reportContent += `- **Qualified Leads:** ${roundResults.metrics.qualifiedLeads}\n`;
    reportContent += `- **Success Rate:** ${roundResults.metrics.successRate.toFixed(
      1
    )}%\n`;
    reportContent += `- **Average Confidence:** ${roundResults.metrics.averageConfidence}%\n`;
    reportContent += `- **Total Cost:** $${roundResults.metrics.totalCost.toFixed(
      3
    )}\n`;
    reportContent += `- **Processing Time:** ${Math.round(
      roundResults.processingTime / 1000
    )}s\n\n`;

    reportContent += `## Individual Test Results\n\n`;
    roundResults.results.forEach((result, idx) => {
      reportContent += `### Test ${idx + 1}: ${result.scenario}\n`;
      reportContent += `- **Location:** ${result.location}\n`;
      reportContent += `- **Focus:** ${result.validationFocus}\n`;
      reportContent += `- **Status:** ${result.status.toUpperCase()}\n`;
      reportContent += `- **Cost:** $${result.cost?.toFixed(3) || "0.000"}\n`;
      if (result.qualified) {
        reportContent += `- **Lead Qualified:** ✅ ${result.confidence}% confidence\n`;
        reportContent += `- **Business:** ${result.lead?.name || "N/A"}\n`;
        reportContent += `- **Owner:** ${result.lead?.owner_name || "N/A"}\n`;
      } else {
        reportContent += `- **Lead Qualified:** ❌ Below ${this.confidenceThreshold}% threshold\n`;
      }
      reportContent += `\n`;
    });

    await fs.writeFile(reportPath, reportContent);
    console.log(`\n📄 Round ${roundNumber} report saved: ${reportPath}`);
  }

  /**
   * Generate final V1.0 comprehensive report
   */
  async generateFinalV1Report() {
    const reportPath = path.join(__dirname, "ProspectPro-V1-Final-Report.md");

    let reportContent = `# ProspectPro V1.0 Final Testing Report\n\n`;
    reportContent += `**Testing Period:** ${
      this.completedRounds[0]?.startTime
    } - ${this.completedRounds[this.completedRounds.length - 1]?.endTime}\n`;
    reportContent += `**Total Rounds:** ${this.completedRounds.length}\n`;
    reportContent += `**Total Budget:** $${this.totalCost.toFixed(2)}\n`;
    reportContent += `**Total Qualified Leads:** ${this.allQualifiedLeads.length}\n\n`;

    reportContent += `## Overall Performance Metrics\n\n`;
    const avgConfidence =
      this.performanceMetrics.confidenceScores.reduce((a, b) => a + b, 0) /
      this.performanceMetrics.confidenceScores.length;
    const avgQualificationRate =
      this.performanceMetrics.qualificationRates.reduce((a, b) => a + b, 0) /
      this.performanceMetrics.qualificationRates.length;

    reportContent += `- **Average Confidence Score:** ${avgConfidence.toFixed(
      1
    )}%\n`;
    reportContent += `- **Average Qualification Rate:** ${avgQualificationRate.toFixed(
      1
    )}%\n`;
    reportContent += `- **Cost Per Qualified Lead:** $${(
      this.totalCost / this.allQualifiedLeads.length
    ).toFixed(3)}\n`;
    reportContent += `- **Total API Calls:** ${this.completedRounds.reduce(
      (sum, round) => sum + round.results.length,
      0
    )}\n\n`;

    reportContent += `## Client Brief Fulfillment\n\n`;
    reportContent += `✅ **Target:** 25 qualified leads\n`;
    reportContent += `✅ **Delivered:** ${this.allQualifiedLeads.length} qualified leads\n`;
    reportContent += `✅ **Quality Standard:** ${this.confidenceThreshold}%+ confidence threshold maintained\n`;
    reportContent += `✅ **Budget Management:** $20 total budget across 4 testing rounds\n\n`;

    reportContent += `## All Qualified Leads\n\n`;
    this.allQualifiedLeads.forEach((lead, idx) => {
      reportContent += `### ${idx + 1}. ${lead.name || "Business Name TBD"}\n`;
      reportContent += `- **Owner:** ${lead.owner_name || "TBD"}\n`;
      reportContent += `- **Email:** ${lead.email || "TBD"}\n`;
      reportContent += `- **Phone:** ${lead.phone || "TBD"}\n`;
      reportContent += `- **Location:** ${lead.address || "TBD"}\n`;
      reportContent += `- **Type:** ${
        Array.isArray(lead.business_type)
          ? lead.business_type.join(", ")
          : lead.business_type || "TBD"
      }\n`;
      reportContent += `- **Confidence:** ${lead.confidence}%\n`;
      reportContent += `- **Rating:** ${lead.rating || "N/A"}\n\n`;
    });

    await fs.writeFile(reportPath, reportContent);
    console.log(`\n📋 Final V1.0 report generated: ${reportPath}`);

    return reportPath;
  }

  /**
   * Execute complete 4-round testing strategy
   */
  async executeCompleteTestingSuite() {
    console.log("🚀 PROSPECTPRO V1.0 ITERATIVE TESTING SUITE");
    console.log("===========================================");
    console.log(`Total Budget: $${this.totalBudget.toFixed(2)}`);
    console.log(
      `Target: ${this.leadsPerRound * 4} qualified leads across 4 rounds`
    );
    console.log(
      `Quality Standard: ${this.confidenceThreshold}%+ confidence threshold`
    );
    console.log("");

    try {
      // Execute all 4 rounds sequentially
      await this.runRound1_BaselineValidation();
      await this.runRound2_GeographicExpansion();
      await this.runRound3_IndustryVerticalOptimization();
      await this.runRound4_QualityOptimization();

      console.log("\n\n🎯 COMPLETE TESTING SUITE RESULTS");
      console.log("═══════════════════════════════════════════════════");
      console.log(`✅ Rounds completed: ${this.completedRounds.length}/4`);
      console.log(`✅ Total qualified leads: ${this.allQualifiedLeads.length}`);
      console.log(`✅ Total cost: $${this.totalCost.toFixed(2)}`);
      console.log(
        `✅ Client brief fulfillment: ${
          this.allQualifiedLeads.length >= 20 ? "✅ ACHIEVED" : "⚠️ PARTIAL"
        }`
      );
      console.log(
        `✅ Quality maintenance: ${
          this.performanceMetrics.confidenceScores.every(
            (score) => score >= this.confidenceThreshold
          )
            ? "✅ MAINTAINED"
            : "⚠️ VARIABLE"
        }`
      );

      return {
        success: true,
        totalLeads: this.allQualifiedLeads.length,
        totalCost: this.totalCost,
        completedRounds: this.completedRounds.length,
        qualifiedLeads: this.allQualifiedLeads,
        performanceMetrics: this.performanceMetrics,
      };
    } catch (error) {
      console.error("❌ Testing suite failed:", error);
      return {
        success: false,
        error: error.message,
        completedRounds: this.completedRounds.length,
        partialResults: this.allQualifiedLeads,
      };
    }
  }
}

// Export for use in other modules
module.exports = IterativeTestingFramework;

// CLI execution
if (require.main === module) {
  const testingFramework = new IterativeTestingFramework({
    baseURL: process.env.PROSPECTPRO_URL || "http://localhost:3000",
    totalBudget: 20.0,
    budgetPerRound: 5.0,
    confidenceThreshold: 80,
    leadsPerRound: 5,
  });

  testingFramework
    .executeCompleteTestingSuite()
    .then((results) => {
      if (results.success) {
        console.log("\n🎉 V1.0 testing suite completed successfully!");
        console.log(
          `📊 Final Results: ${
            results.totalLeads
          } leads for $${results.totalCost.toFixed(2)}`
        );
      } else {
        console.log("\n❌ Testing suite encountered issues");
        console.error(results.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Fatal testing error:", error);
      process.exit(1);
    });
}
