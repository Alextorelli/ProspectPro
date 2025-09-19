/**
 * Enhanced SEC EDGAR API Client
 *
 * Provides public company intelligence using SEC EDGAR database
 * - Company lookup by ticker symbol, CIK, or name
 * - Latest filings retrieval (10-K, 10-Q, 8-K, proxy statements)
 * - Company facts and financial data
 * - Insider trading information
 * - Free access with rate limiting compliance
 *
 * API Documentation: https://www.sec.gov/edgar/sec-api-documentation
 * Rate Limits: 10 requests per second maximum
 *
 * ProspectPro - Zero Fake Data Policy
 */

require("dotenv").config();

class EnhancedSECEdgarClient {
  constructor() {
    this.baseUrl = "https://data.sec.gov";
    this.companiesUrl = "https://www.sec.gov/files/company_tickers.json";
    this.companyCIKUrl =
      "https://www.sec.gov/files/company_tickers_exchange.json";

    // Rate limiting - SEC requires 10 requests per second max
    this.rateLimitPerSecond = 10;
    this.requestTimes = [];
    this.requestQueue = [];
    this.processing = false;

    // Caching for performance
    this.cache = new Map();
    this.cacheTimeout = 4 * 60 * 60 * 1000; // 4 hours for SEC data
    this.companiesCache = null;
    this.companiesCacheExpiry = null;

    // Quality scoring configuration
    this.qualityScore = 65; // HIGH quality for public companies
    this.costPerRequest = 0.0; // Free API

    // Request statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      cachedResponses: 0,
      errorCount: 0,
      rateLimitHits: 0,
      lastRequestTime: null,
    };

    // User agent required by SEC
    this.userAgent =
      "ProspectPro Business Intelligence System (support@prospectpro.ai)";
  }

  /**
   * Search for public companies by name, ticker, or CIK
   * @param {string} searchTerm - Company name, ticker symbol, or CIK
   * @param {Object} options - Search options
   * @param {boolean} options.includeDetails - Whether to fetch detailed company information
   * @param {boolean} options.includeFinancials - Whether to include latest financial data
   * @returns {Object} Search results with normalized structure
   */
  async searchCompanies(searchTerm, options = {}) {
    if (!searchTerm || typeof searchTerm !== "string") {
      throw new Error("Search term is required and must be a string");
    }

    const normalizedTerm = searchTerm.trim().toUpperCase();

    // Check cache first
    const cacheKey = `sec_search_${normalizedTerm}_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.stats.cachedResponses++;
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      // Load company directory if needed
      await this.loadCompaniesDirectory();

      // Search for matches
      const matches = this.findCompanyMatches(normalizedTerm);

      if (matches.length === 0) {
        return this.createEmptyResponse(searchTerm);
      }

      // Process matches with optional details
      const enrichedMatches = [];
      for (const match of matches.slice(0, 10)) {
        // Limit to 10 results
        let enrichedMatch = { ...match };

        if (options.includeDetails) {
          const companyFacts = await this.getCompanyFacts(match.cik);
          if (companyFacts) {
            enrichedMatch.companyFacts = companyFacts;
          }
        }

        if (options.includeFinancials) {
          const latestFilings = await this.getLatestFilings(match.cik, 3);
          if (latestFilings) {
            enrichedMatch.latestFilings = latestFilings;
          }
        }

        enrichedMatches.push(enrichedMatch);
      }

      const response = this.normalizeSearchResponse(
        enrichedMatches,
        searchTerm
      );

      // Cache successful responses
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      this.stats.errorCount++;
      console.error("SEC EDGAR search error:", error.message);

      return {
        found: false,
        totalResults: 0,
        companies: [],
        error: error.message,
        source: "SEC EDGAR Database",
        apiCost: this.costPerRequest,
        qualityScore: 0,
        confidenceBoost: 0,
        searchTerm,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get detailed company information by CIK
   * @param {string} cik - Central Index Key (CIK) of the company
   * @returns {Object} Detailed company information
   */
  async getCompanyFacts(cik) {
    if (!cik) {
      throw new Error("CIK is required");
    }

    const paddedCIK = cik.toString().padStart(10, "0");
    const cacheKey = `sec_facts_${paddedCIK}`;

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
      const data = await this.makeRequest(
        `/api/xbrl/companyfacts/CIK${paddedCIK}.json`
      );
      const normalizedFacts = this.normalizeCompanyFacts(data);

      // Cache successful responses
      this.cache.set(cacheKey, {
        data: normalizedFacts,
        timestamp: Date.now(),
      });

      return normalizedFacts;
    } catch (error) {
      console.error(
        `Error fetching company facts for CIK ${cik}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Get latest filings for a company
   * @param {string} cik - Central Index Key (CIK) of the company
   * @param {number} limit - Number of recent filings to retrieve (default 5)
   * @returns {Object} Latest filings information
   */
  async getLatestFilings(cik, limit = 5) {
    if (!cik) {
      throw new Error("CIK is required");
    }

    const paddedCIK = cik.toString().padStart(10, "0");
    const cacheKey = `sec_filings_${paddedCIK}_${limit}`;

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
      const data = await this.makeRequest(
        `/api/xbrl/submissions/CIK${paddedCIK}.json`
      );
      const latestFilings = this.extractLatestFilings(data, limit);

      // Cache successful responses
      this.cache.set(cacheKey, {
        data: latestFilings,
        timestamp: Date.now(),
      });

      return latestFilings;
    } catch (error) {
      console.error(`Error fetching filings for CIK ${cik}:`, error.message);
      return null;
    }
  }

  /**
   * Load and cache the companies directory from SEC
   */
  async loadCompaniesDirectory() {
    const now = Date.now();

    // Check if we have valid cached data
    if (
      this.companiesCache &&
      this.companiesCacheExpiry &&
      now < this.companiesCacheExpiry
    ) {
      return this.companiesCache;
    }

    try {
      // Load company tickers
      const tickerData = await this.makeRequest(
        "/files/company_tickers.json",
        true
      );

      // Load exchange data if available
      let exchangeData = null;
      try {
        exchangeData = await this.makeRequest(
          "/files/company_tickers_exchange.json",
          true
        );
      } catch (e) {
        console.log("Exchange data not available, using ticker data only");
      }

      // Normalize and combine data
      this.companiesCache = this.normalizeCompaniesDirectory(
        tickerData,
        exchangeData
      );
      this.companiesCacheExpiry = now + 24 * 60 * 60 * 1000; // Cache for 24 hours

      console.log(
        `Loaded ${
          Object.keys(this.companiesCache).length
        } companies from SEC directory`
      );
      return this.companiesCache;
    } catch (error) {
      console.error("Failed to load SEC companies directory:", error.message);
      throw new Error("Unable to load SEC companies directory");
    }
  }

  /**
   * Find company matches in the directory
   */
  findCompanyMatches(searchTerm) {
    if (!this.companiesCache) {
      return [];
    }

    const matches = [];
    const searchUpper = searchTerm.toUpperCase();

    // Search through all companies
    for (const [key, company] of Object.entries(this.companiesCache)) {
      let matchScore = 0;
      let matchType = "none";

      // Exact ticker match (highest priority)
      if (company.ticker === searchUpper) {
        matchScore = 100;
        matchType = "ticker_exact";
      }
      // Exact CIK match
      else if (
        company.cik.toString() === searchTerm ||
        company.cik.toString().padStart(10, "0") ===
          searchTerm.padStart(10, "0")
      ) {
        matchScore = 95;
        matchType = "cik_exact";
      }
      // Company name exact match
      else if (company.title.toUpperCase() === searchUpper) {
        matchScore = 90;
        matchType = "name_exact";
      }
      // Company name starts with search term
      else if (company.title.toUpperCase().startsWith(searchUpper)) {
        matchScore = 80;
        matchType = "name_starts";
      }
      // Company name contains search term
      else if (company.title.toUpperCase().includes(searchUpper)) {
        matchScore = 70;
        matchType = "name_contains";
      }
      // Ticker contains search term
      else if (company.ticker.includes(searchUpper)) {
        matchScore = 60;
        matchType = "ticker_contains";
      }

      if (matchScore > 0) {
        matches.push({
          ...company,
          matchScore,
          matchType,
        });
      }
    }

    // Sort by match score (descending) and return
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Make rate-limited request to SEC API
   */
  async makeRequest(endpoint, isFileDownload = false, retries = 3) {
    const url = isFileDownload
      ? `https://www.sec.gov${endpoint}`
      : `${this.baseUrl}${endpoint}`;

    // Rate limiting
    await this.waitForRateLimit();

    const headers = {
      "User-Agent": this.userAgent,
      Accept: "application/json",
      Host: isFileDownload ? "www.sec.gov" : "data.sec.gov",
    };

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
        if (response.status === 429) {
          this.stats.rateLimitHits++;
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 2000; // Longer backoff for SEC
            console.log(
              `SEC rate limit hit. Waiting ${delay}ms before retry ${attempt}/${retries}`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error("SEC rate limit exceeded - Please try again later");
        } else if (response.status === 404) {
          throw new Error("SEC data not found for the requested entity");
        } else if (response.status >= 500) {
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(
              `SEC server error ${response.status}. Retrying in ${delay}ms`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`SEC server error: ${response.status}`);
        } else {
          throw new Error(`SEC API error: ${response.status}`);
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
   * Rate limiting implementation for SEC's 10 requests per second limit
   */
  async waitForRateLimit() {
    const now = Date.now();

    // Remove requests older than 1 second
    this.requestTimes = this.requestTimes.filter((time) => now - time < 1000);

    // If we're at the limit, wait
    if (this.requestTimes.length >= this.rateLimitPerSecond) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = 1000 - (now - oldestRequest) + 100; // Add 100ms buffer

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Normalize companies directory data
   */
  normalizeCompaniesDirectory(tickerData, exchangeData) {
    const companies = {};

    // Process ticker data
    if (tickerData) {
      Object.values(tickerData).forEach((company) => {
        if (company.cik_str && company.ticker && company.title) {
          const cik = parseInt(company.cik_str);
          companies[cik] = {
            cik: cik,
            ticker: company.ticker.toUpperCase(),
            title: company.title,
            exchange: null,
          };
        }
      });
    }

    // Enhance with exchange data if available
    if (exchangeData && exchangeData.data) {
      exchangeData.data.forEach((company) => {
        if (company.cik && companies[company.cik]) {
          companies[company.cik].exchange = company.exchange;
        }
      });
    }

    return companies;
  }

  /**
   * Normalize search response
   */
  normalizeSearchResponse(matches, searchTerm) {
    // Calculate confidence boost based on match quality
    let confidenceBoost = 0;
    let exactMatches = 0;

    matches.forEach((match) => {
      if (match.matchScore >= 90) {
        exactMatches++;
      }
    });

    if (exactMatches > 0) {
      confidenceBoost = 25; // Very high confidence for public companies
    } else if (matches.length > 0) {
      confidenceBoost = 15; // Good confidence for partial matches
    }

    return {
      found: matches.length > 0,
      totalResults: matches.length,
      exactMatches,
      companies: matches.map((company) => ({
        cik: company.cik,
        ticker: company.ticker,
        companyName: company.title,
        exchange: company.exchange,
        matchScore: company.matchScore,
        matchType: company.matchType,

        // Enhanced data if available
        companyFacts: company.companyFacts || null,
        latestFilings: company.latestFilings || null,

        // Validation metadata
        source: "SEC EDGAR Database",
        sourceId: company.cik,
        lastVerified: new Date().toISOString(),
        dataQuality: "official_government_record",
        isPublicCompany: true,
      })),

      // ProspectPro metadata
      source: "SEC EDGAR Database",
      apiCost: this.costPerRequest,
      qualityScore: this.qualityScore,
      confidenceBoost,
      searchTerm,

      // Performance metrics
      cached: false,
      processingTime: Date.now(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Normalize company facts data
   */
  normalizeCompanyFacts(factsData) {
    if (!factsData || !factsData.facts) {
      return null;
    }

    const facts = factsData.facts;
    const dei = facts.dei || {}; // Document and Entity Information
    const usGaap = facts["us-gaap"] || {}; // US GAAP data

    return {
      entityName: dei.EntityRegistrantName?.units?.USD?.[0]?.val || null,
      businessDescription:
        dei.EntityBusinessDescription?.units?.USD?.[0]?.val || null,
      sicCode: dei.EntityCentralIndexKey?.units?.USD?.[0]?.val || null,

      // Financial highlights (latest available)
      financialData: this.extractLatestFinancialData(usGaap),

      // Entity information
      entityInfo: {
        fiscalYearEnd:
          dei.EntityFiscalYearEndMonthOfYear?.units?.USD?.[0]?.val || null,
        commonStockShares:
          dei.EntityCommonStockSharesOutstanding?.units?.shares?.[0]?.val ||
          null,
        publicFloat: dei.EntityPublicFloat?.units?.USD?.[0]?.val || null,
      },

      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Extract latest financial data from US GAAP facts
   */
  extractLatestFinancialData(usGaap) {
    const financialData = {};

    const keyMetrics = [
      "Revenues",
      "RevenueFromContractWithCustomerExcludingAssessedTax",
      "NetIncomeLoss",
      "Assets",
      "AssetsCurrent",
      "Liabilities",
      "StockholdersEquity",
      "CashAndCashEquivalentsAtCarryingValue",
    ];

    keyMetrics.forEach((metric) => {
      if (usGaap[metric] && usGaap[metric].units && usGaap[metric].units.USD) {
        const latestValue = usGaap[metric].units.USD.sort(
          (a, b) => new Date(b.end) - new Date(a.end)
        )[0];

        if (latestValue) {
          financialData[metric] = {
            value: latestValue.val,
            period: latestValue.end,
            form: latestValue.form,
          };
        }
      }
    });

    return Object.keys(financialData).length > 0 ? financialData : null;
  }

  /**
   * Extract latest filings information
   */
  extractLatestFilings(submissionData, limit) {
    if (!submissionData.filings || !submissionData.filings.recent) {
      return null;
    }

    const recent = submissionData.filings.recent;
    const filings = [];

    for (let i = 0; i < Math.min(limit, recent.form.length); i++) {
      filings.push({
        form: recent.form[i],
        filingDate: recent.filingDate[i],
        reportDate: recent.reportDate[i],
        accessionNumber: recent.accessionNumber[i],
        fileNumber: recent.fileNumber[i],
        filmNumber: recent.filmNumber[i],
        description: recent.description?.[i] || null,
        size: recent.size?.[i] || null,
        isXBRL: recent.isXBRL?.[i] === 1,
        isInlineXBRL: recent.isInlineXBRL?.[i] === 1,
      });
    }

    return filings;
  }

  /**
   * Create empty response for no matches
   */
  createEmptyResponse(searchTerm) {
    return {
      found: false,
      totalResults: 0,
      exactMatches: 0,
      companies: [],
      source: "SEC EDGAR Database",
      apiCost: this.costPerRequest,
      qualityScore: 0,
      confidenceBoost: 0,
      searchTerm,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      ...this.stats,
      rateLimitStatus: {
        currentSecondRequests: this.requestTimes.length,
        secondLimit: this.rateLimitPerSecond,
        nextAvailableTime:
          this.requestTimes.length >= this.rateLimitPerSecond
            ? new Date(Math.min(...this.requestTimes) + 1000).toISOString()
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
        companiesLoaded: this.companiesCache
          ? Object.keys(this.companiesCache).length
          : 0,
      },
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.companiesCache = null;
    this.companiesCacheExpiry = null;
    console.log("SEC EDGAR API cache cleared");
  }
}

module.exports = EnhancedSECEdgarClient;
