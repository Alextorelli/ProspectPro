/**
 * Enhanced API Integration Orchestrator
 * Coordinates ScrapingDog, Hunter.io, and Supabase for comprehensive lead discovery
 */

const EnhancedScrapingDogClient = require("./api-clients/enhanced-scrapingdog-client");
const EnhancedHunterClient = require("./api-clients/enhanced-hunter-client");
const { createSupabaseClient } = require("../config/supabase");

class EnhancedLeadDiscoveryOrchestrator {
  constructor(config = {}) {
    // Initialize enhanced API clients
    this.scrapingDog = new EnhancedScrapingDogClient(
      process.env.SCRAPINGDOG_API_KEY,
      config.scrapingDogBudget || process.env.SCRAPINGDOG_MONTHLY_BUDGET || 200
    );

    this.hunter = new EnhancedHunterClient(
      process.env.HUNTER_IO_API_KEY,
      config.hunterBudget || process.env.HUNTER_MONTHLY_BUDGET || 500
    );

    this.supabase = createSupabaseClient();

    // Configuration
    this.config = {
      minConfidenceScore:
        config.minConfidenceScore || process.env.MIN_CONFIDENCE_SCORE || 70,
      maxLeadsPerCampaign:
        config.maxLeadsPerCampaign || process.env.MAX_LEADS_PER_CAMPAIGN || 100,
      enableRealTimeUpdates: config.enableRealTimeUpdates !== false,
      batchSize: config.batchSize || 10,
      ...config,
    };

    // Tracking
    this.campaignStats = {
      leads_discovered: 0,
      leads_qualified: 0,
      total_cost: 0,
      api_calls: {
        scrapingdog: 0,
        hunter: 0,
        supabase: 0,
      },
    };
  }

  /**
   * Complete lead discovery workflow
   * @param {Object} searchParams - Search parameters
   * @param {string} userId - User ID for campaign
   * @returns {Promise<Object>} Campaign results
   */
  async runEnhancedLeadDiscovery(searchParams, userId) {
    console.log("🚀 Starting enhanced lead discovery workflow...");

    const startTime = Date.now();

    try {
      // Step 1: Create campaign
      const campaign = await this.createCampaign(searchParams, userId);
      console.log(`✅ Campaign created: ${campaign.id}`);

      // Step 2: Discover businesses using enhanced ScrapingDog
      console.log("📍 Phase 1: Business Discovery...");
      const businesses = await this.discoverBusinesses(searchParams);
      console.log(`✅ Discovered ${businesses.length} businesses`);

      // Step 3: Enrich with website data and emails
      console.log("🔍 Phase 2: Business Enrichment...");
      const enrichedBusinesses = await this.enrichBusinesses(businesses);
      console.log(`✅ Enriched ${enrichedBusinesses.length} businesses`);

      // Step 4: Email discovery and verification
      console.log("📧 Phase 3: Email Discovery...");
      const businessesWithEmails = await this.discoverEmails(
        enrichedBusinesses
      );
      console.log(
        `✅ Found emails for ${
          businessesWithEmails.filter((b) => b.emails?.length > 0).length
        } businesses`
      );

      // Step 5: Quality scoring and validation
      console.log("⭐ Phase 4: Quality Validation...");
      const qualifiedLeads = await this.validateAndScore(businessesWithEmails);
      console.log(`✅ Qualified ${qualifiedLeads.length} high-quality leads`);

      // Step 6: Save to enhanced database
      console.log("💾 Phase 5: Database Storage...");
      const savedLeads = await this.saveEnhancedLeads(
        qualifiedLeads,
        campaign.id
      );
      console.log(`✅ Saved ${savedLeads.length} leads to database`);

      // Step 7: Generate comprehensive results
      const results = await this.generateCampaignResults(
        campaign.id,
        startTime
      );

      console.log("🎉 Enhanced lead discovery complete!");
      return results;
    } catch (error) {
      console.error("❌ Lead discovery workflow failed:", error);
      throw error;
    }
  }

  /**
   * Create campaign with enhanced settings
   */
  async createCampaign(searchParams, userId) {
    const campaignData = {
      name: `${searchParams.businessType} in ${searchParams.location}`,
      search_parameters: searchParams,
      budget_limit: searchParams.budgetLimit || 50,
      lead_limit: searchParams.leadLimit || this.config.maxLeadsPerCampaign,
      quality_threshold:
        searchParams.qualityThreshold || this.config.minConfidenceScore,
    };

    return await this.supabase.createCampaign(campaignData, userId);
  }

  /**
   * Discover businesses using enhanced ScrapingDog multi-radius search
   */
  async discoverBusinesses(searchParams) {
    const query = `${searchParams.businessType} in ${searchParams.location}`;
    const coordinates = await this.geocodeLocation(searchParams.location);
    const radiuses = searchParams.radiuses || [2, 5, 10]; // km

    // Track API usage
    const startTime = Date.now();

    try {
      const businesses = await this.scrapingDog.searchBusinessesMultiRadius(
        query,
        `${coordinates.lat},${coordinates.lng}`,
        radiuses
      );

      // Log API usage
      await this.logApiUsage({
        api_service: "scrapingdog",
        endpoint: "multi_radius_search",
        processing_time_ms: Date.now() - startTime,
        credits_used: businesses.length * 5, // 5 credits per Google Maps search
        response_status: 200,
      });

      this.campaignStats.api_calls.scrapingdog += radiuses.length;
      this.campaignStats.leads_discovered += businesses.length;

      return businesses;
    } catch (error) {
      await this.logApiUsage({
        api_service: "scrapingdog",
        endpoint: "multi_radius_search",
        processing_time_ms: Date.now() - startTime,
        response_status: error.status || 500,
      });
      throw error;
    }
  }

  /**
   * Enrich businesses with website data and sentiment analysis
   */
  async enrichBusinesses(businesses) {
    console.log(`🔍 Enriching ${businesses.length} businesses...`);

    // Filter businesses worth enriching
    const worthEnriching = businesses.filter(
      (business) =>
        business.confidence_score >= 50 && // Basic quality threshold
        business.website &&
        this.scrapingDog.isValidWebsite(business.website)
    );

    console.log(
      `📊 Selected ${worthEnriching.length} businesses for enrichment`
    );

    if (worthEnriching.length === 0) {
      return businesses;
    }

    const startTime = Date.now();

    try {
      const enriched = await this.scrapingDog.enrichBusinessData(
        worthEnriching
      );

      // Track enrichment costs
      const enrichmentCost = enriched.length * 0.001; // $0.001 per website scrape
      this.campaignStats.total_cost += enrichmentCost;

      // Log API usage
      await this.logApiUsage({
        api_service: "scrapingdog",
        endpoint: "website_enrichment",
        processing_time_ms: Date.now() - startTime,
        credits_used: enriched.length,
        request_cost: enrichmentCost,
        response_status: 200,
      });

      // Merge enriched data back into full business list
      const enrichedMap = new Map(
        enriched.map((b) => [b.data_id || b.title, b])
      );

      return businesses.map((business) => {
        const enrichedVersion = enrichedMap.get(
          business.data_id || business.title
        );
        return enrichedVersion || business;
      });
    } catch (error) {
      console.error("❌ Business enrichment failed:", error);
      return businesses; // Return original data if enrichment fails
    }
  }

  /**
   * Discover emails for all businesses using Hunter.io
   */
  async discoverEmails(businesses) {
    console.log(`📧 Discovering emails for ${businesses.length} businesses...`);

    // Filter businesses with valid domains
    const businessesWithDomains = businesses.filter(
      (business) =>
        business.website &&
        !this.hunter.isInvalidDomain(
          this.hunter.extractDomain(business.website)
        )
    );

    console.log(
      `🎯 Selected ${businessesWithDomains.length} businesses for email discovery`
    );

    if (businessesWithDomains.length === 0) {
      return businesses;
    }

    // Process in batches to manage costs
    const batchSize = this.config.batchSize;
    const emailResults = [];

    for (let i = 0; i < businessesWithDomains.length; i += batchSize) {
      const batch = businessesWithDomains.slice(i, i + batchSize);
      console.log(
        `📦 Processing email batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          businessesWithDomains.length / batchSize
        )}`
      );

      try {
        const batchResults = await this.hunter.processBusinessBatch(batch);
        emailResults.push(...batchResults);

        // Track costs
        const batchCost = batchResults.reduce(
          (sum, result) => sum + (result.cost || 0),
          0
        );
        this.campaignStats.total_cost += batchCost;
        this.campaignStats.api_calls.hunter += batch.length;
      } catch (error) {
        console.error(
          `❌ Email batch ${Math.floor(i / batchSize) + 1} failed:`,
          error
        );
        // Continue with remaining batches
      }

      // Check budget limits
      if (this.campaignStats.total_cost > 50) {
        // $50 safety limit
        console.log("⚠️ Budget limit reached, stopping email discovery");
        break;
      }
    }

    // Merge email results back into businesses
    const emailMap = new Map(emailResults.map((r) => [r.business_name, r]));

    return businesses.map((business) => {
      const emailResult = emailMap.get(
        business.business_name || business.title
      );
      if (emailResult && emailResult.emails.length > 0) {
        return {
          ...business,
          emails: emailResult.emails,
          email_discovery_cost: emailResult.cost,
          hunter_used: emailResult.hunter_used,
        };
      }
      return business;
    });
  }

  /**
   * Validate and score all leads for quality
   */
  async validateAndScore(businesses) {
    console.log(`⭐ Validating and scoring ${businesses.length} businesses...`);

    const scoredBusinesses = businesses.map((business) => {
      // Calculate comprehensive confidence score
      const confidence = this.calculateEnhancedConfidenceScore(business);

      return {
        ...business,
        confidence_score: confidence,
        is_qualified: confidence >= this.config.minConfidenceScore,
        enrichment_cost:
          (business.discovery_cost || 0) + (business.email_discovery_cost || 0),
      };
    });

    // Filter qualified leads
    const qualifiedLeads = scoredBusinesses.filter(
      (business) => business.is_qualified
    );

    this.campaignStats.leads_qualified = qualifiedLeads.length;

    console.log(
      `✅ ${qualifiedLeads.length}/${businesses.length} businesses qualify (${this.config.minConfidenceScore}%+ confidence)`
    );

    return qualifiedLeads.slice(0, this.config.maxLeadsPerCampaign);
  }

  /**
   * Save leads to enhanced Supabase database
   */
  async saveEnhancedLeads(leads, campaignId) {
    console.log(`💾 Saving ${leads.length} leads to enhanced database...`);

    const savedLeads = [];

    for (const lead of leads) {
      try {
        // Map business data to lead format
        const leadData = this.mapBusinessToLead(lead);

        // Save to database
        const savedLead = await this.supabase.createEnhancedLead(
          leadData,
          campaignId
        );
        savedLeads.push(savedLead);

        this.campaignStats.api_calls.supabase++;
      } catch (error) {
        console.error(`❌ Failed to save lead ${lead.business_name}:`, error);
        // Continue saving other leads
      }
    }

    console.log(
      `✅ Successfully saved ${savedLeads.length}/${leads.length} leads`
    );
    return savedLeads;
  }

  /**
   * Generate comprehensive campaign results
   */
  async generateCampaignResults(campaignId, startTime) {
    const processingTime = Date.now() - startTime;

    // Get analytics from database
    const analytics = await this.supabase.getCampaignAnalytics(campaignId);

    return {
      campaign_id: campaignId,
      processing_time_ms: processingTime,
      stats: {
        ...this.campaignStats,
        processing_time_seconds: Math.round(processingTime / 1000),
        cost_per_lead:
          this.campaignStats.leads_qualified > 0
            ? (
                this.campaignStats.total_cost /
                this.campaignStats.leads_qualified
              ).toFixed(4)
            : 0,
        success_rate:
          this.campaignStats.leads_discovered > 0
            ? Math.round(
                (this.campaignStats.leads_qualified /
                  this.campaignStats.leads_discovered) *
                  100
              )
            : 0,
      },
      analytics: analytics,
      api_usage: {
        scrapingdog: this.scrapingDog.getCostSummary(),
        hunter: this.hunter.getUsageStats(),
        total_api_calls: Object.values(this.campaignStats.api_calls).reduce(
          (a, b) => a + b,
          0
        ),
      },
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Utility functions
   */

  calculateEnhancedConfidenceScore(business) {
    let score = 0;

    // Basic business data (40 points)
    if (business.business_name || business.title) score += 10;
    if (business.phone) score += 10;
    if (business.address) score += 10;
    if (business.website) score += 10;

    // Contact discovery (30 points)
    if (business.emails && business.emails.length > 0) {
      score += 15;
      // Bonus for verified emails
      const verifiedEmails = business.emails.filter(
        (e) => e.verification_status === "deliverable"
      );
      if (verifiedEmails.length > 0) score += 15;
    }

    // Social proof and reviews (20 points)
    if (business.rating >= 4.0) score += 10;
    if (business.reviews_count >= 10) score += 5;
    if (business.review_sentiment?.positive_percentage >= 70) score += 5;

    // Additional intelligence (10 points)
    if (business.social_links && Object.keys(business.social_links).length > 0)
      score += 5;
    if (business.website_content && business.website_content.length > 1000)
      score += 5;

    return Math.min(100, score);
  }

  mapBusinessToLead(business) {
    return {
      business_name: business.business_name || business.title,
      address: business.address,
      phone: business.phone,
      website: business.website,
      business_type: business.types || business.business_type,
      owner_name: business.owner_name,
      emails: business.emails,
      social_links: business.social_links,
      rating: business.rating,
      review_count: business.reviews_count || business.review_count,
      review_sentiment: business.review_sentiment,
      website_content: business.website_content ? "enriched" : null,
      discovery_cost: business.discovery_cost || 0,
      enrichment_cost: business.enrichment_cost || 0,
      coordinates: business.coordinates,
      source: business.source || "scrapingdog_enhanced",
    };
  }

  async geocodeLocation(location) {
    // Simple geocoding - in production, use Google Geocoding API
    // For now, return approximate coordinates for major cities
    const cityCoords = {
      austin: { lat: 30.2672, lng: -97.7431 },
      houston: { lat: 29.7604, lng: -95.3698 },
      dallas: { lat: 32.7767, lng: -96.797 },
      "san antonio": { lat: 29.4241, lng: -98.4936 },
      "new york": { lat: 40.7128, lng: -74.006 },
      "los angeles": { lat: 34.0522, lng: -118.2437 },
      chicago: { lat: 41.8781, lng: -87.6298 },
    };

    const normalized = location.toLowerCase();
    return cityCoords[normalized] || { lat: 30.2672, lng: -97.7431 }; // Default to Austin
  }

  async logApiUsage(usageData) {
    try {
      await this.supabase.logApiUsage(usageData);
    } catch (error) {
      console.error("Failed to log API usage:", error);
    }
  }

  generateRecommendations() {
    const recommendations = [];

    // Budget optimization
    if (this.campaignStats.total_cost > 25) {
      recommendations.push({
        type: "budget",
        message:
          "Consider reducing search radius or quality threshold to lower costs",
        priority: "medium",
      });
    }

    // Quality optimization
    const qualificationRate =
      this.campaignStats.leads_discovered > 0
        ? this.campaignStats.leads_qualified /
          this.campaignStats.leads_discovered
        : 0;

    if (qualificationRate < 0.3) {
      recommendations.push({
        type: "quality",
        message:
          "Low qualification rate - consider refining search terms or location",
        priority: "high",
      });
    }

    // Email discovery
    const emailCostPerLead =
      this.hunter.getUsageStats().daily_spend /
      this.campaignStats.leads_qualified;
    if (emailCostPerLead > 0.2) {
      recommendations.push({
        type: "email",
        message:
          "Email discovery costs are high - consider using pattern generation first",
        priority: "low",
      });
    }

    return recommendations;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Stop any real-time subscriptions
    if (this.supabase.realTimeChannels.size > 0) {
      this.supabase.realTimeChannels.forEach((channel, campaignId) => {
        this.supabase.stopCampaignMonitoring(campaignId);
      });
    }
  }
}

module.exports = EnhancedLeadDiscoveryOrchestrator;
