/**
 * Enhanced Discovery Engine v2.0
 * Core discovery system with iterative quality-focused lead generation
 *
 * Key Features:
 * - Iterative search until target qualified leads found
 * - Complete contact information requirements (name, address, phone, website, email)
 * - Multiple search query strategies
 * - Duplicate prevention and quality filtering
 * - Budget and cost optimization
 * - Real-time feedback and progress tracking
 *
 * ProspectPro v2.0 - Zero Fake Data Policy
 */

const GooglePlacesClient = require("./api-clients/google-places");
const EnhancedLeadDiscovery = require("./enhanced-lead-discovery");
const CampaignCSVExporter = require("./campaign-csv-exporter");

class EnhancedDiscoveryEngine {
  constructor(apiKeys = {}) {
    this.apiKeys = apiKeys;
    this.googleClient = new GooglePlacesClient(apiKeys.googlePlaces);
    this.enhancedDiscovery = new EnhancedLeadDiscovery(apiKeys);
    this.csvExporter = new CampaignCSVExporter();

    // Discovery metrics
    this.totalProcessed = 0;
    this.totalCost = 0;
    this.startTime = null;
    this.sessionStats = {
      queriesExecuted: 0,
      businessesProcessed: 0,
      qualifiedLeadsFound: 0,
      averageConfidence: 0,
      costPerLead: 0,
    };
  }

  /**
   * Core discovery method - finds qualified leads until target met
   * @param {Object} config - Complete configuration object
   * @returns {Promise<Object>} Discovery results with qualified leads
   */
  async discoverQualifiedLeads(config) {
    const {
      businessType,
      location,
      targetCount = 3,
      budgetLimit = 10.0,
      requireCompleteContacts = true,
      minConfidenceScore = 70,
      additionalQueries = [],
    } = config;

    console.log(`🚀 Enhanced Discovery Engine v2.0 Starting`);
    console.log(
      `🎯 Target: ${targetCount} qualified leads with complete contact info`
    );
    console.log(
      `📋 Requirements: Complete contacts required: ${requireCompleteContacts}`
    );
    console.log("=".repeat(70));

    this.startTime = Date.now();
    let allQualifiedLeads = [];
    let currentQueryIndex = 0;
    let attemptCount = 0;

    const searchQueries = this.generateSearchQueries(
      businessType,
      location
    ).concat(additionalQueries);
    const maxAttempts = 8;
    const maxResultsPerQuery = 15;

    console.log(
      `🔍 Search Strategy: ${searchQueries.length} query variations prepared`
    );
    console.log(
      `💰 Budget: $${budgetLimit} | Quality Threshold: ${minConfidenceScore}%`
    );
    console.log(`📊 Max Results per Query: ${maxResultsPerQuery}`);
    console.log("");

    // Initialize campaign
    const campaignId = this.csvExporter.generateCampaignId();
    this.csvExporter.initializeCampaign(campaignId, {
      name: `Enhanced Discovery: ${businessType} in ${location}`,
      description: `Quality-focused discovery ensuring complete contact information`,
      targetLeads: targetCount,
      qualityRequirements: { requireCompleteContacts, minConfidenceScore },
      searchStrategy: searchQueries,
    });

    while (
      allQualifiedLeads.length < targetCount &&
      attemptCount < maxAttempts &&
      currentQueryIndex < searchQueries.length &&
      this.totalCost < budgetLimit
    ) {
      attemptCount++;
      const currentQuery = searchQueries[currentQueryIndex];

      console.log(`🔍 Search Attempt ${attemptCount}: "${currentQuery}"`);
      console.log(
        `   📊 Current Qualified: ${allQualifiedLeads.length}/${targetCount}`
      );
      console.log(
        `   💰 Budget Used: $${this.totalCost.toFixed(3)}/$${budgetLimit}`
      );

      try {
        // Execute Google Places search
        const searchResults = await this.googleClient.textSearch({
          query: currentQuery,
          location: location,
          type: this.getSearchType(businessType),
        });

        if (!searchResults || searchResults.length === 0) {
          console.log(`   ⚠️ No results for query: ${currentQuery}`);
          currentQueryIndex++;
          continue;
        }

        console.log(`   ✅ Found ${searchResults.length} potential businesses`);

        // Enhanced discovery processing
        const discoveryOptions = {
          budgetLimit: Math.min(2.0, budgetLimit - this.totalCost), // Remaining budget
          qualityThreshold: minConfidenceScore,
          maxResults: Math.min(maxResultsPerQuery, searchResults.length),
          prioritizeLocalBusinesses: true,
          enablePropertyIntelligence: true,
          enableRegistryValidation: true,
          enableRealTimeFeedback: true,
          minimumPreValidationScore: minConfidenceScore - 10,
        };

        const enhancedResults =
          await this.enhancedDiscovery.discoverAndValidateLeads(
            searchResults,
            discoveryOptions
          );

        this.totalProcessed += enhancedResults.totalProcessed;
        this.totalCost += enhancedResults.totalCost;
        this.sessionStats.queriesExecuted++;
        this.sessionStats.businessesProcessed += enhancedResults.totalProcessed;

        console.log(
          `   📈 Pipeline Results: ${enhancedResults.leads.length} qualified from ${enhancedResults.totalProcessed}`
        );
        console.log(
          `   💰 Query Cost: $${enhancedResults.totalCost.toFixed(3)}`
        );

        // Apply strict quality filtering
        const strictQualifiedLeads = this.applyQualityFilter(
          enhancedResults.leads,
          {
            requireEmail: requireCompleteContacts,
            requirePhone: requireCompleteContacts,
            requireWebsite: requireCompleteContacts,
            minimumConfidence: minConfidenceScore,
          }
        );

        console.log(
          `   🎯 Strict Quality Filter: ${strictQualifiedLeads.length} leads with complete info`
        );

        // Add new qualified leads (avoid duplicates)
        const newLeads = this.removeDuplicates(
          strictQualifiedLeads,
          allQualifiedLeads
        );
        allQualifiedLeads = [...allQualifiedLeads, ...newLeads];

        console.log(
          `   📊 Total Qualified: ${allQualifiedLeads.length}/${targetLeads}`
        );

        if (allQualifiedLeads.length >= targetLeads) {
          console.log(
            `   🎉 Target Achieved! Found ${allQualifiedLeads.length} qualified leads`
          );
          break;
        }

        // Strategy for next iteration
        if (newLeads.length === 0) {
          console.log(`   ⏭️ No new qualified leads, moving to next query`);
          currentQueryIndex++;
        } else if (newLeads.length < 2) {
          console.log(
            `   📈 Low yield (${newLeads.length}), trying next query variation`
          );
          currentQueryIndex++;
        }
        // If we got good results (2+), try the same query type again with different parameters
      } catch (error) {
        console.error(`   ❌ Query failed: ${error.message}`);
        currentQueryIndex++;
      }

      console.log(""); // Spacing between attempts
    }

    return this.generateDiscoveryResults(
      allQualifiedLeads,
      targetCount,
      campaignId,
      businessType,
      location
    );
  }

  /**
   * Apply strict quality filtering for complete contact information
   */
  applyQualityFilter(leads, requirements) {
    const {
      requireEmail = true,
      requirePhone = true,
      requireWebsite = true,
      minimumConfidence = 70,
    } = requirements;

    return leads.filter((lead) => {
      const hasName = !!(lead.name || lead.businessName);
      const hasAddress = !!(lead.address || lead.formatted_address);
      const hasPhone = !!(lead.phone || lead.companyPhone);
      const hasWebsite = !!lead.website;
      const hasEmail = !!(lead.email || lead.companyEmail);
      const hasConfidence =
        (lead.finalConfidenceScore || lead.confidenceScore) >=
        minimumConfidence;

      const meetsCriteria =
        hasName &&
        hasAddress &&
        (!requirePhone || hasPhone) &&
        (!requireWebsite || hasWebsite) &&
        (!requireEmail || hasEmail) &&
        hasConfidence;

      return meetsCriteria;
    });
  }

  /**
   * Remove duplicate leads based on business name and phone
   */
  removeDuplicates(newLeads, existingLeads) {
    return newLeads.filter((newLead) => {
      const newName = (
        newLead.name ||
        newLead.businessName ||
        ""
      ).toLowerCase();
      const newPhone = (newLead.phone || newLead.companyPhone || "").replace(
        /\D/g,
        ""
      );

      return !existingLeads.some((existing) => {
        const existingName = (
          existing.name ||
          existing.businessName ||
          ""
        ).toLowerCase();
        const existingPhone = (
          existing.phone ||
          existing.companyPhone ||
          ""
        ).replace(/\D/g, "");

        return (
          newName === existingName ||
          (newPhone && existingPhone && newPhone === existingPhone)
        );
      });
    });
  }

  /**
   * Generate comprehensive search queries for industry and location
   */
  generateSearchQueries(industry, location) {
    const industryQueries = {
      wellness: [
        `wellness center spa ${location}`,
        `massage therapy clinic ${location}`,
        `day spa wellness ${location}`,
        `holistic wellness center ${location}`,
        `medical spa ${location}`,
        `health spa wellness ${location}`,
        `therapeutic massage ${location}`,
        `wellness studio ${location}`,
      ],
      restaurant: [
        `restaurant ${location}`,
        `fine dining restaurant ${location}`,
        `local restaurant ${location}`,
        `family restaurant ${location}`,
        `cuisine restaurant ${location}`,
        `bistro restaurant ${location}`,
        `cafe restaurant ${location}`,
        `grill restaurant ${location}`,
      ],
      legal: [
        `law firm attorney ${location}`,
        `legal services ${location}`,
        `lawyer attorney ${location}`,
        `law office ${location}`,
        `legal counsel ${location}`,
        `litigation attorney ${location}`,
        `business lawyer ${location}`,
        `legal practice ${location}`,
      ],
      healthcare: [
        `medical practice ${location}`,
        `healthcare clinic ${location}`,
        `medical office ${location}`,
        `physician practice ${location}`,
        `medical center ${location}`,
        `health clinic ${location}`,
        `medical facility ${location}`,
        `healthcare provider ${location}`,
      ],
      default: [
        `business ${location}`,
        `professional services ${location}`,
        `local business ${location}`,
        `commercial services ${location}`,
        `professional office ${location}`,
      ],
    };

    return (
      industryQueries[industry.toLowerCase()] ||
      industryQueries.default.map((q) => q.replace("business", industry))
    );
  }

  /**
   * Get appropriate Google Places search type for industry
   */
  getSearchType(businessType) {
    const typeMapping = {
      wellness: "health",
      healthcare: "health",
      restaurant: "restaurant",
      legal: "establishment",
      retail: "store",
      default: "establishment",
    };

    return typeMapping[businessType.toLowerCase()] || typeMapping.default;
  }

  /**
   * Format quality requirements for display
   */
  formatRequirements(requirements) {
    const parts = [];
    if (requirements.requireEmail) parts.push("Email");
    if (requirements.requirePhone) parts.push("Phone");
    if (requirements.requireWebsite) parts.push("Website");
    return parts.join(", ") || "Basic contact info";
  }

  /**
   * Generate comprehensive discovery results
   */
  async generateDiscoveryResults(
    qualifiedLeads,
    targetLeads,
    campaignId,
    industry,
    location
  ) {
    const processingTime = Date.now() - this.startTime;

    // Update session stats
    this.sessionStats.qualifiedLeadsFound = qualifiedLeads.length;
    this.sessionStats.averageConfidence =
      qualifiedLeads.length > 0
        ? qualifiedLeads.reduce(
            (sum, lead) =>
              sum + (lead.finalConfidenceScore || lead.confidenceScore),
            0
          ) / qualifiedLeads.length
        : 0;
    this.sessionStats.costPerLead =
      qualifiedLeads.length > 0 ? this.totalCost / qualifiedLeads.length : 0;

    // Quality metrics
    const qualityMetrics = {
      allHaveEmail: qualifiedLeads.every(
        (lead) => !!(lead.email || lead.companyEmail)
      ),
      allHavePhone: qualifiedLeads.every(
        (lead) => !!(lead.phone || lead.companyPhone)
      ),
      allHaveWebsite: qualifiedLeads.every((lead) => !!lead.website),
      avgConfidence: this.sessionStats.averageConfidence,
      targetMet: qualifiedLeads.length >= targetLeads,
    };

    // Display results
    console.log("=".repeat(70));
    console.log("📊 ENHANCED DISCOVERY RESULTS");
    console.log("=".repeat(70));
    console.log(
      `🎯 Target: ${targetLeads} | Achieved: ${qualifiedLeads.length}`
    );
    console.log(
      `📈 Businesses Processed: ${this.sessionStats.businessesProcessed}`
    );
    console.log(`💰 Total Cost: $${this.totalCost.toFixed(3)}`);
    console.log(`⏱️ Processing Time: ${(processingTime / 1000).toFixed(1)}s`);
    console.log(`🔍 Queries Executed: ${this.sessionStats.queriesExecuted}`);
    console.log(
      `📊 Success Rate: ${(
        (qualifiedLeads.length / this.sessionStats.businessesProcessed) *
        100
      ).toFixed(1)}%`
    );
    console.log("");

    // Quality validation
    console.log("🔍 QUALITY VALIDATION:");
    console.log(
      `   📧 All have email: ${qualityMetrics.allHaveEmail ? "✅" : "❌"}`
    );
    console.log(
      `   📞 All have phone: ${qualityMetrics.allHavePhone ? "✅" : "❌"}`
    );
    console.log(
      `   🌐 All have website: ${qualityMetrics.allHaveWebsite ? "✅" : "❌"}`
    );
    console.log(
      `   📊 Average confidence: ${qualityMetrics.avgConfidence.toFixed(1)}%`
    );
    console.log("");

    // Display qualified leads
    if (qualifiedLeads.length > 0) {
      console.log("🎯 QUALIFIED LEADS (Complete Contact Info):");
      console.log("=".repeat(60));

      qualifiedLeads.forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.name || lead.businessName}`);
        console.log(
          `   📊 Confidence: ${(
            lead.finalConfidenceScore || lead.confidenceScore
          ).toFixed(1)}%`
        );
        console.log(`   📍 Address: ${lead.address || lead.formatted_address}`);
        console.log(`   📞 Phone: ${lead.phone || lead.companyPhone}`);
        console.log(`   🌐 Website: ${lead.website || "Not available"}`);
        console.log(
          `   📧 Email: ${lead.email || lead.companyEmail || "Not available"}`
        );
        console.log(
          `   🗺️ Enhanced: ${lead.foursquareData ? "✅ Yes" : "❌ No"}`
        );
        console.log(
          `   ⭐ Rating: ${lead.rating || lead.googleRating || "N/A"}/5`
        );
        console.log(`   💰 Cost: $${(lead.apiCost || 0).toFixed(3)}`);
        console.log("");
      });

      // Add to campaign and export
      console.log("📊 Adding qualified leads to campaign...");
      this.csvExporter.addQueryResults(
        `enhanced ${industry} discovery`,
        location,
        qualifiedLeads,
        {
          totalResults: qualifiedLeads.length,
          qualifiedLeads: qualifiedLeads.length,
          totalCost: this.totalCost,
          processingTimeMs: processingTime,
          averageConfidence: qualityMetrics.avgConfidence,
          qualityMetrics: qualityMetrics,
          searchQueriesUsed: this.sessionStats.queriesExecuted,
          successRate:
            (qualifiedLeads.length / this.sessionStats.businessesProcessed) *
            100,
          sessionStats: this.sessionStats,
        }
      );

      console.log("📤 Exporting campaign to CSV...");
      const csvPath = await this.csvExporter.exportCampaignToCsv();

      console.log("");
      console.log("✅ DISCOVERY COMPLETED:");
      console.log("=".repeat(60));
      console.log(`📁 CSV Export: ${csvPath}`);
      console.log(
        `🎯 Success: ${
          qualifiedLeads.length >= targetLeads ? "TARGET MET" : "PARTIAL"
        }`
      );
      console.log(
        `💰 Cost per Lead: $${this.sessionStats.costPerLead.toFixed(3)}`
      );
      console.log(
        `⏱️ Time per Lead: ${(
          processingTime /
          1000 /
          qualifiedLeads.length
        ).toFixed(1)}s`
      );
      console.log(
        `📊 Quality Score: ${qualityMetrics.avgConfidence.toFixed(1)}%`
      );

      return {
        success: qualifiedLeads.length >= targetLeads,
        leads: qualifiedLeads,
        qualifiedCount: qualifiedLeads.length,
        targetMet: qualifiedLeads.length >= targetLeads,
        totalCost: this.totalCost,
        processingTime: processingTime,
        qualityMetrics,
        sessionStats: this.sessionStats,
        csvPath: csvPath,
        campaignId,
      };
    } else {
      console.log("❌ No qualified leads found meeting requirements");
      return {
        success: false,
        leads: [],
        error: "No qualified leads found meeting complete contact requirements",
      };
    }
  }

  /**
   * Quick discovery method for testing and validation
   */
  async quickDiscovery(industry, location, targetLeads = 3) {
    const searchConfig = {
      industry,
      location,
      budgetLimit: 5.0,
      maxAttempts: 3,
    };

    const qualityRequirements = {
      requireEmail: true,
      requirePhone: true,
      requireWebsite: true,
      minimumConfidence: 70,
    };

    return await this.discoverQualifiedLeads(
      searchConfig,
      targetLeads,
      qualityRequirements
    );
  }
}

module.exports = EnhancedDiscoveryEngine;
