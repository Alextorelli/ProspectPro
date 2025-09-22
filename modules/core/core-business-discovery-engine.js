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

const GooglePlacesClient = require("../api-clients/api-google-places-client");
const EnhancedLeadDiscovery = require("./core-lead-discovery-engine");
const CampaignCSVExporter = require("./export-campaign-csv-system");
const logger = require("../utils/logger");

class EnhancedDiscoveryEngine {
  constructor(apiKeys = {}) {
    this.leadDiscovery = new EnhancedLeadDiscovery(apiKeys);
    this.googleClient = new GooglePlacesClient(apiKeys.googlePlaces);
    this.csvExporter = new CampaignCSVExporter();
    this.logger = logger;
    this.sessionStats = {
      totalQueries: 0,
      businessesProcessed: 0,
      qualifiedLeads: 0,
      totalCost: 0,
      averageConfidence: 0,
      successRate: 0,
    };

    // Discovery stats
    this.totalProcessed = 0;
    this.totalCost = 0;
    this.startTime = null;
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
    const maxAttempts = 20; // Prevent infinite loops

    // Generate comprehensive search queries
    const searchQueries = this.generateSearchQueries(businessType, location);
    if (additionalQueries.length > 0) {
      searchQueries.push(...additionalQueries);
    }

    const maxResultsPerQuery = Math.ceil(
      (targetCount * 3) / searchQueries.length
    );

    console.log(
      `📋 Generated ${searchQueries.length} search queries, ${maxResultsPerQuery} results each`
    );
    console.log("");

    // Iterative discovery loop
    while (
      allQualifiedLeads.length < targetCount &&
      currentQueryIndex < searchQueries.length &&
      attemptCount < maxAttempts &&
      this.totalCost < budgetLimit
    ) {
      attemptCount++;
      const currentQuery = searchQueries[currentQueryIndex];

      console.log(`🔍 Query ${attemptCount}: "${currentQuery}"`);
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
          await this.leadDiscovery.discoverAndValidateLeads(
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
            // Owner must be qualified (owner verified email OR owner name + verified company email)
            requireOwnerQualified: requireCompleteContacts,
            minimumConfidence: minConfidenceScore,
            industry: businessType,
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
          `   📊 Total Qualified: ${allQualifiedLeads.length}/${targetCount}`
        );

        if (allQualifiedLeads.length >= targetCount) {
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
      null, // campaignId
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
      requireOwnerQualified = false,
      minimumConfidence = 70,
      industry = null,
    } = requirements;

    return leads.filter((lead) => {
      const hasName = !!(lead.name || lead.businessName);
      const hasAddress = !!(lead.address || lead.formatted_address);
      const hasPhone = !!(lead.phone || lead.companyPhone);
      const hasWebsite = !!lead.website;
      const websiteAccessible = lead.websiteValidation?.accessible === true;
      const hasEmail = !!(lead.email || lead.companyEmail);
      const hasOwnerEmail = !!lead.ownerEmail;
      const hasOwnerName = !!lead.ownerName;

      const companyEmailConfidence = parseInt(
        lead.companyEmailConfidence || lead.emailConfidence || 0
      );
      const ownerEmailConfidence = parseInt(lead.ownerEmailConfidence || 0);

      const companyEmailSource = (
        lead.companyEmailSource ||
        lead.emailSource ||
        ""
      ).toLowerCase();
      const ownerEmailSource = (lead.ownerEmailSource || "").toLowerCase();
      const isPatternSource = (src) => /pattern_generation|pattern/.test(src);
      const looksVerifiedSource = (src) =>
        /(hunter|neverbounce|apollo|zoominfo|scrapingdog|mx|dns|verify|validated)/.test(
          src
        );

      const ownerEmailVerified =
        ownerEmailConfidence >= 70 && !isPatternSource(ownerEmailSource);
      const companyEmailVerified =
        companyEmailConfidence >= 70 && !isPatternSource(companyEmailSource);

      // If NeverBounce ran and found a deliverable email, accept as verified regardless of source strings
      const hasDeliverableEmail =
        !!lead.emailValidation?.bestEmail?.isDeliverable;
      const emailVerifiedEvidence =
        hasDeliverableEmail ||
        looksVerifiedSource(companyEmailSource) ||
        looksVerifiedSource(ownerEmailSource);

      // Owner qualified if we have verified owner email OR owner name + verified company email
      const ownerQualified =
        (hasOwnerEmail && ownerEmailVerified) ||
        (hasOwnerName &&
          (lead.companyEmail || lead.email) &&
          (companyEmailVerified || emailVerifiedEvidence)) ||
        // Fallback: if owner email exists and is not pattern-generated with decent confidence
        (hasOwnerEmail &&
          !isPatternSource(ownerEmailSource) &&
          ownerEmailConfidence >= 60);

      const hasConfidence =
        (lead.finalConfidenceScore || lead.confidenceScore) >=
        minimumConfidence;

      // Log email qualification details for debugging
      if (requireEmail && this.logger) {
        this.logger.emailFilterLog(
          lead,
          hasEmail,
          hasVerifiedEmail,
          [companyEmailSource, ownerEmailSource].filter((s) => s),
          Math.max(companyEmailConfidence, ownerEmailConfidence)
        );
      }

      // Industry/category enforcement (e.g., wellness)
      let passesIndustry = true;
      if (industry) {
        const category = (
          lead.category ||
          lead.types?.join(" ") ||
          ""
        ).toLowerCase();
        const name = (lead.name || lead.businessName || "").toLowerCase();
        if (industry.toLowerCase() === "wellness") {
          const wellnessTerms = [
            "wellness",
            "spa",
            "massage",
            "acupuncture",
            "clinic",
            "chiropractic",
            "nutrition",
            "fitness",
            "yoga",
            "pilates",
            "med spa",
            "aesthetics",
            "integrative",
            "mental health",
            "therapy",
          ];
          const text = `${category} ${name}`;
          passesIndustry = wellnessTerms.some((t) => text.includes(t));
        }
      }

      const meetsCriteria =
        hasName &&
        hasAddress &&
        (!requirePhone || hasPhone) &&
        (!requireWebsite || (hasWebsite && websiteAccessible)) &&
        (!requireEmail || hasEmail) &&
        (!requireOwnerQualified || ownerQualified) &&
        hasConfidence &&
        passesIndustry;

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
    const baseQueries = [
      `${industry} in ${location}`,
      `${industry} ${location}`,
      `${industry} businesses ${location}`,
      `${industry} services ${location}`,
      `${industry} companies ${location}`,
    ];

    // Add industry-specific variations
    const industryVariations = this.getIndustryVariations(industry);
    const locationVariations = this.getLocationVariations(location);

    const expandedQueries = [];
    baseQueries.forEach((base) => expandedQueries.push(base));

    // Add industry variations
    industryVariations.forEach((variation) => {
      expandedQueries.push(`${variation} in ${location}`);
      expandedQueries.push(`${variation} ${location}`);
    });

    // Add location variations
    locationVariations.forEach((locVariation) => {
      expandedQueries.push(`${industry} in ${locVariation}`);
    });

    return expandedQueries.slice(0, 15); // Limit to top 15 queries
  }

  /**
   * Get industry-specific variations
   */
  getIndustryVariations(industry) {
    const variationMap = {
      wellness: [
        "wellness center",
        "health center",
        "holistic health",
        "wellness clinic",
      ],
      restaurant: ["dining", "food", "cuisine", "eatery"],
      legal: ["law firm", "attorney", "legal services", "lawyer"],
      retail: ["store", "shop", "boutique", "retailer"],
    };

    return variationMap[industry.toLowerCase()] || [];
  }

  /**
   * Get location-specific variations
   */
  getLocationVariations(location) {
    if (location.includes(",")) {
      const parts = location.split(",");
      const city = parts[0].trim();
      const state = parts[1]?.trim();

      const variations = [city];
      if (state) {
        variations.push(`${city}, ${state}`);
      }

      // Add metro area variations for major cities
      const metroAreas = {
        "San Diego": ["San Diego County", "North County San Diego"],
        "Los Angeles": ["LA", "Greater Los Angeles"],
        "San Francisco": ["Bay Area", "SF"],
      };

      if (metroAreas[city]) {
        variations.push(...metroAreas[city]);
      }

      return variations;
    }

    return [location];
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

    // Cap exported leads at the target (max 5 by requirement)
    const exportCap = Math.min(targetLeads, 5);
    const cappedLeads = qualifiedLeads.slice(0, exportCap);

    // Update session stats
    this.sessionStats.qualifiedLeadsFound = cappedLeads.length;
    this.sessionStats.averageConfidence =
      cappedLeads.length > 0
        ? cappedLeads.reduce(
            (sum, lead) =>
              sum + (lead.finalConfidenceScore || lead.confidenceScore),
            0
          ) / cappedLeads.length
        : 0;
    this.sessionStats.costPerLead =
      cappedLeads.length > 0 ? this.totalCost / cappedLeads.length : 0;
    this.sessionStats.successRate =
      this.totalProcessed > 0
        ? (cappedLeads.length / this.totalProcessed) * 100
        : 0;

    // Quality metrics
    const qualityMetrics = {
      allHaveEmail: cappedLeads.every(
        (lead) => !!(lead.email || lead.companyEmail)
      ),
      allHavePhone: cappedLeads.every(
        (lead) => !!(lead.phone || lead.companyPhone)
      ),
      allHaveWebsite: cappedLeads.every((lead) => !!lead.website),
      avgConfidence: this.sessionStats.averageConfidence,
      targetMet: qualifiedLeads.length >= targetLeads,
    };

    // Display results
    console.log("=".repeat(70));
    console.log("📊 ENHANCED DISCOVERY RESULTS");
    console.log("=".repeat(70));
    console.log(`🎯 Target: ${targetLeads} | Achieved: ${cappedLeads.length}`);
    console.log(
      `⏱️  Processing Time: ${(processingTime / 1000).toFixed(1)} seconds`
    );
    console.log(
      `💰 Total Cost: $${this.totalCost.toFixed(
        3
      )} (${this.sessionStats.costPerLead.toFixed(3)}/lead)`
    );
    console.log(
      `📈 Success Rate: ${this.sessionStats.successRate.toFixed(1)}% (${
        cappedLeads.length
      }/${this.totalProcessed})`
    );
    console.log("");

    // Quality assessment
    console.log("🎯 QUALITY METRICS:");
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
      console.log("-".repeat(70));

      cappedLeads.forEach((lead, index) => {
        const email = lead.email || lead.companyEmail || "N/A";
        const phone = lead.phone || lead.companyPhone || "N/A";
        const confidence = (
          lead.finalConfidenceScore ||
          lead.confidenceScore ||
          0
        ).toFixed(1);

        console.log(`${index + 1}. ${lead.name || lead.businessName}`);
        console.log(`   📧 ${email}`);
        console.log(`   📞 ${phone}`);
        console.log(`   🌐 ${lead.website || "N/A"}`);
        console.log(`   📊 ${confidence}% confidence`);
        console.log("");
      });
    }

    return {
      success: cappedLeads.length > 0,
      totalFound: qualifiedLeads.length,
      exported: cappedLeads.length,
      target: targetLeads,
      targetMet: qualifiedLeads.length >= targetLeads,
      leads: cappedLeads,
      processingTime,
      totalCost: this.totalCost,
      sessionStats: this.sessionStats,
      qualityMetrics,
      costPerLead: this.sessionStats.costPerLead,
    };
  }

  /**
   * Quick discovery method for testing and validation
   */
  async quickDiscovery(industry, location, targetLeads = 3) {
    const searchConfig = {
      businessType: industry,
      location: location,
      targetCount: targetLeads,
      budgetLimit: 5.0,
      requireCompleteContacts: true,
      minConfidenceScore: 70,
    };

    return await this.discoverQualifiedLeads(searchConfig);
  }
}

module.exports = EnhancedDiscoveryEngine;
