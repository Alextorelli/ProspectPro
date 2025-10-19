/**
 * Enhanced Batch Processor for ProspectPro Multi-Source Operations
 * Handles batching of email verification, website scraping, and multi-source API operations
 * Updated to support Foursquare + Google Places multi-source discovery pipeline
 */

const pLimit = require("p-limit");
const { globalCache, TTLCache } = require("./cache-ttl-manager");
const logger = require("./logger");

class BatchProcessor {
  constructor(config = {}) {
    this.config = {
      emailBatchSize: config.emailBatchSize || 50,
      websiteConcurrency: config.websiteConcurrency || 4,
      googlePlacesConcurrency: config.googlePlacesConcurrency || 6,
      foursquareConcurrency: config.foursquareConcurrency || 8, // Higher for free API
      emailVerificationConcurrency: config.emailVerificationConcurrency || 2,
      multiSourceBatchSize: config.multiSourceBatchSize || 25,
      ...config,
    };

    // Concurrency limiters
    this.websiteLimit = pLimit(this.config.websiteConcurrency);
    this.googleLimit = pLimit(this.config.googlePlacesConcurrency);
    this.foursquareLimit = pLimit(this.config.foursquareConcurrency);
    this.emailLimit = pLimit(this.config.emailVerificationConcurrency);

    // Batch queues
    this.emailQueue = [];
    this.websiteQueue = [];
    this.multiSourceQueue = [];
    this.domainCache = new Map();

    // Multi-source processing stats
    this.multiSourceStats = {
      foursquareHits: 0,
      googleHits: 0,
      crossPlatformMatches: 0,
      totalProcessed: 0,
      cacheSaves: 0,
    };
  }

  /**
   * Batch email verification across multiple businesses
   */
  async batchEmailVerification(businesses, neverBounceClient) {
    logger.info(
      `🔍 Starting batch email verification for ${businesses.length} businesses`
    );

    // Collect all unique emails
    const emailsToVerify = new Set();
    const businessEmailMap = new Map();

    businesses.forEach((business, index) => {
      const emails = this.extractEmailsFromBusiness(business);
      emails.forEach((email) => {
        emailsToVerify.add(email);
        if (!businessEmailMap.has(email)) {
          businessEmailMap.set(email, []);
        }
        businessEmailMap.get(email).push({ business, index });
      });
    });

    const uniqueEmails = Array.from(emailsToVerify);
    logger.info(`📧 Found ${uniqueEmails.length} unique emails to verify`);

    if (uniqueEmails.length === 0) return businesses;

    // Check cache first
    const uncachedEmails = [];
    const cachedResults = new Map();

    uniqueEmails.forEach((email) => {
      const cacheKey = TTLCache.generateKey("email_verify", email);
      const cached = globalCache.get(cacheKey);
      if (cached) {
        cachedResults.set(email, cached);
      } else {
        uncachedEmails.push(email);
      }
    });

    logger.info(
      `💾 Cache hit: ${cachedResults.size}/${uniqueEmails.length} emails`
    );

    // Process uncached emails in batches
    const verificationResults = new Map(cachedResults);

    if (uncachedEmails.length > 0) {
      const batches = this.chunkArray(
        uncachedEmails,
        this.config.emailBatchSize
      );

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        logger.info(
          `📨 Processing email batch ${i + 1}/${batches.length} (${
            batch.length
          } emails)`
        );

        try {
          const batchResults = await this.emailLimit(() =>
            neverBounceClient.verifyEmailBatch(batch)
          );

          // Process and cache results
          batchResults.forEach((result, index) => {
            const email = batch[index];
            const cacheKey = TTLCache.generateKey("email_verify", email);

            // Cache for 1 hour
            globalCache.set(cacheKey, result, 3600000);
            verificationResults.set(email, result);
          });
        } catch (error) {
          logger.error(`❌ Email batch ${i + 1} failed:`, error.message);

          // Mark failed emails as unverified
          batch.forEach((email) => {
            verificationResults.set(email, {
              email,
              result: "unknown",
              error: error.message,
            });
          });
        }
      }
    }

    // Apply results back to businesses
    businessEmailMap.forEach((businessList, email) => {
      const result = verificationResults.get(email);
      businessList.forEach(({ business, index }) => {
        if (!business.emailValidation) {
          business.emailValidation = { results: [] };
        }
        business.emailValidation.results.push({
          email,
          ...result,
        });
      });
    });

    logger.info(
      `✅ Batch email verification complete: ${verificationResults.size} emails processed`
    );
    return businesses;
  }

  /**
   * Batch website scraping with domain-level caching
   */
  async batchWebsiteScraping(businesses, scrapeFunction) {
    logger.info(
      `🌐 Starting batch website scraping for ${businesses.length} businesses`
    );

    // Group businesses by domain
    const domainGroups = new Map();

    businesses.forEach((business, index) => {
      const website = business.website;
      if (!website) return;

      const domain = this.extractDomain(website);
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain).push({ business, index, website });
    });

    logger.info(`🏢 Grouped into ${domainGroups.size} unique domains`);

    // Process domains with concurrency control
    const domainTasks = Array.from(domainGroups.entries()).map(
      ([domain, businessList]) =>
        this.websiteLimit(async () => {
          const cacheKey = TTLCache.generateKey("website_scrape", domain);
          let domainData = globalCache.get(cacheKey);

          if (!domainData) {
            try {
              // Use first website URL for domain scraping
              const sampleWebsite = businessList[0].website;
              domainData = await scrapeFunction(sampleWebsite);

              // Cache for 15 minutes
              globalCache.set(cacheKey, domainData, 900000);
            } catch (error) {
              logger.error(
                `❌ Domain scraping failed for ${domain}:`,
                error.message
              );
              domainData = { error: error.message, status: "failed" };

              // Cache failures for 5 minutes to avoid rapid retries
              globalCache.set(cacheKey, domainData, 300000);
            }
          }

          // Apply domain data to all businesses in this domain
          businessList.forEach(({ business }) => {
            business.websiteScrapeData = {
              domain,
              ...domainData,
              cachedResult: globalCache.has(cacheKey),
            };
          });

          return {
            domain,
            businessCount: businessList.length,
            success: !domainData.error,
          };
        })
    );

    const results = await Promise.allSettled(domainTasks);
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - successful;

    logger.info(
      `✅ Batch website scraping complete: ${successful} domains succeeded, ${failed} failed`
    );
    return businesses;
  }

  /**
   * Batch Google Places details fetching
   */
  async batchGooglePlacesDetails(businesses, googleClient) {
    logger.info(
      `📍 Starting batch Google Places details for ${businesses.length} businesses`
    );

    const placesToFetch = businesses
      .filter((b) => b.place_id && !b.googlePlacesDetails)
      .map((b) => ({ business: b, place_id: b.place_id }));

    if (placesToFetch.length === 0) {
      logger.info(`📍 No places need details fetching`);
      return businesses;
    }

    const detailsTasks = placesToFetch.map(({ business, place_id }) =>
      this.googleLimit(async () => {
        const cacheKey = TTLCache.generateKey("google_details", place_id);
        let details = globalCache.get(cacheKey);

        if (!details) {
          try {
            details = await googleClient.getPlaceDetails(place_id);

            // Cache for 1 hour
            globalCache.set(cacheKey, details, 3600000);
          } catch (error) {
            logger.error(
              `❌ Google Places details failed for ${place_id}:`,
              error.message
            );
            details = { error: error.message, place_id };

            // Cache failures for 15 minutes
            globalCache.set(cacheKey, details, 900000);
          }
        }

        business.googlePlacesDetails = details;
        return { place_id, success: !details.error };
      })
    );

    const results = await Promise.allSettled(detailsTasks);
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - successful;

    logger.info(
      `✅ Batch Google Places details complete: ${successful} succeeded, ${failed} failed`
    );
    return businesses;
  }

  /**
   * Extract emails from business object
   */
  extractEmailsFromBusiness(business) {
    const emails = [];

    if (business.email) emails.push(business.email);
    if (business.companyEmail) emails.push(business.companyEmail);
    if (business.ownerEmail) emails.push(business.ownerEmail);

    // From email discovery results
    if (business.emails && Array.isArray(business.emails)) {
      business.emails.forEach((emailObj) => {
        if (typeof emailObj === "string") {
          emails.push(emailObj);
        } else if (emailObj.value) {
          emails.push(emailObj.value);
        }
      });
    }

    return [...new Set(emails)]; // Remove duplicates
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    if (!url) return null;

    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return null;
    }
  }

  /**
   * Split array into chunks
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get processor statistics
   */
  getStats() {
    return {
      cacheStats: globalCache.getStats
        ? globalCache.getStats()
        : globalCache.stats(),
      config: this.config,
      queues: {
        email: this.emailQueue?.length || 0,
        website: this.websiteQueue?.length || 0,
        multiSource: this.multiSourceQueue?.length || 0,
      },
      multiSourceStats: this.multiSourceStats,
    };
  }

  /**
   * Batch multi-source discovery processing (Foursquare + Google Places)
   * Optimizes API calls by caching and deduplicating across sources
   */
  async batchMultiSourceDiscovery(queries, discoveryClients) {
    const { foursquareClient, googleClient } = discoveryClients;

    logger.info(
      `🔍 Starting batch multi-source discovery for ${queries.length} queries`
    );

    const results = {
      foursquareResults: new Map(),
      googleResults: new Map(),
      mergedBusinesses: [],
      stats: {
        foursquareQueries: 0,
        googleQueries: 0,
        totalBusinesses: 0,
        duplicatesRemoved: 0,
      },
    };

    // Phase 1: Batch Foursquare queries (free/cheap API first)
    if (foursquareClient) {
      const foursquareTasks = queries.map((query) =>
        this.foursquareLimit(async () => {
          const cacheKey = TTLCache.generateKey("foursquare_search", {
            query: query.searchQuery,
            location: query.location,
          });

          let cachedResult = globalCache.get(cacheKey);
          if (cachedResult) {
            this.multiSourceStats.cacheSaves++;
            return { query, result: cachedResult, cached: true };
          }

          try {
            const result = await foursquareClient.searchPlaces(
              query.searchQuery,
              {
                near: query.location,
                limit: query.maxResults || 20,
              }
            );

            globalCache.set(cacheKey, result, 1800000); // 30 minutes cache
            results.stats.foursquareQueries++;
            this.multiSourceStats.foursquareHits += result.places?.length || 0;

            return { query, result, cached: false };
          } catch (error) {
            logger.warn(`Foursquare query failed: ${error.message}`);
            return {
              query,
              result: { found: false, places: [] },
              cached: false,
            };
          }
        })
      );

      const foursquareResults = await Promise.allSettled(foursquareTasks);
      foursquareResults.forEach((result) => {
        if (result.status === "fulfilled") {
          results.foursquareResults.set(
            result.value.query,
            result.value.result
          );
        }
      });
    }

    // Phase 2: Batch Google Places queries (for gaps and validation)
    if (googleClient) {
      const googleTasks = queries.map((query) =>
        this.googleLimit(async () => {
          const cacheKey = TTLCache.generateKey("google_search", {
            query: query.searchQuery,
            location: query.location,
          });

          let cachedResult = globalCache.get(cacheKey);
          if (cachedResult) {
            this.multiSourceStats.cacheSaves++;
            return { query, result: cachedResult, cached: true };
          }

          try {
            const result = await googleClient.textSearch({
              query: query.searchQuery,
              location: query.location,
              type: query.searchType || "establishment",
            });

            globalCache.set(cacheKey, result, 1800000); // 30 minutes cache
            results.stats.googleQueries++;
            this.multiSourceStats.googleHits += result?.length || 0;

            return { query, result, cached: false };
          } catch (error) {
            logger.warn(`Google Places query failed: ${error.message}`);
            return { query, result: [], cached: false };
          }
        })
      );

      const googleResults = await Promise.allSettled(googleTasks);
      googleResults.forEach((result) => {
        if (result.status === "fulfilled") {
          results.googleResults.set(result.value.query, result.value.result);
        }
      });
    }

    // Phase 3: Merge and deduplicate results
    queries.forEach((query) => {
      const foursquareData = results.foursquareResults.get(query);
      const googleData = results.googleResults.get(query);

      const mergedBusinesses = this.mergeMultiSourceResults(
        foursquareData?.places || [],
        googleData || [],
        query
      );

      results.mergedBusinesses.push(...mergedBusinesses);
      results.stats.totalBusinesses += mergedBusinesses.length;
    });

    this.multiSourceStats.totalProcessed += queries.length;

    logger.info(
      `✅ Batch multi-source discovery complete: ${results.stats.totalBusinesses} businesses from ${results.stats.foursquareQueries} Foursquare + ${results.stats.googleQueries} Google queries`
    );

    return results;
  }

  /**
   * Merge results from Foursquare and Google Places, removing duplicates
   */
  mergeMultiSourceResults(foursquareResults, googleResults, query) {
    const allResults = [];
    const seenBusinesses = new Map();

    // Add Foursquare results first (often higher quality for discovery)
    foursquareResults.forEach((business) => {
      const businessKey = this.generateBusinessKey(business);
      if (!seenBusinesses.has(businessKey)) {
        allResults.push({
          ...business,
          source: "foursquare",
          originalQuery: query,
          discoveryTimestamp: new Date().toISOString(),
        });
        seenBusinesses.set(businessKey, "foursquare");
      }
    });

    // Add Google results, checking for duplicates
    googleResults.forEach((business) => {
      const businessKey = this.generateBusinessKey(business);
      if (!seenBusinesses.has(businessKey)) {
        allResults.push({
          ...business,
          source: "google",
          originalQuery: query,
          discoveryTimestamp: new Date().toISOString(),
        });
        seenBusinesses.set(businessKey, "google");
      } else {
        // Cross-platform validation - enhance existing business
        const existingBusiness = allResults.find(
          (b) => this.generateBusinessKey(b) === businessKey
        );
        if (existingBusiness) {
          existingBusiness.crossPlatformValidation = {
            sources: [seenBusinesses.get(businessKey), "google"],
            googleData: business,
          };
          this.multiSourceStats.crossPlatformMatches++;
        }
      }
    });

    return allResults;
  }

  /**
   * Generate a unique key for business deduplication
   */
  generateBusinessKey(business) {
    const name = (business.name || business.businessName || "")
      .toLowerCase()
      .trim();
    const phone = (business.phone || business.telephone || "").replace(
      /\D/g,
      ""
    );

    if (phone && phone.length >= 10) {
      return `${name}:${phone}`;
    }

    const address = (
      business.address ||
      business.formattedAddress ||
      ""
    ).toLowerCase();
    if (address && name) {
      // Use first part of address + business name for matching
      const addressKey = address.split(",")[0] || address.substring(0, 20);
      return `${name}:${addressKey}`;
    }

    return name || "unknown";
  }

  /**
   * Batch Foursquare place details fetching with caching
   */
  async batchFoursquareDetails(foursquareIds, foursquareClient) {
    logger.info(
      `📍 Starting batch Foursquare details for ${foursquareIds.length} places`
    );

    const detailsTasks = foursquareIds.map((fsqId) =>
      this.foursquareLimit(async () => {
        const cacheKey = TTLCache.generateKey("foursquare_details", fsqId);
        let details = globalCache.get(cacheKey);

        if (!details) {
          try {
            details = await foursquareClient.getPlaceDetails(fsqId);
            globalCache.set(cacheKey, details, 3600000); // 1 hour cache
          } catch (error) {
            logger.error(
              `Foursquare details failed for ${fsqId}:`,
              error.message
            );
            details = { error: error.message, fsqId };
            globalCache.set(cacheKey, details, 900000); // 15 minutes for errors
          }
        }

        return { fsqId, details, success: !details.error };
      })
    );

    const results = await Promise.allSettled(detailsTasks);
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;

    logger.info(
      `✅ Batch Foursquare details complete: ${successful}/${foursquareIds.length} succeeded`
    );

    return results
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean);
  }

  /**
   * Reset multi-source processing stats
   */
  resetMultiSourceStats() {
    this.multiSourceStats = {
      foursquareHits: 0,
      googleHits: 0,
      crossPlatformMatches: 0,
      totalProcessed: 0,
      cacheSaves: 0,
    };
  }
}

// Create and export singleton instance
const batchProcessor = new BatchProcessor();

module.exports = {
  BatchProcessor,
  batchProcessor,
};
