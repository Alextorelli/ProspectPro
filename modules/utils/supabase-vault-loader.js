/**
 * Supabase Vault Loader - Secure API Key Management
 * Loads API keys from Supabase Vault with caching and error handling
 * @version 1.0.0 - Production Ready
 */

const { getSupabaseClient } = require('../../config/supabase');

class SupabaseVaultLoader {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes cache TTL
    this.loadAttempts = new Map();
    this.maxRetries = 3;
  }

  /**
   * Load API key from Supabase Vault with caching
   * @param {string} keyName - Name of the API key to load
   * @returns {Promise<string|null>} API key or null if not found
   */
  async loadApiKey(keyName) {
    // Check cache first
    const cached = this.getCachedKey(keyName);
    if (cached) {
      return cached;
    }

    // Attempt to load from vault
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.warn(`⚠️ Supabase client not available for key: ${keyName}`);
        return null;
      }

      // Query vault for the secret using the JavaScript interface
      const { data, error } = await supabase.rpc('vault_decrypt_secret', {
        secret_name: keyName
      });

      if (error) {
        console.warn(`⚠️ Vault error for ${keyName}:`, error.message);
        return null;
      }

      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.status === 'SUCCESS' && result.decrypted_secret) {
          // Cache the key
          this.setCachedKey(keyName, result.decrypted_secret);
          console.log(`✅ Loaded ${keyName} from Supabase Vault`);
          return result.decrypted_secret;
        } else {
          console.warn(`⚠️ Vault issue for ${keyName}: ${result.status} - ${result.error_message || 'No details'}`);
          return null;
        }
      }

      console.warn(`⚠️ No valid API key found for ${keyName} in Supabase Vault`);
      return null;

    } catch (error) {
      const attempts = this.loadAttempts.get(keyName) || 0;
      this.loadAttempts.set(keyName, attempts + 1);

      if (attempts < this.maxRetries) {
        console.warn(`⚠️ Retry ${attempts + 1}/${this.maxRetries} loading ${keyName}:`, error.message);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        return await this.loadApiKey(keyName);
      }

      console.error(`❌ Failed to load ${keyName} after ${this.maxRetries} attempts:`, error.message);
      return null;
    }
  }

  /**
   * Load multiple API keys from Supabase Vault
   * @param {string[]} keyNames - Array of API key names to load
   * @returns {Promise<Object>} Object with keyName: apiKey pairs
   */
  async loadApiKeys(keyNames) {
    console.log('🔑 Loading API keys from Supabase Vault...');
    
    const apiKeys = {};
    const loadPromises = keyNames.map(async (keyName) => {
      const key = await this.loadApiKey(keyName);
      if (key) {
        apiKeys[keyName] = key;
      }
      return { keyName, key };
    });

    const results = await Promise.all(loadPromises);
    
    const loaded = results.filter(r => r.key).length;
    const total = keyNames.length;
    
    console.log(`🔑 Vault loading complete: ${loaded}/${total} API keys loaded`);
    
    if (loaded === 0) {
      console.warn('⚠️ No API keys loaded from Supabase Vault');
      console.warn('💡 Ensure vault is configured and API keys are stored');
    }

    return apiKeys;
  }

  /**
   * Load all standard ProspectPro API keys
   * @returns {Promise<Object>} Complete API key configuration
   */
  async loadStandardApiKeys() {
    const standardKeys = [
      'GOOGLE_PLACES_API_KEY',
      'FOURSQUARE_SERVICE_API_KEY',
      'FOURSQUARE_PLACES_API_KEY',
      'HUNTER_IO_API_KEY',
      'NEVERBOUNCE_API_KEY',
      'ZEROBOUNCE_API_KEY',
      'APOLLO_API_KEY',
      'SCRAPINGDOG_API_KEY',
      'CALIFORNIA_SOS_API_KEY',
      'COURTLISTENER_API_KEY',
      'SOCRATA_API_KEY',
      'SOCRATA_APP_TOKEN',
      'USPTO_TSDR_API_KEY',
      'PERSONAL_ACCESS_TOKEN'
    ];

    const vaultKeys = await this.loadApiKeys(standardKeys);
    
    // Combine with environment variables (environment takes precedence for security)
    const combinedKeys = {
      googlePlaces: process.env.GOOGLE_PLACES_API_KEY || vaultKeys.GOOGLE_PLACES_API_KEY,
      foursquare: process.env.FOURSQUARE_SERVICE_API_KEY || 
                  vaultKeys.FOURSQUARE_SERVICE_API_KEY || 
                  process.env.FOURSQUARE_PLACES_API_KEY ||
                  vaultKeys.FOURSQUARE_PLACES_API_KEY,
      hunterIO: process.env.HUNTER_IO_API_KEY || vaultKeys.HUNTER_IO_API_KEY,
      neverBounce: process.env.NEVERBOUNCE_API_KEY || vaultKeys.NEVERBOUNCE_API_KEY,
      zeroBounce: process.env.ZEROBOUNCE_API_KEY || vaultKeys.ZEROBOUNCE_API_KEY,
      apollo: process.env.APOLLO_API_KEY || vaultKeys.APOLLO_API_KEY,
      scrapingdog: process.env.SCRAPINGDOG_API_KEY || vaultKeys.SCRAPINGDOG_API_KEY,
      californiaSOSApiKey: process.env.CALIFORNIA_SOS_API_KEY || vaultKeys.CALIFORNIA_SOS_API_KEY,
      courtListener: process.env.COURTLISTENER_API_KEY || vaultKeys.COURTLISTENER_API_KEY,
      socrata: process.env.SOCRATA_API_KEY || vaultKeys.SOCRATA_API_KEY,
      socrataToken: process.env.SOCRATA_APP_TOKEN || vaultKeys.SOCRATA_APP_TOKEN,
      uspto: process.env.USPTO_TSDR_API_KEY || vaultKeys.USPTO_TSDR_API_KEY,
      personalAccessToken: process.env.PERSONAL_ACCESS_TOKEN || vaultKeys.PERSONAL_ACCESS_TOKEN
    };

    // Log configuration summary
    const configuredCount = Object.values(combinedKeys).filter(key => 
      key && key !== 'your_api_key_here' && !key.includes('your_')
    ).length;
    
    console.log(`🔑 Final API configuration: ${configuredCount}/${Object.keys(combinedKeys).length} keys available`);
    
    return combinedKeys;
  }

  /**
   * Get cached API key
   */
  getCachedKey(keyName) {
    const cached = this.cache.get(keyName);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.key;
    }
    this.cache.delete(keyName);
    return null;
  }

  /**
   * Cache API key with TTL
   */
  setCachedKey(keyName, key) {
    this.cache.set(keyName, {
      key: key,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for specific key or all keys
   */
  clearCache(keyName = null) {
    if (keyName) {
      this.cache.delete(keyName);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    const total = this.cache.size;
    let valid = 0;
    
    for (const [keyName, cached] of this.cache.entries()) {
      if (now - cached.timestamp < this.cacheTTL) {
        valid++;
      }
    }

    return { total, valid, expired: total - valid };
  }
}

// Export singleton instance
module.exports = new SupabaseVaultLoader();