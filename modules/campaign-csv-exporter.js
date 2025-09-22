/**
 * Enhanced Campaign CSV Exporter
 *
 * Exports comprehensive campaign data with query tracking and detailed metadata
 * Supports multi-query campaigns with full analysis and testing data
 */

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");
const fs = require("fs").promises;

class CampaignCSVExporter {
  constructor() {
    this.exportsDir = path.join(__dirname, "../exports");
    this.campaignData = {
      campaignId: null,
      startTime: null,
      queries: [],
      totalLeads: [],
      metadata: {},
      analysisData: {},
    };

    this.ensureExportsDirectory();
  }

  /**
   * Initialize a new campaign session
   */
  initializeCampaign(campaignId, metadata = {}) {
    this.campaignData = {
      campaignId: campaignId || this.generateCampaignId(),
      startTime: new Date().toISOString(),
      queries: [],
      totalLeads: [],
      metadata: {
        ...metadata,
        exportVersion: "2.0",
        enhancedContactDifferentiation: true,
        createdBy: "ProspectPro Enhanced Lead Discovery",
      },
      analysisData: {
        totalProcessingTime: 0,
        totalCost: 0,
        averageConfidence: 0,
        qualificationRate: 0,
        apiUsageBreakdown: {},
        qualityMetrics: {},
      },
    };

    console.log(`🆔 Campaign initialized: ${this.campaignData.campaignId}`);
    return this.campaignData.campaignId;
  }

  /**
   * Add query results to the campaign
   */
  addQueryResults(query, location, leads, metadata = {}) {
    const queryData = {
      queryId: this.generateQueryId(),
      query,
      location,
      timestamp: new Date().toISOString(),
      leadCount: leads.length,
      metadata: metadata,
      processingTime: metadata.processingTime || 0,
      cost: metadata.totalCost || 0,
      qualificationRate: metadata.qualificationRate || 0,
      averageConfidence: metadata.averageConfidence || 0,
    };

    // Add query metadata to each lead
    const enhancedLeads = leads.map((lead) => ({
      ...lead,
      queryId: queryData.queryId,
      query: query,
      location: location,
      queryTimestamp: queryData.timestamp,
      campaignId: this.campaignData.campaignId,
    }));

    this.campaignData.queries.push(queryData);
    this.campaignData.totalLeads.push(...enhancedLeads);

    // Update campaign analysis data
    this.updateCampaignAnalysis(queryData, metadata);

    console.log(
      `📊 Added query "${query}" with ${leads.length} leads to campaign`
    );
    return queryData.queryId;
  }

  /**
   * Update campaign-level analysis data
   */
  updateCampaignAnalysis(queryData, metadata) {
    this.campaignData.analysisData.totalProcessingTime +=
      queryData.processingTime;
    this.campaignData.analysisData.totalCost += queryData.cost;

    // Calculate weighted averages
    const totalLeads = this.campaignData.totalLeads.length;
    if (totalLeads > 0) {
      this.campaignData.analysisData.averageConfidence =
        this.campaignData.totalLeads.reduce(
          (sum, lead) =>
            sum + (lead.finalConfidenceScore || lead.confidenceScore || 0),
          0
        ) / totalLeads;

      const qualifiedLeads = this.campaignData.totalLeads.filter(
        (lead) => (lead.finalConfidenceScore || lead.confidenceScore || 0) >= 75
      ).length;
      this.campaignData.analysisData.qualificationRate = Math.round(
        (qualifiedLeads / totalLeads) * 100
      );
    }

    // Update API usage breakdown
    if (metadata.apiUsage) {
      Object.keys(metadata.apiUsage).forEach((api) => {
        if (!this.campaignData.analysisData.apiUsageBreakdown[api]) {
          this.campaignData.analysisData.apiUsageBreakdown[api] = {
            requests: 0,
            cost: 0,
            successRate: 0,
          };
        }

        const apiData = this.campaignData.analysisData.apiUsageBreakdown[api];
        if (metadata.apiUsage[api].requestCount) {
          apiData.requests += metadata.apiUsage[api].requestCount;
        }
        if (metadata.apiUsage[api].totalCost) {
          apiData.cost += metadata.apiUsage[api].totalCost;
        }
      });
    }

    // Update quality metrics
    if (metadata.qualityBreakdown) {
      this.campaignData.analysisData.qualityMetrics = {
        ...this.campaignData.analysisData.qualityMetrics,
        ...metadata.qualityBreakdown,
      };
    }
  }

  /**
   * Export campaign to comprehensive CSV
   */
  async exportCampaignToCsv() {
    if (this.campaignData.totalLeads.length === 0) {
      throw new Error("No leads to export - add query results first");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `ProspectPro-Campaign-${this.campaignData.campaignId}-${timestamp}.csv`;
    const filepath = path.join(this.exportsDir, filename);

    // Enhanced CSV structure with query tracking and metadata
    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        // Campaign & Query Tracking
        { id: "campaignId", title: "Campaign ID" },
        { id: "queryId", title: "Query ID" },
        { id: "query", title: "Search Query" },
        { id: "location", title: "Search Location" },
        { id: "queryTimestamp", title: "Query Timestamp" },

        // Business Information
        { id: "name", title: "Business Name" },
        { id: "address", title: "Address" },
        { id: "category", title: "Category" },
        { id: "rating", title: "Rating" },
        { id: "reviewCount", title: "Review Count" },
        { id: "priceLevel", title: "Price Level" },

        // Company Contact Information
        { id: "companyPhone", title: "Company Phone" },
        { id: "companyPhoneSource", title: "Company Phone Source" },
        { id: "companyEmail", title: "Company Email" },
        { id: "companyEmailSource", title: "Company Email Source" },
        { id: "companyEmailConfidence", title: "Company Email Confidence" },

        // Owner Contact Information
        { id: "ownerPhone", title: "Owner Phone" },
        { id: "ownerPhoneSource", title: "Owner Phone Source" },
        { id: "ownerEmail", title: "Owner Email" },
        { id: "ownerEmailSource", title: "Owner Email Source" },
        { id: "ownerEmailConfidence", title: "Owner Email Confidence" },
        { id: "ownerName", title: "Owner Name" },
        { id: "ownerTitle", title: "Owner Title" },

        // Digital Presence
        { id: "website", title: "Website" },
        { id: "websiteSource", title: "Website Source" },
        { id: "websiteAccessible", title: "Website Accessible" },
        { id: "websiteResponseTime", title: "Website Response Time (ms)" },

        // Validation & Quality
        { id: "confidenceScore", title: "Confidence Score" },
        { id: "qualityGrade", title: "Quality Grade" },
        { id: "isQualified", title: "Is Qualified" },
        { id: "exportReady", title: "Export Ready" },

        // Registry & Verification
        { id: "registryValidated", title: "Registry Validated" },
        { id: "emailValidated", title: "Email Validated" },
        { id: "propertyIntelligence", title: "Property Intelligence" },
        { id: "foursquareMatch", title: "Foursquare Match" },

        // Data Sources & Attribution
        { id: "primarySource", title: "Primary Source" },
        { id: "dataSources", title: "All Data Sources" },
        { id: "apiCost", title: "API Cost ($)" },
        { id: "processingTime", title: "Processing Time (ms)" },

        // Enhanced API Integration Tracking
        { id: "apolloData", title: "Apollo.io Data" },
        { id: "hunterData", title: "Hunter.io Data" },
        { id: "optimizedEngineCost", title: "Optimized Engine Cost ($)" },
        { id: "employeeCount", title: "Employee Count Est." },

        // Testing & Analysis Metadata
        { id: "businessNameScore", title: "Business Name Score" },
        { id: "addressScore", title: "Address Score" },
        { id: "phoneScore", title: "Phone Score" },
        { id: "websiteScore", title: "Website Score" },
        { id: "emailScore", title: "Email Score" },
        { id: "registrationScore", title: "Registration Score" },
        { id: "preValidationScore", title: "Pre-validation Score" },

        // Technical Identifiers
        { id: "placeId", title: "Google Place ID" },
        { id: "foursquareId", title: "Foursquare ID" },
        { id: "hours", title: "Business Hours" },
      ],
    });

    // Map leads to comprehensive CSV format
    const csvData = this.campaignData.totalLeads.map((lead) => ({
      // Campaign & Query Tracking
      campaignId: lead.campaignId,
      queryId: lead.queryId,
      query: lead.query,
      location: lead.location,
      queryTimestamp: lead.queryTimestamp,

      // Business Information
      name: lead.name || "",
      address: lead.address || "",
      category: lead.category || "",
      rating: lead.rating || "",
      reviewCount: lead.reviewCount || "",
      priceLevel: lead.priceLevel || "",

      // Company Contact Information
      companyPhone: lead.companyPhone || lead.phone || "",
      companyPhoneSource:
        lead.companyPhoneSource || lead.phoneSource || "Google Places",
      companyEmail:
        lead.companyEmail || (lead.ownerEmail ? "" : lead.email) || "",
      companyEmailSource:
        lead.companyEmailSource ||
        (lead.ownerEmail ? "" : lead.emailSource) ||
        "",
      companyEmailConfidence:
        lead.companyEmailConfidence ||
        (lead.ownerEmail ? "" : lead.emailConfidence) ||
        "",

      // Owner Contact Information
      ownerPhone: lead.ownerPhone || "",
      ownerPhoneSource: lead.ownerPhoneSource || "",
      ownerEmail: lead.ownerEmail || "",
      ownerEmailSource: lead.ownerEmailSource || "",
      ownerEmailConfidence: lead.ownerEmailConfidence || "",
      ownerName: lead.ownerName || "",
      ownerTitle: lead.ownerTitle || "",

      // Digital Presence
      website: lead.website || "",
      websiteSource: lead.websiteSource || "Google Places",
      websiteAccessible: lead.websiteValidation?.accessible || false,
      websiteResponseTime: lead.websiteValidation?.responseTime || "",

      // Validation & Quality
      confidenceScore: lead.finalConfidenceScore || lead.confidenceScore || "",
      qualityGrade: lead.qualityGrade || "",
      isQualified: lead.isQualified || false,
      exportReady: lead.exportReady || false,

      // Registry & Verification
      registryValidated: lead.registryValidation?.registeredInAnyState || false,
      emailValidated: lead.emailValidation?.isValid || false,
      propertyIntelligence: lead.propertyIntelligence?.found || false,
      foursquareMatch: lead.foursquareData?.found || false,

      // Data Sources & Attribution
      primarySource: lead.source || "Google Places",
      dataSources: this.formatDataSources(lead),
      apiCost: lead.processingCost || "",
      processingTime: lead.processingTime || "",

      // Enhanced API Integration Tracking
      apolloData: this.getApolloDataStatus(lead),
      hunterData: this.getHunterDataStatus(lead),
      optimizedEngineCost: this.getOptimizedEngineCost(lead),
      employeeCount: lead.employeeCount || lead.employee_count_estimate || "",

      // Testing & Analysis Metadata
      businessNameScore: lead.qualityScores?.businessNameScore || "",
      addressScore: lead.qualityScores?.addressScore || "",
      phoneScore: lead.qualityScores?.phoneScore || "",
      websiteScore: lead.qualityScores?.websiteScore || "",
      emailScore: lead.qualityScores?.emailScore || "",
      registrationScore: lead.qualityScores?.registrationScore || "",
      preValidationScore: lead.preValidationScore || "",

      // Technical Identifiers
      placeId: lead.placeId || "",
      foursquareId: lead.foursquareData?.places?.[0]?.fsqId || "",
      hours: lead.hours
        ? typeof lead.hours === "object"
          ? JSON.stringify(lead.hours)
          : lead.hours
        : "",
    }));

    // Write comprehensive CSV
    await csvWriter.writeRecords(csvData);

    // Generate campaign summary and analysis files
    await this.exportCampaignSummary(filename);
    await this.exportAnalysisData(filename);

    console.log(`✅ Campaign CSV export complete: ${filename}`);
    console.log(
      `📊 Exported ${csvData.length} leads across ${this.campaignData.queries.length} queries`
    );

    return {
      filename,
      filepath,
      leadCount: csvData.length,
      queryCount: this.campaignData.queries.length,
      campaignId: this.campaignData.campaignId,
      summaryFiles: {
        csv: filename,
        summary: filename.replace(".csv", "-summary.json"),
        analysis: filename.replace(".csv", "-analysis.json"),
      },
    };
  }

  /**
   * Export campaign summary with query-level analysis
   */
  async exportCampaignSummary(csvFilename) {
    const summaryFilename = csvFilename.replace(".csv", "-summary.json");
    const summaryPath = path.join(this.exportsDir, summaryFilename);

    const summary = {
      campaignOverview: {
        campaignId: this.campaignData.campaignId,
        startTime: this.campaignData.startTime,
        endTime: new Date().toISOString(),
        duration: Date.now() - new Date(this.campaignData.startTime).getTime(),
        totalQueries: this.campaignData.queries.length,
        totalLeads: this.campaignData.totalLeads.length,
        exportVersion: this.campaignData.metadata.exportVersion,
      },

      queryBreakdown: this.campaignData.queries.map((query) => ({
        queryId: query.queryId,
        query: query.query,
        location: query.location,
        leadCount: query.leadCount,
        cost: query.cost,
        processingTime: query.processingTime,
        qualificationRate: query.qualificationRate,
        averageConfidence: query.averageConfidence,
        timestamp: query.timestamp,
      })),

      campaignTotals: this.campaignData.analysisData,

      qualityAnalysis: {
        confidenceDistribution: this.calculateConfidenceDistribution(),
        qualityGradeDistribution: this.calculateQualityDistribution(),
        sourceEffectiveness: this.calculateSourceEffectiveness(),
        costEfficiency: this.calculateCostEfficiency(),
      },

      recommendations: this.generateRecommendations(),

      metadata: this.campaignData.metadata,
    };

    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📋 Campaign summary exported: ${summaryFilename}`);
  }

  /**
   * Export detailed analysis data for testing and optimization
   */
  async exportAnalysisData(csvFilename) {
    const analysisFilename = csvFilename.replace(".csv", "-analysis.json");
    const analysisPath = path.join(this.exportsDir, analysisFilename);

    const analysisData = {
      testingMetrics: {
        preValidationAccuracy: this.calculatePreValidationAccuracy(),
        apiCostEfficiency: this.calculateApiCostEfficiency(),
        sourceReliability: this.calculateSourceReliability(),
        qualityPredictionAccuracy: this.calculateQualityPredictionAccuracy(),
      },

      optimizationInsights: {
        costReductionOpportunities: this.identifyCostReductions(),
        qualityImprovementAreas: this.identifyQualityImprovements(),
        apiUsageOptimization: this.analyzeApiUsageOptimization(),
        processingTimeOptimization: this.analyzeProcessingTimeOptimization(),
      },

      dataQualityMetrics: {
        completenessScores: this.calculateCompletenessScores(),
        accuracyMetrics: this.calculateAccuracyMetrics(),
        consistencyAnalysis: this.analyzeDataConsistency(),
        validationResults: this.summarizeValidationResults(),
      },

      rawData: {
        allQueries: this.campaignData.queries,
        apiUsageDetails: this.campaignData.analysisData.apiUsageBreakdown,
        processingTimestamps: this.extractProcessingTimestamps(),
        errorAnalysis: this.analyzeErrors(),
      },
    };

    await fs.writeFile(analysisPath, JSON.stringify(analysisData, null, 2));
    console.log(`🔬 Analysis data exported: ${analysisFilename}`);
  }

  /**
   * Utility methods for data formatting and analysis
   */
  formatDataSources(lead) {
    const sources = [];
    if (lead.source) sources.push(lead.source);
    if (lead.foursquareData?.found) sources.push("Foursquare");
    if (lead.emailDiscovery?.emails?.length > 0) sources.push("Hunter.io");
    if (lead.emailValidation?.isValid) sources.push("NeverBounce");
    if (lead.registryValidation?.registeredInAnyState)
      sources.push("State Registries");
    if (lead.propertyIntelligence?.found) sources.push("Property Intelligence");

    return sources.length > 0 ? sources.join(", ") : "Google Places";
  }

  calculateConfidenceDistribution() {
    const distribution = {
      "90-100": 0,
      "80-89": 0,
      "70-79": 0,
      "60-69": 0,
      "50-59": 0,
      "0-49": 0,
    };

    this.campaignData.totalLeads.forEach((lead) => {
      const confidence = lead.finalConfidenceScore || lead.confidenceScore || 0;
      if (confidence >= 90) distribution["90-100"]++;
      else if (confidence >= 80) distribution["80-89"]++;
      else if (confidence >= 70) distribution["70-79"]++;
      else if (confidence >= 60) distribution["60-69"]++;
      else if (confidence >= 50) distribution["50-59"]++;
      else distribution["0-49"]++;
    });

    return distribution;
  }

  calculateQualityDistribution() {
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    this.campaignData.totalLeads.forEach((lead) => {
      const grade = lead.qualityGrade || "F";
      if (distribution[grade] !== undefined) {
        distribution[grade]++;
      }
    });

    return distribution;
  }

  calculateSourceEffectiveness() {
    const sources = {};

    this.campaignData.totalLeads.forEach((lead) => {
      const source = lead.source || "Unknown";
      if (!sources[source]) {
        sources[source] = { count: 0, totalConfidence: 0, qualified: 0 };
      }

      sources[source].count++;
      sources[source].totalConfidence +=
        lead.finalConfidenceScore || lead.confidenceScore || 0;
      if ((lead.finalConfidenceScore || lead.confidenceScore || 0) >= 75) {
        sources[source].qualified++;
      }
    });

    // Calculate averages
    Object.keys(sources).forEach((source) => {
      const data = sources[source];
      data.averageConfidence = Math.round(data.totalConfidence / data.count);
      data.qualificationRate = Math.round((data.qualified / data.count) * 100);
    });

    return sources;
  }

  calculateCostEfficiency() {
    const totalCost = this.campaignData.analysisData.totalCost;
    const qualifiedLeads = this.campaignData.totalLeads.filter(
      (lead) => (lead.finalConfidenceScore || lead.confidenceScore || 0) >= 75
    ).length;

    return {
      totalCost: totalCost,
      qualifiedLeads: qualifiedLeads,
      costPerQualifiedLead:
        qualifiedLeads > 0 ? (totalCost / qualifiedLeads).toFixed(3) : 0,
      costPerLead:
        this.campaignData.totalLeads.length > 0
          ? (totalCost / this.campaignData.totalLeads.length).toFixed(3)
          : 0,
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const qualificationRate = this.campaignData.analysisData.qualificationRate;
    const avgConfidence = this.campaignData.analysisData.averageConfidence;
    const costPerLead = this.calculateCostEfficiency().costPerLead;

    if (qualificationRate < 30) {
      recommendations.push(
        "Consider lowering quality thresholds or expanding search criteria"
      );
    }
    if (avgConfidence < 70) {
      recommendations.push(
        "Enable additional validation APIs to improve confidence scores"
      );
    }
    if (parseFloat(costPerLead) > 0.5) {
      recommendations.push(
        "Optimize API usage by implementing better pre-validation screening"
      );
    }
    if (this.campaignData.queries.length < 5) {
      recommendations.push(
        "Consider testing multiple query variations for better lead diversity"
      );
    }

    return recommendations;
  }

  /**
   * Enhanced optimized engine tracking functions
   */
  getApolloDataStatus(lead) {
    // Check if lead has data enriched by Apollo
    const hasOwnerData =
      lead.ownerName || lead.ownerTitle || lead.owner_name || lead.owner_title;
    const hasOrganizationData =
      lead.employeeCount ||
      lead.employee_count_estimate ||
      lead.companyDescription;
    const apolloCost = this.getApiCostByService(lead, "apollo");

    if (apolloCost > 0) {
      const dataPoints = [];
      if (hasOwnerData) dataPoints.push("Owner Info");
      if (hasOrganizationData) dataPoints.push("Company Data");
      if (dataPoints.length > 0) {
        return `Yes (${dataPoints.join(", ")}) - $${apolloCost.toFixed(4)}`;
      }
      return `Yes - $${apolloCost.toFixed(4)}`;
    }

    // Check for Apollo-sourced data without explicit cost tracking
    if (
      hasOwnerData &&
      (lead.source?.includes("apollo") || lead.dataSources?.includes("apollo"))
    ) {
      return "Yes (Owner Info)";
    }

    return "No";
  }

  getHunterDataStatus(lead) {
    // Check if lead has Hunter.io email data
    const hunterEmails =
      lead.emails?.filter(
        (email) =>
          email.source?.toLowerCase().includes("hunter") ||
          email.discovery_method?.toLowerCase().includes("hunter")
      ) || [];

    const hunterCost = this.getApiCostByService(lead, "hunter");

    if (hunterCost > 0) {
      const emailCount =
        hunterEmails.length || (lead.companyEmail || lead.ownerEmail ? 1 : 0);
      return `Yes (${emailCount} emails) - $${hunterCost.toFixed(4)}`;
    }

    // Check for Hunter-sourced emails without explicit cost tracking
    if (hunterEmails.length > 0) {
      return `Yes (${hunterEmails.length} emails)`;
    }

    // Check if email discovery source mentions hunter/comprehensive
    if (
      lead.companyEmailSource?.toLowerCase().includes("hunter") ||
      lead.ownerEmailSource?.toLowerCase().includes("hunter") ||
      lead.emailSource?.toLowerCase().includes("comprehensive")
    ) {
      return "Yes (Email Discovery)";
    }

    return "No";
  }

  getOptimizedEngineCost(lead) {
    const apolloCost = this.getApiCostByService(lead, "apollo");
    const hunterCost = this.getApiCostByService(lead, "hunter");
    return (apolloCost + hunterCost).toFixed(4);
  }

  getApiCostByService(lead, serviceName) {
    if (!lead.apiCosts || !Array.isArray(lead.apiCosts)) {
      return 0;
    }

    return lead.apiCosts
      .filter((cost) =>
        cost.api_service?.toLowerCase().includes(serviceName.toLowerCase())
      )
      .reduce((sum, cost) => sum + parseFloat(cost.cost_usd || 0), 0);
  }

  formatDataSources(lead) {
    const sources = [];
    if (lead.source) sources.push(lead.source);
    if (lead.foursquareData?.found) sources.push("Foursquare");
    if (lead.apolloData) sources.push("Apollo.io");
    if (lead.hunterData) sources.push("Hunter.io");
    return sources.length > 0 ? sources.join(", ") : "google_places";
  }

  // Placeholder methods for detailed analysis (to be implemented based on specific needs)
  calculatePreValidationAccuracy() {
    return "TBD - Requires validation dataset";
  }
  calculateApiCostEfficiency() {
    return this.campaignData.analysisData.apiUsageBreakdown;
  }
  calculateSourceReliability() {
    return "TBD - Requires accuracy validation";
  }
  calculateQualityPredictionAccuracy() {
    return "TBD - Requires ground truth data";
  }
  identifyCostReductions() {
    return ["Implement more aggressive pre-screening", "Cache API results"];
  }
  identifyQualityImprovements() {
    return ["Add more validation sources", "Improve owner detection"];
  }
  analyzeApiUsageOptimization() {
    return this.campaignData.analysisData.apiUsageBreakdown;
  }
  analyzeProcessingTimeOptimization() {
    return { averageTime: this.campaignData.analysisData.totalProcessingTime };
  }
  calculateCompletenessScores() {
    return "TBD - Field completeness analysis";
  }
  calculateAccuracyMetrics() {
    return "TBD - Requires manual verification";
  }
  analyzeDataConsistency() {
    return "TBD - Cross-source validation";
  }
  summarizeValidationResults() {
    return this.campaignData.analysisData.qualityMetrics;
  }
  extractProcessingTimestamps() {
    return this.campaignData.queries.map((q) => ({
      query: q.query,
      timestamp: q.timestamp,
    }));
  }
  analyzeErrors() {
    return "TBD - Error logging implementation";
  }

  async ensureExportsDirectory() {
    try {
      await fs.mkdir(this.exportsDir, { recursive: true });
    } catch (error) {
      console.error("Error creating exports directory:", error);
    }
  }

  generateCampaignId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `campaign_${timestamp}_${random}`;
  }

  generateQueryId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `query_${timestamp}_${random}`;
  }
}

module.exports = CampaignCSVExporter;
