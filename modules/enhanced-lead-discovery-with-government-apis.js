/**
 * Enhanced Lead Discovery Algorithm with Phase 1 Government APIs
 * Integrates multiple data sources with cost optimization and intelligent pre-validation
 *
 * Phase 1 Government APIs Integrated:
 * - California Secretary of State (75% quality score)
 * - Enhanced SEC EDGAR (65% quality score)
 * - ProPublica Nonprofit Explorer (60% quality score)
 * - Companies House UK (70% quality score)
 *
 * ProspectPro - Zero Fake Data Policy
 */

// Existing API clients
const CaliforniaSOS = require("./api-clients/california-sos-client");
const NewYorkSOS = require("./api-clients/newyork-sos-client");
const NYTaxParcels = require("./api-clients/ny-tax-parcels-client");
const HunterIOClient = require("./api-clients/hunter-io");
const NeverBounceClient = require("./api-clients/neverbounce");

// Phase 1 Government API clients
const CaliforniaSOSClient = require("./api-clients/california-sos-client");
const EnhancedSECEdgarClient = require("./api-clients/enhanced-sec-edgar-client");
const ProPublicaNonprofitClient = require("./api-clients/propublica-nonprofit-client");
const CompaniesHouseUKClient = require("./api-clients/companies-house-uk-client");

class EnhancedLeadDiscoveryWithGovernmentAPIs {
  constructor(apiKeys = {}) {
    // Existing API clients
    this.californiaSOSClient = new CaliforniaSOS();
    this.newYorkSOSClient = new NewYorkSOS();
    this.nyTaxParcelsClient = new NYTaxParcels();

    // Paid API clients with cost optimization
    this.hunterClient = apiKeys.hunterIO
      ? new HunterIOClient(apiKeys.hunterIO)
      : null;
    this.neverBounceClient = apiKeys.neverBounce
      ? new NeverBounceClient(apiKeys.neverBounce)
      : null;

    // Phase 1 Government API clients (FREE)
    this.californiaSOSEnhanced = new CaliforniaSOSClient(apiKeys.californiaSOS);
    this.secEdgarClient = new EnhancedSECEdgarClient();
    this.nonprofitClient = new ProPublicaNonprofitClient();
    this.companiesHouseClient = new CompaniesHouseUKClient(
      apiKeys.companiesHouseUK
    );

    // Cost tracking
    this.totalCost = 0;
    this.apiUsageStats = {};

    // Government API confidence weights
    this.governmentAPIWeights = {
      californiaSOS: 0.75, // 75% quality score
      secEDGAR: 0.65, // 65% quality score
      nonprofit: 0.6, // 60% quality score
      companiesHouseUK: 0.7, // 70% quality score
    };

    console.log(
      "🔧 Enhanced Lead Discovery Algorithm with Phase 1 Government APIs initialized"
    );
    console.log(
      "🏛️ Government APIs: California SOS, SEC EDGAR, ProPublica Nonprofit, Companies House UK"
    );
  }

  /**
   * Main lead discovery pipeline with enhanced 4-stage validation
   * Stage 1: Discovery + Pre-validation + Government Registry Validation
   * Stage 2: Enrichment + Property Intelligence + Business Intelligence
   * Stage 3: Validation + Risk Assessment + Sector Classification
   * Stage 4: Quality Scoring + Confidence Boosting + Export Preparation
   */
  async discoverAndValidateLeads(businesses, options = {}) {
    const {
      budgetLimit = 50.0,
      qualityThreshold = 80, // Increased threshold with government APIs
      maxResults = 100,
      enableGovernmentAPIs = true,
      governmentAPIOptions = {
        enableCaliforniaSOS: true,
        enableSECEdgar: true,
        enableNonprofit: true,
        enableCompaniesHouseUK: true,
        includeFinancials: false,
        includeOfficers: false,
      },
    } = options;

    console.log(
      `🚀 Starting enhanced lead discovery with government APIs for ${businesses.length} businesses`
    );
    console.log(
      `💰 Budget limit: $${budgetLimit}, Quality threshold: ${qualityThreshold}%`
    );
    console.log(
      `🏛️ Government APIs enabled: ${enableGovernmentAPIs ? "YES" : "NO"}`
    );

    const results = [];
    let processedCount = 0;
    let governmentValidatedCount = 0;

    for (const business of businesses.slice(0, maxResults)) {
      try {
        // Check budget before processing each business
        if (this.totalCost >= budgetLimit) {
          console.warn(
            `⚠️ Budget limit reached: $${this.totalCost.toFixed(2)}`
          );
          break;
        }

        // Enhanced 4-stage pipeline with government APIs
        const enhancedBusiness =
          await this.processBusinessThroughEnhancedPipeline(
            business,
            options,
            enableGovernmentAPIs,
            governmentAPIOptions
          );

        // Track government validation success
        if (enhancedBusiness.governmentValidation?.hasAnyMatch) {
          governmentValidatedCount++;
        }

        // Only include businesses that meet quality threshold
        if (enhancedBusiness.finalConfidenceScore >= qualityThreshold) {
          results.push(enhancedBusiness);
        }

        processedCount++;

        if (processedCount % 10 === 0) {
          console.log(
            `✅ Processed ${processedCount} businesses, found ${results.length} qualified leads`
          );
          console.log(`🏛️ Government validated: ${governmentValidatedCount}`);
        }
      } catch (error) {
        console.error(
          `❌ Error processing business ${business.name}:`,
          error.message
        );
      }
    }

    console.log(
      `🎯 Enhanced discovery complete: ${results.length} qualified leads from ${processedCount} businesses`
    );
    console.log(
      `🏛️ Government API validation rate: ${(
        (governmentValidatedCount / processedCount) *
        100
      ).toFixed(1)}%`
    );
    console.log(
      `💰 Total cost: $${this.totalCost.toFixed(2)} (Government APIs: $0.00)`
    );

    return {
      leads: results,
      totalProcessed: processedCount,
      governmentValidatedCount,
      totalCost: this.totalCost,
      usageStats: this.getEnhancedUsageStats(),
      qualityMetrics: this.calculateEnhancedQualityMetrics(results),
      governmentAPIMetrics: this.calculateGovernmentAPIMetrics(results),
    };
  }

  /**
   * Process single business through enhanced 4-stage pipeline with government APIs
   */
  async processBusinessThroughEnhancedPipeline(
    business,
    options,
    enableGovernmentAPIs,
    governmentAPIOptions
  ) {
    // Stage 1: Discovery + Pre-validation + Government Registry Validation
    const stage1Result = await this.stage1_EnhancedDiscoveryAndPreValidation(
      business,
      enableGovernmentAPIs,
      governmentAPIOptions
    );

    // Early filtering - only proceed if pre-validation score is promising
    // Lowered threshold since government APIs can boost confidence significantly
    if (
      stage1Result.preValidationScore < 50 &&
      !stage1Result.governmentValidation?.hasAnyMatch
    ) {
      console.log(
        `⏭️ Skipping ${business.name} - low pre-validation score: ${stage1Result.preValidationScore}`
      );
      return {
        ...stage1Result,
        finalConfidenceScore: stage1Result.preValidationScore,
        stage: "pre-validation-filtered",
      };
    }

    // Stage 2: Enrichment + Property Intelligence + Business Intelligence
    const stage2Result = await this.stage2_EnhancedEnrichmentAndIntelligence(
      stage1Result,
      governmentAPIOptions
    );

    // Stage 3: Validation + Risk Assessment + Sector Classification
    const stage3Result = await this.stage3_EnhancedValidationAndRiskAssessment(
      stage2Result
    );

    // Stage 4: Quality Scoring + Confidence Boosting + Export Preparation
    const finalResult = await this.stage4_EnhancedQualityScoringAndExport(
      stage3Result
    );

    return finalResult;
  }

  /**
   * Stage 1: Enhanced Discovery + Pre-validation + Government Registry Validation
   */
  async stage1_EnhancedDiscoveryAndPreValidation(
    business,
    enableGovernmentAPIs,
    governmentAPIOptions
  ) {
    console.log(`🔍 Stage 1: Enhanced pre-validation for ${business.name}`);

    const preValidationScore = this.calculatePreValidationScore(business);

    // Enhanced registry validation including government APIs
    let registryValidation = {};
    let governmentValidation = {};

    if (preValidationScore >= 40 || enableGovernmentAPIs) {
      // Lower threshold for government validation
      // Existing state registry validation
      registryValidation = await this.validateBusinessRegistration(business);

      // Government APIs validation (FREE - zero cost impact)
      if (enableGovernmentAPIs) {
        governmentValidation = await this.validateThroughGovernmentAPIs(
          business,
          governmentAPIOptions
        );
      }
    }

    return {
      ...business,
      preValidationScore,
      registryValidation,
      governmentValidation,
      stage: "enhanced-discovery",
      processingCost: 0, // Stage 1 remains free with government APIs
    };
  }

  /**
   * Stage 2: Enhanced Enrichment + Property Intelligence + Business Intelligence
   */
  async stage2_EnhancedEnrichmentAndIntelligence(
    businessData,
    governmentAPIOptions
  ) {
    console.log(`🏢 Stage 2: Enhanced enrichment for ${businessData.name}`);

    let propertyData = {};
    let emailDiscovery = {};
    let businessIntelligence = {};
    let stageCost = 0;

    // Property intelligence (existing logic)
    if (businessData.address && businessData.preValidationScore >= 65) {
      propertyData = await this.getPropertyIntelligence(businessData);
    }

    // Enhanced business intelligence from government APIs
    if (businessData.governmentValidation?.hasAnyMatch) {
      businessIntelligence =
        await this.getBusinessIntelligenceFromGovernmentAPIs(
          businessData,
          governmentAPIOptions
        );
    }

    // Email discovery optimization based on government validation
    const shouldDiscoverEmail = this.shouldDiscoverEmail(businessData);
    if (shouldDiscoverEmail && this.hunterClient) {
      try {
        const domain = this.extractDomainFromWebsite(businessData.website);
        if (domain && domain !== "example.com") {
          emailDiscovery = await this.hunterClient.findEmails(domain);
          stageCost += emailDiscovery.cost || 0.04;
          this.totalCost += stageCost;
        }
      } catch (error) {
        console.warn(
          `Email discovery failed for ${businessData.name}:`,
          error.message
        );
      }
    }

    return {
      ...businessData,
      propertyIntelligence: propertyData,
      emailDiscovery: emailDiscovery,
      businessIntelligence: businessIntelligence, // New field
      stage: "enhanced-enrichment",
      processingCost: stageCost,
    };
  }

  /**
   * Stage 3: Enhanced Validation + Risk Assessment + Sector Classification
   */
  async stage3_EnhancedValidationAndRiskAssessment(businessData) {
    console.log(`⚖️ Stage 3: Enhanced validation for ${businessData.name}`);

    let websiteValidation = {};
    let emailValidation = {};
    let riskAssessment = {};
    let sectorClassification = {};
    let stageCost = 0;

    // Website validation
    if (businessData.website) {
      websiteValidation = await this.validateWebsite(businessData.website);
    }

    // Enhanced email validation
    if (businessData.emailDiscovery?.emails?.length && this.neverBounceClient) {
      try {
        emailValidation = await this.validateEmails(
          businessData.emailDiscovery.emails
        );
        stageCost += emailValidation.cost || 0;
        this.totalCost += stageCost;
      } catch (error) {
        console.warn(
          `Email validation failed for ${businessData.name}:`,
          error.message
        );
      }
    }

    // Enhanced risk assessment with government data
    riskAssessment = this.calculateEnhancedRiskAssessment(businessData);

    // Sector classification from government APIs
    sectorClassification = this.determineSectorClassification(businessData);

    return {
      ...businessData,
      websiteValidation,
      emailValidation,
      riskAssessment, // Enhanced
      sectorClassification, // New field
      stage: "enhanced-validation",
      processingCost: stageCost,
    };
  }

  /**
   * Stage 4: Enhanced Quality Scoring + Confidence Boosting + Export Preparation
   */
  async stage4_EnhancedQualityScoringAndExport(businessData) {
    console.log(
      `📊 Stage 4: Enhanced quality scoring for ${businessData.name}`
    );

    // Calculate base confidence scores
    const componentScores = {
      businessName: this.scoreBusinessName(businessData),
      address: this.scoreAddress(businessData),
      phone: this.scorePhone(businessData),
      website: this.scoreWebsite(businessData),
      email: this.scoreEmail(businessData),
      registration: this.scoreRegistration(businessData),
      property: this.scoreProperty(businessData),
    };

    // Calculate government API confidence boost
    const governmentConfidenceBoost =
      this.calculateGovernmentConfidenceBoost(businessData);

    // Enhanced sector-specific scoring
    const sectorSpecificBoost = this.calculateSectorSpecificBoost(businessData);

    // Calculate final confidence score
    const baseScore =
      Object.values(componentScores).reduce((sum, score) => sum + score, 0) /
      Object.keys(componentScores).length;
    const finalConfidenceScore = Math.min(
      100,
      Math.round(baseScore + governmentConfidenceBoost + sectorSpecificBoost)
    );

    // Enhanced qualification status
    const isQualified = this.determineEnhancedQualificationStatus(
      businessData,
      finalConfidenceScore
    );

    return {
      ...businessData,
      componentScores,
      governmentConfidenceBoost,
      sectorSpecificBoost,
      finalConfidenceScore,
      isQualified,
      stage: "export-ready",
      processingCost: 0,
      lastProcessed: new Date().toISOString(),
    };
  }

  /**
   * Validate business through all available government APIs
   */
  async validateThroughGovernmentAPIs(business, options = {}) {
    console.log(`🏛️ Government API validation for ${business.name}`);

    const validationResults = {
      californiaSOS: null,
      secEDGAR: null,
      nonprofit: null,
      companiesHouseUK: null,
      hasAnyMatch: false,
      totalMatches: 0,
      bestMatch: null,
      validationSummary: {},
    };

    // Prepare search promises
    const validationPromises = [];

    // California SOS validation
    if (options.enableCaliforniaSOS && this.californiaSOSEnhanced) {
      validationPromises.push(
        this.californiaSOSEnhanced
          .searchByKeyword(business.name)
          .then((result) => ({ source: "californiaSOS", result }))
          .catch((error) => ({ source: "californiaSOS", error: error.message }))
      );
    }

    // SEC EDGAR validation
    if (options.enableSECEdgar && this.secEdgarClient) {
      validationPromises.push(
        this.secEdgarClient
          .searchCompanies(business.name, {
            includeDetails: options.includeFinancials,
            includeFinancials: options.includeFinancials,
          })
          .then((result) => ({ source: "secEDGAR", result }))
          .catch((error) => ({ source: "secEDGAR", error: error.message }))
      );
    }

    // ProPublica Nonprofit validation
    if (options.enableNonprofit && this.nonprofitClient) {
      validationPromises.push(
        this.nonprofitClient
          .searchNonprofits(business.name, {
            includeFinancials: options.includeFinancials,
          })
          .then((result) => ({ source: "nonprofit", result }))
          .catch((error) => ({ source: "nonprofit", error: error.message }))
      );
    }

    // Companies House UK validation
    if (options.enableCompaniesHouseUK && this.companiesHouseClient) {
      validationPromises.push(
        this.companiesHouseClient
          .searchCompanies(business.name, {
            includeDetails: options.includeFinancials,
            includeOfficers: options.includeOfficers,
          })
          .then((result) => ({ source: "companiesHouseUK", result }))
          .catch((error) => ({
            source: "companiesHouseUK",
            error: error.message,
          }))
      );
    }

    // Execute all validations in parallel
    try {
      const results = await Promise.allSettled(validationPromises);

      results.forEach((promise) => {
        if (promise.status === "fulfilled" && promise.value.result) {
          const { source, result } = promise.value;
          validationResults[source] = result;

          // Check if this API found matches
          if (result.found && result.totalResults > 0) {
            validationResults.hasAnyMatch = true;
            validationResults.totalMatches += result.totalResults;

            // Track best match based on confidence
            if (
              !validationResults.bestMatch ||
              result.confidenceBoost >
                validationResults.bestMatch.confidenceBoost
            ) {
              validationResults.bestMatch = {
                source,
                ...result,
              };
            }
          }

          // Build validation summary
          validationResults.validationSummary[source] = {
            found: result.found,
            matches: result.totalResults || 0,
            qualityScore: result.qualityScore || 0,
            confidenceBoost: result.confidenceBoost || 0,
          };
        }
      });
    } catch (error) {
      console.error("Government API validation failed:", error.message);
    }

    console.log(
      `🏛️ Government validation complete: ${validationResults.totalMatches} total matches across APIs`
    );
    return validationResults;
  }

  /**
   * Calculate confidence boost from government API matches
   */
  calculateGovernmentConfidenceBoost(businessData) {
    if (!businessData.governmentValidation?.hasAnyMatch) {
      return 0;
    }

    let boost = 0;
    const gov = businessData.governmentValidation;

    // Apply weighted boosts based on API quality scores
    Object.keys(this.governmentAPIWeights).forEach((apiKey) => {
      const apiResult = gov[apiKey];
      if (apiResult?.found && apiResult.confidenceBoost > 0) {
        const weightedBoost =
          apiResult.confidenceBoost * this.governmentAPIWeights[apiKey];
        boost += weightedBoost;
      }
    });

    // Additional boost for multiple government sources confirming the business
    const confirmedSources = Object.values(gov.validationSummary || {}).filter(
      (summary) => summary.found
    ).length;

    if (confirmedSources > 1) {
      boost += confirmedSources * 5; // Multi-source validation bonus
    }

    return Math.round(Math.min(boost, 30)); // Cap at 30 points boost
  }

  /**
   * Enhanced risk assessment incorporating government data
   */
  calculateEnhancedRiskAssessment(businessData) {
    let riskScore = 0;
    const riskFactors = [];

    // Base risk assessment (existing logic)
    const baseRisk = this.calculateBaseRiskScore(businessData);
    riskScore += baseRisk.score;
    riskFactors.push(...baseRisk.factors);

    // Government validation reduces risk significantly
    if (businessData.governmentValidation?.hasAnyMatch) {
      riskScore -= 25; // Government validation reduces risk
      riskFactors.push("Government registry validation reduces risk");

      // SEC public company validation reduces risk even more
      if (businessData.governmentValidation?.secEDGAR?.found) {
        riskScore -= 15;
        riskFactors.push(
          "SEC public company filing reduces risk substantially"
        );
      }
    }

    // Multiple government sources reduces risk further
    const govSources = Object.values(
      businessData.governmentValidation?.validationSummary || {}
    ).filter((summary) => summary.found).length;

    if (govSources > 1) {
      riskScore -= govSources * 5;
      riskFactors.push(
        `Multiple government sources (${govSources}) confirm business legitimacy`
      );
    }

    return {
      riskScore: Math.max(0, Math.min(100, riskScore)),
      riskLevel: this.determineRiskLevel(riskScore),
      riskFactors: riskFactors,
    };
  }

  /**
   * Determine sector classification from government API data
   */
  determineSectorClassification(businessData) {
    const classification = {
      primary: "Unknown",
      secondary: [],
      confidence: 0,
      sources: [],
    };

    const gov = businessData.governmentValidation || {};

    // SEC EDGAR classification (public companies)
    if (gov.secEDGAR?.found && gov.secEDGAR.companies?.length > 0) {
      classification.primary = "Public Company";
      classification.secondary.push("SEC Registered");
      classification.confidence = 90;
      classification.sources.push("SEC EDGAR");
    }

    // ProPublica nonprofit classification
    if (gov.nonprofit?.found && gov.nonprofit.organizations?.length > 0) {
      const org = gov.nonprofit.organizations[0];
      if (org.sectorClassification) {
        classification.primary = "Nonprofit";
        classification.secondary.push(org.sectorClassification);
        classification.confidence = 85;
        classification.sources.push("ProPublica Nonprofit");
      }
    }

    // Companies House UK classification
    if (
      gov.companiesHouseUK?.found &&
      gov.companiesHouseUK.companies?.length > 0
    ) {
      const company = gov.companiesHouseUK.companies[0];
      if (company.companyTypeDescription) {
        classification.primary = "UK Company";
        classification.secondary.push(company.companyTypeDescription);
        classification.confidence = 80;
        classification.sources.push("Companies House UK");
      }
    }

    // California/State registration classification
    if (gov.californiaSOS?.found) {
      const entity = gov.californiaSOS.entities?.[0];
      if (entity?.entityType) {
        if (classification.primary === "Unknown") {
          classification.primary = "State Registered Business";
        }
        classification.secondary.push(entity.entityType);
        classification.confidence = Math.max(classification.confidence, 75);
        classification.sources.push("California SOS");
      }
    }

    return classification;
  }

  /**
   * Calculate sector-specific confidence boost
   */
  calculateSectorSpecificBoost(businessData) {
    const sector = businessData.sectorClassification;
    if (!sector || sector.primary === "Unknown") {
      return 0;
    }

    let boost = 0;

    // Higher confidence for regulated sectors
    switch (sector.primary) {
      case "Public Company":
        boost = 15; // High trust for SEC-registered companies
        break;
      case "Nonprofit":
        boost = 12; // Good trust for registered nonprofits
        break;
      case "UK Company":
        boost = 10; // Good trust for UK registered companies
        break;
      case "State Registered Business":
        boost = 8; // Moderate trust for state registration
        break;
      default:
        boost = 5; // Base boost for any classification
    }

    // Additional boost based on classification confidence
    boost += Math.round(sector.confidence / 20);

    // Multi-source classification bonus
    if (sector.sources.length > 1) {
      boost += sector.sources.length * 2;
    }

    return Math.min(boost, 20); // Cap at 20 points
  }

  /**
   * Enhanced qualification determination
   */
  determineEnhancedQualificationStatus(businessData, finalConfidenceScore) {
    // Base qualification
    const baseQualified = finalConfidenceScore >= 75;

    // Government validation can qualify businesses with lower base scores
    const governmentBoost = businessData.governmentConfidenceBoost || 0;
    const governmentQualified =
      finalConfidenceScore >= 65 && governmentBoost >= 15;

    // High-value targets (public companies, established nonprofits)
    const highValueTarget =
      businessData.sectorClassification?.primary === "Public Company" ||
      (businessData.sectorClassification?.primary === "Nonprofit" &&
        businessData.businessIntelligence?.revenue > 1000000);

    return (
      baseQualified ||
      governmentQualified ||
      (highValueTarget && finalConfidenceScore >= 60)
    );
  }

  /**
   * Get business intelligence from government APIs
   */
  async getBusinessIntelligenceFromGovernmentAPIs(businessData, options) {
    const intelligence = {
      hasFinancialData: false,
      revenue: null,
      assets: null,
      employees: null,
      founded: null,
      officers: null,
      businessDescription: null,
      sector: null,
      riskFactors: [],
    };

    const gov = businessData.governmentValidation || {};

    // Extract intelligence from SEC EDGAR
    if (gov.secEDGAR?.companies?.length > 0) {
      const company = gov.secEDGAR.companies[0];
      if (company.companyFacts?.financialData) {
        intelligence.hasFinancialData = true;
        const financials = company.companyFacts.financialData;
        intelligence.revenue =
          financials.Revenues?.value ||
          financials.RevenueFromContractWithCustomerExcludingAssessedTax?.value;
        intelligence.assets = financials.Assets?.value;
      }
    }

    // Extract intelligence from ProPublica Nonprofit
    if (gov.nonprofit?.organizations?.length > 0) {
      const org = gov.nonprofit.organizations[0];
      intelligence.hasFinancialData = true;
      intelligence.revenue = org.totalRevenue;
      intelligence.assets = org.netAssets;
      intelligence.sector = org.sectorClassification;

      if (org.detailedFilings?.filings?.length > 0) {
        const latestFiling = org.detailedFilings.filings[0];
        intelligence.employees = latestFiling.totalEmployees;
      }
    }

    // Extract intelligence from Companies House UK
    if (gov.companiesHouseUK?.companies?.length > 0) {
      const company = gov.companiesHouseUK.companies[0];
      intelligence.founded = company.dateOfCreation;
      intelligence.businessDescription = company.sicCodes?.join(", ");

      if (company.officers?.officers?.length > 0) {
        intelligence.officers = company.officers.officers.length;
      }
    }

    return intelligence;
  }

  /**
   * Calculate enhanced quality metrics including government API performance
   */
  calculateEnhancedQualityMetrics(results) {
    if (!results.length) return {};

    const base = this.calculateQualityMetrics(results);

    return {
      ...base,
      governmentValidated: results.filter(
        (r) => r.governmentValidation?.hasAnyMatch
      ).length,
      publicCompanies: results.filter(
        (r) => r.sectorClassification?.primary === "Public Company"
      ).length,
      nonprofits: results.filter(
        (r) => r.sectorClassification?.primary === "Nonprofit"
      ).length,
      ukCompanies: results.filter(
        (r) => r.sectorClassification?.primary === "UK Company"
      ).length,
      averageGovernmentBoost: Math.round(
        results.reduce(
          (sum, r) => sum + (r.governmentConfidenceBoost || 0),
          0
        ) / results.length
      ),
      sectorClassified: results.filter(
        (r) => r.sectorClassification?.primary !== "Unknown"
      ).length,
    };
  }

  /**
   * Calculate government API specific metrics
   */
  calculateGovernmentAPIMetrics(results) {
    const metrics = {
      totalGovernmentQueries: 0,
      californiaSOS: { queries: 0, matches: 0, hitRate: 0 },
      secEDGAR: { queries: 0, matches: 0, hitRate: 0 },
      nonprofit: { queries: 0, matches: 0, hitRate: 0 },
      companiesHouseUK: { queries: 0, matches: 0, hitRate: 0 },
    };

    results.forEach((result) => {
      const gov = result.governmentValidation;
      if (gov) {
        Object.keys(metrics).forEach((apiKey) => {
          if (apiKey !== "totalGovernmentQueries" && gov[apiKey] !== null) {
            metrics[apiKey].queries++;
            if (gov[apiKey]?.found) {
              metrics[apiKey].matches++;
            }
          }
        });
      }
    });

    // Calculate hit rates
    Object.keys(metrics).forEach((apiKey) => {
      if (apiKey !== "totalGovernmentQueries") {
        const api = metrics[apiKey];
        api.hitRate =
          api.queries > 0 ? Math.round((api.matches / api.queries) * 100) : 0;
        metrics.totalGovernmentQueries += api.queries;
      }
    });

    return metrics;
  }

  /**
   * Get enhanced usage statistics including government APIs
   */
  getEnhancedUsageStats() {
    const stats = {
      // Existing APIs
      californiaSOSRequests: this.californiaSOSClient.getUsageStats(),
      newYorkSOSRequests: this.newYorkSOSClient.getUsageStats(),
      nyTaxParcelsRequests: this.nyTaxParcelsClient.getUsageStats(),

      // Phase 1 Government APIs
      californiaSOSEnhanced: this.californiaSOSEnhanced.getUsageStats(),
      secEDGAR: this.secEdgarClient.getUsageStats(),
      nonprofit: this.nonprofitClient.getUsageStats(),
      companiesHouseUK: this.companiesHouseClient.getUsageStats(),
    };

    // Paid APIs
    if (this.hunterClient) {
      stats.hunterIOUsage = this.hunterClient.getUsageStats();
    }

    if (this.neverBounceClient) {
      stats.neverBounceUsage = this.neverBounceClient.getUsageStats();
    }

    return stats;
  }

  // Include all existing methods from original class
  calculatePreValidationScore(business) {
    let score = 0;

    // Business name quality (30 points)
    if (business.name && !this.isGenericBusinessName(business.name)) {
      score += 30;
    }

    // Address completeness (25 points)
    if (business.address && this.isCompleteAddress(business.address)) {
      score += 25;
    }

    // Phone validation (20 points)
    if (
      business.phone &&
      this.isValidPhoneFormat(business.phone) &&
      !this.isFakePhone(business.phone)
    ) {
      score += 20;
    }

    // Website presence (15 points)
    if (
      business.website &&
      business.website !== "http://example.com" &&
      business.website.includes(".")
    ) {
      score += 15;
    }

    // Additional business data (10 points)
    if (business.category || business.description || business.industry) {
      score += 10;
    }

    return Math.min(100, score);
  }

  shouldDiscoverEmail(businessData) {
    // Enhanced logic considering government validation
    const hasGovernmentValidation =
      businessData.governmentValidation?.hasAnyMatch;
    const baseScore = businessData.preValidationScore;

    return (
      baseScore >= 70 ||
      (baseScore >= 60 && hasGovernmentValidation) ||
      businessData.sectorClassification?.primary === "Public Company"
    );
  }

  // Include all existing validation and scoring methods...
  // (The rest of the methods from the original class would be included here)

  async validateBusinessRegistration(business) {
    const results = {};

    try {
      // California SOS check
      if (business.state === "CA" || business.address?.includes("California")) {
        results.california = await this.californiaSOSClient.searchBusiness(
          business.name
        );
      }

      // New York SOS check
      if (business.state === "NY" || business.address?.includes("New York")) {
        results.newYork = await this.newYorkSOSClient.searchBusiness(
          business.name
        );
      }

      results.registeredInAnyState = Object.values(results).some(
        (r) => r?.found
      );
    } catch (error) {
      console.warn("Registry validation failed:", error.message);
      results.error = error.message;
    }

    return results;
  }

  // Include all other existing methods...
  isGenericBusinessName(name) {
    const generic = ["Company LLC", "Business Inc", "Corp", "Store", "Shop"];
    return generic.some((g) => name.includes(g));
  }

  isCompleteAddress(address) {
    return address && address.includes(",") && address.length > 20;
  }

  isValidPhoneFormat(phone) {
    return (
      /^\(\d{3}\)\s\d{3}-\d{4}$/.test(phone) ||
      /^\d{3}-\d{3}-\d{4}$/.test(phone)
    );
  }

  isFakePhone(phone) {
    return (
      phone.includes("555-") ||
      phone.includes("(555)") ||
      phone.includes("000-000")
    );
  }

  extractDomainFromWebsite(website) {
    try {
      const url = new URL(website);
      return url.hostname.replace("www.", "");
    } catch {
      return website
        .replace(/^https?:\/\//, "")
        .replace("www.", "")
        .split("/")[0];
    }
  }

  // Scoring methods
  scoreBusinessName(data) {
    if (!data.name) return 0;
    return this.isGenericBusinessName(data.name) ? 30 : 90;
  }

  scoreAddress(data) {
    if (!data.address) return 0;
    if (data.propertyIntelligence?.found) return 95;
    return this.isCompleteAddress(data.address) ? 80 : 40;
  }

  scorePhone(data) {
    if (!data.phone) return 0;
    if (this.isFakePhone(data.phone)) return 10;
    return this.isValidPhoneFormat(data.phone) ? 85 : 30;
  }

  scoreWebsite(data) {
    if (!data.website) return 0;
    if (data.websiteValidation?.accessible) return 95;
    return data.website !== "http://example.com" ? 50 : 10;
  }

  scoreEmail(data) {
    if (!data.emailValidation?.bestEmail) return 0;
    return data.emailValidation.bestEmail.confidence || 50;
  }

  scoreRegistration(data) {
    if (!data.registryValidation) return 50;
    return data.registryValidation.registeredInAnyState ? 90 : 20;
  }

  scoreProperty(data) {
    if (!data.propertyIntelligence?.found) return 50;
    return data.propertyIntelligence.isCommercial ? 90 : 70;
  }

  calculateBaseRiskScore(businessData) {
    let score = 50; // Base moderate risk
    const factors = [];

    if (!businessData.website) {
      score += 10;
      factors.push("No website increases risk");
    }

    if (this.isFakePhone(businessData.phone)) {
      score += 15;
      factors.push("Fake phone number increases risk");
    }

    if (!businessData.registryValidation?.registeredInAnyState) {
      score += 20;
      factors.push("No state registration increases risk");
    }

    return { score, factors };
  }

  determineRiskLevel(riskScore) {
    if (riskScore <= 25) return "Low";
    if (riskScore <= 50) return "Moderate";
    if (riskScore <= 75) return "High";
    return "Very High";
  }

  calculateQualityMetrics(results) {
    if (!results.length) return {};

    return {
      averageConfidence: Math.round(
        results.reduce((sum, r) => sum + r.finalConfidenceScore, 0) /
          results.length
      ),
      registrationVerified: results.filter(
        (r) => r.registryValidation?.registeredInAnyState
      ).length,
      websitesAccessible: results.filter((r) => r.websiteValidation?.accessible)
        .length,
      emailsVerified: results.filter(
        (r) => r.emailValidation?.bestEmail?.isDeliverable
      ).length,
      propertiesFound: results.filter((r) => r.propertyIntelligence?.found)
        .length,
      commercialProperties: results.filter(
        (r) => r.propertyIntelligence?.isCommercial
      ).length,
    };
  }

  // Placeholder methods for existing functionality
  async getPropertyIntelligence(businessData) {
    // Existing property intelligence logic
    return { found: false, isCommercial: false };
  }

  async validateWebsite(website) {
    // Existing website validation logic
    try {
      const response = await fetch(website, { method: "HEAD", timeout: 10000 });
      return { accessible: response.ok, status: response.status };
    } catch (error) {
      return { accessible: false, error: error.message };
    }
  }

  async validateEmails(emails) {
    // Existing email validation logic
    return { validated: [], cost: 0 };
  }
}

module.exports = EnhancedLeadDiscoveryWithGovernmentAPIs;
