/**
 * Batch Processor for ProspectPro Operations
 * Handles batching of email verification, website scraping, and other operations
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
      emailVerificationConcurrency: config.emailVerificationConcurrency || 2,
      ...config,
    };

    // Concurrency limiters
    this.websiteLimit = pLimit(this.config.websiteConcurrency);
    this.googleLimit = pLimit(this.config.googlePlacesConcurrency);
    this.emailLimit = pLimit(this.config.emailVerificationConcurrency);

    // Batch queues
    this.emailQueue = [];
    this.websiteQueue = [];
    this.domainCache = new Map();
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
      },
    };
  }
}

// Create and export singleton instance
const batchProcessor = new BatchProcessor();

module.exports = {
  BatchProcessor,
  batchProcessor,
};
