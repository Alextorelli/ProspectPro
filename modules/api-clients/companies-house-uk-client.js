/**
 * Companies House UK API Client
 *
 * Provides UK company validation and intelligence using Companies House API
 * - Company search by name, registration number, or postcode
 * - Detailed company information and filing history
 * - Officer and person of significant control (PSC) data
 * - Charges and insolvency information
 * - Free access with API key authentication
 *
 * API Documentation: https://developer.company-information.service.gov.uk/
 * Rate Limits: 600 requests per 5 minutes per IP address
 *
 * ProspectPro - Zero Fake Data Policy
 */

require("dotenv").config();

class CompaniesHouseUKClient {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.COMPANIES_HOUSE_UK_API_KEY;
    this.baseUrl = "https://api.company-information.service.gov.uk";

    // Rate limiting configuration - 600 requests per 5 minutes
    this.rateLimitPer5Min = 600;
    this.requestTimes = [];
    this.rateLimitWindow = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Caching for performance
    this.cache = new Map();
    this.cacheTimeout = 6 * 60 * 60 * 1000; // 6 hours for UK company data

    // Quality scoring configuration
    this.qualityScore = 70; // MEDIUM-HIGH quality for official UK data
    this.costPerRequest = 0.0; // Free API with registration

    // Request statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      cachedResponses: 0,
      errorCount: 0,
      rateLimitHits: 0,
      lastRequestTime: null,
    };

    // Company statuses and types for better categorization
    this.companyStatuses = {
      active: "Active",
      dissolved: "Dissolved",
      liquidation: "In Liquidation",
      receivership: "In Receivership",
      administration: "In Administration",
      "voluntary-arrangement": "Company Voluntary Arrangement",
      "converted-closed": "Converted/Closed",
      "insolvency-proceedings": "Insolvency Proceedings",
      registered: "Registered",
      removed: "Removed",
    };

    this.companyTypes = {
      ltd: "Private Limited Company",
      plc: "Public Limited Company",
      llp: "Limited Liability Partnership",
      lp: "Limited Partnership",
      other: "Other Company Type",
      "european-company": "European Company",
      "icvc-securities": "Investment Company with Variable Capital",
      "industrial-and-provident-society": "Industrial and Provident Society",
      "northern-ireland": "Northern Ireland Company",
      "overseas-company": "Overseas Company",
      "scottish-partnership": "Scottish Partnership",
    };

    if (!this.apiKey) {
      console.warn(
        "⚠️ Companies House UK API key not found. Set COMPANIES_HOUSE_UK_API_KEY environment variable."
      );
    }
  }

  /**
   * Search for UK companies
   * @param {string} searchTerm - Company name or registration number
   * @param {Object} options - Search options
   * @param {number} options.itemsPerPage - Number of results per page (default 20)
   * @param {number} options.startIndex - Starting index for pagination (default 0)
   * @param {boolean} options.includeDetails - Whether to fetch detailed company information
   * @param {boolean} options.includeOfficers - Whether to include officer information
   * @returns {Object} Search results with normalized structure
   */
  async searchCompanies(searchTerm, options = {}) {
    if (!this.apiKey) {
      console.warn(
        "⚠️ Companies House UK API key not configured, returning mock response"
      );
      return this.getMockResponse(searchTerm);
    }

    if (!searchTerm || typeof searchTerm !== "string") {
      throw new Error("Search term is required and must be a string");
    }

    // Check cache first
    const cacheKey = `ch_uk_search_${searchTerm
      .toLowerCase()
      .trim()}_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.stats.cachedResponses++;
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const searchParams = new URLSearchParams({
        q: searchTerm.trim(),
        items_per_page: (options.itemsPerPage || 20).toString(),
        start_index: (options.startIndex || 0).toString(),
      });

      const response = await this.makeRequest(
        `/search/companies?${searchParams}`
      );
      let normalizedResponse = this.normalizeSearchResponse(
        response,
        searchTerm,
        options
      );

      // Enhance with detailed information if requested
      if (options.includeDetails && normalizedResponse.companies.length > 0) {
        const enhanced = await this.enhanceWithCompanyDetails(
          normalizedResponse.companies.slice(0, 5), // Limit to 5 for API efficiency
          options.includeOfficers
        );
        normalizedResponse.companies = enhanced;
      }

      // Cache successful responses
      this.cache.set(cacheKey, {
        data: normalizedResponse,
        timestamp: Date.now(),
      });

      return normalizedResponse;
    } catch (error) {
      this.stats.errorCount++;
      console.error("Companies House UK search error:", error.message);

      return {
        found: false,
        totalResults: 0,
        companies: [],
        error: error.message,
        source: "Companies House UK",
        apiCost: this.costPerRequest,
        qualityScore: 0,
        confidenceBoost: 0,
        searchTerm,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get detailed company information by company number
   * @param {string} companyNumber - UK company registration number
   * @param {Object} options - Options for additional data
   * @param {boolean} options.includeOfficers - Whether to include officers
   * @param {boolean} options.includePSC - Whether to include persons of significant control
   * @param {boolean} options.includeCharges - Whether to include charges
   * @returns {Object} Detailed company information
   */
  async getCompanyByNumber(companyNumber, options = {}) {
    if (!this.apiKey) {
      console.warn("⚠️ Companies House UK API key not configured");
      return { found: false, error: "API key not configured" };
    }

    if (!companyNumber) {
      throw new Error("Company number is required");
    }

    const cleanNumber = companyNumber.toString().toUpperCase().trim();
    const cacheKey = `ch_uk_company_${cleanNumber}_${JSON.stringify(options)}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.stats.cachedResponses++;
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const companyData = await this.makeRequest(`/company/${cleanNumber}`);
      let enrichedData = { companyDetails: companyData };

      // Get additional data if requested
      const additionalData = await Promise.allSettled([
        options.includeOfficers ? this.getCompanyOfficers(cleanNumber) : null,
        options.includePSC
          ? this.getPersonsOfSignificantControl(cleanNumber)
          : null,
        options.includeCharges ? this.getCompanyCharges(cleanNumber) : null,
      ]);

      if (options.includeOfficers && additionalData[0].status === "fulfilled") {
        enrichedData.officers = additionalData[0].value;
      }
      if (options.includePSC && additionalData[1].status === "fulfilled") {
        enrichedData.personsOfSignificantControl = additionalData[1].value;
      }
      if (options.includeCharges && additionalData[2].status === "fulfilled") {
        enrichedData.charges = additionalData[2].value;
      }

      const normalizedResponse = this.normalizeCompanyResponse(
        enrichedData,
        cleanNumber
      );

      // Cache successful responses
      this.cache.set(cacheKey, {
        data: normalizedResponse,
        timestamp: Date.now(),
      });

      return normalizedResponse;
    } catch (error) {
      console.error(`Error fetching company ${companyNumber}:`, error.message);

      return {
        found: false,
        companyNumber: cleanNumber,
        error: error.message,
        source: "Companies House UK",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get company officers
   * @param {string} companyNumber - UK company registration number
   * @returns {Object} Officers information
   */
  async getCompanyOfficers(companyNumber) {
    try {
      const response = await this.makeRequest(
        `/company/${companyNumber}/officers`
      );
      return this.normalizeOfficersResponse(response);
    } catch (error) {
      console.warn(
        `Failed to get officers for ${companyNumber}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Get persons of significant control
   * @param {string} companyNumber - UK company registration number
   * @returns {Object} PSC information
   */
  async getPersonsOfSignificantControl(companyNumber) {
    try {
      const response = await this.makeRequest(
        `/company/${companyNumber}/persons-with-significant-control`
      );
      return this.normalizePSCResponse(response);
    } catch (error) {
      console.warn(`Failed to get PSC for ${companyNumber}:`, error.message);
      return null;
    }
  }

  /**
   * Get company charges
   * @param {string} companyNumber - UK company registration number
   * @returns {Object} Charges information
   */
  async getCompanyCharges(companyNumber) {
    try {
      const response = await this.makeRequest(
        `/company/${companyNumber}/charges`
      );
      return this.normalizeChargesResponse(response);
    } catch (error) {
      console.warn(
        `Failed to get charges for ${companyNumber}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Make rate-limited request to Companies House API
   */
  async makeRequest(endpoint, retries = 3) {
    // Rate limiting
    await this.waitForRateLimit();

    const headers = {
      Authorization: `Basic ${Buffer.from(this.apiKey + ":").toString(
        "base64"
      )}`,
      Accept: "application/json",
      "User-Agent": "ProspectPro Business Intelligence System",
    };

    const url = `${this.baseUrl}${endpoint}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers,
          timeout: 30000, // 30 second timeout
        });

        // Track request timing
        this.requestTimes.push(Date.now());
        this.stats.totalRequests++;
        this.stats.lastRequestTime = new Date().toISOString();

        if (response.ok) {
          this.stats.successfulRequests++;
          return await response.json();
        }

        // Handle specific error codes
        if (response.status === 401) {
          throw new Error("Authentication failed - Invalid API key");
        } else if (response.status === 404) {
          throw new Error("Company not found in Companies House database");
        } else if (response.status === 429) {
          this.stats.rateLimitHits++;
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 2000; // Exponential backoff
            console.log(
              `Companies House rate limit hit. Waiting ${delay}ms before retry ${attempt}/${retries}`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(
            "Companies House rate limit exceeded - Please try again later"
          );
        } else if (response.status >= 500) {
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(
              `Companies House server error ${response.status}. Retrying in ${delay}ms`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`Companies House server error: ${response.status}`);
        } else {
          throw new Error(`Companies House API error: ${response.status}`);
        }
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Rate limiting implementation
   */
  async waitForRateLimit() {
    const now = Date.now();

    // Remove requests older than the rate limit window
    this.requestTimes = this.requestTimes.filter(
      (time) => now - time < this.rateLimitWindow
    );

    // If we're at the limit, wait
    if (this.requestTimes.length >= this.rateLimitPer5Min) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = this.rateLimitWindow - (now - oldestRequest) + 100; // Add buffer

      if (waitTime > 0) {
        console.log(
          `Waiting ${waitTime}ms for Companies House rate limit reset`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Enhance companies with detailed information
   */
  async enhanceWithCompanyDetails(companies, includeOfficers = false) {
    const enhanced = [];

    for (const company of companies) {
      try {
        const detailsOptions = { includeOfficers };
        const details = await this.getCompanyByNumber(
          company.companyNumber,
          detailsOptions
        );

        enhanced.push({
          ...company,
          detailedInfo: details.found ? details.companyDetails : null,
          officers: details.officers || null,
        });
      } catch (error) {
        console.warn(
          `Failed to get details for ${company.companyNumber}:`,
          error.message
        );
        enhanced.push(company);
      }
    }

    return enhanced;
  }

  /**
   * Normalize search response
   */
  normalizeSearchResponse(data, searchTerm, options) {
    const companies = data?.items || [];

    // Calculate confidence boost
    let confidenceBoost = 0;
    let exactMatches = 0;

    companies.forEach((company) => {
      if (
        company.title &&
        company.title.toLowerCase() === searchTerm.toLowerCase()
      ) {
        exactMatches++;
      }
    });

    if (exactMatches > 0) {
      confidenceBoost = 20; // High confidence for UK official data
    } else if (companies.length > 0) {
      confidenceBoost = 12; // Good confidence for partial matches
    }

    return {
      found: companies.length > 0,
      totalResults: data?.total_results || companies.length,
      exactMatches,
      companies: companies.map((company) => ({
        companyNumber: company.company_number || null,
        companyName: company.title || null,
        companyStatus: company.company_status || null,
        companyStatusDescription:
          this.companyStatuses[company.company_status] ||
          company.company_status,
        companyType: company.company_type || null,
        companyTypeDescription:
          this.companyTypes[company.company_type] || company.company_type,

        // Address information
        address: this.normalizeAddress(company.address),

        // Dates
        dateOfCreation: company.date_of_creation || null,
        dateOfCessation: company.date_of_cessation || null,

        // Additional info
        sicCodes: company.sic_codes || [],

        // Match metadata
        matchSnippet: company.snippet || null,
        matchScore: this.calculateMatchScore(company, searchTerm),

        // Validation metadata
        source: "Companies House UK",
        sourceId: company.company_number,
        lastVerified: new Date().toISOString(),
        dataQuality: "official_government_record",
        isUKCompany: true,
      })),

      // ProspectPro metadata
      source: "Companies House UK",
      apiCost: this.costPerRequest,
      qualityScore: this.qualityScore,
      confidenceBoost,
      searchTerm,
      searchOptions: options,

      // Performance metrics
      cached: false,
      processingTime: Date.now(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Normalize company response
   */
  normalizeCompanyResponse(data, companyNumber) {
    const company = data.companyDetails;

    if (!company) {
      return {
        found: false,
        companyNumber,
        source: "Companies House UK",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      found: true,
      companyNumber,
      companyDetails: {
        companyName: company.company_name || null,
        companyNumber: company.company_number || companyNumber,
        companyStatus: company.company_status || null,
        companyStatusDescription:
          this.companyStatuses[company.company_status] ||
          company.company_status,
        companyType: company.type || null,
        companyTypeDescription: this.companyTypes[company.type] || company.type,

        // Jurisdiction
        jurisdiction: company.jurisdiction || "England/Wales",

        // Dates
        dateOfCreation: company.date_of_creation || null,
        dateOfCessation: company.date_of_cessation || null,

        // Address
        registeredOfficeAddress: this.normalizeAddress(
          company.registered_office_address
        ),

        // Business activity
        sicCodes: company.sic_codes || [],

        // Accounts and returns
        accountingReferenceDate: company.accounting_reference_date || null,
        lastAccountsDate: company.last_accounts?.made_up_to || null,
        nextAccountsDue: company.last_accounts?.next_due || null,
        confirmationStatementDate:
          company.confirmation_statement?.next_due || null,

        // Share capital
        hasShareCapital: company.has_share_capital || false,

        // Additional information
        canFile: company.can_file || false,
        hasCharges: company.has_charges || false,
        hasInsolvencyHistory: company.has_insolvency_history || false,

        // Links for further data
        links: company.links || {},
      },

      // Additional data if requested
      officers: data.officers || null,
      personsOfSignificantControl: data.personsOfSignificantControl || null,
      charges: data.charges || null,

      source: "Companies House UK",
      qualityScore: this.qualityScore,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Normalize address object
   */
  normalizeAddress(address) {
    if (!address) return null;

    return {
      line1: address.address_line_1 || null,
      line2: address.address_line_2 || null,
      careOf: address.care_of || null,
      locality: address.locality || null,
      region: address.region || null,
      postalCode: address.postal_code || null,
      country: address.country || null,
      premises: address.premises || null,
      poBox: address.po_box || null,
    };
  }

  /**
   * Normalize officers response
   */
  normalizeOfficersResponse(data) {
    if (!data?.items) return null;

    return {
      totalOfficers: data.total_results || data.items.length,
      activeCount: data.active_count || null,
      resignedCount: data.resigned_count || null,
      officers: data.items.map((officer) => ({
        name: officer.name || null,
        officerRole: officer.officer_role || null,
        appointedOn: officer.appointed_on || null,
        resignedOn: officer.resigned_on || null,
        nationality: officer.nationality || null,
        occupation: officer.occupation || null,
        countryOfResidence: officer.country_of_residence || null,
        address: this.normalizeAddress(officer.address),
        dateOfBirth: officer.date_of_birth
          ? {
              month: officer.date_of_birth.month,
              year: officer.date_of_birth.year,
            }
          : null,
      })),
    };
  }

  /**
   * Normalize PSC response
   */
  normalizePSCResponse(data) {
    if (!data?.items) return null;

    return {
      totalPSC: data.total_results || data.items.length,
      items: data.items.map((psc) => ({
        name: psc.name || null,
        kind: psc.kind || null,
        notifiedOn: psc.notified_on || null,
        naturesOfControl: psc.natures_of_control || [],
        nationality: psc.nationality || null,
        countryOfResidence: psc.country_of_residence || null,
        address: this.normalizeAddress(psc.address),
        dateOfBirth: psc.date_of_birth
          ? {
              month: psc.date_of_birth.month,
              year: psc.date_of_birth.year,
            }
          : null,
      })),
    };
  }

  /**
   * Normalize charges response
   */
  normalizeChargesResponse(data) {
    if (!data?.items) return null;

    return {
      totalCharges: data.total_count || data.items.length,
      unfiltered: data.unfiltered_count || null,
      satisfied: data.satisfied_count || null,
      partSatisfied: data.part_satisfied_count || null,
      charges: data.items.map((charge) => ({
        chargeCode: charge.charge_code || null,
        chargeNumber: charge.charge_number || null,
        classification: charge.classification || null,
        description: charge.description || null,
        createdOn: charge.created_on || null,
        deliveredOn: charge.delivered_on || null,
        status: charge.status || null,
        assetsCeasedReleased: charge.assets_ceased_released || null,
        acquiredOn: charge.acquired_on || null,
        satisfiedOn: charge.satisfied_on || null,
      })),
    };
  }

  /**
   * Calculate match score for search results
   */
  calculateMatchScore(company, searchTerm) {
    let score = 0;
    const searchUpper = searchTerm.toUpperCase();
    const titleUpper = (company.title || "").toUpperCase();

    if (titleUpper === searchUpper) {
      score = 100; // Exact match
    } else if (titleUpper.startsWith(searchUpper)) {
      score = 90; // Starts with
    } else if (titleUpper.includes(searchUpper)) {
      score = 80; // Contains
    } else if (company.company_number === searchTerm.toUpperCase()) {
      score = 95; // Company number match
    } else {
      score = 60; // General match
    }

    // Boost for active companies
    if (company.company_status === "active") {
      score += 5;
    }

    return score;
  }

  /**
   * Mock response for testing when API key not available
   */
  getMockResponse(searchTerm) {
    return {
      found: false,
      totalResults: 0,
      companies: [],
      error:
        "API key not configured - this would search Companies House UK database",
      source: "Companies House UK (Mock)",
      apiCost: this.costPerRequest,
      qualityScore: 0,
      confidenceBoost: 0,
      searchTerm,
      timestamp: new Date().toISOString(),
      mockData: true,
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      ...this.stats,
      rateLimitStatus: {
        current5MinRequests: this.requestTimes.length,
        fiveMinuteLimit: this.rateLimitPer5Min,
        resetTime:
          this.requestTimes.length > 0
            ? new Date(
                Math.min(...this.requestTimes) + this.rateLimitWindow
              ).toISOString()
            : "now",
      },
      cacheStats: {
        entriesCount: this.cache.size,
        hitRate:
          this.stats.totalRequests > 0
            ? this.stats.cachedResponses / this.stats.totalRequests
            : 0,
      },
      apiInfo: {
        qualityScore: this.qualityScore,
        costPerRequest: this.costPerRequest,
        isConfigured: !!this.apiKey,
      },
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log("Companies House UK API cache cleared");
  }
}

module.exports = CompaniesHouseUKClient;
