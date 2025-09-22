/**
 * Registry Validation Engine for ProspectPro
 * Modular provider system for business registry validation
 */

const pLimit = require("p-limit");
const { globalCache, TTLCache } = require("../utils/cache");
const { createAllProviders, createProvider } = require("./providers");
const logger = require("../utils/logger");

class RegistryValidationEngine {
  constructor(config = {}) {
    this.config = {
      concurrency: config.concurrency || 3,
      cacheEnabled: config.cacheEnabled !== false,
      cacheTTL: config.cacheTTL || 3600000, // 1 hour
      ...config,
    };

    this.providers = new Map();
    this.concurrencyLimit = pLimit(this.config.concurrency);
    this.stats = {
      validationsRun: 0,
      cacheHits: 0,
      providerResults: new Map(),
      errors: [],
    };

    // Auto-initialize providers if configuration provided
    if (config.providerConfig) {
      this.initializeProviders(config.providerConfig);
    }
  }

  /**
   * Initialize all available providers with configuration
   */
  initializeProviders(providerConfig = {}) {
    try {
      const providerInstances = createAllProviders(providerConfig);

      for (const [name, instance] of Object.entries(providerInstances)) {
        this.registerProvider(name, instance);
      }

      logger.info(`🔧 Initialized ${this.providers.size} registry providers`);
    } catch (error) {
      logger.error("❌ Failed to initialize providers:", error.message);
      throw error;
    }
  }

  /**
   * Add a specific provider by name
   */
  addProvider(name, config = {}) {
    try {
      const instance = createProvider(name, config);
      this.registerProvider(name, instance);
      logger.info(`✅ Added provider: ${name}`);
    } catch (error) {
      logger.error(`❌ Failed to add provider ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Register a validation provider
   */
  registerProvider(name, provider) {
    if (!provider.isRelevant || !provider.validate) {
      throw new Error(
        `Provider ${name} must implement isRelevant() and validate() methods`
      );
    }

    this.providers.set(name, provider);
    this.stats.providerResults.set(name, { success: 0, error: 0, skipped: 0 });
    logger.debug(`📋 Registered validation provider: ${name}`);
  }

  /**
   * Validate a business using relevant providers
   */
  async validateBusiness(business, searchParams = {}) {
    const relevantProviders = this.selectRelevantProviders(
      business,
      searchParams
    );

    if (relevantProviders.length === 0) {
      logger.debug(
        `🔍 No relevant providers for ${business.name || "Unknown"}`
      );
      return {
        business,
        validationResults: {},
        providersUsed: [],
        skipped: true,
      };
    }

    logger.debug(
      `🔍 Validating ${
        business.name || "Unknown"
      } using providers: ${relevantProviders.map((p) => p.name).join(", ")}`
    );

    // Run validations with concurrency control
    const validationPromises = relevantProviders.map((provider) =>
      this.concurrencyLimit(() =>
        this.runProviderValidation(provider, business, searchParams)
      )
    );

    const results = await Promise.allSettled(validationPromises);

    // Process results
    const validationResults = {};
    const providersUsed = [];
    const errors = [];

    results.forEach((result, index) => {
      const provider = relevantProviders[index];
      const providerStats = this.stats.providerResults.get(provider.name);

      if (result.status === "fulfilled") {
        validationResults[provider.name] = result.value;
        providersUsed.push(provider.name);
        providerStats.success++;
      } else {
        const error = {
          provider: provider.name,
          error: result.reason.message,
          business: business.name || "Unknown",
        };

        errors.push(error);
        validationResults[provider.name] = { error: result.reason.message };
        providerStats.error++;
        this.stats.errors.push(error);
      }
    });

    this.stats.validationsRun++;

    return {
      business,
      validationResults,
      providersUsed,
      errors,
      skipped: false,
    };
  }

  /**
   * Batch validate multiple businesses
   */
  async validateBusinesses(businesses, searchParams = {}) {
    logger.info(
      `🔍 Starting registry validation for ${businesses.length} businesses`
    );

    const validationTasks = businesses.map((business) =>
      this.validateBusiness(business, searchParams)
    );

    const results = await Promise.allSettled(validationTasks);
    const processedResults = results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { error: r.reason.message, skipped: true }
    );

    const successful = processedResults.filter(
      (r) => !r.error && !r.skipped
    ).length;
    const skipped = processedResults.filter((r) => r.skipped).length;
    const failed = processedResults.length - successful - skipped;

    logger.info(
      `✅ Registry validation complete: ${successful} validated, ${skipped} skipped, ${failed} failed`
    );

    return processedResults;
  }

  /**
   * Select relevant providers based on business and search parameters
   */
  selectRelevantProviders(business, searchParams) {
    const relevant = [];

    for (const [name, provider] of this.providers) {
      try {
        if (provider.isRelevant(business, searchParams)) {
          relevant.push({ name, provider });
        } else {
          this.stats.providerResults.get(name).skipped++;
        }
      } catch (error) {
        logger.error(
          `❌ Provider relevance check failed for ${name}:`,
          error.message
        );
        this.stats.providerResults.get(name).error++;
      }
    }

    return relevant;
  }

  /**
   * Run validation for a specific provider with caching
   */
  async runProviderValidation(providerInfo, business, searchParams) {
    const { name, provider } = providerInfo;

    // Generate cache key
    const cacheKey = this.config.cacheEnabled
      ? TTLCache.generateKey(`registry_${name}`, {
          name: this.normalizeName(
            business.name || business.businessName || ""
          ),
          state: business.state || searchParams.state || "",
          address: this.normalizeAddress(business.address || ""),
        })
      : null;

    // Check cache
    if (cacheKey) {
      const cached = globalCache.get(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }
    }

    // Run validation
    const result = await provider.validate(business, searchParams);

    // Cache result
    if (cacheKey && result) {
      globalCache.set(cacheKey, result, this.config.cacheTTL);
    }

    return result;
  }

  /**
   * Normalize business name for caching
   */
  normalizeName(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\b(inc|llc|corp|ltd|company|co)\b/g, "")
      .trim();
  }

  /**
   * Normalize address for caching
   */
  normalizeAddress(address) {
    return address
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      validationsRun: this.stats.validationsRun,
      cacheHits: this.stats.cacheHits,
      cacheHitRate:
        this.stats.validationsRun > 0
          ? ((this.stats.cacheHits / this.stats.validationsRun) * 100).toFixed(
              1
            ) + "%"
          : "0%",
      providers: Object.fromEntries(this.stats.providerResults),
      errors: this.stats.errors.length,
      recentErrors: this.stats.errors.slice(-5), // Last 5 errors
    };
  }

  /**
   * Clear all statistics
   */
  clearStats() {
    this.stats = {
      validationsRun: 0,
      cacheHits: 0,
      providerResults: new Map(
        Array.from(this.providers.keys()).map((name) => [
          name,
          { success: 0, error: 0, skipped: 0 },
        ])
      ),
      errors: [],
    };
  }
}

module.exports = RegistryValidationEngine;
