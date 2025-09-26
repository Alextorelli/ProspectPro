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
const FoursquareClient = require("../api-clients/api-foursquare-places-client");
const EnhancedLeadDiscovery = require("./core-lead-discovery-engine");
const CampaignCSVExporter = require("./export-campaign-csv-system");
const logger = require("../utils/logger");

class EnhancedDiscoveryEngine {
  constructor(apiKeys = {}) {
    this.leadDiscovery = new EnhancedLeadDiscovery(apiKeys);
    this.googleClient = new GooglePlacesClient(apiKeys.googlePlaces);
    this.foursquareClient = new FoursquareClient(apiKeys.foursquare);
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

    // Multi-source discovery tracking
    this.sourceStats = {
      foursquare: { searches: 0, businesses: 0, cost: 0 },
      google: { searches: 0, businesses: 0, cost: 0 },
    };

    // CACHE RESET: Clear all cached data for fresh discoveries
    this.discoveryCache = new Map(); // Fresh cache per session
    this.lastCacheReset = Date.now();

    console.log(
      "🔄 Discovery caches cleared - ensuring fresh business discoveries"
    );
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

    console.log(`🚀 Enhanced Discovery Engine v2.0 - Multi-Source Starting`);
    console.log(
      `🎯 Target: ${targetCount} qualified leads with complete contact info`
    );
    console.log(
      `� Budget: $${budgetLimit} | Confidence: ${minConfidenceScore}%`
    );
    console.log("=".repeat(70));

    this.startTime = Date.now();
    let allQualifiedLeads = [];
    let currentQueryIndex = 0;
    let attemptCount = 0;
    const maxAttempts = 20;

    // Generate comprehensive search queries
    const searchQueries = this.generateSearchQueries(businessType, location);
    if (additionalQueries.length > 0) {
      searchQueries.push(...additionalQueries);
    }

    const maxResultsPerQuery = Math.ceil(
      (targetCount * 2.5) / searchQueries.length
    );

    console.log(
      `📋 Multi-source strategy: ${searchQueries.length} queries, ${maxResultsPerQuery} results each`
    );
    console.log("");

    // Enhanced multi-source discovery loop
    while (
      allQualifiedLeads.length < targetCount &&
      currentQueryIndex < searchQueries.length &&
      attemptCount < maxAttempts &&
      this.totalCost < budgetLimit
    ) {
      attemptCount++;
      const currentQuery = searchQueries[currentQueryIndex];

      console.log(`🔍 Multi-Source Query ${attemptCount}: "${currentQuery}"`);
      console.log(
        `   💰 Budget Used: $${this.totalCost.toFixed(3)}/$${budgetLimit}`
      );

      try {
        // ESSENTIAL DUAL-SOURCE DISCOVERY: Both APIs required for comprehensive coverage
        console.log(
          `   📍 Foursquare search: "${currentQuery}" near ${location}`
        );
        const foursquareResults = await this.discoverViaFoursquare(
          currentQuery,
          location,
          maxResultsPerQuery
        );

        console.log(
          `   🔍 Google Places search: "${currentQuery}" near ${location}`
        );
        const googleResults = await this.discoverViaGooglePlaces(
          currentQuery,
          location,
          maxResultsPerQuery
        );

        // CRITICAL: Ensure both APIs contribute to discovery diversity
        if (foursquareResults.length === 0 && googleResults.length === 0) {
          console.log(
            `   ⚠️ No results from either API for query: ${currentQuery}`
          );
          currentQueryIndex++;
          attemptCount++;
          continue;
        }

        // Phase 3: Merge and deduplicate results ensuring maximum diversity
        const allDiscoveredBusinesses = this.mergeAndDeduplicateResults(
          foursquareResults,
          googleResults
        );

        console.log(
          `   📊 Discovery Results: ${foursquareResults.length} Foursquare + ${googleResults.length} Google = ${allDiscoveredBusinesses.length} unique`
        );

        if (allDiscoveredBusinesses.length === 0) {
          console.log(
            `   ⚠️ No unique businesses after deduplication for: ${currentQuery}`
          );
          currentQueryIndex++;
          attemptCount++;
          continue;
        }

        // Phase 4: Enhanced processing with pre-validated data
        const remainingBudget = budgetLimit - this.totalCost;
        const discoveryOptions = {
          budgetLimit: Math.min(2.0, remainingBudget),
          qualityThreshold: minConfidenceScore,
          maxResults: allDiscoveredBusinesses.length,
          prioritizeLocalBusinesses: true,
          enablePropertyIntelligence: true,
          enableRegistryValidation: true,
          enableRealTimeFeedback: true,
          minimumPreValidationScore: minConfidenceScore - 10,
          // Pass cached data to avoid redundant API calls
          preEnrichedData: true,
        };

        const enhancedResults =
          await this.leadDiscovery.discoverAndValidateLeads(
            allDiscoveredBusinesses,
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
        console.log(
          `   💡 Cost Savings: $${this.calculateCostSavings().toFixed(
            3
          )} from multi-source approach`
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
        console.error(`   ❌ Multi-source query failed: ${error.message}`);
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

      const hasVerifiedEmail =
        emailVerifiedEvidence || companyEmailVerified || ownerEmailVerified;

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
    industryVariations.forEach((variation) => {
      baseQueries.push(`${variation} in ${location}`);
      baseQueries.push(`${variation} near ${location}`);
    });

    // Add location-specific variations for geographic diversity
    const locationVariations = this.getLocationVariations(location);
    locationVariations.forEach((locVar) => {
      baseQueries.push(`${industry} in ${locVar}`);
      baseQueries.push(`${industry} near ${locVar}`);
      // Add industry variations to location variations
      industryVariations.slice(0, 2).forEach((indVar) => {
        baseQueries.push(`${indVar} in ${locVar}`);
      });
    });

    // ENHANCED: Add neighborhood and area-specific searches
    const neighborhoods = this.getNeighborhoodVariations(location);
    neighborhoods.forEach((neighborhood) => {
      baseQueries.push(`${industry} ${neighborhood}`);
      baseQueries.push(`${industry} near ${neighborhood}`);
    });

    console.log(
      `📋 Generated ${baseQueries.length} diverse search queries for maximum coverage`
    );
    return baseQueries;
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
    const variations = [];

    if (location.includes(",")) {
      const parts = location.split(",");
      const city = parts[0].trim();
      const state = parts[1]?.trim();

      variations.push(location, city);
      if (state) {
        variations.push(`${city}, ${state}`);
        variations.push(`${city} ${state}`);
        variations.push(state);
      }

      // ENHANCED: Add comprehensive metro area variations for major cities
      const metroAreas = {
        "San Diego": [
          "San Diego County",
          "North County San Diego",
          "East County San Diego",
          "South Bay San Diego",
        ],
        "Los Angeles": [
          "LA",
          "Greater Los Angeles",
          "LA Metro",
          "Orange County",
          "Inland Empire",
        ],
        "San Francisco": [
          "Bay Area",
          "SF",
          "Silicon Valley",
          "Peninsula",
          "East Bay",
        ],
        "New York": [
          "NYC",
          "Manhattan",
          "Brooklyn",
          "Queens",
          "Bronx",
          "Staten Island",
          "Tri-State Area",
        ],
        Chicago: [
          "Chicagoland",
          "Cook County",
          "Greater Chicago",
          "North Shore",
        ],
        Houston: [
          "Greater Houston",
          "Harris County",
          "The Woodlands",
          "Sugar Land",
        ],
        Phoenix: ["Phoenix Metro", "Maricopa County", "Scottsdale", "Tempe"],
        Philadelphia: [
          "Philly",
          "Delaware Valley",
          "Main Line",
          "South Jersey",
        ],
        Atlanta: [
          "Metro Atlanta",
          "Fulton County",
          "Gwinnett County",
          "North Atlanta",
        ],
        Miami: [
          "Miami-Dade",
          "South Florida",
          "Broward County",
          "Palm Beach County",
        ],
      };

      if (metroAreas[city]) {
        variations.push(...metroAreas[city]);
      }
    } else {
      variations.push(location);
    }

    return variations;
  }

  /**
   * Get neighborhood and area variations for deeper geographic coverage
   */
  getNeighborhoodVariations(location) {
    const neighborhoods = [];
    const cityLower = location.toLowerCase();

    // San Diego neighborhoods and suburbs
    if (cityLower.includes("san diego")) {
      neighborhoods.push(
        "Downtown San Diego",
        "La Jolla",
        "Pacific Beach",
        "Mission Valley",
        "Hillcrest",
        "North Park",
        "South Park",
        "Chula Vista",
        "Escondido",
        "Carlsbad",
        "Encinitas",
        "Del Mar",
        "Poway",
        "Santee",
        "El Cajon"
      );
    }

    // Los Angeles neighborhoods and suburbs
    if (cityLower.includes("los angeles") || cityLower.includes(" la ")) {
      neighborhoods.push(
        "Hollywood",
        "Beverly Hills",
        "Santa Monica",
        "Venice",
        "Pasadena",
        "Glendale",
        "Burbank",
        "Long Beach",
        "Torrance",
        "El Segundo",
        "Culver City"
      );
    }

    // New York neighborhoods and boroughs
    if (cityLower.includes("new york") || cityLower.includes("nyc")) {
      neighborhoods.push(
        "Midtown Manhattan",
        "Lower East Side",
        "Upper West Side",
        "SoHo",
        "Brooklyn Heights",
        "Williamsburg",
        "Astoria",
        "Flushing",
        "Battery Park"
      );
    }

    return neighborhoods;
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

  /**
   * Discover businesses via Foursquare Places API
   * @param {string} query - Search query
   * @param {string} location - Location string
   * @param {number} maxResults - Maximum results to return
   * @returns {Array} Array of normalized business objects
   */
  async discoverViaFoursquare(query, location, maxResults = 20) {
    if (!this.foursquareClient) {
      console.warn(
        `⚠️ Foursquare Service Key not configured, returning mock response`
      );
      // Return empty results instead of mock data for fresh discoveries
      return [];
    }

    try {
      this.sourceStats.foursquare.searches++;

      const results = await this.foursquareClient.searchPlaces(query, {
        near: location,
        limit: maxResults,
        categories: this.mapBusinessTypeToFoursquareCategory(query),
      });

      this.sourceStats.foursquare.cost += results.apiCost || 0;

      if (!results.found || !results.places.length) {
        console.log(`   ⚠️ No Foursquare results for "${query}"`);
        return [];
      }

      const normalizedBusinesses = results.places.map((place) => ({
        // Core business info
        name: place.name,
        businessName: place.name,
        address: place.formattedAddress || place.address,
        formatted_address: place.formattedAddress,
        city: place.city,
        state: place.region,
        zipCode: place.postalCode,
        country: place.country,

        // Contact info
        phone: place.telephone,
        website: place.website,

        // Location data
        geometry: {
          location: {
            lat: place.latitude,
            lng: place.longitude,
          },
        },

        // Foursquare-specific data
        fsqId: place.fsqId,
        categories: place.categories,
        primaryCategory: place.primaryCategory,
        businessType: place.businessType,

        // Metadata
        source: "foursquare",
        foursquareData: place, // Cache for later validation
        preValidationScore: this.calculateFoursquarePreScore(place),
        sourceConfidenceBoost: results.confidenceBoost || 0,

        // For Google Places compatibility
        place_id: `foursquare_${place.fsqId}`,
        types: place.categories?.map((cat) => cat.name.toLowerCase()) || [],
        rating: null, // Foursquare doesn't provide ratings in free tier
        user_ratings_total: null,
      }));

      this.sourceStats.foursquare.businesses += normalizedBusinesses.length;

      console.log(
        `   ✅ Foursquare found ${normalizedBusinesses.length} businesses`
      );
      return normalizedBusinesses;
    } catch (error) {
      console.warn(`   ⚠️ Foursquare search failed: ${error.message}`);
      this.sourceStats.foursquare.searches++;
      return [];
    }
  }

  /**
   * Discover businesses via Google Places API
   * @param {string} query - Search query
   * @param {string} location - Location string
   * @param {number} maxResults - Maximum results to return
   * @returns {Array} Array of business objects
   */
  async discoverViaGooglePlaces(query, location, maxResults = 20) {
    if (!this.googleClient) {
      console.log(`   ⚠️ Google Places client not configured, skipping`);
      return [];
    }

    try {
      console.log(`   🔍 Google Places search: "${query}" near ${location}`);

      const searchResults = await this.googleClient.textSearch({
        query: query,
        location: location,
        type: this.getSearchType(query),
      });

      this.sourceStats.google.searches++;
      this.sourceStats.google.cost += 0.032; // Approximate Google Places cost

      if (!searchResults || searchResults.length === 0) {
        console.log(`   ⚠️ No Google Places results for "${query}"`);
        return [];
      }

      // Normalize results to match Foursquare format
      const normalizedBusinesses = searchResults
        .slice(0, maxResults)
        .map((place) => ({
          ...place,
          source: "google",
          preValidationScore: this.calculatePreValidationScore(place),
          sourceConfidenceBoost: 5, // Standard Google boost
        }));

      this.sourceStats.google.businesses += normalizedBusinesses.length;

      console.log(
        `   ✅ Google Places found ${normalizedBusinesses.length} businesses`
      );
      return normalizedBusinesses;
    } catch (error) {
      console.warn(`   ⚠️ Google Places search failed: ${error.message}`);
      this.sourceStats.google.searches++;
      return [];
    }
  }

  /**
   * Merge results from multiple sources and remove duplicates
   * @param {Array} foursquareResults - Results from Foursquare
   * @param {Array} googleResults - Results from Google Places
   * @returns {Array} Merged and deduplicated results
   */
  mergeAndDeduplicateResults(foursquareResults, googleResults) {
    const allResults = [...foursquareResults];

    // Add Google results that don't match existing Foursquare results
    googleResults.forEach((googleBusiness) => {
      const isDuplicate = foursquareResults.some((foursquareBusiness) =>
        this.businessesMatch(googleBusiness, foursquareBusiness)
      );

      if (!isDuplicate) {
        allResults.push(googleBusiness);
      } else {
        // If it's a duplicate, enhance the Foursquare result with Google data
        const matchingFoursquare = foursquareResults.find((fb) =>
          this.businessesMatch(googleBusiness, fb)
        );
        if (matchingFoursquare) {
          this.enhanceBusinessWithCrossData(matchingFoursquare, googleBusiness);
        }
      }
    });

    return allResults;
  }

  /**
   * Check if two businesses are the same
   * @param {Object} business1 - First business
   * @param {Object} business2 - Second business
   * @returns {boolean} True if they match
   */
  businessesMatch(business1, business2) {
    const name1 = (business1.name || business1.businessName || "")
      .toLowerCase()
      .trim();
    const name2 = (business2.name || business2.businessName || "")
      .toLowerCase()
      .trim();

    // Exact name match
    if (name1 === name2 && name1.length > 3) {
      return true;
    }

    // Phone number match (if both have phones)
    const phone1 = (business1.phone || "").replace(/\D/g, "");
    const phone2 = (business2.phone || "").replace(/\D/g, "");

    if (phone1 && phone2 && phone1 === phone2 && phone1.length >= 10) {
      return true;
    }

    // Address similarity with name similarity
    const addr1 = (
      business1.address ||
      business1.formatted_address ||
      ""
    ).toLowerCase();
    const addr2 = (
      business2.address ||
      business2.formatted_address ||
      ""
    ).toLowerCase();

    if (
      addr1 &&
      addr2 &&
      this.addressesSimilar(addr1, addr2) &&
      this.namesSimilar(name1, name2)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Enhance a business with cross-platform data
   * @param {Object} primaryBusiness - Main business to enhance
   * @param {Object} secondaryBusiness - Secondary business data
   */
  enhanceBusinessWithCrossData(primaryBusiness, secondaryBusiness) {
    // Enhance with missing contact info
    if (!primaryBusiness.phone && secondaryBusiness.phone) {
      primaryBusiness.phone = secondaryBusiness.phone;
    }
    if (!primaryBusiness.website && secondaryBusiness.website) {
      primaryBusiness.website = secondaryBusiness.website;
    }

    // Add cross-platform validation boost
    primaryBusiness.crossPlatformMatch = true;
    primaryBusiness.sourceConfidenceBoost += 10;
    primaryBusiness.preValidationScore = Math.min(
      primaryBusiness.preValidationScore + 15,
      100
    );

    // Store secondary data for validation
    primaryBusiness.crossPlatformData = {
      source: secondaryBusiness.source,
      data: secondaryBusiness,
    };
  }

  /**
   * Calculate pre-validation score for Foursquare businesses
   * @param {Object} place - Foursquare place object
   * @returns {number} Score from 0-100
   */
  calculateFoursquarePreScore(place) {
    let score = 0;

    // Business name quality (25 points)
    if (place.name) {
      score += this.isGenericBusinessName(place.name) ? 10 : 25;
    }

    // Address completeness (20 points)
    if (place.formattedAddress) {
      score += place.formattedAddress.length > 20 ? 20 : 15;
    }

    // Contact information (30 points total)
    if (place.telephone) score += 15;
    if (place.website) score += 15;

    // Category verification (15 points)
    if (place.categories && place.categories.length > 0) {
      score += place.categories.length > 1 ? 15 : 10;
    }

    // Location data quality (10 points)
    if (place.latitude && place.longitude) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Map business type to Foursquare category
   * @param {string} businessType - Business type string
   * @returns {string} Foursquare category ID
   */
  mapBusinessTypeToFoursquareCategory(businessType) {
    const categoryMap = {
      wellness: "4bf58dd8d48988d177941735", // Health & Medical
      restaurant: "4d4b7105d754a06374d81259", // Food & Dining
      retail: "4d4b7105d754a06378d81259", // Shop & Service
      legal: "4d4b7105d754a06379d81259", // Professional Services
      healthcare: "4d4b7105d754a0637cd81259", // Health & Medical
      fitness: "4bf58dd8d48988d176941735", // Gym
      beauty: "4bf58dd8d48988d110941735", // Salon
      automotive: "4d4b7105d754a06378d81259", // Automotive
    };

    const type = businessType.toLowerCase();

    // Check for exact matches first
    for (const [key, categoryId] of Object.entries(categoryMap)) {
      if (type.includes(key)) {
        return categoryId;
      }
    }

    // Default to professional services
    return "4d4b7105d754a06379d81259";
  }

  /**
   * Calculate cost savings from multi-source approach
   * @returns {number} Estimated savings in dollars
   */
  calculateCostSavings() {
    const foursquareCount = this.sourceStats.foursquare.businesses;
    const googleCount = this.sourceStats.google.businesses;

    // If we only used Google, estimate the cost
    const googleOnlyCost = (foursquareCount + googleCount) * 0.032;
    const actualCost =
      this.sourceStats.foursquare.cost + this.sourceStats.google.cost;

    return Math.max(0, googleOnlyCost - actualCost);
  }

  /**
   * Helper method to check if names are similar
   * @param {string} name1 - First name
   * @param {string} name2 - Second name
   * @returns {boolean} True if similar
   */
  namesSimilar(name1, name2) {
    if (!name1 || !name2) return false;

    // Remove common business suffixes for comparison
    const cleanName1 = name1.replace(/\s+(llc|inc|corp|ltd)\.?$/i, "").trim();
    const cleanName2 = name2.replace(/\s+(llc|inc|corp|ltd)\.?$/i, "").trim();

    // Check if one name contains the other (for cases like "ABC Corp" vs "ABC Corporation")
    return cleanName1.includes(cleanName2) || cleanName2.includes(cleanName1);
  }

  /**
   * Helper method to check if addresses are similar
   * @param {string} addr1 - First address
   * @param {string} addr2 - Second address
   * @returns {boolean} True if similar
   */
  addressesSimilar(addr1, addr2) {
    if (!addr1 || !addr2) return false;

    // Extract street numbers and names for comparison
    const streetNum1 = addr1.match(/^\d+/);
    const streetNum2 = addr2.match(/^\d+/);

    // If street numbers match, consider similar
    if (streetNum1 && streetNum2 && streetNum1[0] === streetNum2[0]) {
      return true;
    }

    // Check for substantial overlap in address text
    const words1 = addr1.split(/\s+/);
    const words2 = addr2.split(/\s+/);
    const commonWords = words1.filter(
      (word) => word.length > 3 && words2.includes(word)
    );

    return commonWords.length >= 2;
  }

  /**
   * Helper method to check if business name is generic
   * @param {string} name - Business name
   * @returns {boolean} True if generic
   */
  isGenericBusinessName(name) {
    const genericPatterns = [
      /business\s+(llc|inc|corp)/i,
      /company\s+(llc|inc|corp)/i,
      /^(business|company)$/i,
      /test\s*business/i,
      /^(store|shop|office)$/i,
    ];
    return genericPatterns.some((pattern) => pattern.test(name));
  }

  /**
   * Calculate pre-validation score to filter businesses early
   * @param {Object} business - Business data object
   * @returns {number} Pre-validation score (0-100)
   */
  calculatePreValidationScore(business) {
    let score = 0;

    // Business name quality (25 points max)
    if (business.name) {
      score += !this.isGenericBusinessName(business.name) ? 25 : 15;
    }

    // Address completeness (20 points max)
    if (business.formatted_address || business.address) {
      const address = business.formatted_address || business.address;
      score += address.split(",").length >= 3 ? 20 : 15; // Simple completeness check
    }

    // Phone number presence (20 points max)
    if (business.formatted_phone_number || business.phone) {
      const phone = business.formatted_phone_number || business.phone;
      score += phone && phone.match(/\d{10,}/) ? 20 : 10;
    }

    // Google rating and review indicators (15 points max)
    if (business.rating >= 4.0 && business.user_ratings_total >= 10) {
      score += 15;
    } else if (business.rating >= 3.5) {
      score += 10;
    }

    // Website presence (20 points max)
    if (business.website && business.website !== "http://example.com") {
      score += 20;
    } else if (business.website) {
      score += 10;
    }

    return Math.min(score, 100);
  }
}

module.exports = EnhancedDiscoveryEngine;
