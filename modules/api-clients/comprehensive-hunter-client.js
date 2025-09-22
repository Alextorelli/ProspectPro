/**
 * COMPREHENSIVE HUNTER.IO CLIENT V3.0
 * 
 * Optimized integr    // Performance tracking
    this.stats = {
      totalCost: 0,
      totalRequests: 0,
      endpointUsage: {},
      emailsDiscovered: 0,
      companiesEnriched: 0,
      personsEnriched: 0,
    };

    // Circuit breaker states
    this.circuitBreakers = {};
    
    // Initialize circuit breakers and stats
    this.initializeCircuitBreakers();LL Hunter.io API v2 features:
 * ✅ Domain Search (implemented)
 * ✅ Email Finder (implemented) 
 * ✅ Email Verifier (implemented)
 * 🆕 Company Enrichment (new)
 * 🆕 Person Enrichment (new)
 * 🆕 Combined Enrichment (new)
 * 🆕 Discover API (new)
 * 🆕 Email Count (new)
 * 🆕 Advanced Search Parameters (new)
 * 
 * Features:
 * - Complete API coverage with all endpoints
 * - Intelligent cost optimization strategies
 * - Advanced circuit breaker with per-endpoint tracking
 * - Comprehensive data enrichment pipeline
 * - Smart email prioritization and verification
 * - Company and person intelligence gathering
 * - Lead scoring with enriched data
 */

const axios = require("axios");
const { performance } = require("perf_hooks");

class ComprehensiveHunterClient {
  constructor(apiKey, config = {}) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.hunter.io/v2";

    this.config = {
      // Budget Management
      maxDailyCost: config.maxDailyCost || 15.0,
      maxPerLeadCost: config.maxPerLeadCost || 1.0,

      // API Costs (per Hunter.io pricing)
      costs: {
        domainSearch: 0.034, // Updated pricing
        emailFinder: 0.034, // Updated pricing
        emailVerifier: 0.01, // Updated pricing
        personEnrichment: 0.034, // Updated pricing
        companyEnrichment: 0.034, // Updated pricing
        combinedEnrichment: 0.068, // Updated pricing
        discover: 0.0, // FREE
        emailCount: 0.0, // FREE
      },

      // Quality Thresholds
      minEmailConfidence: 75,
      minVerificationScore: 80,
      maxEmailsPerDomain: 10,
      maxEnrichmentRequests: 3,

      // Rate Limiting
      maxConcurrentRequests: 3,
      baseDelay: 800, // ms between requests

      // Circuit Breaker per endpoint
      circuitBreakerThreshold: 3,
      recoveryTimeoutMs: 180000, // 3 minutes

      ...config,
    };

    // Performance tracking
    this.stats = {
      totalCost: 0,
      totalRequests: 0,
      endpointUsage: {},
      emailsDiscovered: 0,
      companiesEnriched: 0,
      personsEnriched: 0,
    };

    // Per-endpoint circuit breakers
    this.circuitBreakers = {};
    this.initializeCircuitBreakers();

    console.log("🚀 Comprehensive Hunter.io Client V3.0 initialized");
    console.log(`   💰 Budget: $${this.config.maxDailyCost}/day`);
    console.log(`   🎯 Min Confidence: ${this.config.minEmailConfidence}%`);
    console.log(`   📊 All API endpoints enabled`);
  }

  initializeCircuitBreakers() {
    const endpoints = [
      "domainSearch",
      "emailFinder",
      "emailVerifier",
      "personEnrichment",
      "companyEnrichment",
      "combinedEnrichment",
      "discover",
      "emailCount",
    ];

    endpoints.forEach((endpoint) => {
      this.circuitBreakers[endpoint] = {
        state: "CLOSED",
        failures: 0,
        lastFailureTime: null,
        successCount: 0,
      };

      // Initialize endpoint usage stats
      this.stats.endpointUsage[endpoint] = 0;
    });
  }

  /**
   * COMPREHENSIVE EMAIL DISCOVERY PIPELINE
   * Uses all Hunter.io capabilities in intelligent sequence
   */
  async comprehensiveEmailDiscovery(businessData) {
    const startTime = performance.now();

    console.log(
      `🔍 Comprehensive Hunter.io discovery: ${businessData.business_name}`
    );

    const result = {
      business_name: businessData.business_name,
      domain: this.extractDomain(businessData.website),

      // Email discovery results
      emails: [],
      emailPatterns: [],
      emailCount: 0,

      // Enrichment results
      companyData: null,
      personData: [],
      combinedData: [],

      // Discovery results
      similarCompanies: [],

      // Metrics
      total_cost: 0,
      api_calls_made: 0,
      confidence_score: 0,
      processing_time: 0,
      success: false,
      endpoints_used: [],
      error: null,
    };

    try {
      if (!result.domain || this.isInvalidDomain(result.domain)) {
        throw new Error(`Invalid domain: ${result.domain}`);
      }

      // STAGE 1: Email Count (FREE) - Check if domain has emails
      console.log(`📊 Checking email availability for: ${result.domain}`);
      const emailCount = await this.getEmailCount(result.domain);
      if (emailCount) {
        result.emailCount = emailCount.total;
        result.endpoints_used.push("emailCount");

        if (emailCount.total === 0) {
          console.log(`⚠️ No emails available for ${result.domain}`);
          result.success = false;
          return result;
        }

        console.log(
          `📈 Found ${emailCount.total} emails available (${emailCount.personal_emails} personal)`
        );
      }

      // STAGE 2: Company Enrichment (PAID) - Get rich company data
      if (this.canMakeRequest("companyEnrichment")) {
        console.log(`🏢 Enriching company data: ${result.domain}`);
        const companyData = await this.enrichCompanyData(result.domain);

        if (companyData) {
          result.companyData = companyData;
          result.total_cost += this.config.costs.companyEnrichment;
          result.api_calls_made++;
          result.endpoints_used.push("companyEnrichment");

          // Use company data to enhance business profile
          this.enhanceBusinessWithCompanyData(businessData, companyData);
        }
      }

      // STAGE 3: Domain Search (PAID) - Get email patterns and addresses
      if (this.canMakeRequest("domainSearch")) {
        console.log(`🔍 Domain search: ${result.domain}`);
        const domainResult = await this.comprehensiveDomainSearch(
          result.domain,
          businessData
        );

        if (domainResult?.emails?.length > 0) {
          result.emails.push(...domainResult.emails);
          result.emailPatterns = domainResult.patterns || [];
          result.total_cost += this.config.costs.domainSearch;
          result.api_calls_made++;
          result.endpoints_used.push("domainSearch");

          console.log(
            `✅ Domain search found ${domainResult.emails.length} emails`
          );
        }
      }

      // STAGE 4: Targeted Email Finder (PAID) - Find specific person emails
      if (businessData.owner_name && this.canMakeRequest("emailFinder")) {
        const ownerEmail = await this.findPersonEmail(
          result.domain,
          businessData.owner_name
        );

        if (ownerEmail && !this.isDuplicateEmail(ownerEmail, result.emails)) {
          result.emails.push(ownerEmail);
          result.total_cost += this.config.costs.emailFinder;
          result.api_calls_made++;
          result.endpoints_used.push("emailFinder");

          console.log(`👤 Found owner email: ${ownerEmail.value}`);
        }
      }

      // STAGE 5: Email Verification (PAID) - Verify high-priority emails
      if (result.emails.length > 0) {
        const verifiedEmails = await this.verifyPriorityEmails(result.emails);
        result.emails = verifiedEmails.emails;
        result.total_cost += verifiedEmails.cost;
        result.api_calls_made += verifiedEmails.verifications;

        if (verifiedEmails.verifications > 0) {
          result.endpoints_used.push("emailVerifier");
        }
      }

      // STAGE 6: Person Enrichment (PAID) - Get rich person data
      if (result.emails.length > 0 && this.canMakeRequest("personEnrichment")) {
        const personEnrichments = await this.enrichPersonData(
          result.emails.slice(0, 3) // Top 3 emails only to control costs
        );

        if (personEnrichments.length > 0) {
          result.personData = personEnrichments;
          result.total_cost +=
            personEnrichments.length * this.config.costs.personEnrichment;
          result.api_calls_made += personEnrichments.length;
          result.endpoints_used.push("personEnrichment");
        }
      }

      // STAGE 7: Combined Enrichment (PAID) - Get person + company data
      const topEmail = this.getTopPriorityEmail(result.emails);
      if (topEmail && this.canMakeRequest("combinedEnrichment")) {
        console.log(`🔗 Combined enrichment for: ${topEmail.value}`);
        const combinedData = await this.getCombinedEnrichment(topEmail.value);

        if (combinedData) {
          result.combinedData.push(combinedData);
          result.total_cost += this.config.costs.combinedEnrichment;
          result.api_calls_made++;
          result.endpoints_used.push("combinedEnrichment");
        }
      }

      // STAGE 8: Company Discovery (FREE) - Find similar companies
      if (result.companyData?.industry) {
        console.log(
          `🏭 Discovering similar companies in: ${result.companyData.industry}`
        );
        const similarCompanies = await this.discoverSimilarCompanies(
          result.companyData
        );

        if (similarCompanies?.length > 0) {
          result.similarCompanies = similarCompanies.slice(0, 5);
          result.endpoints_used.push("discover");

          console.log(`🎯 Found ${similarCompanies.length} similar companies`);
        }
      }

      // Calculate final metrics
      result.confidence_score = this.calculateComprehensiveConfidence(result);
      result.processing_time = performance.now() - startTime;
      result.success =
        result.emails.length > 0 &&
        result.confidence_score >= this.config.minEmailConfidence;

      // Update statistics
      this.updateStats(result);

      console.log(`✅ Comprehensive discovery complete:`);
      console.log(`   📧 ${result.emails.length} emails discovered`);
      console.log(`   🏢 ${result.companyData ? 1 : 0} company enriched`);
      console.log(`   👥 ${result.personData.length} persons enriched`);
      console.log(`   💰 $${result.total_cost.toFixed(3)} total cost`);
      console.log(`   🎯 ${result.confidence_score}% confidence`);
      console.log(
        `   🚀 ${
          result.endpoints_used.length
        } endpoints used: ${result.endpoints_used.join(", ")}`
      );

      return result;
    } catch (error) {
      console.error(`❌ Comprehensive discovery failed: ${error.message}`);
      result.error = error.message;
      result.processing_time = performance.now() - startTime;
      return result;
    }
  }

  /**
   * EMAIL COUNT API (FREE)
   * Check how many emails are available for a domain before searching
   */
  async getEmailCount(domain) {
    if (!this.isEndpointAvailable("emailCount")) return null;

    try {
      const response = await this.makeApiRequest("GET", "email-count", {
        domain: domain,
      });

      if (response.data) {
        this.recordEndpointSuccess("emailCount");
        return {
          total: response.data.total || 0,
          personal_emails: response.data.personal_emails || 0,
          generic_emails: response.data.generic_emails || 0,
          department_breakdown: response.data.department || {},
          seniority_breakdown: response.data.seniority || {},
        };
      }

      return null;
    } catch (error) {
      this.recordEndpointFailure("emailCount", error);
      throw error;
    }
  }

  /**
   * COMPANY ENRICHMENT API (PAID)
   * Get comprehensive company data
   */
  async enrichCompanyData(domain) {
    if (!this.isEndpointAvailable("companyEnrichment")) return null;

    try {
      const response = await this.makeApiRequest("GET", "companies/find", {
        domain: domain,
      });

      if (response.data) {
        this.recordEndpointSuccess("companyEnrichment");

        return {
          name: response.data.name,
          domain: response.data.domain,
          industry: response.data.category?.industry,
          employees: response.data.metrics?.employees,
          revenue: response.data.metrics?.estimatedAnnualRevenue,
          location: response.data.location,
          phone: response.data.phone,
          description: response.data.description,
          founded_year: response.data.foundedYear,
          technologies: response.data.tech || [],
          social_profiles: {
            linkedin: response.data.linkedin?.handle,
            twitter: response.data.twitter?.handle,
            facebook: response.data.facebook?.handle,
          },
          headcount_range: response.data.metrics?.employees,
          funding_info: response.data.fundingRounds || [],
        };
      }

      return null;
    } catch (error) {
      this.recordEndpointFailure("companyEnrichment", error);
      console.warn(
        `⚠️ Company enrichment failed for ${domain}: ${error.message}`
      );
      return null;
    }
  }

  /**
   * PERSON ENRICHMENT API (PAID)
   * Get comprehensive person data from email addresses
   */
  async enrichPersonData(emails) {
    const enrichedPersons = [];

    for (const email of emails) {
      if (!this.canMakeRequest("personEnrichment")) break;

      try {
        const response = await this.makeApiRequest("GET", "people/find", {
          email: email.value,
        });

        if (response.data) {
          this.recordEndpointSuccess("personEnrichment");

          enrichedPersons.push({
            email: email.value,
            name: {
              full: response.data.name?.fullName,
              first: response.data.name?.givenName,
              last: response.data.name?.familyName,
            },
            location: response.data.location,
            employment: {
              title: response.data.employment?.title,
              company: response.data.employment?.name,
              domain: response.data.employment?.domain,
              seniority: response.data.employment?.seniority,
              role: response.data.employment?.role,
            },
            social_profiles: {
              linkedin: response.data.linkedin?.handle,
              twitter: response.data.twitter?.handle,
              github: response.data.github?.handle,
            },
            phone: response.data.phone,
            timezone: response.data.timeZone,
          });
        }

        // Rate limiting
        await this.delay(this.config.baseDelay);
      } catch (error) {
        this.recordEndpointFailure("personEnrichment", error);
        console.warn(
          `⚠️ Person enrichment failed for ${email.value}: ${error.message}`
        );
      }
    }

    return enrichedPersons;
  }

  /**
   * COMBINED ENRICHMENT API (PAID)
   * Get both person and company data in one call
   */
  async getCombinedEnrichment(email) {
    if (!this.isEndpointAvailable("combinedEnrichment")) return null;

    try {
      const response = await this.makeApiRequest("GET", "combined/find", {
        email: email,
      });

      if (response.data) {
        this.recordEndpointSuccess("combinedEnrichment");

        return {
          person: {
            email: response.data.person?.email,
            name: response.data.person?.name?.fullName,
            location: response.data.person?.location,
            employment: response.data.person?.employment,
            social_profiles: {
              linkedin: response.data.person?.linkedin?.handle,
              twitter: response.data.person?.twitter?.handle,
            },
          },
          company: {
            name: response.data.company?.name,
            domain: response.data.company?.domain,
            industry: response.data.company?.category?.industry,
            employees: response.data.company?.metrics?.employees,
            location: response.data.company?.location,
            description: response.data.company?.description,
            technologies: response.data.company?.tech || [],
          },
        };
      }

      return null;
    } catch (error) {
      this.recordEndpointFailure("combinedEnrichment", error);
      console.warn(
        `⚠️ Combined enrichment failed for ${email}: ${error.message}`
      );
      return null;
    }
  }

  /**
   * DISCOVER API (FREE)
   * Find companies matching criteria
   */
  async discoverSimilarCompanies(companyData) {
    if (!this.isEndpointAvailable("discover")) return null;

    try {
      const searchCriteria = {
        industry: {
          include: [companyData.industry],
        },
        headcount: this.getHeadcountRange(companyData.employees),
      };

      // Add location if available
      if (companyData.location) {
        searchCriteria.headquarters_location = {
          include: [{ city: this.extractCity(companyData.location) }],
        };
      }

      const response = await this.makeApiRequest(
        "POST",
        "discover",
        searchCriteria
      );

      if (response.data && Array.isArray(response.data)) {
        this.recordEndpointSuccess("discover");

        return response.data.map((company) => ({
          domain: company.domain,
          organization: company.organization,
          email_count: company.emails_count?.total || 0,
          personal_emails: company.emails_count?.personal || 0,
        }));
      }

      return [];
    } catch (error) {
      this.recordEndpointFailure("discover", error);
      console.warn(`⚠️ Company discovery failed: ${error.message}`);
      return [];
    }
  }

  /**
   * COMPREHENSIVE DOMAIN SEARCH with advanced parameters
   */
  async comprehensiveDomainSearch(domain, businessData) {
    if (!this.isEndpointAvailable("domainSearch")) return null;

    try {
      const searchParams = {
        domain: domain,
        limit: this.config.maxEmailsPerDomain,
        offset: 0,
        type: "personal", // Focus on personal emails first
      };

      // Add advanced parameters based on business data
      if (businessData.industry) {
        // Target specific departments based on industry
        searchParams.department = this.getTargetDepartments(
          businessData.industry
        );
      }

      // Target senior-level contacts
      searchParams.seniority = "senior,executive";

      // Require full names and positions for better quality
      searchParams.required_field = "full_name,position";

      const response = await this.makeApiRequest(
        "GET",
        "domain-search",
        searchParams
      );

      if (response.data?.emails) {
        this.recordEndpointSuccess("domainSearch");

        return {
          emails: this.processEmailResults(response.data.emails),
          patterns: [response.data.pattern],
          organization: response.data.organization,
          domain_info: {
            disposable: response.data.disposable,
            webmail: response.data.webmail,
            accept_all: response.data.accept_all,
          },
        };
      }

      return null;
    } catch (error) {
      this.recordEndpointFailure("domainSearch", error);
      throw error;
    }
  }

  /**
   * Enhanced email verification with batch processing
   */
  async verifyPriorityEmails(emails) {
    const result = {
      emails: [],
      cost: 0,
      verifications: 0,
    };

    // Sort emails by priority
    const priorityEmails = this.prioritizeEmailsForVerification(emails);
    const emailsToVerify = priorityEmails.slice(0, 5); // Limit to control costs

    console.log(`🔍 Verifying ${emailsToVerify.length} priority emails...`);

    for (const email of emailsToVerify) {
      if (!this.canMakeRequest("emailVerifier")) break;

      try {
        const verification = await this.verifyEmail(email.value);

        if (verification) {
          result.cost += this.config.costs.emailVerifier;
          result.verifications++;

          // Update email with verification data
          const updatedEmail = {
            ...email,
            verification: verification,
            confidence: this.combineConfidenceScores(
              email.confidence || 50,
              verification.score || 0
            ),
            deliverability: verification.status,
            is_valid: verification.status === "valid",
          };

          result.emails.push(updatedEmail);
        } else {
          result.emails.push(email);
        }

        await this.delay(this.config.baseDelay);
      } catch (error) {
        console.warn(
          `⚠️ Email verification failed for ${email.value}: ${error.message}`
        );
        result.emails.push(email);
      }
    }

    // Add non-verified emails
    const nonVerifiedEmails = emails.filter(
      (email) => !emailsToVerify.includes(email)
    );
    result.emails.push(...nonVerifiedEmails);

    return result;
  }

  /**
   * API Request wrapper with circuit breaker
   */
  async makeApiRequest(method, endpoint, params = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    const config = {
      method: method,
      url: url,
      timeout: 15000,
      headers: {
        Accept: "application/json",
        "User-Agent": "ProspectPro/3.0",
      },
    };

    // Add API key and parameters
    if (method === "GET") {
      config.params = { ...params, api_key: this.apiKey };
    } else {
      config.data = params;
      config.params = { api_key: this.apiKey };
    }

    const response = await axios(config);
    return response.data;
  }

  /**
   * Circuit breaker and budget management
   */
  isEndpointAvailable(endpoint) {
    const breaker = this.circuitBreakers[endpoint];
    const currentTime = Date.now();

    // Check circuit breaker state
    if (breaker.state === "OPEN") {
      if (
        currentTime - breaker.lastFailureTime >
        this.config.recoveryTimeoutMs
      ) {
        breaker.state = "HALF_OPEN";
        console.log(`🔄 ${endpoint} circuit breaker: HALF_OPEN`);
        return true;
      }
      return false;
    }

    return true;
  }

  canMakeRequest(endpoint) {
    // Check budget
    if (this.stats.totalCost >= this.config.maxDailyCost) {
      console.warn(`💰 Daily budget exceeded: $${this.stats.totalCost}`);
      return false;
    }

    // Check endpoint-specific cost
    const estimatedCost = this.config.costs[endpoint] || 0;
    if (this.stats.totalCost + estimatedCost > this.config.maxDailyCost) {
      console.warn(`💰 Endpoint ${endpoint} would exceed budget`);
      return false;
    }

    return this.isEndpointAvailable(endpoint);
  }

  recordEndpointSuccess(endpoint) {
    const breaker = this.circuitBreakers[endpoint];

    if (breaker.state === "HALF_OPEN") {
      breaker.successCount++;
      if (breaker.successCount >= 2) {
        breaker.state = "CLOSED";
        breaker.failures = 0;
        console.log(`✅ ${endpoint} circuit breaker: CLOSED (recovered)`);
      }
    } else {
      breaker.failures = Math.max(0, breaker.failures - 1);
    }

    this.stats.endpointUsage[endpoint]++;
  }

  recordEndpointFailure(endpoint, error) {
    const breaker = this.circuitBreakers[endpoint];
    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= this.config.circuitBreakerThreshold) {
      breaker.state = "OPEN";
      console.error(
        `🚫 ${endpoint} circuit breaker: OPEN (${breaker.failures} failures)`
      );
    }
  }

  /**
   * Business intelligence and scoring
   */
  calculateComprehensiveConfidence(result) {
    let score = 0;
    let factors = 0;

    // Email quality and quantity
    if (result.emails.length > 0) {
      const avgEmailConfidence =
        result.emails.reduce(
          (sum, email) => sum + (email.confidence || 50),
          0
        ) / result.emails.length;
      score += avgEmailConfidence * 0.4;
      factors += 0.4;
    }

    // Company enrichment data quality
    if (result.companyData) {
      let companyScore = 0;
      if (result.companyData.phone) companyScore += 25;
      if (result.companyData.industry) companyScore += 20;
      if (result.companyData.employees) companyScore += 15;
      if (result.companyData.description) companyScore += 10;
      if (result.companyData.founded_year) companyScore += 10;

      score += companyScore * 0.3;
      factors += 0.3;
    }

    // Person enrichment data quality
    if (result.personData.length > 0) {
      let personScore = 0;
      result.personData.forEach((person) => {
        if (person.employment?.title) personScore += 15;
        if (person.phone) personScore += 20;
        if (person.social_profiles?.linkedin) personScore += 10;
      });

      score += Math.min(100, personScore) * 0.2;
      factors += 0.2;
    }

    // Email verification quality
    const verifiedEmails = result.emails.filter(
      (email) => email.verification?.status === "valid"
    );
    if (verifiedEmails.length > 0) {
      score += (verifiedEmails.length / result.emails.length) * 100 * 0.1;
      factors += 0.1;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  }

  /**
   * Utility functions
   */
  enhanceBusinessWithCompanyData(businessData, companyData) {
    businessData.enriched_company_data = companyData;

    // Update business data with enriched information
    if (!businessData.phone && companyData.phone) {
      businessData.phone = companyData.phone;
    }
    if (!businessData.industry && companyData.industry) {
      businessData.industry = companyData.industry;
    }
    if (!businessData.employee_count && companyData.employees) {
      businessData.employee_count = companyData.employees;
    }
  }

  getTargetDepartments(industry) {
    const departmentMap = {
      technology: "it,executive",
      healthcare: "health,executive",
      finance: "finance,executive",
      retail: "sales,marketing,executive",
      manufacturing: "operations,executive",
      "real estate": "sales,executive",
      legal: "legal,executive",
    };

    return departmentMap[industry.toLowerCase()] || "executive,management";
  }

  getHeadcountRange(employees) {
    if (!employees) return ["1-10", "11-50"];

    const ranges = {
      "1-10": ["1-10"],
      "11-50": ["11-50"],
      "51-200": ["51-200"],
      "201-500": ["201-500"],
      "501-1000": ["501-1000"],
      "1001-5000": ["1001-5000"],
      "5001-10000": ["5001-10000"],
      "10K-50K": ["5001-10000", "10001+"],
    };

    return ranges[employees] || ["11-50", "51-200"];
  }

  extractCity(location) {
    // Simple city extraction - enhance as needed
    return location.split(",")[0].trim();
  }

  prioritizeEmailsForVerification(emails) {
    return emails.sort((a, b) => {
      // Priority: personal > professional > generic
      const typeScore = { personal: 3, professional: 2, generic: 1 };
      const aScore = (typeScore[a.type] || 1) * (a.confidence || 50);
      const bScore = (typeScore[b.type] || 1) * (b.confidence || 50);
      return bScore - aScore;
    });
  }

  getTopPriorityEmail(emails) {
    if (!emails || emails.length === 0) return null;

    // Find highest confidence email with verification
    const verifiedEmails = emails.filter(
      (email) => email.verification?.status === "valid"
    );
    if (verifiedEmails.length > 0) {
      return verifiedEmails.sort(
        (a, b) => (b.confidence || 0) - (a.confidence || 0)
      )[0];
    }

    // Return highest confidence email
    return emails.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
  }

  combineConfidenceScores(emailScore, verificationScore) {
    // Weighted combination: 60% email discovery confidence, 40% verification score
    return Math.round(emailScore * 0.6 + verificationScore * 0.4);
  }

  updateStats(result) {
    this.stats.totalCost += result.total_cost;
    this.stats.totalRequests++;
    this.stats.emailsDiscovered += result.emails.length;

    if (result.companyData) this.stats.companiesEnriched++;
    if (result.personData.length > 0)
      this.stats.personsEnriched += result.personData.length;
  }

  // Inherited utility functions
  extractDomain(website) {
    if (!website) return null;
    try {
      const url = website.startsWith("http") ? website : `https://${website}`;
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return null;
    }
  }

  isInvalidDomain(domain) {
    const invalidPatterns = [
      "localhost",
      "127.0.0.1",
      "example.com",
      "test.com",
      "facebook.com",
      "instagram.com",
      "twitter.com",
      "linkedin.com",
    ];
    return (
      !domain || invalidPatterns.some((pattern) => domain.includes(pattern))
    );
  }

  processEmailResults(emails) {
    if (!emails || !Array.isArray(emails)) return [];

    return emails
      .filter((email) => email?.value && this.isValidEmailFormat(email.value))
      .map((email) => ({
        value: email.value,
        type: email.type || "professional",
        confidence: email.confidence || 50,
        sources: email.sources?.map((s) => s.domain) || ["hunter_io"],
        first_name: email.first_name,
        last_name: email.last_name,
        position: email.position,
        department: email.department,
        seniority: email.seniority,
        linkedin: email.linkedin,
        phone_number: email.phone_number,
        verification: email.verification,
      }))
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }

  isValidEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isDuplicateEmail(newEmail, existingEmails) {
    return existingEmails.some(
      (existing) =>
        existing.value.toLowerCase() === newEmail.value.toLowerCase()
    );
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async verifyEmail(email) {
    try {
      const response = await this.makeApiRequest("GET", "email-verifier", {
        email,
      });

      if (response.data) {
        this.recordEndpointSuccess("emailVerifier");

        return {
          status: response.data.status,
          result: response.data.result,
          score: response.data.score || 0,
          deliverable: response.data.result === "deliverable",
          mx_records: response.data.mx_records,
          smtp_check: response.data.smtp_check,
          disposable: response.data.disposable,
          webmail: response.data.webmail,
        };
      }

      return null;
    } catch (error) {
      this.recordEndpointFailure("emailVerifier", error);
      throw error;
    }
  }

  async findPersonEmail(domain, fullName) {
    if (!this.isEndpointAvailable("emailFinder")) return null;

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    if (!firstName || !lastName) return null;

    try {
      const response = await this.makeApiRequest("GET", "email-finder", {
        domain,
        first_name: firstName,
        last_name: lastName,
      });

      if (response.data?.email) {
        this.recordEndpointSuccess("emailFinder");

        return {
          value: response.data.email,
          type: "personal",
          confidence: response.data.score || 75,
          sources: ["hunter_io_finder"],
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          position: response.data.position,
        };
      }

      return null;
    } catch (error) {
      this.recordEndpointFailure("emailFinder", error);
      throw error;
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  getComprehensiveStats() {
    const totalEndpointCalls = Object.values(this.stats.endpointUsage).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      ...this.stats,
      averageCostPerRequest:
        this.stats.totalRequests > 0
          ? (this.stats.totalCost / this.stats.totalRequests).toFixed(3)
          : "0.000",
      averageEmailsPerRequest:
        this.stats.totalRequests > 0
          ? (this.stats.emailsDiscovered / this.stats.totalRequests).toFixed(1)
          : "0.0",
      endpointUtilization: this.stats.endpointUsage,
      circuitBreakerStatus: Object.keys(this.circuitBreakers).reduce(
        (status, endpoint) => {
          status[endpoint] = this.circuitBreakers[endpoint].state;
          return status;
        },
        {}
      ),
      budgetUtilization: `${(
        (this.stats.totalCost / this.config.maxDailyCost) *
        100
      ).toFixed(1)}%`,
      remainingBudget: `$${(
        this.config.maxDailyCost - this.stats.totalCost
      ).toFixed(2)}`,
    };
  }
}

module.exports = ComprehensiveHunterClient;
